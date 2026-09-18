const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Import Mongoose Models
const Feedback = require('./models/Feedback');
const Progress = require('./models/Progress');

// Initialize Gemini AI (Safely & Dynamically)
const getGenerativeModel = (modelName = 'gemini-3.6-flash') => {
  const currentKey = process.env.GEMINI_API_KEY;
  if (!currentKey || currentKey.includes('your_gemini_api_key_here') || currentKey.trim() === '') {
    return null;
  }
  const client = new GoogleGenerativeAI(currentKey);
  return client.getGenerativeModel({ model: modelName });
};

// In-Memory Fallback Storage (if MongoDB is disconnected)
let inMemoryFeedback = [
  {
    _id: 'fallback-1',
    name: 'Sarah Jenkins',
    email: 'sarah@student.edu',
    category: 'courses',
    rating: 5,
    comments: 'The Web Development and ES6 JavaScript modules are detailed and helpful!',
    createdAt: new Date()
  },
  {
    _id: 'fallback-2',
    name: 'David Chen',
    email: 'david@student.edu',
    category: 'quiz',
    rating: 5,
    comments: 'The AI Question Explainer feature helped me understand why my answer was wrong instantly.',
    createdAt: new Date()
  }
];

// Connect to MongoDB using Mongoose
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_hub_db';
let isDbConnected = false;

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 2000
}).then(() => {
  isDbConnected = true;
  console.log(' Successfully connected to MongoDB via Mongoose!');
}).catch(() => {
  isDbConnected = false;
  console.warn(' MongoDB offline. Using In-Memory Fallback Database mode.');
});

// Create HTTP Server
const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Prevent 404 for Favicon Requests
  const urlPath = req.url.split('?')[0];
  if (urlPath === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Lightweight local health check for process managers and safe startup checks.
  if (req.method === 'GET' && urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'nexus-learning' }));
    return;
  }

  // --------------------------------------------------------------------------
  // REST API ROUTER (MongoDB Feedback CRUD Endpoints)
  // --------------------------------------------------------------------------

  // 1. GET /api/feedback (READ all feedback)
  if (req.method === 'GET' && urlPath === '/api/feedback') {
    (async () => {
      try {
        if (isDbConnected) {
          const feedbackList = await Feedback.find().sort({ createdAt: -1 });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(feedbackList));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(inMemoryFeedback));
        }
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(inMemoryFeedback));
      }
    })();
    return;
  }

  // 2. POST /api/feedback (CREATE new feedback)
  if (req.method === 'POST' && urlPath === '/api/feedback') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        if (isDbConnected) {
          const newDoc = new Feedback(payload);
          const savedDoc = await newDoc.save();
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: savedDoc }));
        } else {
          const fallbackDoc = {
            _id: 'fb-' + Date.now(),
            ...payload,
            createdAt: new Date()
          };
          inMemoryFeedback.unshift(fallbackDoc);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: fallbackDoc }));
        }
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message || 'Validation error' }));
      }
    });
    return;
  }

  // 3. DELETE /api/feedback/:id (DELETE feedback entry)
  if (req.method === 'DELETE' && urlPath.startsWith('/api/feedback/')) {
    const id = urlPath.split('/api/feedback/')[1];
    (async () => {
      try {
        if (isDbConnected) {
          await Feedback.findByIdAndDelete(id);
        } else {
          inMemoryFeedback = inMemoryFeedback.filter(item => item._id !== id);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Deleted successfully' }));
      } catch (err) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Failed to delete entry' }));
      }
    })();
    return;
  }

  // --------------------------------------------------------------------------
  // AI API ROUTER (Gemini Endpoint - Graceful 200 Handling)
  // --------------------------------------------------------------------------

  if (req.method === 'POST' && urlPath === '/ask') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { question, file, fileType } = data;

        // Check if real Gemini Key is configured
        const currentModel = getGenerativeModel();
        if (!currentModel) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            answer: `🔑 Gemini API Key is missing or invalid in backend/.env!\n\nTo enable live AI answers:\n1. Get a free key from https://aistudio.google.com/app/apikey\n2. Open backend/.env and paste: GEMINI_API_KEY=your_key\n3. Restart node server.js`
          }));
          return;
        }

        let content = [];
        if (file && fileType) {
          const base64Data = file.includes(',') ? file.split(',')[1] : file;
          content.push({
            inlineData: { data: base64Data, mimeType: fileType }
          });
        }

        content.push({ text: question || 'Analyze this content' });

        let result;
        let lastError;
        const candidateModels = ['gemini-3.6-flash', 'gemini-1.5-flash'];

        for (const mName of candidateModels) {
          try {
            const m = getGenerativeModel(mName);
            result = await m.generateContent(content);
            if (result) break;
          } catch (mErr) {
            lastError = mErr;
          }
        }

        if (!result) {
          throw lastError || new Error('Failed to generate content with available Gemini models');
        }

        const response = await result.response;
        const answer = response.text();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ answer }));
      } catch (error) {
        console.error('Gemini API Error:', error);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          answer: `⚠️ AI Response Warning: ${error.message}\n\nPlease verify your Gemini API key in backend/.env!`
        }));
      }
    });
    return;
  }

  // --------------------------------------------------------------------------
  // STATIC FILE ROUTER (Serves HTML, CSS, JS from frontend/)
  // --------------------------------------------------------------------------

  if (req.method === 'GET') {
    let cleanUrl = urlPath === '/' ? '/index.html' : urlPath;
    let filePath = path.join(__dirname, '..', 'frontend', cleanUrl);

    // Auto-append .html extension if file doesn't exist and has no extension
    if (!fs.existsSync(filePath) && !path.extname(cleanUrl)) {
      filePath += '.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();

    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        // Fallback to index.html for unknown routes instead of 404
        const indexPath = path.join(__dirname, '..', 'frontend', 'index.html');
        fs.readFile(indexPath, (indexErr, indexContent) => {
          if (indexErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const PORT = process.env.PORT || 5004;

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    // A second terminal may try to start the app while the correct instance is
    // already running. Confirm that case instead of reporting a hard failure.
    const probe = http.get({ hostname: '127.0.0.1', port: PORT, path: '/health', timeout: 1000 }, (response) => {
      if (response.statusCode === 200) {
        console.log(`Nexus Learning is already running at http://localhost:${PORT}`);
        process.exit(0);
      }
      console.error(`Port ${PORT} is already in use by another service.`);
      process.exit(1);
    });
    probe.on('error', () => {
      console.error(`Port ${PORT} is already in use by another service.`);
      process.exit(1);
    });
    return;
  }
  console.error('Server error:', err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

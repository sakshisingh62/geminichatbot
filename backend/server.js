const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

const server = http.createServer((req,res) => {
    // Add CORS headers to allow requests from Live Server (port 5500)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Serve the HTML file for GET /
    if (req.method === 'GET' && req.url === '/') {
        const htmlPath = path.join(__dirname, 'fronted', 'index.html');
        fs.readFile(htmlPath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500, {'content-type': 'text/plain'});
                res.end('Error loading page');
                return;
            }
            res.writeHead(200, {'content-type': 'text/html'});
            res.end(data);
        });
        return;
    }

    // Handle POST /ask
    if (req.method === 'POST' && req.url === '/ask') {
        let body = '';
        const maxSize = 50 * 1024 * 1024; // 50MB limit
        
        req.on('data', chunk => {
            body += chunk.toString();
            // Prevent memory overflow
            if (body.length > maxSize) {
                req.pause();
                res.writeHead(413, {'content-type': 'application/json'});
                res.end(JSON.stringify({error: 'File too large. Maximum size is 50MB'}));
            }
        });
        
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const {question, file, fileType} = data;
                
                let content = [];
                
                // If file is provided, add it to the content
                if (file && fileType) {
                    try {
                        // Remove data:image/png;base64, prefix if present
                        const base64Data = file.includes(',') ? file.split(',')[1] : file;
                        
                        content.push({
                            inlineData: {
                                data: base64Data,
                                mimeType: fileType
                            }
                        });
                        console.log('File uploaded with MIME type:', fileType);
                    } catch (fileError) {
                        console.error('File processing error:', fileError);
                    }
                }
                
                // Add the question text
                content.push({text: question || 'Analyze this content'});
                
                // Call Gemini API with optional file
                const result = await model.generateContent(content);
                const response = await result.response;
                const answer = response.text();
                
                res.writeHead(200, {'content-type': 'application/json'});
                res.end(JSON.stringify({answer}));
            } catch (error) {
                console.error('Gemini API Error:', error);
                res.writeHead(500, {'content-type': 'application/json'});
                res.end(JSON.stringify({error: 'Failed to get response from AI: ' + error.message}));
            }
        });
        return;
    }

    // 404 for other routes
    res.writeHead(404, {'content-type': 'text/plain'});
    res.end('Not Found');
});

const PORT = process.env.PORT || 5004;

server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Set a different PORT or stop the process using it.`);
        process.exit(1);
    }
    console.error('Server error:', err);
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});

# Chatbot Backend

Backend server for Gemini AI Chatbot using Node.js and Google Generative AI.

## Features
- Google Gemini 2.5 Pro AI integration
- RESTful API endpoints
- CORS enabled for cross-origin requests
- Environment variable configuration

## Setup

1. Clone the repository:
```bash
git clone https://github.com/sakshisingh62/chatbot-backend.git
cd chatbot-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```
GEMINI_API_KEY=your_api_key_here
```
Get your API key from: https://aistudio.google.com/app/apikey

4. Start the server:
```bash
node server.js
```

The server will run on port 5004 (or set custom port with `PORT` environment variable).

## API Endpoints

### POST /ask
Send a question to the Gemini AI.

**Request:**
```json
{
  "question": "Your question here"
}
```

**Response:**
```json
{
  "answer": "AI generated answer"
}
```

## Technologies Used
- Node.js
- Google Generative AI SDK
- dotenv for environment variables

## License
MIT

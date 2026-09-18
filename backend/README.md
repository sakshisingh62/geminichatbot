# Nexus Learning backend

The backend serves the static learning workspace and provides the AI assistant and feedback APIs.

## Start

```bash
npm install
node server.js
```

The default address is `http://localhost:5004`.

## Environment

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=5004
MONGODB_URI=mongodb://127.0.0.1:27017/student_hub_db
```

`POST /ask` sends a question to the configured Gemini model. Feedback is available through `GET /api/feedback`, `POST /api/feedback`, and `DELETE /api/feedback/:id`. When MongoDB is unavailable, local development uses an in-memory fallback.

The browser account screen is intentionally a demo session. Add a real identity provider and server-side session validation before using the portal with production accounts.

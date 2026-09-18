# Nexus Learning

Nexus Learning is an AI-assisted student workspace for courses, assessments, progress tracking, feedback, and focused study support.

## Product surface

- Workspace dashboard with learning metrics and clear next actions
- Responsive course library and interactive assessments
- AI Studio for questions, summaries, ideas, definitions, and explanations
- Floating AI study assistant available across the workspace
- Progress transcript and feedback workflows
- Account entry screen with a device-local demo session

## Run locally

```bash
cd backend
npm install
node server.js
```

Open `http://localhost:5004` in a browser. The server serves the frontend and exposes the AI and feedback endpoints.

Create `backend/.env` when using live services:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=5004
MONGODB_URI=mongodb://127.0.0.1:27017/student_hub_db
```

The AI key remains server-side. If MongoDB is unavailable, feedback falls back to the in-memory store for local development.

## Structure

```text
frontend/       HTML, CSS, and browser JavaScript
backend/        HTTP server, AI endpoint, and feedback persistence
backend/models/ Mongoose models
```

## Important note

The account screen is currently a front-end demo session stored in the browser. Production authentication should be connected to a real identity provider or backend session service before handling real users.

MIT License © 2026 Nexus Learning Project Team.

# Backend integration contract

The frontend uses the same `/api/*` paths in both frontend branches.

## API routes

GET /api/questions
Returns an array of questions. The current backend already exposes this route.

POST /api/questions
Request JSON: `{ "title": "...", "category": "...", "body": "...", "privacy": "private" }`

POST /api/messages
Request JSON: `{ "recipientId": 1, "body": "..." }`

The frontend sends cookies with requests (`credentials: include`) so an authenticated backend session can be used. The sender/author should be derived from the backend session rather than trusted from the browser.

## Development

When `VITE_API_URL` is empty, Vite proxies `/api` to the backend target in `vite.config.ts` (default `http://localhost:3000`). For a separately deployed backend, set `VITE_API_URL` to the backend origin and configure CORS for the frontend origin.

## Branch behavior

`frontend-placeholder-demo`: keeps the demo login shortcuts and falls back to placeholder success behavior when the API is unavailable.

`frontend-backend-integration`: uses the same API calls but reports API errors instead of silently treating them as successful demo actions.

Authentication is still backend-owned. The current backend login page is a server action, so production authentication needs an API/session flow the Vite frontend can call.
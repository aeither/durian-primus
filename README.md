# DurianBank - Primus zkTLS Demo

A banking demo app showcasing Primus zkTLS attestation for payment verification.

## Quick Start

**Terminal 1 – server (port 9000):**
```bash
cd server && npm install && node index.js
```

**Terminal 2 – frontend:**
```bash
npm install && npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The frontend calls `http://localhost:9000` by default.

## Deploy

- **Frontend (Vercel):** `npx vercel --prod --yes`  
  Set **VITE_API_URL** in Vercel to your server URL (e.g. `https://your-server.herokuapp.com`).
- **Server:** Deploy `server/` to any host (Railway, Render, Heroku, etc.) so it can make external calls. Frontend uses **VITE_API_URL** or `http://localhost:9000`.

## Project Structure

```
├── server/                  # Express API (port 9000)
│   └── index.js             # GET /api/payment, GET /primus/sign
├── src/
│   ├── App.jsx              # Dashboard
│   ├── Layout.jsx           # Sidebar layout
│   ├── primus.js            # zkTLS attestation (calls server)
│   └── pages/Payment.jsx    # Fetches from server /api/payment
└── vercel.json              # SPA rewrites (frontend only)
```

## Configuration

- **VITE_API_URL** – Server base URL. Unset = `http://localhost:9000`. Set in Vercel (or `.env`) for production.
- **App ID & Secret** – `server/index.js` (primus/sign), `src/primus.js` (App ID).
- **Attestation Template ID** – `src/primus.js` (`attTemplateID`).

## API (server)

| Endpoint | Description |
|----------|-------------|
| `GET /api/payment` | Sample payment JSON |
| `GET /primus/sign?signParams=...` | Signs attestation request |

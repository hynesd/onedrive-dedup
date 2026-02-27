# OneDrive Dedup

A full-stack OneDrive deduplication tool that authenticates with Microsoft OneDrive, scans all files for duplicates, and provides an interactive UI for reviewing and safely deleting duplicate files.

## Features

- 🔐 **Microsoft OAuth 2.0** — Secure sign-in via MSAL with token refresh
- 🔍 **Deep File Scanning** — Recursively scans all OneDrive files using Graph API hashes (no downloads needed)
- 📊 **Smart Duplicate Detection** — Groups files by content hash, suggests which copy to keep
- 🗂️ **Filter & Sort** — Filter duplicates by extension, folder path, or minimum file size
- 🗑️ **Safe Deletion** — Bulk delete with confirmation; files go to OneDrive recycle bin (restorable)
- 📈 **Progress Tracking** — Live scan progress polling with file count display
- 💅 **Modern UI** — React + MUI with responsive layout, toast notifications, loading states

## UI Overview

```
┌─────────────────────────────────────────────────────────┐
│  OneDrive Dedup                        👤 John  [Logout] │
├─────────────────────────────────────────────────────────┤
│  📁 1,234 files │ 🗂️ 12 groups │ 🗑️ 45 dupes │ 💾 2.4 GB│
├────────┬────────────────────────────────────────────────┤
│  Scan  │  Duplicates                                    │
├────────┴────────────────────────────────────────────────┤
│  ▼ Group 1 — 3 copies · Save 4.2 MB    [2 to delete]   │
│     ☑ report.pdf  /Documents  2.1 MB  ⭐ keep          │
│     ☐ report.pdf  /Backup     2.1 MB                   │
│     ☐ report.pdf  /Archive    2.1 MB                   │
└─────────────────────────────────────────────────────────┘
```

## Architecture

```
┌──────────────┐       ┌──────────────┐       ┌──────────────────┐
│  React UI    │◄─────►│  FastAPI      │◄─────►│  Microsoft Graph │
│  (Vite+TS)   │ REST  │  Backend      │ OAuth │  API (OneDrive)  │
└──────────────┘       └──────────────┘       └──────────────────┘
```

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** and npm
- A **Microsoft Azure account** (free tier works)

---

## Step 1: Azure App Registration

1. Go to [https://portal.azure.com](https://portal.azure.com) → **Azure Active Directory** → **App registrations**
2. Click **New registration**
   - Name: `onedrive-dedup` (or any name)
   - Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
   - Redirect URI: **Web** → `http://localhost:8000/auth/callback`
3. Click **Register**
4. Note your **Application (client) ID** — this is your `CLIENT_ID`
5. Go to **Certificates & secrets** → **New client secret** → copy the **Value** (this is your `CLIENT_SECRET`)
6. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**
   - Add: `Files.Read`, `Files.ReadWrite`, `User.Read`
   - Click **Grant admin consent** (or users will be prompted on first login)

---

## Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Azure credentials:
#   CLIENT_ID=<your-client-id>
#   CLIENT_SECRET=<your-client-secret>
#   REDIRECT_URI=http://localhost:8000/auth/callback
#   FRONTEND_URL=http://localhost:5173
#   SECRET_KEY=<random-secret-for-sessions>

# Run the backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`. Swagger docs at `http://localhost:8000/docs`.

---

## Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

> The Vite dev server proxies `/auth` and `/api` requests to `http://localhost:8000`.

---

## Docker Compose Setup (Optional)

```bash
# Copy and fill in backend env
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Build and start both services
docker-compose up --build

# Backend: http://localhost:8000
# Frontend: http://localhost:5173
```

---

## Usage Guide

1. **Open** `http://localhost:5173` in your browser
2. **Sign In** — click "Sign in with Microsoft" and complete the OAuth flow
3. **Scan** — on the Scan tab, click "Start Scan" to recursively scan your OneDrive
4. **Review** — switch to the Duplicates tab to see grouped duplicate files
5. **Select** — check files you want to KEEP (⭐ = auto-suggested oldest copy)
6. **Delete** — click "Delete Selected", review the confirmation dialog, confirm
7. Files are moved to the OneDrive **recycle bin** — you can restore them at any time

### Filters

- **File extensions**: comma-separated list (e.g., `jpg,png,pdf`)
- **Folder path**: only show duplicates under a specific path (e.g., `/Documents`)

---

## Security Considerations

- **Credentials**: Never commit your `.env` file. It is excluded by `.gitignore`.
- **Session secret**: Set a strong random `SECRET_KEY` in production (`python -c "import secrets; print(secrets.token_hex(32))"`)
- **Scopes**: The app requests only `Files.Read`, `Files.ReadWrite`, and `User.Read` — no broader permissions
- **No permanent deletion**: Files are moved to the recycle bin, not permanently deleted
- **Safety check**: The backend prevents deleting ALL copies of a duplicate group
- **CORS**: Restricted to `FRONTEND_URL` in production

---

## Project Structure

```
onedrive-dedup/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, session middleware
│   │   ├── config.py        # Pydantic settings from .env
│   │   ├── auth/
│   │   │   ├── msal_auth.py # MSAL OAuth2 helpers
│   │   │   └── routes.py    # /auth/login, /callback, /me, /logout
│   │   ├── onedrive/
│   │   │   ├── scanner.py   # Async recursive Graph API scanner
│   │   │   ├── dedup.py     # Duplicate detection & stats
│   │   │   ├── deleter.py   # File deletion via Graph API
│   │   │   └── routes.py    # /api/scan/*, /api/duplicates, /api/delete
│   │   └── models/
│   │       └── schemas.py   # Pydantic models
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/      # React components
│   │   ├── services/api.ts  # Axios API client
│   │   ├── types/index.ts   # TypeScript types
│   │   └── hooks/useApi.ts  # Generic API hook
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── .gitignore
```

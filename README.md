# OneDrive Dedup

A full-stack tool that authenticates with Microsoft OneDrive, recursively scans all your files for duplicates using content hashes, and provides an interactive UI to review and safely delete duplicate files.

## Features

- **Microsoft OAuth 2.0** login via MSAL (no passwords stored)
- **Recursive file scan** using Microsoft Graph API with pagination support
- **Duplicate detection** by content hash (`quickXorHash`) — no file downloads needed
- **Interactive React UI** — review every duplicate group before deleting anything
- **Safe deletion** — files go to OneDrive Recycle Bin (fully recoverable), and at least one copy is always preserved
- **Dashboard stats** — total files, duplicate groups, reclaimable space
- **Bulk delete** with confirmation dialog

## Screenshots

### Login Page
Sign in with your Microsoft account — scopes requested are `Files.Read`, `Files.ReadWrite`, and `User.Read`.

### Dashboard
Overview of total files scanned, duplicate groups found, and total space reclaimable.

### Duplicates View
Each duplicate group shows all copies, highlights the suggested file to keep (oldest), and lets you select which copies to delete.

### Confirmation Dialog
Before any deletion, a summary dialog shows exactly what will be deleted. Deleted files go to the OneDrive Recycle Bin.

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- A Microsoft Azure account (free tier is sufficient)

---

## 1. Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com) → **Azure Active Directory** → **App registrations** → **New registration**
2. Fill in:
   - **Name**: `OneDrive Dedup` (or any name)
   - **Supported account types**: *Accounts in any organizational directory and personal Microsoft accounts*
   - **Redirect URI**: Platform = **Web**, URI = `http://localhost:8000/auth/callback`
3. Click **Register**
4. Copy the **Application (client) ID** — this is your `CLIENT_ID`
5. Go to **Certificates & secrets** → **New client secret** → copy the **Value** — this is your `CLIENT_SECRET`
6. Go to **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**:
   - `Files.Read`
   - `Files.ReadWrite`
   - `User.Read`
   - `offline_access` (for token refresh)
7. Click **Grant admin consent** (optional for personal accounts)

---

## 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `backend/.env`:

```env
CLIENT_ID=<your Azure client ID>
CLIENT_SECRET=<your Azure client secret>
TENANT_ID=common
REDIRECT_URI=http://localhost:8000/auth/callback
FRONTEND_URL=http://localhost:5173
SECRET_KEY=<any long random string>
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

---

## 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment (optional — defaults to http://localhost:8000)
cp .env.example .env.local
```

Start the frontend:

```bash
npm run dev
```

The UI will be available at `http://localhost:5173`.

---

## 4. Docker Compose Setup (Optional)

```bash
# Copy and fill in backend env
cp backend/.env.example backend/.env
# Edit backend/.env with your Azure credentials

docker-compose up --build
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

---

## 5. Usage Guide

1. **Log in** — click *Sign in with Microsoft* and authorize the app
2. **Start Scan** — click the *Start Scan* button; the app recursively scans all OneDrive files
3. **Review Duplicates** — each group shows all copies; the oldest is highlighted as *Keep*
4. **Select files to delete** — use *Select Duplicates* on each group, or *Select All Duplicates* for bulk action
5. **Delete** — click *Delete Selected*, review the confirmation dialog, confirm
6. Files are moved to the **OneDrive Recycle Bin** — restore them any time from OneDrive on the web

---

## 6. Security Considerations

- **No file contents are read** — duplicate detection uses hashes provided by Microsoft Graph API metadata
- **OAuth tokens** are stored in a signed, server-side session cookie (not in localStorage)
- **At least one copy** of every file is always preserved — the backend refuses to delete all copies in a group
- **HTTPS in production** — set `SECURE_COOKIES=true` and deploy behind HTTPS to prevent cookie interception
- **Secret key** — set a long, random `SECRET_KEY` in production; never commit `.env`
- Deleted files go to the **OneDrive Recycle Bin** and can be fully restored

---

## Project Structure

```
onedrive-dedup/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings via env vars
│   │   ├── auth/
│   │   │   ├── msal_auth.py     # MSAL OAuth 2.0 logic
│   │   │   └── routes.py        # /auth/login, /callback, /logout, /me
│   │   ├── onedrive/
│   │   │   ├── scanner.py       # Recursive Graph API scanner
│   │   │   ├── dedup.py         # Duplicate detection by hash
│   │   │   ├── deleter.py       # Safe file deletion
│   │   │   └── routes.py        # /onedrive/scan, /duplicates, /delete
│   │   └── models/
│   │       └── schemas.py       # Pydantic models
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/          # Login, Dashboard, DuplicatesList, etc.
│   │   ├── services/api.ts      # Axios API client
│   │   ├── hooks/useApi.ts      # React hooks
│   │   └── types/index.ts       # TypeScript types
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
└── README.md
```

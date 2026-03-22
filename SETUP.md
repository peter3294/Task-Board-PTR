# Task Board — Setup Guide

## Prerequisites

- Node.js 18+
- A Google account
- A Google Cloud project

---

## 1. Google Cloud Setup

### Create a project & enable APIs

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable these APIs:
   - **Google Sheets API**
   - **Google Calendar API**

### Create OAuth credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Add your deployment URL to **Authorized JavaScript origins**:
   - For local dev: `http://localhost:5173`
   - For Netlify: `https://your-app.netlify.app`
   - For Vercel: `https://your-app.vercel.app`
5. No redirect URIs needed (token implicit flow)
6. Copy the **Client ID**

### Configure OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. User type: **External** (or Internal if using Google Workspace)
3. Fill in app name, support email
4. Add scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/calendar.readonly`
5. Add your Google account as a test user (while in development)

---

## 2. Google Sheet Setup

1. Create a new Google Sheet at [sheets.google.com](https://sheets.google.com)
2. Rename the first tab to **Tasks** (exactly, case-sensitive)
3. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```
   The Sheet ID is the long string between `/d/` and `/edit`.

The app will automatically write column headers on first load.

---

## 3. Local Development

```bash
cd task-board
npm install

# Copy and fill in environment variables
cp .env.example .env
```

Edit `.env`:
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_SHEET_ID=your-google-sheet-id
```

```bash
npm run dev
```

Open http://localhost:5173

---

## 4. Deploying to Netlify

1. Push this folder to a GitHub repo
2. Connect to Netlify → **New site from Git**
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables in **Site settings → Environment variables**:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_SHEET_ID`
6. Add your Netlify URL to the Google OAuth **Authorized JavaScript origins**

---

## 5. Deploying to Vercel

1. Push to GitHub, connect to Vercel
2. Framework: **Vite**
3. Add the same two environment variables in Vercel project settings
4. Add your Vercel URL to Google OAuth **Authorized JavaScript origins**

---

## Usage Notes

- **Click any cell** to edit it inline. Press Enter or click away to save.
- **Arrow (▸)** on each row expands the notes/detail panel with rich text editing.
- **+ Sub** button appears on row hover to add a subtask.
- **Archive** button on row hover removes the task to the archive.
- **Search** (top bar, or ⌘K) searches across all tasks including archived ones.
- **Archive** button in the top bar shows archived tasks with a Restore option.
- The right panel shows your Google Calendar events for the next 14 days.
- Data syncs to Google Sheets in real time — changes are saved immediately.

# Intvar — Complete Setup & Deployment Guide

## Project Structure
```
intvar/
├── backend/
│   ├── main.py           ← FastAPI app
│   ├── requirements.txt  ← Python dependencies
│   ├── schema.sql        ← Run this in Supabase
│   └── .env.example      ← Copy to .env and fill values
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── index.css
    │   ├── main.jsx
    │   ├── lib/supabase.js
    │   └── pages/
    │       ├── Home.jsx   ← Public website + chatbot
    │       ├── Login.jsx  ← Admin login/signup
    │       └── Admin.jsx  ← Leads dashboard
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── .env.example       ← Copy to .env and fill values
```

---

## STEP 1 — Supabase Setup (Database + Auth)

1. Go to https://supabase.com → Create new project
2. Wait for it to initialize (~1 min)
3. Go to **SQL Editor** → paste contents of `backend/schema.sql` → Run
4. Go to **Settings → API** and copy:
   - Project URL → `SUPABASE_URL`
   - `anon` public key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_KEY`

---

## STEP 2 — Anthropic API Key

1. Go to https://console.anthropic.com
2. API Keys → Create new key
3. Copy it → `ANTHROPIC_API_KEY`

---

## STEP 3 — Backend on Render (Free)

1. Push your code to GitHub (push the whole `intvar/` folder)
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   ```
   SUPABASE_URL = <your value>
   SUPABASE_SERVICE_KEY = <your value>
   SUPABASE_ANON_KEY = <your value>
   ANTHROPIC_API_KEY = <your value>
   ```
6. Deploy → copy your Render URL (e.g. `https://intvar-api.onrender.com`)

---

## STEP 4 — Frontend on Vercel (Free)

1. Go to https://vercel.com → New Project → Import your GitHub repo
2. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
3. Add Environment Variables:
   ```
   VITE_SUPABASE_URL = <your Supabase URL>
   VITE_SUPABASE_ANON_KEY = <your anon key>
   VITE_API_URL = <your Render URL>
   ```
4. Deploy → get your Vercel URL

---

## STEP 5 — Create Admin Account

1. Open your Vercel URL in browser
2. Click **Admin** (top right nav)
3. Click **Sign up** → enter your email + password
4. Check email for confirmation link → click it
5. Login with those credentials
6. You now have full access to the admin panel

---

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # fill in your values
uvicorn main:app --reload
# Runs at http://localhost:8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env      # fill in your values
npm run dev
# Runs at http://localhost:5173
```

---

## Features Summary

| Feature | Details |
|---|---|
| Public website | Hero, Services, Contact form |
| AI Chatbot | Floating widget, Claude-powered, Intvar-specific |
| Contact form | Submits leads to database |
| Admin login | Supabase Auth (email + password) |
| Admin signup | Protected — only for you |
| Leads dashboard | View, filter, search all leads |
| Status management | New → Contacted → Closed |
| Delete leads | With confirmation |
| Stats dashboard | Total, New, Contacted, Closed, Today |

---

## For College Presentation

1. Deploy everything following the steps above
2. Test by submitting a lead from the contact form
3. Show the admin panel receiving that lead in real-time
4. Demo the AI chatbot answering questions about Intvar

**URLs to show in presentation:**
- Public site: `https://your-app.vercel.app`
- Admin: `https://your-app.vercel.app` → click Admin
- API docs: `https://your-api.onrender.com/docs` (FastAPI auto-generates this)

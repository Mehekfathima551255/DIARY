<div align="center">

# 📓 Smart Diary

**An AI-powered personal diary & memory journal.**
Capture your days, track your moods, and let AI reveal the patterns in your story.

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google-bard&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405e?style=for-the-badge&logo=sqlite&logoColor=white)

</div>

---

## ✨ Features

- 🔐 **Authentication** — JWT-based register / login.
- 📝 **Memories** — create, edit, delete, favorite, search & filter entries with mood + tags.
- 📊 **Dashboard** — totals, writing streak, mood overview and top tags at a glance.
- 📈 **Analytics** — mood trend line, writing-activity heatmap and word stats.
- 🗓️ **Calendar** — a month view of your journaling activity.
- 🤖 **AI Assistant** — chat with your diary (RAG over your own entries).
- 🧠 **AI Insights** — weekly reflections, mood analysis, writing patterns & suggestions.
- ⚡ **AI Tools** — per-entry summarize, improve writing, detect mood, generate title/tags.

All AI features are powered by **Google Gemini**.

---

## 📁 Project Structure

```text
DIARY/
├── backend/                     # FastAPI application
│   ├── app/
│   │   ├── main.py              # App entrypoint + CORS + routers
│   │   ├── core/                # config, JWT, dependencies
│   │   ├── database/            # SQLAlchemy engine + session
│   │   ├── models/              # ORM models (user, memory, notification)
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routes/             # API endpoints (auth, memory, ai, chat, ...)
│   │   ├── services/            # Business logic
│   │   └── ai/                  # Gemini service, prompts, helpers
│   ├── uploads/                 # Uploaded memory images (git-ignored)
│   ├── requirements.txt
│   └── .env.example             # Copy to .env and fill in
│
└── frontend/                    # React + Vite single-page app
    ├── index.html
    ├── src/
    │   ├── main.jsx             # React entrypoint
    │   ├── App.jsx              # Layout, routing & auth gate
    │   ├── index.css           # Global design system (dark glassmorphism)
    │   ├── context/            # AuthContext (login/session state)
    │   ├── lib/                 # api.js (backend client) + demo.js (sample data)
    │   ├── components/          # Sidebar, charts (dependency-free SVG)
    │   └── pages/               # Login, Dashboard, Memories, Editor,
    │                            #   Analytics, Calendar, Assistant,
    │                            #   Insights, Summary, Settings
    └── package.json
```

---

## 🚀 Getting Started

### 1. Backend (FastAPI)

```bash
cd backend

# create & activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\activate

# install dependencies
pip install -r requirements.txt

# configure environment
cp .env.example .env            # then edit .env with your keys

# run the API
uvicorn app.main:app --reload
```

The API runs at **http://127.0.0.1:8000** — interactive docs at **/docs**.

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

The app runs at **http://localhost:5173**.

> 💡 **No backend? No problem.** Click **"Try the demo"** on the login screen to
> explore every page with realistic sample data — the frontend falls back to
> demo data whenever the API is unreachable.

The frontend reads the API URL from `VITE_API_URL` (defaults to
`http://localhost:8000`). To point at a different backend, create
`frontend/.env` with:

```env
VITE_API_URL=http://localhost:8000
```

---

## 🧰 Tech Stack

| Layer     | Technology                                             |
|-----------|--------------------------------------------------------|
| Frontend  | React 19, Vite, Boxicons, hand-rolled SVG charts       |
| Backend   | FastAPI, SQLAlchemy, Pydantic, python-jose (JWT)       |
| Database  | SQLite                                                  |
| AI        | Google Gemini                                          |

<div align="center">
  <sub>Made with ❤️ for your memories</sub>
</div>

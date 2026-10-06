# StudyMind AI — Intelligent Study Planner & Progress Tracker

> An AI-powered, locally-run hackathon project for personalised study scheduling, progress tracking, PDF-based RAG chat, and analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI, SQLAlchemy ORM, Pydantic v2 |
| Auth | python-jose (JWT), passlib/bcrypt |
| Database | SQLite (`backend/app.db`) |
| Frontend | React 18 + Vite, React Router v6, Axios |
| AI / RAG | sentence-transformers, FAISS, LangChain (Steps 3 & 7) |
| Scheduler | Pandas, APScheduler (Steps 5 & 6) |
| Analytics | scikit-learn, Chart.js / react-chartjs-2 (Step 8) |

---

## Monorepo Structure

```
Codethon/
├── backend/
│   ├── app/
│   │   ├── core/          config.py, security.py
│   │   ├── models/        user.py (+ more per step)
│   │   ├── routers/       auth.py, users.py (+ more)
│   │   ├── schemas/       user.py (+ more)
│   │   ├── services/      (scheduler, rag, llm, … added per step)
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/
│   ├── .env               (copy from .env.example)
│   ├── .env.example
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/           client.js
    │   ├── components/    ProtectedRoute.jsx
    │   ├── contexts/      AuthContext.jsx
    │   └── pages/         Login, Register, Home, Profile
    ├── .env
    └── index.html
```

---

## Quick Start

### 1 — Prerequisites

- **Python 3.11+** — [python.org/downloads](https://www.python.org/downloads/)  
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)

> **Windows users**: enable script execution first:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
> ```

---

### 2 — Backend

```bash
cd backend

# Copy env and edit if needed
copy .env.example .env

# Create a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Start the API server (SQLite DB auto-created on first run)
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs  
Health check: http://localhost:8000/health

---

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

### 4 — Run Tests

```bash
cd backend
pytest tests/ -v
```

Expected output (Step 1): **11 tests, all passing**

---

## Environment Variables (backend/.env)

| Variable | Default | Description |
|---|---|---|
| `SECRET_KEY` | `change-me-…` | JWT signing secret — **change in production** |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token lifetime |
| `DATABASE_URL` | `sqlite:///./app.db` | SQLite file path |
| `DEBUG` | `false` | Enable FastAPI debug mode |
| `USE_GEMINI` | `false` | Enable Gemini AI features |
| `GEMINI_API_KEY` | _(empty)_ | Only needed when `USE_GEMINI=true` |

---

## API Reference (Step 1)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register new user, returns JWT |
| POST | `/auth/login` | — | Login, returns JWT |
| GET | `/users/me` | Bearer | Get current user profile |
| PUT | `/users/me` | Bearer | Update name / email / password |
| GET | `/health` | — | Liveness probe |

---

## Step-by-Step Build Log

| Step | Feature | Status |
|---|---|---|
| 1 | Project setup, Auth (JWT + bcrypt), React pages | ✅ Done |
| 2 | Classroom / Subject / Topic CRUD | ⏳ Next |
| 3 | PDF upload + RAG pipeline (FAISS + sentence-transformers) | ⏳ |
| 4 | Exams, Assignments, OCR timetable import | ⏳ |
| 5 | AI Study Planner (priority scoring + Pandas scheduling) | ⏳ |
| 6 | Progress tracking + adaptive rescheduling | ⏳ |
| 7 | AI chat (Ollama / Gemini, RAG, SSE streaming) | ⏳ |
| 8 | Analytics dashboard (Chart.js, scikit-learn predictions) | ⏳ |

---

## Notes

### First-run model download (Step 3)
The RAG pipeline downloads `all-MiniLM-L6-v2` (~80 MB) from Hugging Face on first use.
Ensure internet access when running the notes pipeline for the first time.

### Tesseract OCR (Step 4)
Install Tesseract before running OCR features:
- Windows: [UB-Mannheim Tesseract installer](https://github.com/UB-Mannheim/tesseract/wiki)
- macOS: `brew install tesseract`
- Linux: `sudo apt install tesseract-ocr`

### Ollama (Step 7)
Install from [ollama.com](https://ollama.com) and pull a model:
```bash
ollama pull llama3.2
```

---

## Screenshots
_(Add screenshots here after Step 8 is complete)_

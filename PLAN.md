# AI Candidate Preparation Platform — Detailed Implementation Plan

## Product Vision
An AI-powered interview preparation platform where candidates:
1. Connect their own AI API key (OpenAI/Gemini)
2. Upload their resume
3. Get AI-generated case studies & interview questions from their own projects
4. Practice and evaluate their spoken introduction using speech-to-text + AI scoring

---

## Tech Stack

| Layer        | Technology                              |
|--------------|-----------------------------------------|
| Frontend     | Next.js 14 (App Router) + Tailwind CSS  |
| Backend      | FastAPI (Python 3.11+)                  |
| Database     | SQLite (dev) → PostgreSQL (prod)        |
| File Storage | Local disk (`uploads/` folder)          |
| LLM APIs     | OpenAI API (gpt-4o) / Gemini            |
| Speech-to-Text | OpenAI Whisper API / Browser Web Speech API |
| PDF Parsing  | PyMuPDF (`fitz`) + python-docx          |

---

## Project Folder Structure

```
ai-prep-platform/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # SQLite setup (SQLAlchemy)
│   ├── models.py                # DB models: Candidate, Resume
│   ├── schemas.py               # Pydantic schemas
│   ├── routers/
│   │   ├── setup.py             # /api/setup — API key validation & save
│   │   ├── resume.py            # /api/resume — Upload & parse resume
│   │   ├── case_study.py        # /api/case-study — Generate case study
│   │   └── intro.py             # /api/intro — Evaluate intro recording
│   ├── services/
│   │   ├── ai_client.py         # OpenAI / Gemini unified client wrapper
│   │   ├── resume_parser.py     # Extract text from PDF/DOCX
│   │   ├── case_study_agent.py  # Agent: Project extraction + case study
│   │   └── intro_evaluator.py   # STT + AI scoring for intro
│   ├── uploads/                 # Resume file storage
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── app/
    │   ├── page.tsx             # Landing / Home page
    │   ├── setup/page.tsx       # Candidate setup (API key + resume upload)
    │   ├── dashboard/page.tsx   # Main dashboard
    │   ├── case-study/page.tsx  # Case study viewer
    │   └── intro/page.tsx       # Intro practice recorder + evaluator
    ├── components/
    │   ├── Navbar.tsx
    │   ├── ResumeUploader.tsx
    │   ├── CaseStudyCard.tsx
    │   ├── AudioRecorder.tsx
    │   └── ScoreCard.tsx
    ├── lib/
    │   └── api.ts               # Axios API call helpers
    ├── public/
    ├── package.json
    └── tailwind.config.ts
```

---

## Module-by-Module Build Plan

### Phase 1 — Backend Foundation
1. Initialize FastAPI project with SQLAlchemy + SQLite
2. Create `Candidate` DB model (id, api_key, api_provider, resume_text, resume_path)
3. Build `/api/setup` endpoint: validate API key connectivity (test LLM call)
4. Build `/api/resume/upload` endpoint: accept PDF/DOCX, parse text, store in DB
5. Write `resume_parser.py` using PyMuPDF

### Phase 2 — AI Agents (Backend)
6. Write `ai_client.py`: unified wrapper for OpenAI / Gemini
7. Write `case_study_agent.py`:
   - Prompt: *"Given this resume, extract the most recent project and generate a detailed case study with problem statement, solution, architecture, challenges, results, and 5 interview questions"*
8. Build `/api/case-study/generate` endpoint
9. Write `intro_evaluator.py`:
   - Accept audio file → call Whisper STT → get transcript
   - Prompt: *"Evaluate this candidate intro for fluency, grammar, confidence, structure, clarity. Give a score 0-100 and specific feedback."*
10. Build `/api/intro/evaluate` endpoint

### Phase 3 — Frontend
11. Initialize Next.js 14 project
12. Build Landing page (hero, features overview)
13. Build Setup page (API key form + resume upload with drag-and-drop)
14. Build Dashboard (show parsed resume summary, navigation cards)
15. Build Case Study page (generate button + formatted output)
16. Build Intro Practice page (record button, waveform, transcript, score card)

### Phase 4 — Polish & Integration
17. Wire all frontend pages to backend APIs
18. Add loading states, error handling, toast notifications
19. Responsive design (mobile-friendly)
20. Final end-to-end testing

---

## API Endpoints Reference

| Method | Endpoint                    | Description                          |
|--------|-----------------------------|--------------------------------------|
| POST   | `/api/setup/validate`       | Validate API key, save candidate     |
| POST   | `/api/resume/upload`        | Upload & parse resume PDF/DOCX       |
| GET    | `/api/resume/summary`       | Get parsed resume text for candidate |
| POST   | `/api/case-study/generate`  | Run case study agent                 |
| POST   | `/api/intro/evaluate`       | Submit audio, get STT + AI score     |

---

## Key Design Decisions
- **Candidates bring their own keys**: Zero LLM cost for the platform owner
- **SQLite for v1**: Easy to set up, no extra services needed locally
- **Browser native audio recording**: No extra SDK, uses `MediaRecorder` API
- **Streaming responses**: Case study generation streams tokens for better UX (optional v2)

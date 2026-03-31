# 🤖 AI Candidate Preparation Platform

> **"An AI-powered candidate preparation platform that generates project case studies from resumes, trains candidates to deliver structured interview introductions, and conducts AI mock interviews with automated evaluation and feedback."**

---

## 📋 Table of Contents

1. [What Is This?](#-what-is-this)
2. [Full Platform Flow](#-full-platform-flow)
3. [AI Agents & What They Do](#-ai-agents--what-they-do)
4. [Tech Stack](#-tech-stack)
5. [Project Structure](#-project-structure)
6. [How to Run](#-how-to-run)
7. [API Reference](#-api-reference)
8. [Template Files](#-template-files)
9. [Configuration & Environment](#-configuration--environment)
10. [Troubleshooting](#-troubleshooting)

---

## 🎯 What Is This?

This is a **Multi-Agent AI Interview Preparation System** built for candidates who want to prepare for technical interviews using their own AI API keys (OpenAI or Gemini).

Candidates can:
- Upload their **resume** and get a structured project case study generated
- Learn how to **introduce themselves** using a professional template
- **Record or type their introduction** and get AI-scored on 8 parameters
- Practice a full **mock interview** with 10 AI-generated questions
- Receive a **final interview readiness report** with an overall score

**Key Design Decision:** Candidates use their **own API keys** (OpenAI / Google Gemini). This means:
- ✅ Zero platform AI cost for the owner
- ✅ Candidate controls their own data
- ✅ Scales infinitely

---

## 🔄 Full Platform Flow

```
1. Visit http://localhost:3000
         ↓
2. Setup Page (/setup)
   ├── Enter API Key (OpenAI sk-... or Gemini AIza...)
   ├── Select Provider (OpenAI / Gemini)
   ├── Key is validated → session created
   └── Upload Resume (PDF or DOCX)
         ↓
3. Dashboard (/dashboard)
   └── Navigate to any preparation module
         ↓
4. Case Study Generator (/case-study)
   ├── Generate from YOUR resume (AI extracts best project)
   ├── Generate from a Domain Topic (RAG, MLOps, Agentic AI...)
   └── Generate using one of 3 template styles (MLOps / RAG / Agentic)
         ↓
5. Project Extractor (API: /api/resume/extract-project)
   └── AI extracts your most important project in structured format
         ↓
6. Intro Training (/intro)
   ├── See the intro template (based on real XYZ Corp example)
   ├── Get a personalized sample intro generated from your resume
   ├── Type your intro → AI evaluates on 8 parameters
   └── (OpenAI only) Record audio → Whisper STT → AI evaluates
         ↓
7. Retry Until PASS (score ≥ 7/10)
         ↓
8. Mock Interview (/mock-interview)
   ├── AI generates 10 personalized questions from your resume + project
   │   (2 Project, 2 Technical, 2 Scenario, 2 System Design, 2 Behavioral)
   ├── Answer each question in text
   └── Get instant AI evaluation with score breakdown
         ↓
9. Final Report (/report)
   ├── AI generates 11-section comprehensive report
   ├── Covers: technical skills, communication, project explanation,
   │   intro performance, mock interview scores, strengths, weaknesses
   ├── Interview Readiness Score out of 100
   └── Download as Markdown file
```

---

## 🤖 AI Agents & What They Do

| Agent | File | Input | Output |
|---|---|---|---|
| **Resume Analyzer** | `services/resume_parser.py` | PDF/DOCX file | Extracted raw text |
| **Project Extractor** | `services/project_extractor.py` | Resume text | Structured project (10 fields) |
| **Case Study Generator** | `services/case_study_agent.py` | Resume / Project / Topic | Full case study markdown |
| **Intro Trainer** | `services/intro_evaluator.py` | Resume text | Template explanation + sample intro |
| **Intro Evaluator** | `services/intro_evaluator.py` | Intro text / audio | 8-parameter JSON scores |
| **Question Generator** | `services/mock_interview_agent.py` | Resume + Project | 10 typed questions (JSON) |
| **Answer Evaluator** | `services/mock_interview_agent.py` | Question + Answer | 6-dimension scores + ideal answer |
| **Report Generator** | `services/mock_interview_agent.py` | All session data | 11-section final report |
| **AI Client (Core)** | `services/ai_client.py` | Any prompt | Text response (OpenAI/Gemini) |

### Intro Evaluation — 8 Parameters (Score out of 10 each)

| Parameter | What It Measures |
|---|---|
| `template_similarity` | How closely the intro follows the XYZ Corp template structure |
| `fluency` | Smooth, natural flow without fillers or awkward pauses |
| `grammar` | Grammatical correctness and professional language |
| `clarity` | Message is easy to understand |
| `confidence` | Sounds confident and assured |
| `structure` | Clear flow: name → experience → skills → project → goal |
| `professional_tone` | Formal, interview-appropriate language |
| `completeness` | All required elements present |

- **PASS:** Overall score ≥ 7/10
- **FAIL:** Overall score < 7/10 → retry with improved intro

### Answer Evaluation — 6 Parameters

| Parameter | What It Measures |
|---|---|
| `technical_correctness` | Factually and technically accurate |
| `depth_of_knowledge` | Shows deep understanding, not surface-level |
| `clarity` | Easy to understand and well-explained |
| `communication` | Professional and structured |
| `confidence` | Sounds confident and assured |
| `structure` | Clear beginning, middle, conclusion |

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | REST API framework |
| **SQLAlchemy + SQLite** | Database ORM + local database |
| **Uvicorn** | ASGI server |
| **PyMuPDF (fitz)** | PDF text extraction |
| **python-docx** | DOCX text extraction |
| **OpenAI SDK** | GPT-4o (text) + Whisper (speech-to-text) |
| **google-genai** | Gemini 2.0 Flash (text generation) |
| **python-dotenv** | Environment variable management |

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 14** (App Router) | React framework |
| **Tailwind CSS** | Styling |
| **Axios** | HTTP client for API calls |
| **react-markdown** | Render AI-generated markdown |
| **react-hot-toast** | Toast notifications |
| **lucide-react** | Icons |

### AI Models Used
| Task | OpenAI | Gemini |
|---|---|---|
| Text generation | GPT-4o | Gemini 2.0 Flash |
| Key validation | models.list() | models.list() |
| Speech-to-text | Whisper-1 | ❌ Not supported |

---

## 📁 Project Structure

```
AI Mock tool, Intro video tool/
│
├── README.md                          ← You are here
├── PLAN.md                            ← Architecture plan
├── start.bat                          ← One-click launcher (Windows)
│
├── backend/                           ← FastAPI Python backend
│   ├── main.py                        ← App entry point, CORS, router registration
│   ├── database.py                    ← SQLAlchemy engine + session
│   ├── models.py                      ← DB models (Candidate, CaseStudy, IntroAttempt,
│   │                                     ProjectExtraction, MockInterviewSession,
│   │                                     InterviewAnswer, FinalReport)
│   ├── schemas.py                     ← Pydantic schemas
│   ├── requirements.txt               ← Python dependencies
│   │
│   ├── routers/                       ← API route handlers
│   │   ├── setup.py                   ← POST /api/setup/validate
│   │   ├── resume.py                  ← POST /api/resume/upload
│   │   ├── resume_ai.py               ← POST /api/resume/extract-project
│   │   │                                 POST /api/resume/intro-training
│   │   ├── case_study.py              ← POST /api/case-study/generate
│   │   │                                 POST /api/case-study/generate-from-template
│   │   │                                 GET  /api/case-study/download-template/:filename
│   │   ├── intro.py                   ← POST /api/intro/evaluate (audio)
│   │   │                                 POST /api/intro/evaluate-text (text)
│   │   ├── mock_interview.py          ← POST /api/mock-interview/start
│   │   │                                 POST /api/mock-interview/evaluate-answer
│   │   └── report.py                  ← POST /api/report/generate
│   │
│   ├── services/                      ← AI agents & business logic
│   │   ├── ai_client.py               ← Unified OpenAI/Gemini wrapper + validation
│   │   ├── resume_parser.py           ← PDF/DOCX text extraction
│   │   ├── project_extractor.py       ← Resume → structured project
│   │   ├── case_study_agent.py        ← Case study generation (3 modes)
│   │   ├── intro_evaluator.py         ← 8-parameter intro scoring
│   │   ├── mock_interview_agent.py    ← Questions, answer eval, final report
│   │   └── template_loader.py         ← Reads template files, provides to AI
│   │
│   └── templates/                     ← Your template files (placed here)
│       ├── intro_template.docx        ← Candidate Interview Introduction
│       ├── case_study_mlops.pdf       ← MLOps Fraud Detection case study
│       ├── case_study_rag.pdf         ← RAG Call Center case study
│       └── case_study_agentic_ai.pdf  ← Agentic AI case study
│
└── frontend/                          ← Next.js frontend
    ├── app/
    │   ├── page.tsx                   ← Landing page (/)
    │   ├── setup/page.tsx             ← 3-step setup (/setup)
    │   ├── dashboard/page.tsx         ← Module dashboard (/dashboard)
    │   ├── case-study/page.tsx        ← Case study generator (/case-study)
    │   ├── intro/page.tsx             ← Intro practice & scoring (/intro)
    │   ├── mock-interview/page.tsx    ← Mock interview (/mock-interview)
    │   └── report/page.tsx            ← Final report (/report)
    ├── lib/
    │   └── api.ts                     ← All API call functions
    └── globals.css                    ← Dark theme design system
```

---

## 🚀 How to Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- An OpenAI API key (`sk-...`) **or** a Google Gemini API key (`AIza...`)

### Option 1: One-Click Start (Windows)
Double-click **`start.bat`** in the root folder. It opens two terminal windows automatically.

### Option 2: Manual Start

**Terminal 1 — Backend**
```bash
cd backend

# First time only: install dependencies
pip install fastapi uvicorn sqlalchemy pydantic python-multipart pymupdf python-docx openai google-genai python-dotenv aiofiles httpx

# Run
python -m uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend**
```bash
cd frontend

# First time only
npm install

# Run
npm run dev
```

### Verify Both Are Running
| Server | URL | Test |
|---|---|---|
| Backend | http://localhost:8000 | Should return `{"status": "ok"}` |
| Backend Docs | http://localhost:8000/docs | Swagger UI with all endpoints |
| Frontend | http://localhost:3000 | Landing page |

> ⚠️ **Important:** Start the backend BEFORE using the frontend. The setup page will show a green "Backend connected" badge if the backend is up.

---

## 📡 API Reference

### Setup
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/setup/validate` | Validate API key, create session |

### Resume
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/resume/upload` | Upload PDF/DOCX resume |
| POST | `/api/resume/extract-project` | Extract best project from resume |
| GET | `/api/resume/latest-project` | Get last extracted project |
| POST | `/api/resume/intro-training` | Get intro template + sample intro |

### Case Study
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/case-study/topics` | List topics + available templates |
| POST | `/api/case-study/generate` | Generate from resume or topic |
| POST | `/api/case-study/generate-from-template` | Generate using MLOps/RAG/Agentic template |
| GET | `/api/case-study/intro-template` | Get the full intro template text |
| GET | `/api/case-study/download-template/{filename}` | Download a template file |
| GET | `/api/case-study/history` | All generated case studies |

### Intro Practice
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/intro/evaluate` | Audio upload → Whisper STT → 8-param score |
| POST | `/api/intro/evaluate-text` | Text intro → 8-param score (works with Gemini) |
| GET | `/api/intro/history` | All past intro attempts |

### Mock Interview
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/mock-interview/start` | Generate 10 questions |
| POST | `/api/mock-interview/evaluate-answer` | Evaluate one answer |
| GET | `/api/mock-interview/session` | Get current session + questions |
| GET | `/api/mock-interview/answers` | All evaluated answers |

### Report
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/report/generate` | Generate 11-section final report |
| GET | `/api/report/latest` | Get last generated report |

---

## 📄 Template Files

Four template files are stored in `backend/templates/` and used by the AI:

### 1. `intro_template.docx` — Candidate Interview Introduction
Used by the **Intro Evaluator** as the scoring rubric.
The AI compares every candidate's introduction against this template structure:
- Hi, I am [Name]
- Career journey (software → MLOps → GenAI)
- Current/recent project (RAG system, Multi-Agent system)
- Technologies used
- Full stack and deployment experience

### 2. `case_study_mlops.pdf` — MLOps Fraud Detection System
AI uses this structure for MLOps-style case studies:
- CI/CD pipeline, MLflow, Databricks, SageMaker
- Model training, registry, monitoring, drift detection

### 3. `case_study_rag.pdf` — RAG Customer Call Center
AI uses this structure for RAG/LLM case studies:
- Ingestion + Query pipelines
- Hybrid retrieval (semantic + BM25 + Neo4j)
- AWS Bedrock, LangChain, Milvus, Guardrails

### 4. `case_study_agentic_ai.pdf` — Agentic AI Multi-Agent System
AI uses this structure for multi-agent case studies:
- Orchestrator + Domain agents (Claims, Billing, Scheduling, Policy)
- LangGraph, MCP, shared blackboard pattern
- Safety agents, tiered autonomy, memory layers

---

## ⚙️ Configuration & Environment

### Backend — No `.env` required for basic use
The backend uses SQLite by default (no setup needed).

Optional `backend/.env`:
```env
DATABASE_URL=sqlite:///./aiprep.db
UPLOAD_DIR=uploads
CORS_ORIGINS=http://localhost:3000
```

### Frontend — `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🔑 Which API Key to Use?

| Feature | OpenAI | Gemini |
|---|---|---|
| Case Study Generation | ✅ GPT-4o | ✅ Gemini 2.0 Flash |
| Project Extraction | ✅ GPT-4o | ✅ Gemini 2.0 Flash |
| Intro Text Evaluation | ✅ | ✅ |
| **Intro Audio Recording** | ✅ Whisper STT | ❌ Not supported |
| Mock Interview | ✅ | ✅ |
| Final Report | ✅ | ✅ |

**Recommendation:**
- Use **Gemini** (free tier at [aistudio.google.com](https://aistudio.google.com/apikey)) for all text features
- Use **OpenAI** if you also want audio intro evaluation (needs $5+ credits at [platform.openai.com](https://platform.openai.com/api-keys))

### Key Format
- OpenAI: starts with `sk-`
- Gemini: starts with `AIza`

---

## 🔧 Troubleshooting

### Setup page shows "Backend not reachable"
```bash
# Start the backend
cd backend
python -m uvicorn main:app --reload --port 8000
```

### "API key validation failed"
- OpenAI keys must start with `sk-`
- Gemini keys must start with `AIza`
- Check your internet connection
- Make sure the key has not expired or been revoked

### Two backend instances conflict (port already in use)
```powershell
# Kill all Python processes
Get-Process -Name python | Stop-Process -Force
# Then restart backend
python -m uvicorn main:app --reload --port 8000
```

### Resume upload fails
- Only PDF and DOCX/DOC formats are accepted
- Make sure the file is not password-protected
- File size should be under 10 MB

### Intro audio evaluation not working with Gemini
- Audio evaluation uses OpenAI Whisper — it **requires an OpenAI key**
- With Gemini, use the **"Type your intro"** tab instead

### Frontend build errors
```bash
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

---

## 🗺️ Roadmap / Future Improvements

- [ ] **User Authentication** — NextAuth.js for persistent accounts
- [ ] **PostgreSQL** — Replace SQLite for production
- [ ] **S3 File Storage** — For resume and audio files
- [ ] **Streaming Responses** — Real-time case study generation output
- [ ] **Voice Interview Mode** — Full voice-based mock interview
- [ ] **Progress Tracking** — Charts showing improvement over sessions
- [ ] **Gemini Audio Support** — When Gemini adds STT API
- [ ] **PDF Export** — Export final report as styled PDF

---

## 📝 License

This project is for personal/educational use. All AI responses are generated using the candidate's own API keys.

---

*Built with FastAPI + Next.js + OpenAI/Gemini*

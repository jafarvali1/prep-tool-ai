from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from database import engine, Base
import models  # noqa: ensure models are registered

from routers import setup, resume, case_study, intro
from routers import resume_ai, mock_interview, report

# Create all DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Candidate Preparation Platform",
    description="AI-powered interview prep: case studies, intro evaluation, and mock interviews",
    version="1.0.0",
)

# CORS — allow frontend dev server
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(setup.router)
app.include_router(resume.router)
app.include_router(resume_ai.router)
app.include_router(case_study.router)
app.include_router(intro.router)
app.include_router(mock_interview.router)
app.include_router(report.router)


@app.get("/")
async def root():
    return {"message": "AI Candidate Preparation Platform API", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "ok"}

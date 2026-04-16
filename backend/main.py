# # # backend/main.py
# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from dotenv import load_dotenv
# import os

# load_dotenv()

# from database import engine, Base
# import models  # noqa: ensure models are registered

# from routers import setup, resume, case_study, intro
# from routers import resume_ai, mock_interview, report

# app = FastAPI(
#     title="AI Candidate Preparation Platform",
#     description="AI-powered interview prep: case studies, intro evaluation, and mock interviews",
#     version="1.0.0",
# )

# # Create tables on startup (IMPORTANT for Cloud Run)
# # @app.on_event("startup")
# # def startup():
# #     Base.metadata.create_all(bind=engine)

# @app.on_event("startup")
# def startup():
#     try:
#         Base.metadata.create_all(bind=engine)
#         print("Database connected and tables created")
#     except Exception as e:
#         print("Database connection failed:", e)

# # CORS
# # origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
# # app.add_middleware(
# #     CORSMiddleware,
# #     allow_origins=origins,
# #     allow_credentials=True,
# #     allow_methods=["*"],
# #     allow_headers=["*"],
# # )

# origins = [
#     # "http://localhost:3000",
#     # "https://ai-frontend-560359652969.us-central1.run.app",
#     "*"
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Routers
# app.include_router(setup.router)
# app.include_router(resume.router)
# app.include_router(resume_ai.router)
# app.include_router(case_study.router)
# app.include_router(intro.router)
# app.include_router(mock_interview.router)
# app.include_router(report.router)

# @app.get("/")
# async def root():
#     return {"message": "AI Candidate Preparation Platform API", "version": "1.0.0"}

# @app.get("/health")
# async def health():
#     return {"status": "ok"}

# # # backend/main.py

# AI Mock tool, Intro video tool\backend\main.py
import os
from time import sleep
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env ONLY when running locally (not in Cloud Run)
if os.environ.get("K_SERVICE") is None:
    load_dotenv()

from database import engine, Base
import models  # register models

from routers import setup, resume, case_study, intro
from routers import resume_ai, mock_interview, report, project

app = FastAPI(
    title="AI Candidate Preparation Platform",
    description="AI-powered interview prep",
    version="1.0.0",
)

# Create tables on startup with retry (important for Cloud SQL)
@app.on_event("startup")
def startup():
    for i in range(5):
        try:
            Base.metadata.create_all(bind=engine)
            print("Database connected and tables created")
            break
        except Exception as e:
            print(f"Database connection failed (attempt {i+1}):", e)
            sleep(5)

# Debug DB endpoint
@app.get("/debug-db")
def debug_db():
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SHOW TABLES;"))
        tables = [row[0] for row in result]
    return {"tables": tables}

# CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://192.168.56.1:3000",
    "http://192.168.56.1:3001",
    "https://ai-frontend-560359652969.us-central1.run.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(setup.router)
app.include_router(resume.router)
app.include_router(resume_ai.router)
app.include_router(case_study.router)
app.include_router(intro.router)
app.include_router(mock_interview.router)
app.include_router(report.router)
app.include_router(project.router)

@app.get("/")
def root():
    return {"message": "AI Candidate Preparation Platform API"}

@app.get("/health")
def health():
    return {"status": "ok"}
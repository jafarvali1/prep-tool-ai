from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Candidate, CaseStudy
from schemas import CaseStudyRequest, CaseStudyResponse
from services.case_study_agent import (
    generate_case_study_from_resume,
    generate_domain_case_study,
    generate_template_based_case_study,
    get_available_templates,
)
from services.template_loader import get_template_file_path, get_intro_template
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/case-study", tags=["case-study"])

DOMAIN_TOPICS = [
    "MLOps - Fraud Detection System (XYZ Corp)",
    "RAG Customer Call Center Agent (XYZ Corp)",
    "Agentic AI - Multi-Agent Customer Call Center (XYZ Corp)"
]


class TemplateCaseStudyRequest(BaseModel):
    session_id: str
    project_details: str
    template_key: Optional[str] = "mlops"   # mlops | rag | agentic


@router.get("/topics")
async def get_topics():
    """Return available domain topics and case study templates."""
    return {
        "topics": DOMAIN_TOPICS,
        "templates": get_available_templates(),
    }


@router.get("/intro-template")
async def get_intro_template_text():
    """Return the full intro template text (from DOCX)."""
    return {"content": get_intro_template()}


@router.get("/download-template/{filename}")
async def download_template(filename: str):
    """Download a template file (PDF or DOCX) by filename."""
    # Security: only allow known template filenames
    allowed = {
        "case_study_mlops.pdf",
        "case_study_rag.pdf",
        "case_study_agentic_ai.pdf",
        "intro_template.docx",
    }
    if filename not in allowed:
        raise HTTPException(status_code=404, detail="Template file not found.")
    path = get_template_file_path(filename)
    if not path:
        raise HTTPException(status_code=404, detail="Template file not on disk.")
    return FileResponse(
        path,
        filename=filename,
        media_type="application/octet-stream",
    )


@router.post("/generate", response_model=CaseStudyResponse)
async def generate_case_study(request: CaseStudyRequest, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.session_id == request.session_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Session not found. Please complete setup first.")

    try:
        if request.topic:
            # Domain-based case study
            content = await generate_domain_case_study(
                topic=request.topic,
                api_key=candidate.api_key,
                provider=candidate.api_provider,
            )
        else:
            # Resume-based case study
            if not candidate.resume_text:
                raise HTTPException(status_code=400, detail="No resume found. Please upload your resume first.")
            content = await generate_case_study_from_resume(
                resume_text=candidate.resume_text,
                api_key=candidate.api_key,
                provider=candidate.api_provider,
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    case_study = CaseStudy(session_id=request.session_id, content=content)
    db.add(case_study)
    db.commit()

    return CaseStudyResponse(session_id=request.session_id, content=content)


@router.post("/generate-from-template")
async def generate_from_template(request: TemplateCaseStudyRequest, db: Session = Depends(get_db)):
    """
    Generate a case study from extracted project details using one of the 3 template styles:
    mlops | rag | agentic
    """
    candidate = db.query(Candidate).filter(Candidate.session_id == request.session_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Session not found.")

    if not request.project_details or len(request.project_details.strip()) < 20:
        raise HTTPException(status_code=400, detail="Project details too short. Please extract your project first.")

    try:
        content = await generate_template_based_case_study(
            project_details=request.project_details,
            resume_text=candidate.resume_text,
            api_key=candidate.api_key,
            provider=candidate.api_provider,
            template_key=request.template_key or "mlops",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template-based generation failed: {str(e)}")

    case_study = CaseStudy(session_id=request.session_id, content=content)
    db.add(case_study)
    db.commit()

    return {"session_id": request.session_id, "content": content, "template_used": request.template_key}


@router.get("/history")
async def get_case_study_history(session_id: str, db: Session = Depends(get_db)):
    """Return all generated case studies for a session."""
    case_studies = (
        db.query(CaseStudy)
        .filter(CaseStudy.session_id == session_id)
        .order_by(CaseStudy.created_at.desc())
        .all()
    )
    return {
        "session_id": session_id,
        "case_studies": [
            {"id": cs.id, "content": cs.content, "created_at": str(cs.created_at)}
            for cs in case_studies
        ],
    }

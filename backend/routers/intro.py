import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Candidate, IntroAttempt
from services.intro_evaluator import evaluate_intro_from_audio, evaluate_intro_from_text

router = APIRouter(prefix="/api/intro", tags=["intro"])

from services.project_evaluator import generate_dynamic_intro
from models import CaseStudy

@router.get("/dynamic-template")
async def get_dynamic_template(session_id: str, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.session_id == session_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    case_studies = db.query(CaseStudy).filter(CaseStudy.session_id == session_id).order_by(CaseStudy.created_at.desc()).first()
    if not case_studies or not case_studies.content:
        # Fallback to generic template if no case study exists yet
        return {"template": "Hi, my name is [Name]. I have [X] years of experience in [domain]. I specialize in [key skills]. In my last role, I built [key achievement]. I am looking for opportunities in [role]."}
        
    try:
        intro_text = await generate_dynamic_intro(case_studies.content, candidate.resume_text or "No resume provided", candidate.api_key, candidate.api_provider)
        return {"template": intro_text.strip()}
    except Exception as e:
        return {"template": "Hi, my name is [Name]. I have [X] years of experience in [domain]. I specialize in [key skills]. In my last role, I built [key achievement]. I am looking for opportunities in [role]."}


class TextIntroRequest(BaseModel):
    session_id: str
    intro_text: str


@router.post("/evaluate")
async def evaluate_intro_audio(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Accept a recorded audio file, run STT + AI evaluation (8 parameters), return score.
    """
    candidate = db.query(Candidate).filter(Candidate.session_id == session_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Session not found. Please complete setup first.")

    if candidate.api_provider != "openai":
        raise HTTPException(
            status_code=400,
            detail="Audio speech-to-text evaluation requires an OpenAI API key (Whisper).",
        )

    audio_bytes = await audio.read()
    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Audio file too small. Please record a full introduction.")

    try:
        result = await evaluate_intro_from_audio(
            audio_bytes=audio_bytes,
            api_key=candidate.api_key,
            provider=candidate.api_provider,
            filename=audio.filename or "intro.webm",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

    # Save attempt — store overall_score * 10 for consistency (0-100 range)
    overall = result.get("overall_score", 0)
    score_pct = int(overall * 10) if overall <= 10 else int(overall)

    attempt = IntroAttempt(
        session_id=session_id,
        transcript=result.get("transcript"),
        score=score_pct,
        feedback=result.get("suggestions", [""])[0] if result.get("suggestions") else "",
    )
    db.add(attempt)
    db.commit()

    return {"session_id": session_id, **result}


@router.post("/evaluate-text")
async def evaluate_intro_text(request: TextIntroRequest, db: Session = Depends(get_db)):
    """
    Evaluate a typed/transcribed introduction without audio.
    Works with both OpenAI and Gemini.
    """
    candidate = db.query(Candidate).filter(Candidate.session_id == request.session_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Session not found. Please complete setup first.")

    try:
        result = await evaluate_intro_from_text(
            candidate_intro=request.intro_text,
            api_key=candidate.api_key,
            provider=candidate.api_provider,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

    overall = result.get("overall_score", 0)
    score_pct = int(overall * 10) if overall <= 10 else int(overall)

    attempt = IntroAttempt(
        session_id=request.session_id,
        transcript=request.intro_text,
        score=score_pct,
        feedback=", ".join(result.get("suggestions", [])),
    )
    db.add(attempt)
    db.commit()

    return {"session_id": request.session_id, **result}


@router.get("/history")
async def get_intro_history(session_id: str, db: Session = Depends(get_db)):
    """Return all intro attempts for a session."""
    attempts = (
        db.query(IntroAttempt)
        .filter(IntroAttempt.session_id == session_id)
        .order_by(IntroAttempt.created_at.desc())
        .all()
    )
    return {
        "session_id": session_id,
        "attempts": [
            {
                "id": a.id,
                "transcript": a.transcript,
                "score": a.score,
                "feedback": a.feedback,
                "created_at": str(a.created_at),
            }
            for a in attempts
        ],
    }

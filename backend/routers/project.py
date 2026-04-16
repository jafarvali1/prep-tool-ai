from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Candidate, CaseStudy
from services.project_evaluator import evaluate_project_explanation, generate_case_study_from_use_case
from pydantic import BaseModel

router = APIRouter(prefix="/api/project", tags=["project"])

class ProjectExplanationRequest(BaseModel):
    session_id: str
    explanation: str

class UseCaseRequest(BaseModel):
    session_id: str
    explanation: str
    use_case_details: str

@router.post("/evaluate-explanation")
async def evaluate_explanation(request: ProjectExplanationRequest, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.session_id == request.session_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    if len(request.explanation.strip()) < 20:
        return {"score": 1, "missing_elements": ["Problem", "Solution", "Business Value", "Users", "Role"], "feedback": "Explanation is too short. Please provide more detail."}
        
    try:
        evaluation = await evaluate_project_explanation(
            request.explanation,
            candidate.api_key,
            candidate.api_provider
        )
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-use-case")
async def generate_from_use_case(request: UseCaseRequest, db: Session = Depends(get_db)):
    candidate = db.query(Candidate).filter(Candidate.session_id == request.session_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    try:
        content = await generate_case_study_from_use_case(
            request.explanation,
            request.use_case_details,
            candidate.api_key,
            candidate.api_provider
        )
        
        case_study = CaseStudy(session_id=request.session_id, content=content)
        db.add(case_study)
        db.commit()
        
        return {"session_id": request.session_id, "content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

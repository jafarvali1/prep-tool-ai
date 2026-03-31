import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import Candidate
from schemas import SetupRequest, SetupResponse
from services.ai_client import validate_api_key

router = APIRouter(prefix="/api/setup", tags=["setup"])


@router.post("/validate", response_model=SetupResponse)
async def validate_and_setup(request: SetupRequest, db: Session = Depends(get_db)):
    """
    Validate the candidate's API key and create a session.
    """
    try:
        capabilities = await validate_api_key(request.api_key, request.api_provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    session_id = str(uuid.uuid4())

    candidate = Candidate(
        session_id=session_id,
        api_key=request.api_key,
        api_provider=request.api_provider,
    )
    db.add(candidate)
    db.commit()

    return SetupResponse(
        session_id=session_id,
        message="API key validated successfully. Your session is ready.",
        models_available=capabilities,
    )

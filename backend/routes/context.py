from fastapi import APIRouter, HTTPException
from services.context_service import get_candidate_context

router = APIRouter(prefix="/api/context", tags=["context"])

@router.get("/{user_id}")
def get_context(user_id: str):
    """
    Returns full candidate data.
    """
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
        
    try:
        context = get_candidate_context(user_id)
        return context
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

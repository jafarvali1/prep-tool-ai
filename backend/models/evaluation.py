# backend\models\evaluation.py
from pydantic import BaseModel
from typing import Optional, Any, List, Dict

class EvaluationCreate(BaseModel):
    user_id: str
    type: str # 'intro', 'project', etc
    score: int
    passed: bool
    feedback: Optional[dict] = None
    raw_response: Optional[dict] = None

class IntroEvaluationResponse(BaseModel):
    scores: Dict[str, float]
    overall_score: float
    passed: bool
    feedback: List[str]
    missing_elements: List[str]

class ProjectEvaluationResponse(BaseModel):
    scores: Dict[str, float]
    overall_score: float
    feedback: List[str]
    missing_points: List[str]

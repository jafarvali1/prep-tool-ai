from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.llm_service import call_llm_with_context
from services.evaluator import coach_answer

router = APIRouter(prefix="/api/interview", tags=["interview"])

@router.get("/stage-questions")
def get_stage_questions(session_id: str, api_key: str = None):
    """
    Adapter for frontend: start the interview loop and return the first question.
    """
    try:
        q = call_llm_with_context(
            user_id=session_id,
            prompt="Generate the first technical interview question. Do not start with generic greetings.",
            system_prompt="You are a strict technical interviewer.",
            api_key=api_key,
            response_format="text"
        )
        return {"questions": [q]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class LiveEvalRequest(BaseModel):
    session_id: str
    current_question: str
    user_answer: str
    stage_name: str
    previous_context: str = ""
    api_key: str = None

@router.post("/evaluate-live")
def evaluate_live(data: LiveEvalRequest):
    """
    Adapter for frontend: send answer, get feedback and the next question combined.
    """
    try:
        # 1. Coach the answer
        eval_prompt = f"Question: {data.current_question}\nAnswer: {data.user_answer}\nIdentify flaws and explain how to improve."
        feedback = call_llm_with_context(
            user_id=data.session_id,
            prompt=eval_prompt,
            system_prompt="You are a strict technical evaluator.",
            api_key=data.api_key,
            response_format="text"
        )
        coaching = coach_answer(data.session_id, data.user_answer, feedback, api_key=data.api_key)
        
        # 2. Next question
        next_q = call_llm_with_context(
            user_id=data.session_id,
            prompt=f"Previous Context:\n{data.previous_context}\n\nGenerate the next technical interview question. Do not repeat.",
            system_prompt="You are a strict technical interviewer.",
            api_key=data.api_key,
            response_format="text"
        )
        
        return {
            "reply": next_q,
            "evaluation": {
                "overall_score": 7, # Default mock score or parse from coaching
                "gap_analysis": coaching.get("mistakes", []),
                "improved_answer": coaching.get("better_version", "")
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


"""
Mock Interview Router:
POST /api/mock-interview/start           — Generate 10 questions
POST /api/mock-interview/evaluate-answer — Evaluate a single answer
GET  /api/mock-interview/session         — Get existing session with questions
GET  /api/mock-interview/answers         — Get all evaluated answers for a session
"""
import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Candidate, ProjectExtraction, MockInterviewSession, InterviewAnswer
from services.mock_interview_agent import generate_interview_questions, evaluate_answer

router = APIRouter(prefix="/api/mock-interview", tags=["mock-interview"])


class StartRequest(BaseModel):
    session_id: str


class AnswerRequest(BaseModel):
    session_id: str
    mock_session_id: int
    question: str
    question_id: int
    answer: str


@router.post("/start")
async def start_mock_interview(request: StartRequest, db: Session = Depends(get_db)):
    """
    Generate 10 interview questions for the candidate based on resume + extracted project.
    """
    candidate = db.query(Candidate).filter(Candidate.session_id == request.session_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Session not found.")
    if not candidate.resume_text:
        raise HTTPException(status_code=400, detail="No resume found. Please upload your resume first.")

    # Get latest extracted project (or use empty if not extracted yet)
    extraction = (
        db.query(ProjectExtraction)
        .filter(ProjectExtraction.session_id == request.session_id)
        .order_by(ProjectExtraction.created_at.desc())
        .first()
    )
    project_details = extraction.project_details if extraction else "No project extracted yet."

    try:
        questions = await generate_interview_questions(
            resume_text=candidate.resume_text,
            project_details=project_details,
            api_key=candidate.api_key,
            provider=candidate.api_provider,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

    # Save session
    mock_session = MockInterviewSession(
        session_id=request.session_id,
        questions_json=json.dumps(questions),
    )
    db.add(mock_session)
    db.commit()
    db.refresh(mock_session)

    return {
        "session_id": request.session_id,
        "mock_session_id": mock_session.id,
        "questions": questions,
        "total_questions": len(questions),
    }


@router.post("/evaluate-answer")
async def evaluate_interview_answer(request: AnswerRequest, db: Session = Depends(get_db)):
    """
    Evaluate a single candidate answer and store the result.
    """
    candidate = db.query(Candidate).filter(Candidate.session_id == request.session_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Session not found.")

    if not request.answer or len(request.answer.strip()) < 10:
        raise HTTPException(status_code=400, detail="Answer too short. Please provide a detailed answer.")

    try:
        result = await evaluate_answer(
            question=request.question,
            answer=request.answer,
            api_key=candidate.api_key,
            provider=candidate.api_provider,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Answer evaluation failed: {str(e)}")

    # Save answer
    interview_answer = InterviewAnswer(
        session_id=request.session_id,
        mock_session_id=request.mock_session_id,
        question=request.question,
        answer=request.answer,
        overall_score=str(result.get("overall_score", 0)),
        scores_json=json.dumps(result.get("scores", {})),
        feedback=result.get("feedback", ""),
        ideal_answer=result.get("ideal_answer", ""),
    )
    db.add(interview_answer)
    db.commit()

    return {
        "session_id": request.session_id,
        "question_id": request.question_id,
        **result,
    }


@router.get("/session")
async def get_mock_session(session_id: str, db: Session = Depends(get_db)):
    """Get the latest mock interview session with questions."""
    mock_session = (
        db.query(MockInterviewSession)
        .filter(MockInterviewSession.session_id == session_id)
        .order_by(MockInterviewSession.created_at.desc())
        .first()
    )
    if not mock_session:
        return {"session_id": session_id, "mock_session_id": None, "questions": []}

    questions = json.loads(mock_session.questions_json) if mock_session.questions_json else []
    return {
        "session_id": session_id,
        "mock_session_id": mock_session.id,
        "questions": questions,
        "created_at": str(mock_session.created_at),
    }


@router.get("/answers")
async def get_interview_answers(session_id: str, mock_session_id: int, db: Session = Depends(get_db)):
    """Get all evaluated answers for a mock interview session."""
    answers = (
        db.query(InterviewAnswer)
        .filter(
            InterviewAnswer.session_id == session_id,
            InterviewAnswer.mock_session_id == mock_session_id,
        )
        .order_by(InterviewAnswer.created_at.asc())
        .all()
    )
    return {
        "session_id": session_id,
        "answers": [
            {
                "id": a.id,
                "question": a.question,
                "answer": a.answer,
                "overall_score": float(a.overall_score) if a.overall_score else 0,
                "scores": json.loads(a.scores_json) if a.scores_json else {},
                "feedback": a.feedback,
                "ideal_answer": a.ideal_answer,
            }
            for a in answers
        ],
        "average_score": (
            round(sum(float(a.overall_score or 0) for a in answers) / len(answers), 1)
            if answers else 0
        ),
    }

class EvaluateAnswerRequest(BaseModel):
    session_id: str
    current_question: str
    user_answer: str
    stage_name: str
    previous_context: str = ""

@router.post("/evaluate-answer")
async def evaluate_answer_and_followup(request: EvaluateAnswerRequest, db: Session = Depends(get_db)):
    """Evaluate candidate answer structurally and provide 'Ideal Answer', Gap Analysis, and follow-up."""
    candidate = db.query(Candidate).filter(Candidate.session_id == request.session_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    from services.ai_client import generate_text_with_usage
    import json
    
    prompt = f"""
    You are a strict, enterprise-tier Technical Interview Evaluator.
    
    Stage: {request.stage_name}
    Previous Context: {request.previous_context}
    
    Current Question: "{request.current_question}"
    Candidate Answer: "{request.user_answer}"
    
    Evaluate the candidate's answer structurally. Generate a concise Ideal Answer first, then compare.
    Return ONLY valid JSON matching this exact schema (no markdown formatting):
    {{
      "scores": {{
        "clarity": <0-10>,
        "technical_depth": <0-10>,
        "communication": <0-10>,
        "confidence": <0-10>
      }},
      "overall_score": <0-10.0>,
      "strengths": ["...", "..."],
      "weaknesses": ["...", "..."],
      "improved_answer": "...",
      "gap_analysis": ["...", "..."],
      "follow_up_question": "<A spoken, natural follow up question or acknowledgment (1-3 sentences) acting as the recruiter>"
    }}
    """
    
    try:
        response_data = await generate_text_with_usage(prompt, candidate.api_key, candidate.api_provider, max_retries=1)
        response_text = response_data["content"].strip()
        tokens_used = response_data["usage"]["tokens"]
        
        # Track Tokens
        candidate.total_tokens_used += tokens_used
        candidate.total_requests += 1
        db.commit()
        
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1]
            
        evaluation = json.loads(response_text.strip())
        
        # Ensure fallback for follow_up if missing
        if "follow_up_question" not in evaluation:
            evaluation["follow_up_question"] = "Thank you. Let's move on to the next topic."
            
        return {
            "reply": evaluation["follow_up_question"],
            "evaluation": evaluation,
            "usage": {
                "total_tokens_used": candidate.total_tokens_used,
                "total_requests": candidate.total_requests
            }
        }
    except Exception as e:
        print("Evaluation parsing failed:", e)
        # Fallback response
        return {
            "reply": "I see. Let's dig deeper. Can you elaborate further?",
            "evaluation": None,
            "usage": {"total_tokens_used": getattr(candidate, "total_tokens_used", 0), "total_requests": getattr(candidate, "total_requests", 0)}
        }

@router.get("/stage-questions")
async def get_stage_questions(session_id: str, db: Session = Depends(get_db)):
    """Generate exactly 6 contextual questions tailored to the candidate's resume and project."""
    candidate = db.query(Candidate).filter(Candidate.session_id == session_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Session not found.")
    if not candidate.resume_text:
        raise HTTPException(status_code=400, detail="No resume uploaded.")

    # Get latest extracted project
    extraction = (
        db.query(ProjectExtraction)
        .filter(ProjectExtraction.session_id == session_id)
        .order_by(ProjectExtraction.created_at.desc())
        .first()
    )
    project_details = extraction.project_details if extraction else "Unknown specific project"

    from services.ai_client import generate_text
    import json
    
    prompt = f"""
    You are an expert technical interviewer configuring a 6-stage interview panel.
    
    Candidate Resume Background: 
    {candidate.resume_text[:2000]}
    
    Candidate Major Project Highlight:
    {project_details}
    
    Based on the exact company mentioned in their project highlight or their latest role, craft exactly 6 tailored interview questions as a pure JSON array containing 6 strings.
    
    [
      "Intro: State what you currently know about [Company from resume] based on your vast internal knowledge base context. Ask them to confirm if your understanding of the company is correct, and prompt them to elaborate on their specific role there.",
      "Topic Mock: Ask a specific conceptual question about [Key Framework from resume like React or Django]",
      "Hiring Manager: Ask a behavioral question about a time they faced a challenge while building [Exact Project Name from their summary]",
      "Technical Panel: Ask how they would scale or optimize a specific component of [Exact Project Name]",
      "System Design: Ask them to architect a system conceptually related to the domain of their recent experience",
      "Coding: A concise algorithm problem based on [Their primary language]"
    ]
    
    Return ONLY valid JSON array of 6 strings. No markdown, no prefixes.
    """
    
    try:
        response = await generate_text(prompt, candidate.api_key, candidate.api_provider)
        response = response.strip()
        if "```json" in response:
            response = response.split("```json")[1].split("```")[0]
        elif "```" in response:
            response = response.split("```")[1]
            
        questions = json.loads(response.strip())
        if type(questions) != list or len(questions) < 6:
            raise ValueError("LLM returned malformed question list.")
            
        return {"questions": questions[:6]}
    except Exception as e:
        print("Failed to gen dynamic questions:", e)
        # Fallback to hardcoded generic but functional
        return {"questions": [
            "Welcome. Let's start with a brief introduction. Can you walk me through your resume?",
            "Great. Can you explain the difference between processes and threads?",
            "I'm the Hiring Manager. Tell me about a time you resolved a conflict.",
            "Technical Panel. How would you troubleshoot a failing microservice?",
            "System Design. Design a scalable URL shortener.",
            "Coding. How would you detect a cycle in a directed graph?"
        ]}


import os
import json
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from db.connection import get_db_connection
from services.speech_service import transcribe_audio
from services.evaluator import evaluate_intro

router = APIRouter(prefix="/api/intro", tags=["intro"])

@router.post("/evaluate")
async def evaluate_audio_intro(
    session_id: str = Form(...),
    audio: UploadFile = File(...),
    api_key: str = Form(None)
):
    conn = None
    try:
        # Save temp file
        os.makedirs("uploads", exist_ok=True)
        file_path = f"uploads/{uuid.uuid4()}_{audio.filename}"
        with open(file_path, "wb") as f:
            f.write(await audio.read())
            
        # 1. Transcribe
        transcript = transcribe_audio(file_path)
        
        # 2. Evaluate
        conn = get_db_connection()
        ideal_intro = "A professional overview covering name, background, and alignment with the requested role."
        with conn.cursor() as cursor:
            # try to fetch generated template if we added it to resumes or project (simplification here)
            pass
            
        eval_result = evaluate_intro(session_id, transcript, ideal_intro, api_key=api_key)
        
        # 3. Store in DB
        score = int(eval_result.get("overall_score", 0))
        if score <= 10: # normalize to 100 if it was /10
            score *= 10
            
        is_passed = eval_result.get("passed", score >= 70)
        
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO evaluations (user_id, type, score, passed, feedback, raw_response)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                session_id, 
                "intro", 
                score, 
                is_passed, 
                json.dumps(eval_result.get("feedback", [])), 
                json.dumps(eval_result)
            ))
            
            # Upsert attempt
            cursor.execute("SELECT attempt_count FROM attempts WHERE user_id = %s AND attempt_type = 'intro'", (session_id,))
            attn = cursor.fetchone()
            if attn:
                cursor.execute("UPDATE attempts SET attempt_count = attempt_count + 1 WHERE user_id = %s AND attempt_type = 'intro'", (session_id,))
            else:
                cursor.execute("INSERT INTO attempts (user_id, attempt_type, attempt_count) VALUES (%s, %s, %s)", (session_id, 'intro', 1))

            conn.commit()
        
        # Clean up
        if os.path.exists(file_path):
            os.remove(file_path)
            
        return {
            "transcript": transcript,
            "evaluation": eval_result,
            "status": "PASS" if is_passed else "RETRY",
            "score": score
        }

    except Exception as e:
        print("Intro Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

from pydantic import BaseModel
class IntroTextRequest(BaseModel):
    session_id: str
    intro_text: str
    api_key: str = None

@router.post("/evaluate-text")
def evaluate_text_intro(data: IntroTextRequest):
    conn = None
    try:
        # 1. Evaluate directly
        conn = get_db_connection()
        ideal_intro = "A professional overview covering name, background, and alignment with the requested role."
            
        eval_result = evaluate_intro(data.session_id, data.intro_text, ideal_intro, api_key=data.api_key)
        
        # 2. Store in DB
        score = int(eval_result.get("overall_score", 0))
        if score <= 10: 
            score *= 10
            
        is_passed = eval_result.get("passed", score >= 70)
        
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO evaluations (user_id, type, score, passed, feedback, raw_response)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                data.session_id, 
                "intro", 
                score, 
                is_passed, 
                json.dumps(eval_result.get("feedback", [])), 
                json.dumps(eval_result)
            ))
            
            # Upsert attempt
            cursor.execute("SELECT attempt_count FROM attempts WHERE user_id = %s AND attempt_type = 'intro'", (data.session_id,))
            attn = cursor.fetchone()
            if attn:
                cursor.execute("UPDATE attempts SET attempt_count = attempt_count + 1 WHERE user_id = %s AND attempt_type = 'intro'", (data.session_id,))
            else:
                cursor.execute("INSERT INTO attempts (user_id, attempt_type, attempt_count) VALUES (%s, %s, %s)", (data.session_id, 'intro', 1))

            conn.commit()
            
        return {
            "transcript": data.intro_text,
            "evaluation": eval_result,
            "status": "PASS" if is_passed else "RETRY",
            "score": score
        }

    except Exception as e:
        print("Intro Text Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

@router.get("/history")
def get_intro_history(session_id: str):
    """
    Check if the user has completed the intro for the dashboard progression.
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT score FROM evaluations WHERE user_id = %s AND type = 'intro' ORDER BY id DESC", (session_id,))
            res = cursor.fetchall()
            attempts = [{"score": row['score']} for row in res]
            return {"attempts": attempts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

@router.get("/dynamic-template")
def get_dynamic_intro_template(session_id: str, api_key: str = None):
    """
    Generate a dynamic intro template based on resuming and project info.
    """
    from services.llm_service import call_llm_with_context
    try:
        template = call_llm_with_context(
            user_id=session_id,
            prompt="Generate a customized self-introduction template for this candidate based on their resume and project. Make it exactly 3 paragraphs. Use placeholders like [Name] but try to fill in actual data where you know it. \n\nCRITICAL OUTPUT RULE: Output ONLY the raw script text. Do not output conversational filler like 'Here is the script:' or 'Certainly'. Start directly with the script.",
            system_prompt="You are an expert career coach helping a candidate prep. Keep it professional and simple.",
            api_key=api_key,
            response_format="text"
        )
        return {"template": template}
    except Exception as e:
        return {"template": "Failed to fetch generated intro template. Please try refreshing."}

import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db.connection import get_db_connection
from fastapi import UploadFile, File, Form

import uuid
from openai import OpenAI

router = APIRouter(prefix="/api/setup", tags=["setup"])

class ValidationRequest(BaseModel):
    api_key: str
    api_provider: str

@router.post("/validate")
def validate_key(req: ValidationRequest):
    """
    Validates OpenAI key and returns a dummy session_id for legacy frontend code compatibility
    """
    try:
        # Simple client validation
        client = OpenAI(api_key=req.api_key)
        # We can just list models to verify it works
        client.models.list()
        
        return {
            "session_id": str(uuid.uuid4()),
            "models_available": ["gpt-4o-mini", "gpt-4o"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid API Key or Provider")

class CandidateSetup(BaseModel):
    user_id: str
    name: str

@router.post("/")
def init_candidate(data: CandidateSetup):
    """
    Ensure the candidate exists in DB. Create if not.
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # UPSERT basically using ON DUPLICATE KEY UPDATE but we just INSERT ignore or catch
            cursor.execute("SELECT id FROM candidates WHERE user_id = %s", (data.user_id,))
            if cursor.fetchone():
                cursor.execute("UPDATE candidates SET name = %s WHERE user_id = %s", (data.name, data.user_id))
            else:
                cursor.execute("INSERT INTO candidates (user_id, name) VALUES (%s, %s)", (data.user_id, data.name))
        conn.commit()
        return {"message": "Candidate setup successful"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

@router.post("/resume")
async def upload_resume(session_id: str = Form(...), file: UploadFile = File(...)):
    """
    Upload or replace resume JSON via form data.
    """
    conn = None
    try:
        content = await file.read()
        try:
            resume_data = json.loads(content)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid JSON file")

        conn = get_db_connection()
        with conn.cursor() as cursor:
            resume_json_str = json.dumps(resume_data)
            
            cursor.execute("SELECT id FROM resumes WHERE user_id = %s", (session_id,))
            if cursor.fetchone():
                cursor.execute("""
                    UPDATE resumes SET resume_json = %s WHERE user_id = %s
                """, (resume_json_str, session_id))
            else:
                cursor.execute("""
                    INSERT INTO resumes (user_id, resume_json) VALUES (%s, %s)
                """, (session_id, resume_json_str))
                
        conn.commit()
        
        # Determine candidate name from json if possible
        candidate_name = resume_data.get("basics", {}).get("name") or resume_data.get("name", "Candidate")
        
        return {
            "message": "Resume uploaded successfully",
            "candidate_name": candidate_name,
            "word_count": len(resume_json_str.split())
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

@router.get("/summary")
def get_resume_summary(session_id: str):
    """
    Check if the user has uploaded a resume for the dashboard progression.
    """
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT resume_json FROM resumes WHERE user_id = %s", (session_id,))
            res = cursor.fetchone()
            if res:
                resume_data = json.loads(res['resume_json']) if isinstance(res['resume_json'], str) else res['resume_json']
                candidate_name = resume_data.get("basics", {}).get("name") or resume_data.get("name", "")
                return {"resume_text": "Exists", "candidate_name": candidate_name}
        return {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()

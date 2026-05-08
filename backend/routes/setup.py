# # backend\routes\setup.py
# import json
# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel
# from typing import Optional
# from db.connection import get_db_connection
# from fastapi import UploadFile, File, Form

# import uuid
# from openai import OpenAI

# router = APIRouter(prefix="/api/setup", tags=["setup"])

# class ValidationRequest(BaseModel):
#     api_key: str
#     api_provider: str

# @router.post("/validate")
# def validate_key(req: ValidationRequest):
#     """
#     Validates OpenAI key and returns a dummy session_id for legacy frontend code compatibility
#     """
#     try:
#         # Simple client validation
#         client = OpenAI(api_key=req.api_key)
#         # We can just list models to verify it works
#         client.models.list()
        
#         return {
#             "session_id": str(uuid.uuid4()),
#             "models_available": ["gpt-4o-mini", "gpt-4o"]
#         }
#     except Exception as e:
#         raise HTTPException(status_code=400, detail="Invalid API Key or Provider")

# class CandidateSetup(BaseModel):
#     user_id: str
#     name: str

# @router.post("/")
# def init_candidate(data: CandidateSetup):
#     """
#     Ensure the candidate exists in DB. Create if not.
#     """
#     conn = None
#     try:
#         conn = get_db_connection()
#         with conn.cursor() as cursor:
#             # UPSERT basically using ON DUPLICATE KEY UPDATE but we just INSERT ignore or catch
#             cursor.execute("SELECT id FROM AIPrepTool_candidates WHERE user_id = %s", (data.user_id,))
#             if cursor.fetchone():
#                 cursor.execute("UPDATE AIPrepTool_candidates SET name = %s WHERE user_id = %s", (data.name, data.user_id))
#             else:
#                 cursor.execute("INSERT INTO AIPrepTool_candidates (user_id, name) VALUES (%s, %s)", (data.user_id, data.name))
#         conn.commit()
#         return {"message": "Candidate setup successful"}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         if conn:
#             conn.close()

# @router.post("/resume")
# async def upload_resume(session_id: str = Form(...), file: UploadFile = File(...)):
#     """
#     Upload or replace resume JSON via form data.
#     """
#     conn = None
#     try:
#         content = await file.read()
#         try:
#             resume_data = json.loads(content)
#         except Exception:
#             raise HTTPException(status_code=400, detail="Invalid JSON file")

#         conn = get_db_connection()
#         with conn.cursor() as cursor:
#             resume_json_str = json.dumps(resume_data)
            
#             cursor.execute("SELECT id FROM AIPrepTool_resumes WHERE user_id = %s", (session_id,))
#             if cursor.fetchone():
#                 cursor.execute("""
#                     UPDATE AIPrepTool_resumes SET resume_json = %s WHERE user_id = %s
#                 """, (resume_json_str, session_id))
#             else:
#                 cursor.execute("""
#                     INSERT INTO AIPrepTool_resumes (user_id, resume_json) VALUES (%s, %s)
#                 """, (session_id, resume_json_str))
                
#         conn.commit()
        
#         # Determine candidate name from json if possible
#         candidate_name = resume_data.get("basics", {}).get("name") or resume_data.get("name", "Candidate")
        
#         return {
#             "message": "Resume uploaded successfully",
#             "candidate_name": candidate_name,
#             "word_count": len(resume_json_str.split())
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         if conn:
#             conn.close()

# @router.get("/summary")
# def get_resume_summary(session_id: str):
#     """
#     Check if the user has uploaded a resume for the dashboard progression.
#     """
#     conn = None
#     try:
#         conn = get_db_connection()
#         with conn.cursor() as cursor:
#             cursor.execute("SELECT resume_json FROM AIPrepTool_resumes WHERE user_id = %s", (session_id,))
#             res = cursor.fetchone()
#             if res:
#                 resume_data = json.loads(res['resume_json']) if isinstance(res['resume_json'], str) else res['resume_json']
#                 candidate_name = resume_data.get("basics", {}).get("name") or resume_data.get("name", "")
#                 return {"resume_text": "Exists", "candidate_name": candidate_name}
#         return {}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
#     finally:
#         if conn:
#             conn.close()



import json
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
from db.connection import get_db_connection
from utils.security import encrypt
import uuid
import os
import requests
from openai import OpenAI

router = APIRouter(prefix="/api/setup", tags=["setup"])


class ValidationRequest(BaseModel):
    api_key: str
    api_provider: str


@router.post("/validate")
def validate_key(req: ValidationRequest):
    try:
        client = OpenAI(api_key=req.api_key)
        client.models.list()

        session_id = str(uuid.uuid4())
        encrypted_key = encrypt(req.api_key)

        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO AIPrepTool_candidates (user_id, api_key_encrypted)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE api_key_encrypted = %s
            """, (session_id, encrypted_key, encrypted_key))

        conn.commit()
        conn.close()

        return {"session_id": session_id}

    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(400, "Invalid API Key")


# ---------- Candidate ----------
class CandidateSetup(BaseModel):
    user_id: str
    name: str


@router.post("/")
def init_candidate(data: CandidateSetup):
    conn = get_db_connection()

    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO AIPrepTool_candidates (user_id, name)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE name = %s
            """, (data.user_id, data.name, data.name))

        conn.commit()
        return {"message": "Candidate setup successful"}

    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(500, "Failed to setup candidate")

    finally:
        conn.close()

def extract_latest_company_bg(user_id: str, resume_json: dict):
    from services.user_context import get_user_api_key
    from services.llm_service import call_llm_with_context
    from db.connection import get_db_connection
    import json
    
    api_key = get_user_api_key(user_id)
    if not api_key:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE AIPrepTool_candidates SET extraction_status = 'failed' WHERE user_id = %s", (user_id,))
            conn.commit()
        except:
            pass
        finally:
            conn.close()
        return
        
    prompt = f"""
    Extract the candidate's latest project details from the following resume JSON to populate an 18-field project explanation form.
    Return ONLY a JSON object with the following keys, populated with information if found in the resume, otherwise leave them as empty strings:
    - company_name
    - domain
    - background (1-2 sentences summarizing their experience)
    - skills (a list of strings)
    - product
    - architecture
    - business_value
    - role
    - business_problem
    - previous_system
    - key_problems
    - ai_techniques
    - agent_usage (must be exactly 'Agent', 'Hybrid', or 'None')
    - impact
    - evaluation_approach
    - challenges_learnings
    - learnings
    - future_roadmap
    
    Resume:
    {json.dumps(resume_json)[:5000]}
    """
    
    try:
        res_str = call_llm_with_context(
            user_id=user_id,
            prompt=prompt,
            system_prompt="You are an expert resume parser.",
            api_key=api_key,
            response_format="json_object"
        )
        
        # Clean response if markdown wrapped
        res_str = res_str.strip()
        if res_str.startswith("```json"): res_str = res_str[7:]
        if res_str.startswith("```"): res_str = res_str[3:]
        if res_str.endswith("```"): res_str = res_str[:-3]
        
        data = json.loads(res_str)
        company_name = data.get("company_name", "")
        domain = data.get("domain", "")
        background = data.get("background", "")
        skills = data.get("skills", [])
        product = data.get("product", "")
        architecture = data.get("architecture", "")
        business_value = data.get("business_value", "")
        role = data.get("role", "")
        business_problem = data.get("business_problem", "")
        previous_system = data.get("previous_system", "")
        key_problems = data.get("key_problems", "")
        ai_techniques = data.get("ai_techniques", "")
        agent_usage = data.get("agent_usage", "None")
        impact = data.get("impact", "")
        evaluation_approach = data.get("evaluation_approach", "")
        challenges_learnings = data.get("challenges_learnings", "")
        learnings = data.get("learnings", "")
        future_roadmap = data.get("future_roadmap", "")
        
        if company_name or domain or product:
            conn = get_db_connection()
            try:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        INSERT INTO AIPrepTool_project_context (
                            user_id, company_name, domain, product, business_problem, previous_system,
                            key_problems, ai_techniques, agent_usage, impact, evaluation_approach,
                            challenges_learnings, learnings, future_roadmap,
                            background, skills, architecture, business_value, role
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE 
                            company_name = COALESCE(VALUES(company_name), company_name),
                            domain = COALESCE(VALUES(domain), domain),
                            product = COALESCE(VALUES(product), product),
                            business_problem = COALESCE(VALUES(business_problem), business_problem),
                            previous_system = COALESCE(VALUES(previous_system), previous_system),
                            key_problems = COALESCE(VALUES(key_problems), key_problems),
                            ai_techniques = COALESCE(VALUES(ai_techniques), ai_techniques),
                            agent_usage = COALESCE(VALUES(agent_usage), agent_usage),
                            impact = COALESCE(VALUES(impact), impact),
                            evaluation_approach = COALESCE(VALUES(evaluation_approach), evaluation_approach),
                            challenges_learnings = COALESCE(VALUES(challenges_learnings), challenges_learnings),
                            learnings = COALESCE(VALUES(learnings), learnings),
                            future_roadmap = COALESCE(VALUES(future_roadmap), future_roadmap),
                            background = COALESCE(VALUES(background), background),
                            skills = COALESCE(VALUES(skills), skills),
                            architecture = COALESCE(VALUES(architecture), architecture),
                            business_value = COALESCE(VALUES(business_value), business_value),
                            role = COALESCE(VALUES(role), role)
                    """, (
                        user_id, company_name, domain, product, business_problem, previous_system,
                        key_problems, ai_techniques, agent_usage, impact, evaluation_approach,
                        challenges_learnings, learnings, future_roadmap,
                        background, json.dumps(skills), architecture, business_value, role
                    ))
                    cursor.execute("UPDATE AIPrepTool_candidates SET extraction_status = 'completed' WHERE user_id = %s", (user_id,))
                conn.commit()
            finally:
                conn.close()
    except Exception as e:
        print("Background extraction failed:", str(e))
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE AIPrepTool_candidates SET extraction_status = 'failed' WHERE user_id = %s", (user_id,))
            conn.commit()
        except:
            pass
        finally:
            conn.close()


@router.post("/sync-from-wbl")
async def sync_from_wbl(payload: dict, background_tasks: BackgroundTasks):
    token = payload.get("prep_token")
    if not token:
        raise HTTPException(400, "Token required")
    
    # In production, this should be the internal service URL or external IP
    # wbl_url = os.getenv("WBL_BACKEND_URL", "https://api.whitebox-learning.com") # Production URL
    wbl_url = os.getenv("http://localhost:8000") # Local URL
    try:
        response = requests.get(f"{wbl_url}/api/candidate/sync-data?token={token}", timeout=10)
        if response.status_code != 200:
            logger_detail = response.text
            print(f"WBL Sync Failed: {response.status_code} - {logger_detail}")
            raise HTTPException(401, "Failed to sync with WBL: Invalid token or service unavailable")
        
        data = response.json()
        resume_json = data.get("resume_json")
        api_keys = data.get("api_keys")
        candidate_name = data.get("candidate_name") or ""
        
        if not candidate_name and resume_json:
            candidate_name = resume_json.get("basics", {}).get("name") or resume_json.get("name", "Candidate")
        elif not candidate_name:
            candidate_name = "Candidate"
        
        session_id = str(uuid.uuid4())
        
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                # Handle API Keys and Name
                if api_keys and isinstance(api_keys, list):
                    # Prioritize OpenAI or just take the first one
                    selected_key = next((k for k in api_keys if k.get("provider") == "openai"), api_keys[0])
                    if selected_key and selected_key.get("key"):
                        encrypted_key = encrypt(selected_key["key"])
                        cursor.execute("""
                            INSERT INTO AIPrepTool_candidates (user_id, api_key_encrypted, name, extraction_status)
                            VALUES (%s, %s, %s, 'pending')
                            ON DUPLICATE KEY UPDATE api_key_encrypted = %s, name = %s, extraction_status = 'pending'
                        """, (session_id, encrypted_key, candidate_name, encrypted_key, candidate_name))
                    else:
                        cursor.execute("""
                            INSERT INTO AIPrepTool_candidates (user_id, name, extraction_status)
                            VALUES (%s, %s, 'pending')
                            ON DUPLICATE KEY UPDATE name = %s, extraction_status = 'pending'
                        """, (session_id, candidate_name, candidate_name))
                else:
                    cursor.execute("""
                        INSERT INTO AIPrepTool_candidates (user_id, name, extraction_status)
                        VALUES (%s, %s, 'pending')
                        ON DUPLICATE KEY UPDATE name = %s, extraction_status = 'pending'
                    """, (session_id, candidate_name, candidate_name))
                
                # Handle Resume
                if resume_json:
                    resume_json_str = json.dumps(resume_json)
                    cursor.execute("""
                        INSERT INTO AIPrepTool_resumes (user_id, resume_json)
                        VALUES (%s, %s)
                        ON DUPLICATE KEY UPDATE resume_json = %s
                    """, (session_id, resume_json_str, resume_json_str))
            
            conn.commit()
        finally:
            conn.close()
            
        if resume_json:
            background_tasks.add_task(extract_latest_company_bg, session_id, resume_json)
            
        return {
            "session_id": session_id,
            "candidate_name": candidate_name
        }
    except HTTPException:
        raise
    except Exception as e:
        print("SYNC ERROR:", str(e))
        raise HTTPException(500, f"Internal Sync Error: {str(e)}")


# ---------- Resume ----------
@router.post("/resume")
async def upload_resume(background_tasks: BackgroundTasks, session_id: str = Form(...), file: UploadFile = File(...)):
    conn = get_db_connection()

    try:
        content = await file.read()
        resume_data = json.loads(content)

        resume_json_str = json.dumps(resume_data)

        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO AIPrepTool_resumes (user_id, resume_json)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE resume_json = %s
            """, (session_id, resume_json_str, resume_json_str))
            cursor.execute("""
                UPDATE AIPrepTool_candidates SET extraction_status = 'pending' WHERE user_id = %s
            """, (session_id,))

        conn.commit()

        background_tasks.add_task(extract_latest_company_bg, session_id, resume_data)

        return {"message": "Resume uploaded"}

    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(500, "Resume upload failed")

    finally:
        conn.close()

@router.get("/summary")
def get_resume_summary(session_id: str):
    """
    Check if the user has uploaded a resume for the dashboard progression.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM AIPrepTool_candidates WHERE user_id = %s", (session_id,))
            candidate_res = cursor.fetchone()
            candidate_name = candidate_res['name'] if candidate_res and candidate_res['name'] else ""
            
            cursor.execute("SELECT resume_json FROM AIPrepTool_resumes WHERE user_id = %s", (session_id,))
            res = cursor.fetchone()
            if res:
                if not candidate_name:
                    resume_data = json.loads(res['resume_json']) if isinstance(res['resume_json'], str) else res['resume_json']
                    candidate_name = resume_data.get("basics", {}).get("name") or resume_data.get("name", "")
                return {"resume_text": "Exists", "candidate_name": candidate_name}
            else:
                return {"candidate_name": candidate_name}
    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/extraction-status")
def get_extraction_status(session_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT extraction_status FROM AIPrepTool_candidates WHERE user_id = %s", (session_id,))
            res = cursor.fetchone()
            if res and 'extraction_status' in res:
                return {"status": res["extraction_status"] or "completed"}
            return {"status": "completed"}
    except Exception as e:
        print("ERROR GETTING STATUS:", str(e))
        return {"status": "completed"}
    finally:
        conn.close()
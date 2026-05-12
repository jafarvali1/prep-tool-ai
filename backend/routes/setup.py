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
    session_id: str

@router.post("/validate")
def validate_key(req: ValidationRequest):
    try:
        if req.api_provider.lower() == "openai":
            client = OpenAI(api_key=req.api_key)
            client.models.list()
        # Add other provider validations here if needed

        encrypted_key = encrypt(req.api_key)

        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE aiprep_tool_candidates 
                SET api_key_encrypted = %s 
                WHERE user_id = %s
            """, (encrypted_key, req.session_id))
            
            # If no row was updated, it means the session doesn't exist
            if cursor.rowcount == 0:
                # Should not happen if they called /init first
                cursor.execute("""
                    INSERT INTO aiprep_tool_candidates (user_id, api_key_encrypted)
                    VALUES (%s, %s)
                """, (req.session_id, encrypted_key))

        conn.commit()
        conn.close()

        return {"message": "API Key validated and stored successfully"}

    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(400, "Invalid API Key")

class SetupInit(BaseModel):
    wbl_email: str
    name: str

@router.post("/init")
def init_session(data: SetupInit):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Check if this WBL email already has a session
            cursor.execute("SELECT user_id FROM aiprep_tool_candidates WHERE wbl_email = %s", (data.wbl_email,))
            row = cursor.fetchone()
            
            if row:
                session_id = row['user_id']
                # Update name just in case
                cursor.execute("UPDATE aiprep_tool_candidates SET name = %s WHERE wbl_email = %s", (data.name, data.wbl_email))
            else:
                session_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO aiprep_tool_candidates (user_id, wbl_email, name)
                    VALUES (%s, %s, %s)
                """, (session_id, data.wbl_email, data.name))
        
        conn.commit()
        return {"session_id": session_id}
    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(500, "Failed to initialize session")
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
                cursor.execute("UPDATE aiprep_tool_candidates SET extraction_status = 'failed' WHERE user_id = %s", (user_id,))
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
                        INSERT INTO aiprep_tool_project_context (
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
                    cursor.execute("UPDATE aiprep_tool_candidates SET extraction_status = 'completed' WHERE user_id = %s", (user_id,))
                conn.commit()
            finally:
                conn.close()
    except Exception as e:
        print("Background extraction failed:", str(e))
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("UPDATE aiprep_tool_candidates SET extraction_status = 'failed' WHERE user_id = %s", (user_id,))
            conn.commit()
        except:
            pass
        finally:
            conn.close()

@router.post("/resume")
async def upload_resume(background_tasks: BackgroundTasks, session_id: str = Form(...), file: UploadFile = File(...)):
    conn = get_db_connection()

    try:
        content = await file.read()
        resume_data = json.loads(content)

        resume_json_str = json.dumps(resume_data)

        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO aiprep_tool_resumes (user_id, resume_json)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE resume_json = %s
            """, (session_id, resume_json_str, resume_json_str))
            cursor.execute("""
                UPDATE aiprep_tool_candidates SET extraction_status = 'pending' WHERE user_id = %s
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
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT name FROM aiprep_tool_candidates WHERE user_id = %s", (session_id,))
            candidate_res = cursor.fetchone()
            candidate_name = candidate_res['name'] if candidate_res and candidate_res['name'] else ""
            
            cursor.execute("SELECT resume_json FROM aiprep_tool_resumes WHERE user_id = %s", (session_id,))
            res = cursor.fetchone()
            
            cursor.execute("SELECT api_key_encrypted FROM aiprep_tool_candidates WHERE user_id = %s", (session_id,))
            key_res = cursor.fetchone()
            has_api_key = bool(key_res and key_res['api_key_encrypted'])

            if res:
                if not candidate_name:
                    resume_data = json.loads(res['resume_json']) if isinstance(res['resume_json'], str) else res['resume_json']
                    candidate_name = resume_data.get("basics", {}).get("name") or resume_data.get("name", "")
                return {"resume_text": "Exists", "candidate_name": candidate_name, "has_api_key": has_api_key}
            else:
                return {"candidate_name": candidate_name, "has_api_key": has_api_key}
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
            cursor.execute("SELECT extraction_status FROM aiprep_tool_candidates WHERE user_id = %s", (session_id,))
            res = cursor.fetchone()
            if res and 'extraction_status' in res:
                return {"status": res["extraction_status"] or "completed"}
            return {"status": "completed"}
    except Exception as e:
        print("ERROR GETTING STATUS:", str(e))
        return {"status": "completed"}
    finally:
        conn.close()
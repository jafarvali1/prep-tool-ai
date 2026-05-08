import json
from db.connection import get_db_connection

def get_candidate_context(user_id: str):
    """
    Fetches full context: resume_json, AIPrepTool_project_context, intro evaluation.
    This context MUST be used in ALL AI calls.
    """
    context = {
        "resume": {},
        "project": {},
        "intro_eval": {}
    }
    
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 1. Fetch Resume
            cursor.execute("SELECT resume_json FROM AIPrepTool_resumes WHERE user_id = %s", (user_id,))
            res = cursor.fetchone()
            if res and res.get('resume_json'):
                try:
                    context["resume"] = json.loads(res['resume_json']) if isinstance(res['resume_json'], str) else res['resume_json']
                except:
                    pass

            # 2. Fetch Project Context
            cursor.execute("SELECT product, architecture, business_value, role, impact FROM AIPrepTool_project_context WHERE user_id = %s", (user_id,))
            proj = cursor.fetchone()
            if proj:
                context["project"] = proj
                
            # 3. Fetch Intro Eval 
            cursor.execute("SELECT score, passed, feedback FROM AIPrepTool_evaluations WHERE user_id = %s AND type = 'intro' ORDER BY id DESC LIMIT 1", (user_id,))
            intro = cursor.fetchone()
            if intro:
                if 'feedback' in intro and isinstance(intro['feedback'], str):
                    try:
                        intro['feedback'] = json.loads(intro['feedback'])
                    except:
                        pass
                context["intro_eval"] = intro
                
        conn.close()
    except Exception as e:
        print("Error fetching context:", e)
        
    return context

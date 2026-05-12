from db.connection import get_db_connection
from utils.security import decrypt

def get_user_api_key(user_id: str):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT api_key_encrypted FROM aiprep_tool_candidates WHERE user_id = %s",
                (user_id,)
            )
            res = cursor.fetchone()

        if not res or not res.get("api_key_encrypted"):
            return None

        return decrypt(res["api_key_encrypted"])
    finally:
        conn.close()
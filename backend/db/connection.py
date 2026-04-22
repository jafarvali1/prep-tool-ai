# # backend\db\connection.py
# import os
# import pymysql
# import pymysql.cursors

# def get_db_connection():
#     # If DATABASE_URL is somehow given, we can parse it, or rely on distinct vars
#     # typical format: mysql+pymysql://user:password@host/dbname
    
#     host = os.getenv("DB_HOST", "localhost")
#     user = os.getenv("DB_USER", "root")
#     password = os.getenv("DB_PASSWORD", "")
#     db_name = os.getenv("DB_NAME", "ai_prep")
#     port = int(os.getenv("DB_PORT", 3306))

#     connection = pymysql.connect(
#         host=host,
#         user=user,
#         password=password,
#         database=db_name,
#         port=port,
#         cursorclass=pymysql.cursors.DictCursor
#     )
#     return connection



import os
import pymysql
from urllib.parse import urlparse, unquote

def get_db_connection():
    database_url = os.getenv("DATABASE_URL")

    # ✅ 1. Prefer DATABASE_URL
    if database_url:
        try:
            parsed = urlparse(database_url)

            return pymysql.connect(
                host=parsed.hostname,
                user=unquote(parsed.username),
                password=unquote(parsed.password),
                database=parsed.path.lstrip("/"),
                port=parsed.port or 3306,
                cursorclass=pymysql.cursors.DictCursor
            )
        except Exception as e:
            raise Exception(f"Failed to parse DATABASE_URL: {str(e)}")

    # ✅ 2. Fallback to individual env vars
    host = os.getenv("DB_HOST")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    db_name = os.getenv("DB_NAME")
    port = int(os.getenv("DB_PORT", 3306))

    # ❗ Fail fast if missing
    if not all([host, user, password, db_name]):
        raise Exception("Database config missing: provide DATABASE_URL or DB_* variables")

    return pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=db_name,
        port=port,
        cursorclass=pymysql.cursors.DictCursor
    )
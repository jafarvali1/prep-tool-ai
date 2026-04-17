import os
import pymysql
import pymysql.cursors

def get_db_connection():
    # If DATABASE_URL is somehow given, we can parse it, or rely on distinct vars
    # typical format: mysql+pymysql://user:password@host/dbname
    
    host = os.getenv("DB_HOST", "localhost")
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    db_name = os.getenv("DB_NAME", "ai_prep")
    port = int(os.getenv("DB_PORT", 3306))

    connection = pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=db_name,
        port=port,
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection

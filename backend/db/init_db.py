from db.connection import get_db_connection
import pymysql

def init_db():
    print("Initializing Database structure...")
    
    # We might need to create the database itself first if it does not exist, 
    # but get_db_connection expects db_name to connect. 
    # To be safe, we try to create the database using a generic connection over pymysql without selecting a db first.
    import os
    host = os.getenv("DB_HOST", "localhost")
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    db_name = os.getenv("DB_NAME", "ai_prep")
    port = int(os.getenv("DB_PORT", 3306))
    
    try:
        setup_conn = pymysql.connect(host=host, user=user, password=password, port=port)
        with setup_conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}`")
        setup_conn.commit()
        setup_conn.close()
    except Exception as e:
        print(f"Error creating database {db_name}:", e)
        # Continue and let get_db_connection fail if the DB really doesn't exist

    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            # 1. candidates
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS candidates (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255),
                    email VARCHAR(255),
                    role VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # 2. resumes
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS resumes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(255) UNIQUE NOT NULL,
                    resume_json JSON,
                    resume_pdf_url VARCHAR(1024),
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)

            # 3. project_context
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS project_context (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(255) UNIQUE NOT NULL,
                    product TEXT,
                    architecture TEXT,
                    business_value TEXT,
                    role TEXT,
                    impact TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            """)

            # 4. evaluations
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS evaluations (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    type VARCHAR(50),
                    score INT,
                    passed BOOLEAN,
                    feedback JSON,
                    raw_response JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # 5. attempts
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS attempts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL,
                    attempt_type VARCHAR(50),
                    attempt_count INT DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE(user_id, attempt_type)
                )
            """)
            
        try:
            with conn.cursor() as cursor:
                cursor.execute("ALTER TABLE project_context MODIFY COLUMN product TEXT")
                cursor.execute("ALTER TABLE project_context MODIFY COLUMN role TEXT")
        except Exception:
            pass # Ignore if it fails or table doesn't exist etc.

        conn.commit()
        conn.close()
        print("Database tables initialized successfully.")
    except Exception as e:
        print("Error initializing tables:", e)

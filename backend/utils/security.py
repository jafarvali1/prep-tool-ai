# backend\utils\security.py
from cryptography.fernet import Fernet
import os
import base64

SECRET_KEY = os.getenv("ENCRYPTION_KEY")

if not SECRET_KEY:
    raise Exception("ENCRYPTION_KEY not set")

# Validate key
try:
    base64.urlsafe_b64decode(SECRET_KEY)
except Exception:
    raise Exception("Invalid ENCRYPTION_KEY. Must be base64 encoded Fernet key.")

cipher = Fernet(SECRET_KEY)

def encrypt(text: str) -> str:
    return cipher.encrypt(text.encode()).decode()

def decrypt(token: str) -> str:
    return cipher.decrypt(token.encode()).decode()
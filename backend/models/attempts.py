from pydantic import BaseModel

class AttemptRecord(BaseModel):
    user_id: str
    attempt_type: str
    attempt_count: int

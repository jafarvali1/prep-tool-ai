import os
from openai import OpenAI

def transcribe_audio(file_path: str, api_key: str = None) -> str:
    """
    Transcribe audio using Whisper API.
    """
    key = api_key or os.getenv("OPENAI_API_KEY")
    if not key:
        raise ValueError("OPENAI_API_KEY is not set.")
    
    client = OpenAI(api_key=key)
    
    with open(file_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            model="whisper-1", 
            file=audio_file
        )
        
    return transcript.text

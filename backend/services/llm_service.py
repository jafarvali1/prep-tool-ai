import os
import json
from openai import OpenAI
from services.context_service import get_candidate_context

# Initialize client where required to avoid global errors if key missing,
# but usually it's fine globally for standard backend apps.
def get_client(api_key=None):
    key = api_key or os.getenv("OPENAI_API_KEY")
    if not key:
        raise ValueError("OPENAI_API_KEY is not set.")
    return OpenAI(api_key=key)

def call_llm(prompt: str, system_prompt: str = "You a helpful AI.", api_key: str = None, response_format: str = "text") -> str:
    """
    Base function for LLM calls. Enforces JSON if requested.
    """
    client = get_client(api_key)
    
    kwargs = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3
    }
    
    if response_format == "json_object":
        kwargs["response_format"] = {"type": "json_object"}
        # ensure "json" is in the prompt
        if "json" not in system_prompt.lower() and "json" not in prompt.lower():
            kwargs["messages"][0]["content"] += "\nReturn response in STRICT JSON format."
            
    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content

def call_llm_with_context(user_id: str, prompt: str, system_prompt: str = "You are a helpful AI.", api_key: str = None, response_format: str = "text") -> str:
    """
    Behavior:
    - Fetch context from DB
    - Inject into prompt: "KNOWN CANDIDATE CONTEXT: {JSON}"
    """
    context = get_candidate_context(user_id)
    
    context_str = json.dumps(context, indent=2)
    
    enhanced_system_prompt = f"""
{system_prompt}

KNOWN CANDIDATE CONTEXT:
{context_str}

STRICT RULE:
Do NOT ask:
- project explanation again
- tech stack again
- anything already present in context
"""
    return call_llm(prompt, enhanced_system_prompt, api_key, response_format)

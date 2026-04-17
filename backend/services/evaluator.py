import os
import json
from services.llm_service import call_llm_with_context

def load_prompt(filename: str) -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(base_dir, "prompts", filename)
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def evaluate_intro(user_id: str, transcript: str, ideal_intro: str = "A clear description of background.", api_key: str = None) -> dict:
    system_prompt = load_prompt("intro_eval.txt")
    
    prompt = f"Ideal:\n{ideal_intro}\n\nCandidate:\n{transcript}"
    
    res_str = call_llm_with_context(
        user_id=user_id,
        prompt=prompt,
        system_prompt=system_prompt,
        api_key=api_key,
        response_format="json_object"
    )
    return parse_json(res_str)

def evaluate_project(user_id: str, answers: str, api_key: str = None) -> dict:
    system_prompt = load_prompt("project_eval.txt")
    
    prompt = f"Input:\n{answers}"
    
    res_str = call_llm_with_context(
        user_id=user_id,
        prompt=prompt,
        system_prompt=system_prompt,
        api_key=api_key,
        response_format="json_object"
    )
    return parse_json(res_str)

def generate_case_study(user_id: str, data: str, api_key: str = None) -> str:
    system_prompt = load_prompt("case_study.txt")
    prompt = f"Input:\n{data}"
    
    # We do not strictly need json object here, just structured markdown usually.
    res_str = call_llm_with_context(
        user_id=user_id,
        prompt=prompt,
        system_prompt=system_prompt,
        api_key=api_key,
        response_format="text"
    )
    return res_str

def coach_answer(user_id: str, answer: str, feedback: str, api_key: str = None) -> dict:
    system_prompt = load_prompt("coaching.txt")
    
    prompt = f"Answer: {answer}\nFeedback: {feedback}"
    
    res_str = call_llm_with_context(
        user_id=user_id,
        prompt=prompt,
        system_prompt=system_prompt,
        api_key=api_key,
        response_format="json_object"
    )
    return parse_json(res_str)

def parse_json(text: str) -> dict:
    try:
        # try simple parse
        return json.loads(text)
    except Exception:
        # Strip block quotes if present
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        try:
            return json.loads(text)
        except Exception as e:
            print("Failed to parse JSON evaluation target:", text)
            raise e

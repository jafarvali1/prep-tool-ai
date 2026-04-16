import json
from services.ai_client import generate_text
from services.template_loader import get_intro_template, CASE_STUDY_TEMPLATES

PROJECT_EVAL_PROMPT = """
You are a senior technical interviewer evaluating a candidate's project explanation.
The candidate was asked to describe a project, including:
1. What problem did it solve?
2. What is the solution/architecture?
3. What is the business value/impact?
4. Who are the users?
5. What was your role?

Candidate's Explanation:
\"\"\"{candidate_explanation}\"\"\"

Task:
Evaluate the explanation based on the criteria above.
- Give a score from 1 to 5. (1=Very poor, 5=Excellent and complete).
- Identify any missing elements from the 5 points above.
- Provide constructive feedback on what the candidate needs to improve.

Return ONLY a valid JSON object matching this exact format:
{{
  "score": <1-5 numeric>,
  "missing_elements": ["list", "of", "missing", "things"],
  "feedback": "Your overall feedback explaining why they got the score and what they must add."
}}
"""

CASE_STUDY_FROM_USE_CASE_PROMPT = """
You are an expert technical writer and AI systems architect.
You have been provided with three standard Case Study structures (from our ML, RAG, and Agentic AI projects).

Available Case Study Structural Templates:
{templates_context}

Context:
Candidate's Project Explanation:
\"\"\"{candidate_explanation}\"\"\"

Candidate's Specific Use Case Details (Queries, Data, Step-by-Step):
\"\"\"{use_case_details}\"\"\"

Your task is to:
1. Select the MOST APPROPRIATE case study structure from the three templates above based on the candidate's project.
2. Rewrite that chosen structure, injecting the candidate's actual technology, problem, queries, and business impact. Do NOT just copy the template exactly; you must morph it to be extremely customized to the candidate's true project explanation.

Format output as high-quality Markdown following the chosen template's exact 10-11 step outline.
"""

async def evaluate_project_explanation(explanation: str, api_key: str, provider: str) -> dict:
    prompt = PROJECT_EVAL_PROMPT.format(candidate_explanation=explanation)
    response_text = await generate_text(prompt, api_key, provider)
    try:
        clean = response_text.strip()
        if clean.startswith("```"):
            parts = clean.split("```")
            clean = parts[1] if len(parts) > 1 else clean
            if clean.startswith("json"):
                clean = clean[4:]
        data = json.loads(clean.strip())
        return data
    except Exception as e:
        print("Failed to parse evaluation JSON:", e)
        # Fallback response
        return {
            "score": 3,
            "missing_elements": ["Could not parse response"],
            "feedback": response_text[:200]
        }

async def generate_case_study_from_use_case(explanation: str, use_case_details: str, api_key: str, provider: str) -> str:
    template_strings = []
    for k, v in CASE_STUDY_TEMPLATES.items():
        template_strings.append(f"Template Name: {v['name']}\\nDescription & Structure: {v['description']}")
    
    prompt = CASE_STUDY_FROM_USE_CASE_PROMPT.format(
        templates_context="\\n\\n".join(template_strings),
        candidate_explanation=explanation,
        use_case_details=use_case_details
    )
    return await generate_text(prompt, api_key, provider)


DYNAMIC_INTRO_PROMPT = """
You are an expert career coach helping a candidate structure their elevator pitch.

Here is the exact Master Candidate Intro Template structure you MUST follow:
\"\"\"{doc_template}\"\"\"

Your task:
Rewrite this template from top to bottom. But wherever the template mentions a technology, use case, domain, or achievement (like Docling, RAG, customer care, MLOps, AWS Bedrock, etc), REPLACE IT with the actual facts from the Candidate's Resume and their generated Case Study below!

Candidate Resume Context:
\"\"\"{resume_text}\"\"\"

Generated Case Study Context:
\"\"\"{case_study}\"\"\"

Rules: 
- Do not drastically change the conversational flow of the template. 
- Map the candidate's actual projects sequentially to replace the paragraphs in the template.
- If the candidate's name is known in the resume, replace [Candidate Name]. Otherwise leave it as [Candidate Name].
- Generate ONLY the plaintext intro. No markdown, no "Here is your intro...". Just the raw text. Wait, format the output in simple text paragraphs.
"""

async def generate_dynamic_intro(case_study_text: str, resume_text: str, api_key: str, provider: str) -> str:
    doc_template = get_intro_template()
    prompt = DYNAMIC_INTRO_PROMPT.format(
        doc_template=doc_template,
        resume_text=resume_text,
        case_study=case_study_text
    )
    return await generate_text(prompt, api_key, provider)

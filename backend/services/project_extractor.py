"""
Project Extractor Agent: Analyzes resume and extracts the most recent/significant project
in a structured format for use in case study generation and interview prep.
"""
from services.ai_client import generate_text

PROJECT_EXTRACTION_PROMPT = """
You are a resume analyzer and project extraction specialist.

From the resume below, extract the most recent and most relevant technical project.

Return the result in the following EXACT structured format with these exact headings:

**Project Name:** [name]

**Project Overview:** [2-3 sentence overview]

**Problem Statement:** [What problem was being solved?]

**Objective:** [What was the goal?]

**Solution:** [How was the problem solved?]

**Architecture / Workflow:** [System components, data flow, key modules]

**Technologies Used:** [List all technologies, frameworks, tools]

**Your Role and Responsibilities:** [What did the candidate specifically do?]

**Challenges Faced:** [What were the hardest parts?]

**Results / Impact:** [Measurable outcomes, business impact, improvements]

If multiple projects are present, choose the most technically impressive and recent one.
Be specific, technical, and interview-ready in your extraction.

Resume:
{resume_text}
"""


async def extract_project_from_resume(resume_text: str, api_key: str, provider: str) -> str:
    """
    Extract the most recent significant project from resume text.
    Returns structured project details as markdown string.
    """
    prompt = PROJECT_EXTRACTION_PROMPT.format(resume_text=resume_text[:8000])
    return await generate_text(prompt, api_key, provider)

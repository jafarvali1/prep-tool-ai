"""
Resume parser: extract plain text from PDF and DOCX files.
"""
import os
from pathlib import Path


def parse_pdf(file_path: str) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    import fitz  # PyMuPDF
    text = []
    with fitz.open(file_path) as doc:
        for page in doc:
            text.append(page.get_text())
    return "\n".join(text).strip()


def parse_docx(file_path: str) -> str:
    """Extract text from a DOCX file using python-docx."""
    from docx import Document
    doc = Document(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs).strip()


def parse_json(file_path: str) -> str:
    """Extract text from a JSON file."""
    import json
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return json.dumps(data, indent=2)


def parse_resume(file_path: str) -> str:
    """
    Detect file type and extract text accordingly.
    Supports .pdf, .docx, and .json
    """
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return parse_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return parse_docx(file_path)
    elif ext == ".json":
        return parse_json(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}. Please upload a PDF, DOCX, or JSON.")

"""
(V) Preset Views - Returns demo resume presets for the candidate application form
These are stored server-side so the frontend has zero hardcoded data.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/presets", tags=["Presets"])

RESUME_PRESETS = [
    {
        "name": "Priya S. — Senior AI Engineer",
        "experience": 4,
        "education": "B.Tech in Artificial Intelligence, Delhi Technological University (2022)",
        "skills": ["Python", "FastAPI", "React", "PyTorch / Transformers", "LangChain", "PostgreSQL", "System Design", "Docker"],
        "summary": "AI systems architect with 4 years experience deploying LLM agents and multi-tenant FastAPI backends at production scale."
    },
    {
        "name": "Vikram Mehta — Frontend & UI Specialist",
        "experience": 3,
        "education": "B.Tech Computer Science, BITS Pilani (2023)",
        "skills": ["React", "TypeScript / JavaScript", "Tailwind CSS", "Canvas API", "Web Speech API", "State Management"],
        "summary": "Passionate frontend engineer specializing in responsive, high-performance web applications and interactive canvas tools."
    },
    {
        "name": "Ananya Iyer — Junior Full Stack Developer",
        "experience": 1.5,
        "education": "BCA, Mumbai University (2024)",
        "skills": ["JavaScript", "React", "Python", "SQL", "HTML/CSS"],
        "summary": "Recent graduate with internship experience building CRUD applications and REST APIs."
    }
]

@router.get("")
def get_presets():
    """Returns demo candidate resume presets — no hardcoded data in the frontend."""
    return RESUME_PRESETS
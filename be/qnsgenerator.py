import os
import google.generativeai as gogai
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("Google_key")
gogai.configure(api_key=API_KEY)

MODEL_NAME = "gemini-2.5-flash-lite"


def generate_questions(
    resume_text: str,
    difficulty: str,
    num_questions: int
) -> str:
    """
    Stateless question generator.
    """

    if not resume_text.strip():
        raise ValueError("Resume text is empty")

    if difficulty not in {"easy", "medium", "hard"}:
        raise ValueError("Invalid difficulty level")

    if not (1 <= num_questions <= 100):
        raise ValueError("num_questions out of range")

    llm = gogai.GenerativeModel(MODEL_NAME)

    prompt = f"""
        You are a professional interviewer.

        PRIMARY OBJECTIVE:
        Generate {num_questions} interview questions STRICTLY derived from the candidate’s resume content.
        - Difficulty level: {difficulty}
        STEP 1 — CLASSIFY RESUME (internally):
        Determine whether the resume is primarily:
        - Technical
        - Non-technical
        - Mixed

        STEP 2 — QUESTION RULES (MANDATORY):
        - EVERY question MUST explicitly reference at least ONE concrete resume element:
        (skill, role, responsibility, project, certification, metric, domain, or achievement).
        - DO NOT ask generic questions.
        - DO NOT ask hypothetical questions unrelated to resume content.
        - DO NOT invent experience.

        STEP 3 — DIFFICULTY ADAPTATION:
        If Technical:
        - easy   → definition, usage, basic flow, simple debugging of resume-listed skills
        - medium → design decisions, tradeoffs, real scenarios using resume-listed projects/tools
        - hard   → edge cases, optimization, scaling, failure modes, internals of resume-listed tech

        If Non-Technical:
        - easy   → role understanding, responsibilities, tools or processes used based on resume
        - medium → decision-making, prioritization, stakeholder handling, KPIs based on resume
        - hard   → conflict resolution, strategy, scaling processes, failure analysis based on resume

        STEP 4 — DISTRIBUTION:
        - Cover multiple resume areas in balanced proportion.
        - Avoid repeating the same resume element in consecutive questions.

        OUTPUT FORMAT (STRICT):
        - Output ONLY the final interview questions.
        - Do NOT include steps, labels, explanations, or headings/internal classification.
        - One question per line.
        - No extra text before or after the questions.

        Resume content:
        {resume_text}
        """

    response = llm.generate_content(prompt)
    return response.text.strip()

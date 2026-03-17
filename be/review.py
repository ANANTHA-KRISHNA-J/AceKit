import os
import json
import google.generativeai as gogai
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("Google_key")
MODEL_NAME = "gemini-2.5-flash-lite"
gogai.configure(api_key=API_KEY)


# def llmreview(history: list[dict]) -> dict:
#     """
#     Reviews structured Q/A interview history.
#     """

#     if not history:
#         return {"error": "No interview data provided"}

#     llm = gogai.GenerativeModel(MODEL_NAME)

#     prompt = f"""
#       You are a recruiter. Read the candidate's interview Q/A below.
#       Some questions may have no answers; those are skipped ones.

#       history = {history}

#       SCORING RUBRIC (MANDATORY):
#       - 0–2  → irrelevant, incorrect, or meaningless answer
#       - 3–4  → extremely shallow or generic answer
#       - 5–6  → partially correct but missing key details
#       - 7–8  → mostly correct with reasonable explanation
#       - 9–10 → detailed, accurate, and clearly articulated

#       STRICT CONSTRAINTS:
#       - If the answer is less than 2 meaningful sentences, score MUST be ≤4.
#       - If the opinion says "lacks detail" or "high-level", score MUST be ≤6.
#       - NEVER give 8+ unless tools, steps, decisions, or examples are mentioned.
#       - Do NOT reward intent. Score only what is explicitly stated.

#       Return a single JSON object with this exact structure:

#       {{
#         "overall_score": {{
#           "obtained": "<sum of all per-question scores>",
#           "total": "<number_of_questions * 10>"
#           }}

#         "technical_analysis": "<2-4 lines, focus on technical depth, correctness, tools mentioned>",
#         "communication_analysis": "<2-4 lines, clarity, structure, confidence>",
#         "recommendations": "<3-5 bullet-style sentences (in one string) about what to improve before a real interview>",

#         "per_question": [
#           {{
#             "question": "<the original question>",
#             "candidate_answer": "<short cleaned-up version>",
#             "opinion": "<1-2 lines max>",
#             "score": <integer 0-10 on candidate_answer>,
#             "more_better": "<what could have been added for a perfect answer in 1 line>",
#             "follow_up_question": "<one or 2 sharp follow-up based on the question's concept importance>"
#           }},
#           ...
#         ]
#       }}

#       Rules:
#       - NEVER convert the score to 100 or percentages.
#       - The total score MUST equal (number_of_questions * 10). 
#       - DO NOT output 100 anywhere; avoid percentage formats completely.
#       - Use double quotes for all strings.
#       - Use only JSON, no extra text before or after.
#       - Keep each opinion and more_better short (max 2 lines).
#       - Stick to the raw meaning even if speech recognition messed some words.
#       - If an answer is missing or empty, set score to 0 and write an opinion that it was skipped.
#       """

#     response = llm.generate_content(prompt)
#     text = response.text.strip()

#     if text.startswith("```"):
#         text = text.replace("```json", "").replace("```", "").strip()

#     return json.loads(text)

def llmreview(history: list[dict]) -> dict:
    """
    Reviews structured Q/A interview history.
    """
    if not history:
        return {"error": "No interview data provided"}

    llm = gogai.GenerativeModel(MODEL_NAME)

    # ... (Keep your existing prompt exactly as it is) ...
    prompt = f"""
      You are a recruiter. Read the candidate's interview Q/A below.
      Some questions may have no answers; those are skipped ones.

      history = {history}

      SCORING RUBRIC (MANDATORY):
      - 0–2  → irrelevant, incorrect, or meaningless answer
      - 3–4  → extremely shallow or generic answer
      - 5–6  → partially correct but missing key details
      - 7–8  → mostly correct with reasonable explanation
      - 9–10 → detailed, accurate, and clearly articulated

      STRICT CONSTRAINTS:
      - If the answer is less than 2 meaningful sentences, score MUST be ≤4.
      - If the opinion says "lacks detail" or "high-level", score MUST be ≤6.
      - NEVER give 8+ unless tools, steps, decisions, or examples are mentioned.
      - Do NOT reward intent. Score only what is explicitly stated.

      Return a single JSON object with this exact structure:

      {{
        "overall_score": {{
          "obtained": "<sum of all per-question scores>",
          "total": "<number_of_questions * 10>"
          }}

        "technical_analysis": "<2-4 lines, focus on technical/non-technical depth, correctness, tools mentioned>",
        "communication_analysis": "<2-4 lines, clarity, structure, confidence>",
        "recommendations": "<3-5 bullet-style sentences (in one string) about what to improve before a real interview>",

        "per_question": [
          {{
            "question": "<the original question>",
            "candidate_answer": "<short cleaned-up version>",
            "opinion": "<1-2 lines max>",
            "score": <integer 0-10 on candidate_answer>,
            "more_better": "<what could have been added for a perfect answer in 1 line>",
            "follow_up_question": "<one or 2 sharp follow-up based on the question's concept importance>"
          }},
          ...
        ]
      }}

      Rules:
      - NEVER convert the score to 100 or percentages.
      - The total score MUST equal (number_of_questions * 10). 
      - DO NOT output 100 anywhere; avoid percentage formats completely.
      - Use double quotes for all strings.
      - Use only JSON, no extra text before or after.
      - Keep each opinion and more_better short (max 2 lines).
      - Stick to the raw meaning even if speech recognition messed some words.
      - If an answer is missing or empty, set score to 0 and write an opinion that it was skipped.
      """

    try:
        response = llm.generate_content(prompt)
        text = response.text.strip()
        
        # Clean up markdown if present
        if text.startswith("```"):
            text = text.replace("```json", "").replace("```", "").strip()
        
        review_json = json.loads(text)

        # ---------------------------------------------------------
        # 🔴 THE FIX: RECALCULATE SCORES IN PYTHON
        # ---------------------------------------------------------
        calculated_obtained = 0
        questions_count = len(review_json.get("per_question", []))
        
        # 1. Sum up the individual scores
        for q in review_json.get("per_question", []):
            # Ensure score is an integer
            score = int(q.get("score", 0))
            calculated_obtained += score
            
        # 2. Force-update the overall score with the correct math
        review_json["overall_score"] = {
            "obtained": str(calculated_obtained),
            "total": str(questions_count * 10)
        }
        
        return review_json

    except Exception as e:
        print(f"Error in LLM Review: {e}")
        # Return a fallback structure if LLM fails
        return {
            "overall_score": {"obtained": "0", "total": "0"},
            "technical_analysis": "Error generating analysis.",
            "communication_analysis": "Error generating analysis.",
            "recommendations": "Please try again.",
            "per_question": []
        }











def llmreview_module2(transcript: str) -> dict:
    """
    Reviews free-flow voice interview transcript.
    """

    if not transcript or len(transcript.strip()) < 3:
        return {
            "error": "Insufficient data",
            "message": "Transcript too short for evaluation"
        }


    llm = gogai.GenerativeModel(MODEL_NAME)

    prompt =f"""
    You are a Senior Hiring Manager. You have just finished a real-time voice interview with a candidate.
    Below is the raw transcript of the conversation. Note that there may be minor transcription errors (speech-to-text artifacts).
    
    TRANSCRIPT:
    {transcript}
    
    Your goal is to provide a holistic assessment of the candidate's performance.
    Instead of scoring individual questions, evaluate the conversation as a whole.
    
    Analyze the following:
    1. **Conceptual Depth:** Did they understand the core concepts? Did they just recite definitions or explain *how* things work?
    2. **Communication:** Was the candidate clear? Did they ramble? Did they ask for clarification when needed?
    3. **Problem Solving:** How did they handle follow-up questions or harder topics?
    
    Return the output in this EXACT JSON format:
    {{
        "candidate_summary": "<only 2 sentence overview of the candidate's vibe and performance>",
        "overall_rating": "<Integer 1-10 based on hireability>",
        "technical_assessment": {{
            "strengths": ["<strength 1>", "<strength 2>", ...],
            "gaps_identified": ["<gap 1>", "<gap 2>", ...]
        }},
        "communication_style": "<3 lines direct Comment on their clarity, confidence, and conciseness>",
        "feedback_for_improvement": "<3 lines direct advice to the candidate on what to fix before a real interview>"
    }}
    Important Rule: Do NOT output markdown formatting (like ```json). Just the raw JSON string.
    CRITICAL EVALUATION RULES:
    1. Be constructive but honest.
    2. SHORT INTERVIEW EXCEPTION: If the conversation history is too short to evaluate, DO NOT invent feedback. You must output: "Interview ended before a full assessment could be completed" for the summary and feedback, and give a score of 0.
    3. ROLE-ADAPTIVE ASSESSMENT: Do not force a "Technical Coding Assessment" if the candidate's resume or role is non-technical (e.g., Law, Biology, Arts). Instead, evaluate their "Domain Knowledge" and "Analytical Thinking" relevant to their specific field.
    4. NO HALLUCINATIONS: Base your review STRICTLY on the provided conversation transcript. If a skill was not discussed, do not evaluate it.
    """

    response = llm.generate_content(prompt)
    text = response.text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()

    return json.loads(text)

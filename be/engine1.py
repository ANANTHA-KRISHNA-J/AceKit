from qnsgenerator import generate_questions
# from facechecker import check_face_match
from review import llmreview
from reportpdf import render_html
from resumeextractor import process_resume_pdf
import json 
import numpy as np

def run_interview_engine(
    resume_pdf_bytes: bytes,
    difficulty: str,
    num_questions: int,
    qa_history: list[dict],
    face_image_bgr=None,any_match_found: bool = False
):
    """
    Main orchestration for Module 1
    """

    # ---- Resume + Face Encoding ----
    resume_result = process_resume_pdf(
        pdf_bytes=resume_pdf_bytes,
        fallback_face_image=face_image_bgr
    )

    resume_data = resume_result["resume_data"]
    # known_face_encoding = resume_result["face_encoding"]

    # ---- Review ----
    review_json = llmreview(qa_history)

    if isinstance(review_json, str):
        review_json = json.loads(review_json)

    # ---- Face Match Status (AFTER review_json exists) ----
    # if known_face_encoding is None:
    #     review_json["face_match_status"] = "User continued without image"
    # elif any_match_found:
    #     review_json["face_match_status"] = "Face Matched"
    # else:
    #     review_json["face_match_status"] = "Face did not match"


    # ---- HTML Report ----
    html = render_html(review_json, resume_data)

    return {
        "review": review_json,
        "html_report": html
    }

# def verify_face_once(face_encoding, camera_frame_encoding):
#     return check_face_match(np.array(face_encoding), np.array(camera_frame_encoding))

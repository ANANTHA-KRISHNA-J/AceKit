import os
import json
import fitz
import numpy as np
import pytesseract
from pypdf import PdfReader
from pdf2image import convert_from_bytes
from datetime import datetime
import google.generativeai as gogai
from dotenv import load_dotenv
from io import BytesIO

# ---------- THE "LAZY DEV" HACK ----------
# Try to load the heavy libraries. If they fail (like on Render), just flag it and move on!
try:
    import cv2 as cv
    import face_recognition
    FACE_LIBS_AVAILABLE = True
except ImportError:
    FACE_LIBS_AVAILABLE = False
    print("⚠️ OpenCV or face_recognition not installed. Skipping face extraction.")


load_dotenv()

API_KEY = os.getenv("Google_key")
gogai.configure(api_key=API_KEY)
MODEL_NAME = "gemini-2.5-flash-lite"


# ---------- FACE ENCODING ----------

def generate_face_encoding(image_bgr: np.ndarray):
    # Instantly abort if libraries aren't loaded or image is missing
    if not FACE_LIBS_AVAILABLE or image_bgr is None:
        return None
        
    try:
        rgb = cv.cvtColor(image_bgr, cv.COLOR_BGR2RGB)
        enc = face_recognition.face_encodings(rgb)
        return enc[0] if enc else None
    except Exception as e:
        print(f"Face encoding error: {e}")
        return None


# ---------- LLM EXTRACTION ----------

def extract_structured_resume(resume_text: str) -> dict:
    llm = gogai.GenerativeModel(MODEL_NAME)

    prompt = f"""You are a professional HR recruiter. Extract structured information from the resume below.
    Return ONLY a valid JSON. No extra text.
    JSON Schema:
    {{
    "name": "",
    "email": "",
    "role" : ""<based on resume content give one suitable jobrole>",
    "mobile_number": "",
    "linkedin link": "",
    "github link": "",
    "skills": [],
    "knowledge": [],
    "certifications": [],
    "experience": [],
    "education": [],
    "projects": []
    }}

    Resume Content: {resume_text}

    Rules:
    - Do NOT add certifications unless explicitly mentioned.
    - Do NOT add cloud tools, AWS, Azure, GCP unless written in the resume.
    - Do NOT infer,interpret or guess.
    - Extract EXACT strings as written.
    - Extract ONLY the information that appears explicitly in the resume text.
    - DO NOT fill missing details.
    - DO NOT guess skills or certifications.
    - If a field is not present, leave it empty or null.
    """

    response = llm.generate_content(prompt)
    text = response.text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "").replace("```", "").strip()

    return json.loads(text)


# ---------- MAIN PIPELINE ----------

def process_resume_pdf(
    pdf_bytes: bytes,
    fallback_face_image: np.ndarray | None = None
) -> dict:
    """
    Input:
      - pdf_bytes (uploaded resume)
      - fallback_face_image (optional uploaded image)

    Output:
      {
        "resume_data": dict,
        "face_encoding": list | None
      }
    """

    face_encoding = None

    # ---- Extract face from resume ONLY IF LIBRARIES EXIST ----
    if FACE_LIBS_AVAILABLE:
        try:
            reader = PdfReader(BytesIO(pdf_bytes))
            page = reader.pages[0]
            images = getattr(page, "images", [])

            if images:
                img_bytes = images[0].data
                img_arr = np.frombuffer(img_bytes, np.uint8)
                img = cv.imdecode(img_arr, cv.IMREAD_COLOR)
                face_encoding = generate_face_encoding(img)

            if face_encoding is None and fallback_face_image is not None:
                face_encoding = generate_face_encoding(fallback_face_image)
        except Exception as e:
            print(f"Could not extract face from PDF: {e}")
    else:
        print("Skipping face extraction for cloud deployment.")

    # ---- Extract links ----
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    links = []
    for page in doc:
        for link in page.get_links():
            if "uri" in link:
                links.append(link["uri"])

    # ---- OCR text ----
    images = convert_from_bytes(pdf_bytes)
    text_content = ""
    for img in images:
        text_content += pytesseract.image_to_string(img) + "\n"

    if links:
        text_content += "\nLinks:\n" + "\n".join(links)

    resume_data = extract_structured_resume(text_content)

    return {
        "resume_data": resume_data,
        "face_encoding": face_encoding
    }
from flask import Flask, request, jsonify , send_file
from engine1 import run_interview_engine #, verify_face_once
from qnsgenerator import generate_questions
# import cv2 , json,face_recognition
import json
import numpy as np,os
from resumeextractor import process_resume_pdf,generate_face_encoding
from module2 import (
    create_chat_session,
    transcribe_audio,
    generate_ai_reply,
    finalize_module2_review 
)
from flask_cors import CORS

from supabase import create_client, Client

app = Flask(__name__)
CORS(app)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_visitor_count():
    try:
        # Fetch the count where id = 1
        response = supabase.table('visitors').select('count').eq('id', 1).execute()
        return response.data[0]['count']
    except Exception as e:
        print("Supabase read error:", e)
        return 0

def increment_visitor_count():
    try:
        current_count = get_visitor_count()
        new_count = current_count + 1
        
        # Update the count in the database
        supabase.table('visitors').update({'count': new_count}).eq('id', 1).execute()
        return new_count
    except Exception as e:
        print("Supabase write error:", e)
        return 0

# Your existing routes stay exactly the same!
@app.get("/api/visitors")
def get_visitors():
    return jsonify({"count": get_visitor_count()})

@app.post("/api/visitors/increment")
def increment_visitors():
    new_count = increment_visitor_count()
    return jsonify({"count": new_count})


@app.get("/health")
def health():return {"status": "ok"}

@app.post("/module1/start")
def start_interview():
    resume_file = request.files.get("resume")
    if not resume_file:
        return {"error": "resume missing"}, 400

    file_bytes = resume_file.read()
    difficulty = request.form.get("difficulty", "medium")
    num_questions = int(request.form.get("num_questions", 5))

    extraction_result = process_resume_pdf(
        pdf_bytes=file_bytes,
        fallback_face_image=None
    )

    resume_data = extraction_result.get("resume_data")
    if not resume_data:
        return {"error": "Unable to extract resume text"}, 400

    resume_text_str = resume_data.get("raw_text", str(resume_data))

    questions_text = generate_questions(
        resume_text=resume_text_str,
        difficulty=difficulty,
        num_questions=num_questions
    )

    return jsonify({
        "questions": questions_text.split("\n")
        # ❌ DO NOT return face_encoding here (not JSON serializable)
    })

# @app.post("/module1/start")
# def start_interview():
#     # 1. CHECK IF FILE IS PRESENT
#     # if 'resume' not in request.files:
#     #     return jsonify({"error": "No resume file uploaded"}), 400
    
#     file = request.files['resume'].read()
#     difficulty = request.form.get("difficulty", "medium")
#     num_questions = int(request.form.get("num_questions", 5))

#     # 3. EXTRACT TEXT USING YOUR LOGIC
#     # We pass None for the image for now, as we just want text for questions
#     extraction_result = process_resume_pdf(pdf_bytes=file, fallback_face_image=None)
    
#     # Get the structured data as a string or specific fields
#     resume_data = extraction_result["resume_data"]
#     if not resume_data : return {"error": "Unable to extract resume text"}, 400

#     # Convert JSON dict back to string for the Question Generator prompt
#     # (Or update generate_questions to accept a dict)
#     resume_text_str = str(resume_data) 

#     # 4. GENERATE QUESTIONS
#     questions_text = generate_questions(
#         resume_text=resume_text_str,
#         difficulty=difficulty,
#         num_questions=num_questions
#     )

#     # 5. RETURN QUESTIONS + ENCODINGS (Optional, for face check later)
#     return jsonify({
#         "questions": questions_text.split("\n"),
#         # You might want to return the face encoding here if the UI needs to hold it
#         "face_encoding": extraction_result["face_encoding"] 
#     })

# @app.post("/module1/start")
# def start_interview():
#     data = request.json

#     questions = generate_questions(
#         resume_text=data["resume_text"],
#         difficulty=data["difficulty"],
#         num_questions=data["num_questions"]
#     )

#     return jsonify({
#         "questions": questions.split("\n")
#     })

# @app.post("/module1/face-check")
# def face_check():
#     # 1. Check if images were sent
#     if 'resume_face' not in request.files or 'camera_face' not in request.files:
#         return {"match": False, "status": "missing_images"}

#     # 2. Read the images from the request
#     resume_bytes = request.files['resume_face'].read()
#     camera_bytes = request.files['camera_face'].read()

#     # 3. Convert bytes to Images (OpenCV)
#     resume_img = cv2.imdecode(np.frombuffer(resume_bytes, np.uint8), cv2.IMREAD_COLOR)
#     camera_img = cv2.imdecode(np.frombuffer(camera_bytes, np.uint8), cv2.IMREAD_COLOR)

#     # 4. Generate Encodings (Using your existing logic)
#     resume_enc = generate_face_encoding(resume_img)
#     camera_enc = generate_face_encoding(camera_img)

#     # 5. Compare
#     match = False
#     if resume_enc is not None and camera_enc is not None:
#         # Compare faces (tolerance 0.6 is standard)
#         match = face_recognition.compare_faces([resume_enc], camera_enc, tolerance=0.6)[0]

#     return {"match": bool(match)}

# @app.post("/module1/face-check")
# def face_check():
#     data = request.json

#     if "face_encoding" not in data or "camera_encoding" not in data:
#         return {"status": "verification_disabled"}

#     match = verify_face_once(
#         data["face_encoding"],
#         data["camera_encoding"]
#     )
#     return {"match": match}



@app.post("/module1/finish")
def finish_interview():
    resume_pdf = request.files["resume"].read()
    qa_history = json.loads(request.form["qa_history"])

    # face_img = None
    # if "face_image" in request.files:
    #     img_bytes = request.files["face_image"].read()
    #     arr = np.frombuffer(img_bytes, np.uint8)
    #     face_img = cv2.imdecode(arr, cv2.IMREAD_COLOR)

    # any_match_found = request.form.get("any_match_found") == "true"

    result = run_interview_engine(
        resume_pdf_bytes=resume_pdf,
        difficulty = request.form["difficulty"],
        num_questions = int(request.form["num_questions"]),
        qa_history=qa_history,
        face_image_bgr=None,    #face_img,
          any_match_found=False)    #any_match_found
    try:
        html_content = result["html_report"]
        with open("interview_report.html", "w", encoding="utf-8") as f:
            f.write(html_content)
        print("✅ HTML Report Saved successfully.")
    except Exception as e:
        print(f"❌ Failed to save report: {e}")

    # 3. Return the full result (Frontend uses 'review' part for dashboard)
    return jsonify(result)
    # # 1. Generate HTML String
    # html_content = render_html(result)

    # # 2. Save as HTML File (Instead of PDF)
    # with open("interview_report.html", "w", encoding="utf-8") as f:
    #     f.write(result[1])

    # # 3. Return JSON for the dashboard
    # return jsonify(result)
    # # return jsonify(result)

@app.get("/module1/download-report")
def download_report():
    try:
        return send_file(
            "interview_report.html",          # The file we saved above
            mimetype='text/html',             # Browser knows it's a webpage
            as_attachment=True,               # Forces download instead of opening
            download_name="Your_interview_Report.html"
        )
    except Exception as e:
        return {"error": "Report not found"}, 404

# --- MODULE 2 BACKEND --- revised

module2_sessions = {}

@app.post("/module2/start")
def module2_start():
    # 1. Fetch from form data (Frontend now sends FormData, not JSON)
    session_id = request.form.get("session_id")
    resume_file = request.files.get("resume")

    if not session_id or not resume_file:
        return {"error": "Missing session_id or resume file"}, 400

    # 2. Extract PDF text (just like Module 1)
    file_bytes = resume_file.read()
    extraction_result = process_resume_pdf(
        pdf_bytes=file_bytes,
        fallback_face_image=None
    )

    resume_data = extraction_result.get("resume_data")
    if not resume_data:
        return {"error": "Unable to extract resume text"}, 400

    resume_text_str = resume_data.get("raw_text", str(resume_data))

    # 3. Initialize AI Chat
    chat = create_chat_session(resume_text_str)

    module2_sessions[session_id] = {
        "chat": chat,
        "history": []
    }

    opening = "Hello. Let us begin. Please introduce yourself."
    module2_sessions[session_id]["history"].append(f"Interviewer: {opening}")

    return jsonify({
        "message": opening
    })

@app.post("/module2/turn")
def module2_turn():
    session_id = request.form.get("session_id")
    audio_file = request.files.get("audio")

    if session_id not in module2_sessions:
        return {"error": "Invalid or expired session_id"}, 400
    if not audio_file:
        return {"error": "Missing audio file"}, 400

    audio_bytes = audio_file.read()
    session = module2_sessions[session_id]

    # Process Voice
    user_text = transcribe_audio(audio_bytes)
    if not user_text or user_text.strip() == "":
        return jsonify({
            "transcript": "(Silence/Unclear)",
            "reply": "I didn't quite catch that. Could you repeat?",
            "done": False
        })
    session["history"].append(f"Candidate: {user_text}")

    # Generate AI Reply
    ai_text = generate_ai_reply(session["chat"], user_text)
    session["history"].append(f"Interviewer: {ai_text}")

    return jsonify({
        "transcript": user_text,
        "reply": ai_text,     # MATCHES FRONTEND: frontend looks for response.reply
        "done": False         # Optional: Change to True if AI decides interview is over
    })

@app.post("/module2/finish")
def module2_finish():
    # Frontend api.ts sends FormData for finishModule2
    session_id = request.form.get("session_id")

    if not session_id or session_id not in module2_sessions:
        return {"error": "Invalid session_id"}, 400

    # Remove session from active dictionary
    session = module2_sessions.pop(session_id)

    # Generate final review
    review = finalize_module2_review(session["history"])

    return jsonify({
        "review": review
    })

# --- VISITOR COUNTER LOGIC ---
# VISITOR_FILE = "visitors.json"

# def get_visitor_count():
#     # If the file doesn't exist yet, start at 0
#     if not os.path.exists(VISITOR_FILE):
#         return 0
#     with open(VISITOR_FILE, "r") as f:
#         try:
#             data = json.load(f)
#             return data.get("count", 0)
#         except json.JSONDecodeError:
#             return 0

# def increment_visitor_count():
#     count = get_visitor_count() + 1
#     with open(VISITOR_FILE, "w") as f:
#         json.dump({"count": count}, f)
#     return count

# @app.get("/api/visitors")
# def get_visitors():
#     return jsonify({"count": get_visitor_count()})

# @app.post("/api/visitors/increment")
# def increment_visitors():
#     new_count = increment_visitor_count()
#     return jsonify({"count": new_count})

# module2_sessions = {}

# @app.post("/module2/start")
# def module2_start():
#     data = request.json

#     session_id = data["session_id"]
#     resume_text = data.get("resume_text", "Candidate")

#     chat = create_chat_session(resume_text)

#     module2_sessions[session_id] = {
#         "chat": chat,
#         "history": []
#     }

#     opening = "Hello. Let us begin. Please introduce yourself."
#     module2_sessions[session_id]["history"].append(f"Interviewer: {opening}")

#     return jsonify({
#         "message": opening
#     })

# @app.post("/module2/turn")
# def module2_turn():
#     session_id = request.form["session_id"]
#     audio_bytes = request.files["audio"].read()

#     if session_id not in module2_sessions:
#         return {"error": "Invalid or expired session_id"}, 400

#     session = module2_sessions[session_id]

    
#     user_text = transcribe_audio(audio_bytes)
#     session["history"].append(f"Candidate: {user_text}")

#     ai_text = generate_ai_reply(session["chat"], user_text)
#     session["history"].append(f"Interviewer: {ai_text}")

#     return jsonify({
#         "transcript": user_text,
#         "next_question": ai_text
#     })

# @app.post("/module2/finish")
# def module2_finish():
#     session_id = request.json["session_id"]

#     session = module2_sessions.pop(session_id)

#     review = finalize_module2_review(session["history"])

#     return jsonify({
#         "review": review
#     })


if __name__ == "__main__":
    app.run(debug=True, port=5000)



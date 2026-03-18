import json,os
from flask import jsonify
#, verify_face_once
# import cv2 , json,face_recognition

from flask_cors import CORS
from supabase import create_client, Client
from flask import Flask
from flask import request

app = Flask(__name__)
# CORS(app)
CORS(app, resources={r"/*": {"origins": "*"}})

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
    from qnsgenerator import generate_questions
    from resumeextractor import process_resume_pdf #generate_face_encoding
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
    })





@app.post("/module1/finish")
def finish_interview():
    from engine1 import run_interview_engine 
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


@app.get("/module1/download-report")
def download_report():
    from flask import send_file
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
    from module2 import create_chat_session
    from resumeextractor import process_resume_pdf #generate_face_encoding
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
    from module2 import (transcribe_audio,generate_ai_reply)
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
    from module2 import finalize_module2_review 
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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)



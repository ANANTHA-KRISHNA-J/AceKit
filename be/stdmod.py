# Dependencies
import cv2 as cv
import face_recognition , threading , keyboard
import time , sys
import pickle as pk
from datetime import datetime

# uploading resume and extracting face encodings

from resumeextractor import resumeextract_nd_imgencodings 
encodings = resumeextract_nd_imgencodings('varshini.pdf')

# Selecting difficulty lvl, interview level and creating questions

from qnsgenerator import ai_quest_generator
questions = ai_quest_generator()
questions = questions.split('\n')

# Dependencies for answering
from ansengine import speaker , ans_by_text , ans_by_voice

# pre requirements for threadings
state = {
    "running": True,
    "phase": "idle",          # "idle" | "asking" | "answering"
    "question_index": -1,
    "skip_question": False,
    "stop_interview": False,
}
state_lock = threading.Lock()
matches_history =[]
#Opening Camera and checking face and keeping camera on the whole time until esc
def cameras_job(enc):
    cap = cv.VideoCapture(0)
    cap.set(3, 1280)
    cap.set(4, 720)
    face_matched = False
    last_check_time = 0
    CHECK_INTERVAL = 180  # 3 minutes in seconds

    print("Camera ON. Interview running...")
    while True:
        with state_lock:
            if not state['running']:
                break
        success, frame = cap.read()
        if not success:
            continue

        cv.imshow("Interview Practice", frame)

        # Every 3 minutes → run face check
        now = time.time()
        if now - last_check_time >= CHECK_INTERVAL:
            last_check_time = now
            now_ = datetime.now().strftime('%I:%M  %p')


            rgb = cv.cvtColor(frame, cv.COLOR_BGR2RGB)
            locs = face_recognition.face_locations(rgb)
            encs = face_recognition.face_encodings(rgb, locs)

            if len(encs) > 0:
                cam_face = encs[0]
                match = face_recognition.compare_faces([enc], cam_face)[0]
                face_matched = match
                status = 'match' if match else 'not a match'
                matches_history.append(f'{now_} - {status}')

                print("3 min Face Check →", "Match 👍" if match else "Not a match ❌")
            else:
                print("3 min Face Check → No face found ❌")

        key = cv.waitKey(1) & 0xFF

        if key == 27:
            with state_lock:
                state['skip_question'] = True
        elif key == ord('q'):
            with state_lock:
                state['stop_interview'] = True
                state['running'] = False
            break

    print(matches_history)
    cap.release()
    cv.destroyAllWindows()
    print("Camera closed.")
    print("Face match status:", face_matched)

#Starting Camera thread
cam_thread = threading.Thread(target=cameras_job,args=(encodings,),daemon=True)
cam_thread.start()

# -----------------------------------------------------------
# Your interview logic can run here freely
# -----------------------------------------------------------

# Save all questions : answers
session_history = []
# key = cv.waitKey(1) & 0xFF

ans_mode = input('Choose any one Answering method 1-text , 2-voice: (Type 1 or 2 )')
if ans_mode=='1':
    answering_function = ans_by_text
elif ans_mode=='2':
    answering_function = ans_by_voice
else:
    print("Not recognized")
    with state_lock:
        state["running"] = False
    cam_thread.join()
    exit()

for qns in questions:
    with state_lock:
        if not state['running']:
            break
        state['phase']='asking'
        state['skip_question'] = False

    
    print("\nQUESTION:")
    print(qns)
    speaker(qns)
    print("-*-" * 200)

    sys.stdout.flush()  
    with state_lock:
        if state['stop_interview']:
            break
        if state['skip_question']:
            state['phase']='idle'
            continue
    with state_lock:
        if not state['running']:
            break
    state['phase']='answering'
    
    answer_text = answering_function()
    if answer_text is None:
        continue
    with state_lock:
        if state["stop_interview"]:
            break
        if state["skip_question"]:
            state["phase"] = "idle"
            continue
    session_history.append({qns:answer_text})
 
    with state_lock:
        if not state["running"]:
            break
        state["phase"] = "idle"
# stoping the webcam
with state_lock:
    state['running'] = False
cam_thread.join()

# REVIEW SESSION
from review import llmreview
opinions_and_reviews = llmreview(session_history)
# print(opinions_and_reviews)
raw_report = opinions_and_reviews.strip()

import json

if raw_report.startswith("```"):
    raw_report = raw_report.strip("`")
    raw_report = raw_report.replace('json','',1).strip()

report_json = json.loads(raw_report)

# report_json["overall_score"]
# report_json["technical_analysis"]
# report_json["per_question"]

# add face match status
notamatch = []
for i in matches_history :
    if i.endswith('not a match'):
        notamatch.append(i)
matches = len(matches_history ) - len(notamatch)
if matches>0:
    report_json['face_match_status'] = 'Face Matched'
else:
    report_json['face_match_status'] = 'Face Not Matched'

from reportpdf import render_html

html_string = render_html(report_json)

from resumeextractor import txt_file_name
import json
path = txt_file_name.strip()
# read raw text
with open(path, "r", encoding="utf-8") as f:
    raw = f.read().strip()
# clean code fences if present
if raw.startswith("```"):
    raw = raw.replace("```json", "").replace("```", "").strip()
# now parse JSON
resume_data = json.loads(raw)
student_name = resume_data["name"]   
clean_name = student_name.replace(' ','_')

import pdfkit

config = pdfkit.configuration(
    wkhtmltopdf=r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe")

pdfkit.from_string(html_string, f"{clean_name}'s_interview_report.pdf", configuration=config)

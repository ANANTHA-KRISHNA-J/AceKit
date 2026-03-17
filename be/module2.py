import os, json
from dotenv import load_dotenv
import google.generativeai as gogai
from deepgram import DeepgramClient
from review import llmreview_module2

load_dotenv()

# ---- CONFIG ----
API_KEY = os.getenv("Google_key")
DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY")
MODEL_NAME = "gemini-2.5-flash-lite"

gogai.configure(api_key=API_KEY)

# ---- HELPERS ----

def create_chat_session(resume_text: str):
    system_instruction = f'''
You are a senior technical/resume-based(jobrole) interviewer in form of a Interview audio Chatbot.
- Ask ONE question at a time.
- Based on the candidate's resume: {resume_text}
- Dig deeper if the answer is shallow.
- If candidate asks for easier or harder questions provide them
- If candidate asks for doubt or clarifications about question explain them. 
- Keep the tone professional.
- If candidate is strong in current question or concept move to next
- Do NOT mention scoring or feedback during the chat.
- CRITICAL RULE: Keep your responses strictly conversational, concise, and under 3 sentences. 
Never output long paragraphs.
'''
    model = gogai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=system_instruction
    )
    chat = model.start_chat(history=[])
    return chat


def transcribe_audio(audio_bytes: bytes) -> str:
    client = DeepgramClient(api_key=DEEPGRAM_API_KEY)
    response = client.listen.v1.media.transcribe_file(
        request=audio_bytes,
        model="nova-2",
        smart_format="true"
    )
    return response.results.channels[0].alternatives[0].transcript


def generate_ai_reply(chat, user_text: str) -> str:
    response = chat.send_message(user_text)
    return response.text


def finalize_module2_review(conversation_history: list[str]) -> dict:
    transcript = "\n".join(conversation_history)
    review = llmreview_module2(transcript)
    if isinstance(review, str):
        return json.loads(review)
    return review

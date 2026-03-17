# ansengine_web.py

import io
from typing import Optional
from gtts import gTTS
import speech_recognition as sr


# ---------- TEXT TO SPEECH (SERVER SAFE) ----------

def generate_tts_audio(text: str) -> Optional[bytes]:
    """
    Converts text to speech and returns MP3 bytes.
    Client decides how to play it.
    """
    text = text.strip()
    if not text:
        return None

    mp3_fp = io.BytesIO()
    tts = gTTS(text=text, lang="en")
    tts.write_to_fp(mp3_fp)
    mp3_fp.seek(0)

    return mp3_fp.read()


# ---------- ANSWER VIA TEXT ----------

def answer_from_text(answer: str) -> str:
    """
    Pure function.
    No stdin, no blocking.
    """
    return answer.strip()


# ---------- ANSWER VIA AUDIO ----------

def answer_from_audio(
    audio_bytes: bytes,
    sample_rate: int = 16000,
    sample_width: int = 2
) -> str:
    """
    Accepts raw WAV bytes from client.
    Returns recognized text.
    """

    recognizer = sr.Recognizer()
    audio_data = sr.AudioData(audio_bytes, sample_rate, sample_width)

    try:
        text = recognizer.recognize_google(audio_data)
        return text.strip()
    except sr.UnknownValueError:
        return ""
    except sr.RequestError as e:
        raise RuntimeError(f"Speech service error: {e}")

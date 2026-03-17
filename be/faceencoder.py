# import cv2 as cv
# import face_recognition
# import numpy as np
# from typing import Optional

# def generate_face_encoding(image_bgr: np.ndarray) -> Optional[list]:
#     if image_bgr is None:
#         return None

#     rgb = cv.cvtColor(image_bgr, cv.COLOR_BGR2RGB)
#     encodings = face_recognition.face_encodings(rgb)
#     return encodings[0] if encodings else None

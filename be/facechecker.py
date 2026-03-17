# import face_recognition

# def check_face_match(
#     face_encoding: list | None,
#     candidate_encoding: list | None,
#     tolerance: float = 0.6
# ) -> bool:
#     if not face_encoding or not candidate_encoding:
#         return False

#     matches = face_recognition.compare_faces(
#         [face_encoding],
#         candidate_encoding,
#         tolerance=tolerance
#     )
#     return bool(matches[0])

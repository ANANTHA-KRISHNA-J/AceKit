export const API_BASE = "https://acekit-production.up.railway.app"; 
///"https://acekit.onrender.com";//"http://127.0.0.1:5000";

export interface StartInterviewRequest {
  resume_text: string;
  difficulty: "easy" | "medium" | "hard";
  num_questions: number;
}

export interface StartInterviewResponse {
  questions: string[];
}

export interface FaceCheckRequest {
  face_encoding?: number[];
  camera_encoding?: number[];
}

export interface FaceCheckResponse {
  status?: string;
  match?: boolean;
}

export interface FinishInterviewResponse {
  review: {
    overall_score: { obtained: string; total: string };
    technical_analysis: string;
    communication_analysis: string;
    recommendations: string;
    face_match_status: string;
    per_question: Array<{
      question: string;
      candidate_answer: string;
      score: number;
      opinion: string;
      more_better: string;
      follow_up_question: string;
    }>;
  };
  html_report: string;
}

export interface Module2StartResponse {
  message: string;
}

export interface Module2TurnResponse {
  reply?: string;
  done?: boolean;
}

export interface Module2FinishResponse {
  review: Record<string, unknown>;
}

// Module 1 APIs

export async function startInterview(
  resumeFile: File,
  difficulty: "easy" | "medium" | "hard",
  numQuestions: number
) {
  const formData = new FormData(); 

  formData.append("resume", resumeFile);
  formData.append("difficulty", difficulty);
  formData.append("num_questions", numQuestions.toString());

  return fetch(`${API_BASE}/module1/start`, {
    method: "POST",
    body: formData,
  });
}


// export async function startInterview(data: StartInterviewRequest): Promise<StartInterviewResponse> {
//   const res = await fetch(`${API_BASE}/module1/start`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) throw new Error("Failed to start interview");
//   return res.json();
// }

// export async function checkFace(data: FaceCheckRequest): Promise<FaceCheckResponse> {
//   const res = await fetch(`${API_BASE}/module1/face-check`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) throw new Error("Face check failed");
//   return res.json();
// }

// In api.ts

// Update the function signature to accept FormData
// export async function checkFace(formData: FormData): Promise<FaceCheckResponse> {
//   const res = await fetch(`${API_BASE}/module1/face-check`, {
//     method: "POST",
//     // REMOVE headers! Browser sets 'multipart/form-data' automatically
//     body: formData, 
//   });
  
//   if (!res.ok) throw new Error("Face check failed");
//   return res.json();
// }

export async function finishInterview(formData: FormData): Promise<FinishInterviewResponse> {
  const res = await fetch(`${API_BASE}/module1/finish`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to finish interview");
  return res.json();
}

// Module 2 APIs revised

// Replace the existing startModule2 in api.ts
export async function startModule2(sessionId: string, resumeFile: File): Promise<Module2StartResponse> {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  formData.append("resume", resumeFile);

  const res = await fetch(`${API_BASE}/module2/start`, {
    method: "POST",
    // NO Content-Type header! Browser sets it automatically for FormData
    body: formData,
  });
  
  if (!res.ok) throw new Error("Failed to start module 2");
  return res.json();
}


// export async function startModule2(sessionId: string, resumeText: string): Promise<Module2StartResponse> {
//   const res = await fetch(`${API_BASE}/module2/start`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ session_id: sessionId, resume_text: resumeText }),
//   });
//   if (!res.ok) throw new Error("Failed to start module 2");
//   return res.json();
// }

export async function module2Turn(formData: FormData): Promise<Module2TurnResponse> {
  const res = await fetch(`${API_BASE}/module2/turn`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Module 2 turn failed");
  return res.json();
}

export async function finishModule2(sessionId: string): Promise<Module2FinishResponse> {
  const formData = new FormData();
  formData.append("session_id", sessionId);
  const res = await fetch(`${API_BASE}/module2/finish`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to finish module 2");
  return res.json();
}

// Health check
export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

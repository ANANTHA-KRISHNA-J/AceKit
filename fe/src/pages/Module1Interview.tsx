import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ArrowRight, Square, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CameraPreview } from "@/components/CameraPreview";
import { MicIndicator } from "@/components/MicIndicator";
import { QuestionDisplay } from "@/components/QuestionDisplay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useCamera } from "@/hooks/useCamera";
//import { useMicrophone } from "@/hooks/useMicrophone";
import { finishInterview } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// --- TYPES FOR SPEECH RECOGNITION ---
// Adding this to make TypeScript happy with browser APIs
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

interface SessionData {
  answerMode: "text" | "voice";
  difficulty: string;
  numQuestions: number;
  questions: string[];
}

interface QAEntry {
  question: string;
  answer: string;
}

export default function Module1Interview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { videoRef, isActive, error: cameraError, startCamera, stopCamera } = useCamera();
  //const { isRecording, startRecording, stopRecording } = useMicrophone();
  
  // State
  const [session, setSession] = useState<SessionData | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [qaHistory, setQaHistory] = useState<QAEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Voice State
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 1. INITIALIZATION
  useEffect(() => {
    const sessionStr = sessionStorage.getItem("module1_session");
    if (!sessionStr) {
      navigate("/module1/setup");
      return;
    }
    const data = JSON.parse(sessionStr);
    setSession(data);
    startCamera();

    return () => {
      stopCamera();
      window.speechSynthesis.cancel(); // Stop speaking if user leaves
    };
  }, [navigate, startCamera, stopCamera]);
// --- Update the TTS useEffect in Module1Interview.tsx ---
  useEffect(() => {
    if (!session?.questions[currentIndex]) return;

    const speakQuestion = () => {
      // 1. 🛡️ MUTE MIC BEFORE SPEAKING
      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop(); 
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(session.questions[currentIndex]);
      
      utterance.onstart = () => setIsSpeaking(true);
      
      utterance.onend = () => {
        setIsSpeaking(false);
        // 2. 🎤 RE-ENABLE MIC AFTER QUESTION FINISHES (Optional/Auto)
        // Only auto-start if you want it to be "Hands-free"
        // toggleRecording(); 
      };
      
      window.speechSynthesis.speak(utterance);
    };

    const timer = setTimeout(speakQuestion, 500);
    return () => clearTimeout(timer);
  }, [currentIndex, session]);
  // 2. TEXT-TO-SPEECH (TTS) - AUTO SPEAK QUESTION
  // useEffect(() => {
  //   if (!session?.questions[currentIndex]) return;

  //   // Only speak if user selected "Voice" mode (optional)
  //   // Or you can make it always speak. Let's make it always speak for immersion.
  //   const speakQuestion = () => {
  //     window.speechSynthesis.cancel(); // Stop previous speech
  //     const utterance = new SpeechSynthesisUtterance(session.questions[currentIndex]);
  //     utterance.rate = 1.0;
  //     utterance.pitch = 1.0;
      
  //     utterance.onstart = () => setIsSpeaking(true);
  //     utterance.onend = () => setIsSpeaking(false);
      
  //     window.speechSynthesis.speak(utterance);
  //   };

  //   // Small delay to ensure UI is ready
  //   const timer = setTimeout(speakQuestion, 500);
  //   return () => clearTimeout(timer);
  // }, [currentIndex, session]);

  // 3. SPEECH-TO-TEXT (STT) - REAL TRANSCRIPTION
  const toggleRecording = () => {
    if (isRecording) {
      // STOP RECORDING
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // START RECORDING
      if (!("webkitSpeechRecognition" in window)) {
        toast({ title: "Error", description: "Browser does not support speech recognition.", variant: "destructive" });
        return;
      }

      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsRecording(true);
      
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        // Update the text box LIVE as you speak

        setCurrentAnswer(transcript.trim());
        // setCurrentAnswer((prev) => {
        //      // Clever logic to append to existing text or replace
        //      return transcript; 
        // });
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  // 4. NAVIGATION LOGIC
  const submitAnswer = useCallback(() => {
    if (!session) return;
    
    // Guard Clause to prevent "Ghost Repeats"
    if (currentIndex >= session.questions.length - 1) {
        return;
    }

    const newEntry: QAEntry = {
      question: session.questions[currentIndex],
      answer: currentAnswer.trim() || "Skipped by candidate",
    };

    setQaHistory((prev) => [...prev, newEntry]);
    setCurrentAnswer("");
    window.speechSynthesis.cancel(); // Stop talking when moving next
    
    setCurrentIndex((prev) => prev + 1);
  }, [session, currentIndex, currentAnswer]);

  // 5. END INTERVIEW LOGIC (FIX FOR MISSING QUESTIONS)
  const handleEndInterview = async () => {
    if (!session) return;

    // A. Capture the current answer (if any)
    const finalHistory = [...qaHistory];
    
    // Only add current question if it hasn't been added yet
    // and if we are not "past" the end
    if (currentIndex < session.questions.length) {
        finalHistory.push({
          question: session.questions[currentIndex],
          answer: currentAnswer.trim() || "Skipped / Not Answered",
        });
    }

    // B. FILL THE GAPS! (The fix for your report bug)
    // If user ends at Q3 but there are 5 questions, add Q4 and Q5 as skipped.
    const questionsAnsweredSoFar = finalHistory.length;
    const totalQuestions = session.questions.length;

    for (let i = questionsAnsweredSoFar; i < totalQuestions; i++) {
        finalHistory.push({
            question: session.questions[i],
            answer: "Skipped / Not Answered (Interview Ended Early)"
        });
    }

    setIsSubmitting(true);
    try {
      const resumeBase64 = sessionStorage.getItem("module1_resume");
      if (!resumeBase64) {throw new Error("Resume not found");}

      const resumeBlob = await fetch(resumeBase64).then(r => r.blob());
      
      const formData = new FormData();
      formData.append("resume", resumeBlob, "resume.pdf");
      formData.append("qa_history", JSON.stringify(finalHistory));
      formData.append("difficulty", session.difficulty);
      formData.append("num_questions", session.numQuestions.toString());

      const result = await finishInterview(formData);
      
      sessionStorage.setItem("module1_report", JSON.stringify(result));
      navigate("/module1/report");

    } catch (error) {
      console.error("Error finishing interview:", error);
      toast({ title: "Error", description: "Failed to submit interview.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session) return <LoadingSpinner text="Loading..." />;

  const isLastQuestion = currentIndex >= session.questions.length - 1;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-6">
        {/* Camera Preview */}
        <div className="lg:col-span-1 space-y-4">
          <CameraPreview 
          videoRef={videoRef} 
          isActive={isActive} 
          error={cameraError} 
          />
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">
              Camera view for realistic practice
            </p>
          </div>
        </div>

        {/* Interview Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <QuestionDisplay
            question={session.questions[currentIndex] || "Loading question..."}
                questionNumber={currentIndex + 1}
                totalQuestions={session.questions.length}
            />
            {/* Audio Icon to show it's speaking */}
            {isSpeaking && (
                <div className="absolute top-4 right-4 text-primary animate-pulse">
                    <Volume2 className="w-6 h-6" />
                </div>
            )}
          </div>

          <div className="glass-card p-6 space-y-4">
            {session.answerMode === "text" ? (
               // TEXT MODE UI
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your answer here... (Press Enter to submit)"
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-end">
                   <Button onClick={submitAnswer} disabled={!currentAnswer.trim() || isLastQuestion}>
                     Submit Answer
                   </Button>
                </div>
              </div>
            ) : (
              // VOICE MODE UI (Now with REAL Transcription)
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <MicIndicator isRecording={isRecording} />
                    <span className="text-xs text-muted-foreground">
                        {isRecording ? "Listening..." : "Click 'Start Answer' and speak"}
                    </span>
                </div>
                
                <Button
                  onClick={toggleRecording}
                  variant={isRecording ? "destructive" : "default"}
                  className="w-full h-12 text-lg gap-2"
                >
                  {isRecording ? "Stop Recording" : "Start Answer"}
                </Button>

                {/* Live Transcript Box */}
                <div className="p-4 rounded-lg bg-secondary min-h-[100px] relative">
                    <p className="text-sm text-muted-foreground mb-2 font-semibold">Transcript:</p>
                    <p className="text-foreground whitespace-pre-wrap">
                        {currentAnswer || "Speak now to see text here..."}
                    </p>
                </div>

                {/* Submit Button (Manual submit allows user to edit text if STT fails slightly) */}
                <Button onClick={submitAnswer} disabled={!currentAnswer.trim() || isLastQuestion} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Submit This Answer
                </Button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-4">
             {/* Hide Next button if last question */}
             {!isLastQuestion && (
                <Button variant="outline" onClick={submitAnswer} disabled={!currentAnswer.trim()} className="flex-1 gap-2">
                Next Question <ArrowRight className="w-4 h-4" />
                </Button>
             )}

            <Button
              variant={isLastQuestion ? "default" : "destructive"}
              onClick={handleEndInterview}
              disabled={isSubmitting}
              className="flex-1 gap-2"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Generating report in 5 sec...</span>
                </div>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  {isLastQuestion ? "Finish & Submit" : "End Interview"}
                </>
              )}
                        </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            {currentIndex + 1} of {session.questions.length} questions
          </div>
        </div>
      </div>
    </div>
  );
}
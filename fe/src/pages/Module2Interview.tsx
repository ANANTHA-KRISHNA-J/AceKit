import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MicIndicator } from "@/components/MicIndicator";
import { QuestionDisplay } from "@/components/QuestionDisplay";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useMicrophone } from "@/hooks/useMicrophone";
import { module2Turn, finishModule2 } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";
declare global {
  interface Window { webkitSpeechRecognition: any; }
}

interface SessionData {
  sessionId: string;
  resumeText: string;
  openingMessage: string;
}

interface Message { role: "interviewer" | "candidate"; content: string;}

export default function Module2Interview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isRecording, startRecording, stopRecording } = useMicrophone();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null); 
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [session, setSession] = useState<SessionData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false); 

  useEffect(() => {
    const sessionStr = sessionStorage.getItem("module2_session");
    if (!sessionStr) { navigate("/module2/setup"); return; }
    const data: SessionData = JSON.parse(sessionStr);
    setSession(data);
    setMessages([{ role: "interviewer", content: data.openingMessage }]);

    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- AUTO-SEND LOGIC ---
  const handleStopAndSend = useCallback(async (finalText: string) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) recognitionRef.current.stop();
    // Inside handleStopAndSend in Module2Interview.tsx


    const audioBlob = await stopRecording();
    
    if (audioBlob && session) {
      setIsProcessing(true);
      try {
        const formData = new FormData();
        formData.append("session_id", session.sessionId);
        formData.append("audio", audioBlob, "audio.webm"); 

        setMessages((prev) => [...prev, { role: "candidate", content: finalText || "Audio sent..." }]);
        setLiveTranscript(""); 

        const response = await module2Turn(formData);

        if (response.reply) {
          setMessages((prev) => [...prev, { role: "interviewer", content: response.reply }]);
        }

        if (response.done) handleEndInterview();
            } catch (error) {
        toast({ 
          title: "Connection Glitch", 
          description: "Didn't quite catch that. Try speaking again.", 
          variant: "destructive" 
        });
        
        // 1. Tell the AI to repeat the last question
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === "interviewer") {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(lastMessage.content);
            utterance.rate = 1.15;
            utterance.onend = () => handleStartListening(); // Turn mic on AFTER speaking
            
            setTimeout(() => window.speechSynthesis.speak(utterance), 300);
        } else {
            // 2. Fallback if there is no previous message
            setTimeout(() => handleStartListening(), 500);
        }
        
      } finally {
      //       } catch (error) {
      //   toast({ 
      //     title: "Connection Glitch", 
      //     description: "Didn't quite catch that. Try speaking again.", 
      //     variant: "destructive" 
      //   });
        
      //   // 🛟 THE LIFESAVER: Turn the mic back on if the network fails!
      //   setTimeout(() => handleStartListening(), 500);
        
      // } finally {
        setIsProcessing(false);
      }
    }
  }, [session, stopRecording, toast,]);

  // --- AUTO-START MIC LOGIC ---
  const handleStartListening = useCallback(async () => {
    window.speechSynthesis.cancel(); 
    setLiveTranscript("");
    await startRecording(); 

    if ("webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + " ";
        }
        const currentText = transcript.trim();
        setLiveTranscript(currentText);

        // Reset silence timer every time user speaks
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        // If they stop talking for 3 seconds, Auto-Send!
        if (currentText.length > 0) {
            silenceTimerRef.current = setTimeout(() => {
                handleStopAndSend(currentText);
            }, 5000); //3000
        }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
    }
  }, [startRecording, handleStopAndSend]);

  // --- FASTER TEXT-TO-SPEECH ---
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "interviewer") {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(lastMessage.content);
      
      utterance.rate = 1.15; // 🚀 FASTER VOICE (1.0 is normal, 1.15 is brisk)
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // 🎙️ AUTO START MIC WHEN AI STOPS SPEAKING
        handleStartListening();
      };
      
      // Delay slightly so it feels natural
      setTimeout(() => window.speechSynthesis.speak(utterance), 100);
    }
  }, [messages, handleStartListening]);

  const handleEndInterview = async () => {
    if (!session) return;
    setIsEnding(true);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    if (recognitionRef.current) recognitionRef.current.stop();
    await stopRecording();
    
    try {
      const response = await finishModule2(session.sessionId);
      sessionStorage.setItem("module2_review", JSON.stringify(response.review));
      navigate("/module2/review");
    } catch (error) {
      toast({ title: "Error", description: "Failed to end.", variant: "destructive" });
      setIsEnding(false);
    }
  };

  if (!session) return <LoadingSpinner text="Loading interview..." />;

  const currentQuestion = messages.filter((m) => m.role === "interviewer").pop()?.content || "";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <div className="relative">
          <QuestionDisplay question={currentQuestion} />
          {isSpeaking && (
             <div className="absolute top-4 right-4 text-primary animate-pulse">
                <Volume2 className="w-6 h-6" />
             </div>
          )}
        </div>

        <div className="glass-card p-6 max-h-[400px] overflow-y-auto space-y-4">
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Conversations
          </h3>
          <div className="space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-4 rounded-xl ${
                    msg.role === "candidate" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {(isRecording || liveTranscript) && (
          <div className="glass-card p-4 border-primary/50">
            <p className="text-sm text-muted-foreground mb-1">Live transcript:</p>
            <p className="text-foreground">{liveTranscript || "Listening... (Will auto-send when you stop talking)"}</p>
          </div>
        )}

        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-center">
            <MicIndicator isRecording={isRecording} />
          </div>

          <div className="flex gap-4">
            {/* Kept as a manual override just in case they want to force-send early */}
            <Button
              onClick={() => handleStopAndSend(liveTranscript)}
              disabled={isProcessing || !isRecording}
              variant={isRecording ? "destructive" : "secondary"}
              className="flex-1 h-14 text-base"
            >
              {isProcessing ? <LoadingSpinner size="sm" /> : "Send Audio"}
            </Button>

            <Button onClick={handleEndInterview} disabled={isEnding} variant="outline" className="gap-2 h-14">
              {isEnding ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Generating report please wait...</span>
                </div>
                ): (<>
              <Square className="w-4 h-4" /> End Interview</>)}
            </Button>
          </div>
        </div>
      </div>
              <div className="fixed bottom-0 left-0 w-full bg-blue-500/10 border-t border-blue-500/20 py-3 flex justify-center z-50">
                <p className="text-blue-400 text-sm whitespace-nowrap flex items-center gap-2 px-4">
                  <Info className="w-4 h-4" />
                  Note: Answer as soon as the voice reads out the question. Speak in a silent environment. Do not click end interview while the Voice is speaking.
                </p>
              </div>
    </div>
    
  );
}
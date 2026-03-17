import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Image, ArrowLeft, ArrowRight, Mic, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { startInterview } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Module1Setup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  // const [faceImage, setFaceImage] = useState<File | null>(null);
  const [skipFace, setSkipFace] = useState(false);
  const [answerMode, setAnswerMode] = useState<"text" | "voice">("text");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [numQuestions, setNumQuestions] = useState<number | "">(5); //useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  // const extractTextFromPDF = async (file: File): Promise<string> => {
  //   // For now, we'll read the file and send it to the backend
  //   // The backend handles the actual PDF parsing
  //   const text = await file.text().catch(() => file.name);
  //   return text || file.name;
  // };

  const handleStart = async () => {
    if (!resumeFile) {
      toast({
        title: "Resume required",
        description: "Please upload your resume PDF",
        variant: "destructive",
      });
      return;
    }
    setIsStarting(true);

    setIsLoading(true);
    try {

      // ✅ NEW: Send the File directly to match your new API
      // No need to call extractTextFromPDF here! The backend does it now.

      const response = await startInterview(
        resumeFile,    // Pass the File object directly
        difficulty,    // Pass the string "medium"
        Number(numQuestions) || 5  // Pass the number 5 numQuestions
      );

      // Check for backend errors
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Backend failed");
      }
      // Note: startInterview returns a Response object now (from fetch), so you need to parse JSON
      const data = await response.json(); 

      // Update your session storage logic to use the response data
      const sessionData = {
        resumeFile,
        // faceImage: skipFace ? null : faceImage,
        answerMode,
        difficulty,
        numQuestions,
        questions: data.questions.filter((q: string) => q.trim()), // Use 'data.questions' from backend
      };

      // In Module1Interview.tsx

      // Helper to convert Base64 string to Blob for uploading
      // const dataURItoBlob = (dataURI: string) => {
      //   const byteString = atob(dataURI.split(',')[1]);
      //   const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
      //   const ab = new ArrayBuffer(byteString.length);
      //   const ia = new Uint8Array(ab);
      //   for (let i = 0; i < byteString.length; i++) {
      //     ia[i] = byteString.charCodeAt(i);
      //   }
      //   return new Blob([ab], { type: mimeString });
      // };

      // ... inside your component ...

// useEffect(() => {
//         // 1. Set the 10-second timer
//         const timer = setTimeout(async () => {
          
//           // 2. Get the Resume Photo (Stored during Setup)
//           const resumeFaceBase64 = sessionStorage.getItem("module1_face");
          
//           // Skip if user clicked "Continue without image"
//           if (!resumeFaceBase64) return; 

//           // 3. Capture the Live Camera Frame
//           // (Ensure you exposed captureFrame from your useCamera hook!)
//           const cameraFaceBase64 = captureFrame(); 
          
//           if (cameraFaceBase64) {
//             try {
//               // 4. Prepare the Data
//               const formData = new FormData();
//               formData.append("resume_face", dataURItoBlob(resumeFaceBase64), "resume.jpg");
//               formData.append("camera_face", dataURItoBlob(cameraFaceBase64), "camera.jpg");

//               // 5. Send to Backend
//               console.log("Triggering 10s Face Check...");
//               const result = await checkFace(formData);
              
//               if (!result.match) {
//                 toast({ title: "Face Verification Failed", variant: "destructive" });
//                 // Optional: End interview or Log it
//               } else {
//                 toast({ title: "Identity Verified", className: "bg-green-600 text-white" });
//               }
//             } catch (e) {
//               console.error("Face check error", e);
//             }
//           }
//         }, 10000); // <--- 10,000 ms = 10 Seconds

//         // Cleanup timer if user leaves page early
//         return () => clearTimeout(timer);
//       }, []); // Empty dependency array = Runs once on mount
      //   const resumeText = await extractTextFromPDF(resumeFile);
      
      //   const response = await startInterview(
      //   resumeFile,    // Pass the File object directly
      //   difficulty,    // Pass the string "medium"
      //   numQuestions   // Pass the number 5
      // );

      //   const data = await response.json();

      //   // const response = await startInterview({
      //   //   resume_text: resumeText,
      //   //   difficulty,
      //   //   num_questions: numQuestions,
      //   // });

      //   // Store session data
      //   const sessionData = {
      //     resumeFile,
      //     faceImage: skipFace ? null : faceImage,
      //     answerMode,
      //     difficulty,
      //     numQuestions,
      //     questions: response.questions.filter(q => q.trim()),
      //   };

      sessionStorage.setItem("module1_session", JSON.stringify({
        ...sessionData,
        resumeFile: null, // Can't serialize File, handle separately
        faceImage: null,
      }));

      // Store files in sessionStorage as base64
      const reader = new FileReader();
      reader.onload = () => {
        sessionStorage.setItem("module1_resume", reader.result as string);
        sessionStorage.setItem("module1_resume_name", resumeFile.name);
        navigate("/module1/interview");
        // if (faceImage && !skipFace) {
        //   const faceReader = new FileReader();
        //   faceReader.onload = () => {
        //     sessionStorage.setItem("module1_face", faceReader.result as string);
        //     navigate("/module1/interview");
        //   };
        //   faceReader.readAsDataURL(faceImage);
        // } else {
        //   navigate("/module1/interview");
        // }
      };
      reader.readAsDataURL(resumeFile);

    } catch (error) {
    console.error(error);
    setIsStarting(false);
    setIsLoading(false);

      toast({
        title: "Error",
        description: "Failed to start interview. Make sure the backend is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-display font-bold">Setup Interview</h1>
          <p className="text-muted-foreground">
            Configure your structured interview session
          </p>
        </div>

        <div className="space-y-8">
          {/* Resume Upload */}
          <div className="glass-card p-6 space-y-4">
            <Label className="text-base font-medium">Resume (PDF)</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                resumeFile ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                className="hidden"
                id="resume-upload"
              />
              <label htmlFor="resume-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                {resumeFile ? (
                  <p className="text-primary font-medium">{resumeFile.name}</p>
                ) : (
                  <p className="text-muted-foreground">Click to upload PDF</p>
                )}
              </label>
            </div>
          </div>

          {/* Face Image Section (Commented out for future implementation) 
          <div className="glass-card p-6 space-y-4">
            <Label className="text-base font-medium">Face Image (Optional)</Label>
            {!skipFace && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  faceImage ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFaceImage(e.target.files?.[0] || null)}
                  className="hidden"
                  id="face-upload"
                />
                <label htmlFor="face-upload" className="cursor-pointer">
                  <Image className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  {faceImage ? (
                    <p className="text-primary font-medium">{faceImage.name}</p>
                  ) : (
                    <p className="text-muted-foreground">Click to upload image</p>
                  )}
                </label>
              </div>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setSkipFace(!skipFace);
                if (!skipFace) setFaceImage(null);
              }}
              className="w-full"
            >
              {skipFace ? "Add face verification" : "Continue without image"}
            </Button>
          </div> 
          */}

          {/* Answer Mode */}
          <div className="glass-card p-6 space-y-4">
            <Label className="text-base font-medium">Answer Mode</Label>
            <RadioGroup
              value={answerMode}
              onValueChange={(v) => setAnswerMode(v as "text" | "voice")}
              className="grid grid-cols-2 gap-4"
            >
              <Label
                htmlFor="text-mode"
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  answerMode === "text" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <RadioGroupItem value="text" id="text-mode" />
                <Keyboard className="w-5 h-5" />
                <span>Text</span>
              </Label>
              <Label
                htmlFor="voice-mode"
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  answerMode === "voice" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <RadioGroupItem value="voice" id="voice-mode" />
                <Mic className="w-5 h-5" />
                <span>Voice</span>
              </Label>
            </RadioGroup>
          </div>

          {/* Difficulty & Questions */}
          <div className="glass-card p-6 space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as typeof difficulty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
                <Label className="text-base font-medium">Number of Questions</Label>
                <Input
                  type="number"
                  value={numQuestions}
                  // 1. Allow any typing (even empty string) so backspace works
                  onChange={(e) => {
                    const val = e.target.value;
                    setNumQuestions(val === "" ? "" : parseInt(val));
                  }}
                  // 2. Only enforce the 1-40 limit when the user clicks away
                  onBlur={() => {
                    const val = Number(numQuestions);
                    if (isNaN(val) || val < 1) setNumQuestions(1);
                    else if (val > 40) setNumQuestions(40);
                  }}
                />
              </div>
            {/* <div className="space-y-3">
              <Label className="text-base font-medium">Number of Questions</Label>
              <Input
                type="number"
                min={1}
                max={40}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, Math.min(40, parseInt(e.target.value) || 1)))}
              />
            </div>
          </div> */}

          <Button
            onClick={handleStart}
            disabled={isStarting} // {!resumeFile || isLoading}
            className="w-full h-12 text-base font-medium gap-2"
          >
            {isStarting ? (
              <>
              <LoadingSpinner size="sm" className="text-white"/>
              <span className="ml-2">Starting Interview in 5 sec...</span>
              </>
            ) : (
              <>
                Start Interview
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
          {/* <Button 
            onClick={handleStart} 
            className="w-full" 
            disabled={isStarting}
          >
            {isStarting ? (
              // Wrapping it in a div and forcing the text color to white fixes the camouflage 
              <div className="text-white flex items-center justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <span>Start Interview</span>
                <ArrowRight className="w-5 h-5" />
              </div>
            )}
          </Button> */}
        </div>
      </div>
    </div>
    </div>
)}
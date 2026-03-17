import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { startModule2 } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Module2Setup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async () => {
    if (!resumeFile) {
      toast({
        title: "Resume required",
        description: "Please upload your resume PDF",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      //const resumeText = await resumeFile.text().catch(() => resumeFile.name);
      const sessionId = `m2_${Date.now()}`;

      const response = await startModule2(sessionId, resumeFile);

      // Store session
      sessionStorage.setItem("module2_session", JSON.stringify({
        sessionId,
        resumeText: resumeFile.name,
        openingMessage: response.message,
      }));

      navigate("/module2/interview");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start interview. Check backend connection.",
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
          <h1 className="text-3xl font-display font-bold">Voice Interview Setup</h1>
          <p className="text-muted-foreground">
            Get ready for a free-flow conversational interview
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

          {/* Info Card */}
          <div className="glass-card p-6 space-y-3 border-primary/30">
            <h3 className="font-display font-semibold">How it works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                The AI interviewer will ask questions based on your resume
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Speak naturally—the AI adapts to your responses
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                No fixed number of questions—conversation flows naturally
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                Answer as-soon-as AI speaks out the question
              </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                End the interview when ready for your review
              </li>
            </ul>
          </div>

          <Button
            onClick={handleStart}
            disabled={!resumeFile || isLoading}
            className="w-full h-12 text-base font-medium gap-2"
          >
            {isLoading ? (
              <>
              <LoadingSpinner size="sm" className="text-white"/>
              <span className="ml-2">Starting Interview in 5 sec...</span> 
              </>
            ) : (
              <>
                Start Voice Interview
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

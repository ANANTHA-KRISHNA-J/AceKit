import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info, FileText, Mic } from "lucide-react";

export function InfoModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Info className="w-4 h-4" />
          Info about modules
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Interview Modules</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold">Module 1 – Structured Interview - Text & Voice</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-13">
              A traditional interview format with pre-generated questions based on your resume. 
              You control the pace - answer via text or voice, with web-cam view.
              Receive a detailed PDF report with scores and feedback.
            </p>
          </div>

          <div className="border-t border-border" />

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mic className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-semibold">Module 2 – Free flow Interview - Voice</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed pl-13">
              A conversational AI interview that adapts in real-time. The AI interviewer 
              controls the flow, asking follow-up questions based on your responses. 
              Pure voice interaction - like a real phone screen. No fixed number of questions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

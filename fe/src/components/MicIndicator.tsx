import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface MicIndicatorProps {
  isRecording: boolean;
  className?: string;
}

export function MicIndicator({ isRecording, className }: MicIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative w-12 h-12 rounded-full flex items-center justify-center transition-colors",
          isRecording ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {isRecording && <div className="pulse-ring absolute inset-0" />}
        {isRecording ? <Mic className="w-6 h-6 relative z-10" /> : <MicOff className="w-6 h-6" />}
      </div>
      <div className="text-sm">
        {isRecording ? (
          <span className="text-primary font-medium">Recording...</span>
        ) : (
          <span className="text-muted-foreground">Microphone off</span>
        )}
      </div>
    </div>
  );
}

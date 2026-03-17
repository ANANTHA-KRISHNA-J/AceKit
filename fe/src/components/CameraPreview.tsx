import { RefObject } from "react";
import { Camera, CameraOff } from "lucide-react";

interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement>;
  isActive: boolean;
  error?: string | null;
}

export function CameraPreview({ videoRef, isActive, error }: CameraPreviewProps) {
  return (
    <div className="camera-preview aspect-video bg-secondary relative overflow-hidden rounded-xl">
      {/* FIX: Always render the video, but hide it if not active */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${isActive ? "block" : "hidden"}`}
      />

      {/* Show Placeholder only when hidden */}
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground bg-secondary/90 backdrop-blur-sm">
          {error ? (
            <>
              <CameraOff className="w-12 h-12" />
              <p className="text-sm text-center px-4">{error}</p>
            </>
          ) : (
            <>
              <Camera className="w-12 h-12" />
              <p className="text-sm">Camera initializing...</p>
            </>
          )}
        </div>
      )}

      {isActive && (
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <span className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
          <span className="text-xs font-medium text-foreground bg-background/80 px-2 py-1 rounded">
            LIVE
          </span>
        </div>
      )}
    </div>
  );
}
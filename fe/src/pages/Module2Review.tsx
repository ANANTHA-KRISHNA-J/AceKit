import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Module2Review() {
  const navigate = useNavigate();
  const [review, setReview] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const reviewStr = sessionStorage.getItem("module2_review");
    if (!reviewStr) {
      navigate("/module2/setup");
      return;
    }
    setReview(JSON.parse(reviewStr));
  }, [navigate]);

  if (!review) return <LoadingSpinner text="Loading review..." />;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header (No Download Button) */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <Home className="w-4 h-4" /> Home
          </Button>

          <div className="absolute left-1/2 -translate-x-1/2 text-center w-full pointer-events-none">
            <h1 className="text-3xl font-display font-bold">Interview Review</h1>
          </div>

        </div>

        {/* Clean Review Content */}
        <div className="glass-card p-6 space-y-6 text-justify">
          {Object.entries(review).map(([key, value]) => {
            // Check if backend accidentally sent stringified JSON and parse it cleanly
            let displayValue = value;
            if (typeof value === 'string' && value.trim().startsWith('{')) {
                try { displayValue = JSON.parse(value); } catch(e) {}
            }

            return (
              <div key={key} className="space-y-2">
                <h3 className="font-display font-semibold capitalize text-lg text-primary">
                  {key.replace(/_/g, " ")}
                </h3>
                <div className="text-muted-foreground text-sm">
                  {typeof displayValue === "object" ? (
                    <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
                      {/* Render arrays or objects cleanly instead of raw code */}
                      {Object.entries(displayValue as Record<string, any>).map(([subKey, subVal]) => (
                        <div key={subKey}>
                          <span className="font-semibold capitalize text-foreground">{subKey.replace(/_/g, " ")}: </span>
                          <span>{Array.isArray(subVal) ? subVal.join(", ") : String(subVal)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // <p className="leading-relaxed">{String(displayValue)}</p>
                    <p className="leading-relaxed">
                      {key.toLowerCase().includes('score') || key.toLowerCase().includes('rating') 
                        ? `${String(displayValue)}/10` 
                        : String(displayValue)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Download, Home } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { LoadingSpinner } from "@/components/LoadingSpinner";

// export default function Module2Review() {
//   const navigate = useNavigate();
//   const [review, setReview] = useState<Record<string, unknown> | null>(null);

//   useEffect(() => {
//     const reviewStr = sessionStorage.getItem("module2_review");
//     if (!reviewStr) {
//       navigate("/module2/setup");
//       return;
//     }
//     setReview(JSON.parse(reviewStr));
//   }, [navigate]);

//   const handleDownload = () => {
//     if (!review) return;

//     const blob = new Blob([JSON.stringify(review, null, 2)], { type: "application/json" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "interview-review.json";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   if (!review) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <LoadingSpinner text="Loading review..." />
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-background p-4 md:p-8">
//       <div className="max-w-3xl mx-auto space-y-8">
//         {/* Header */}
//         <div className="flex items-center justify-between">
//           <div className="space-y-1">
//             <h1 className="text-3xl font-display font-bold">Interview Review</h1>
//             <p className="text-muted-foreground">Your voice interview analysis</p>
//           </div>
//           <div className="flex gap-3">
//             <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
//               <Home className="w-4 h-4" />
//               Home
//             </Button>
//             <Button onClick={handleDownload} className="gap-2">
//               <Download className="w-4 h-4" />
//               Download
//             </Button>
//           </div>
//         </div>

//         {/* Review Content */}
//         <div className="glass-card p-6 space-y-6">
//           {Object.entries(review).map(([key, value]) => (
//             <div key={key} className="space-y-2">
//               <h3 className="font-display font-semibold capitalize">
//                 {key.replace(/_/g, " ")}
//               </h3>
//               <div className="text-muted-foreground text-sm">
//                 {typeof value === "object" ? (
//                   <pre className="bg-secondary p-4 rounded-lg overflow-auto text-xs">
//                     {JSON.stringify(value, null, 2)}
//                   </pre>
//                 ) : (
//                   <p className="leading-relaxed">{String(value)}</p>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Raw JSON */}
//         <div className="glass-card p-6 space-y-4">
//           <h3 className="font-display font-semibold">Raw Response</h3>
//           <pre className="bg-secondary p-4 rounded-lg overflow-auto text-xs max-h-[400px]">
//             {JSON.stringify(review, null, 2)}
//           </pre>
//         </div>
//       </div>
//     </div>
//   );
// }

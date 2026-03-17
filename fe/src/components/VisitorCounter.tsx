import { useState, useEffect } from "react";
import { Users } from "lucide-react";

// Update this to your Railway URL once deployed (e.g., "https://acekit-backend.up.railway.app")
const API_BASE_URL = "https://acekit.onrender.com"; //"http://127.0.0.1:5000";

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const checkVisitor = async () => {
      // 1. Check if we already dropped a token in this browser
      const hasVisited = localStorage.getItem("_visitor_token");

      try {
        if (!hasVisited) {
          // Brand new visitor! Increment the count on the backend
          const res = await fetch(`${API_BASE_URL}/api/visitors/increment`, { 
            method: "POST" 
          });
          const data = await res.json();
          setCount(data.count);
          
          // Drop the token so we don't count them again tomorrow
          localStorage.setItem("_visitor_token", "true");
        } else {
          // Returning visitor! Just get the current total
          const res = await fetch(`${API_BASE_URL}/api/visitors`);
          const data = await res.json();
          setCount(data.count);
        }
      } catch (error) {
        console.error("Failed to load visitor count:", error);
      }
    };

    checkVisitor();
  }, []);

  // Don't render anything until we have the number
  if (count === null) return null;

  return (
    <div 
      className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 px-4 py-1.5 rounded-full border border-primary/20 shadow-sm backdrop-blur-sm transition-all hover:bg-secondary/50 animate-fade-in"
      style={{ animationDelay: "0.6s", animationFillMode: "both" }}
    >
      <Users className="w-4 h-4 text-primary" />
      <span className="font-medium">
        {count.toLocaleString()} {count === 1 ? 'Visitor' : 'Total Users'}
      </span>
    </div>
  );
}

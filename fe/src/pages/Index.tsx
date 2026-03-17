import { FileText, Mic } from "lucide-react";
import { ModuleCard } from "@/components/ModuleCard";
import { InfoModal } from "@/components/InfoModal";
import { VisitorCounter } from "@/components/VisitorCounter";
const Index = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-full mx-auto text-center space-y-6 mb-16 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight">
            {"AceKit"} - Master Your{" "}
            <span className="gradient-text">Interview Skills</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Practice with AI-powered mock interviews tailored to your resume.<br/>
            Get instant feedback and improve your performance.
          </p>
          <InfoModal />
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <ModuleCard
            title="Structured Interview"
            description="Pre-generated questions with text or voice answers. Includes camera view and detailed reports with scoring."
            icon={<FileText className="w-7 h-7" />}
            href="/module1/setup"
            badge="Module 1"
          />
          <ModuleCard
            title="Free-flow Voice Interview"
            description="Conversational AI interview that adapts in real-time. Pure voice interaction with dynamic follow-up questions."
            icon={<Mic className="w-7 h-7" />}
            href="/module2/setup"
            badge="Module 2"
          />
        </div>

        <div className="mt-16 text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <p>Powered by AI • Your data stays private</p>
        </div>
        <VisitorCounter />
      </div>
    </div>
  );
};

export default Index;

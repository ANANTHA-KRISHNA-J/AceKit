import { cn } from "@/lib/utils";

interface QuestionDisplayProps {
  question: string;
  questionNumber?: number;
  totalQuestions?: number;
  className?: string;
}

export function QuestionDisplay({
  question,
  questionNumber,
  totalQuestions,
  className,
}: QuestionDisplayProps) {
  return (
    <div className={cn("glass-card p-6 space-y-4", className)}>
      {questionNumber && totalQuestions && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary">
            Question {questionNumber} of {totalQuestions}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i < questionNumber ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      )}
      <p className="text-lg font-display font-medium text-foreground leading-relaxed">
        {question}
      </p>
    </div>
  );
}

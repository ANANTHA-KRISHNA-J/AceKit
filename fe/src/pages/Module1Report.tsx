import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Home, FileText,Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { API_BASE } from "@/lib/api";
interface ReportData {
  review: {
    overall_score: { obtained: string; total: string };
    technical_analysis: string;
    communication_analysis: string;
    recommendations: string;
    face_match_status: string;
    per_question: Array<{
      question: string;
      candidate_answer: string;
      score: number;
      opinion: string;
      more_better: string;
      follow_up_question: string;
    }>;
  };
  html_report: string;
}

export default function Module1Report() {
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    const reportStr = sessionStorage.getItem("module1_report");
    if (!reportStr) {
      navigate("/module1/setup");
      return;
    }
    setReport(JSON.parse(reportStr));
  }, [navigate]);

  const handleDownloadPDF = () => {
    if (!report) return;

    // Create a blob from the HTML and trigger download
    const blob = new Blob([report.html_report], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "interview-report.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading report..." />
      </div>
    );
  }

  const score = report.review.overall_score;
  const scorePercent = (parseInt(score.obtained) / parseInt(score.total)) * 100;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {/* <h1 className="text-3xl font-display font-bold">Interview Report</h1> */}
            {/* <p className="text-muted-foreground">Your performance analysis</p> */}
          </div>
            {/* The 'relative' class allows the absolute center to work */}
              <div className="relative flex items-center justify-between mb-8 w-full">
                
                {/* Left side */}
                <Button onClick={() => navigate('/')} variant="outline" className="gap-2 z-10">
                  <Home className="w-4 h-4" /> Home
                </Button>

                {/* Center (Absolutely positioned so it never shifts left or right) */}
                <div className="absolute left-1/2 -translate-x-1/2 text-center w-full pointer-events-none">
                  <h1 className="text-3xl font-bold">Interview Report</h1>
                  {/* <p className="text-muted-foreground">Your performance analysis</p> */}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-3 z-10">
                  <Button variant="secondary" onClick={() => document.getElementById('full-report-section')?.scrollIntoView({ behavior: 'smooth' })} className="gap-2">
                   <Eye className="w-4 h-4" /> View Report
                  </Button>
                  <Button onClick={() => window.location.href = `${API_BASE}/module1/download-report`} className="gap-2">
                    <Download className="w-4 h-4" /> Download Report
                  </Button>
                </div>
              </div>
        </div>

        {/* Score Card */}
        <div className="glass-card p-8 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2  text-primary"> {/*rounded-full bg-primary/10*/}
            <FileText className="w-5 h-5" />
            <span className="font-medium">Overall Score</span>
          </div>
          <div className="text-6xl font-display font-bold gradient-text">
            {score.obtained}/{score.total}
          </div>
          <div className="w-full max-w-xs mx-auto h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {/* Face verification: Disabled (Practice Mode) */}
          </p>
        </div>
{/* {report.review.face_match_status} */}
        {/* Analysis Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6 space-y-3">
            <h3 className="font-display font-semibold text-lg">Domain Analysis</h3> {/*Technical*/}
            <p className="text-muted-foreground text-sm leading-relaxed text-justify">
              {report.review.technical_analysis}
            </p>
          </div>
          <div className="glass-card p-6 space-y-3">
            <h3 className="font-display font-semibold text-lg">Communication Analysis</h3>
            <p className="text-muted-foreground text-sm leading-relaxed text-justify">
              {report.review.communication_analysis}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="glass-card p-6 space-y-3">
          <h3 className="font-display font-semibold text-lg">Recommendations</h3>
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
            {report.review.recommendations}
          </p>
        </div>

        {/* Per-Question Breakdown */}
        <div className="glass-card p-6 space-y-6">
          <h3 className="font-display font-semibold text-lg">Question Breakdown</h3>
          <div className="space-y-6">
            {report.review.per_question.map((q, index) => (
              <div key={index} className="border-b border-border pb-6 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <p className="font-medium text-foreground">
                    Q{index + 1}: {q.question}
                  </p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    q.score >= 7 ? "bg-green-500/20 text-green-400" :
                    q.score >= 4 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    {q.score}/10
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Your answer:</span> {q.candidate_answer}</p>
                  <p><span className="text-muted-foreground">Feedback:</span> {q.opinion}</p>
                  <p><span className="text-muted-foreground">To improve:</span> {q.more_better}</p>
                  <p><span className="text-muted-foreground">Follow-up:</span> {q.follow_up_question}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raw HTML Render (optional) */}
        <div id="full-report-section"className="glass-card p-6 space-y-4">
          <h3 className="font-display font-semibold text-lg">Full Report Preview</h3>
          <div
            className="bg-white text-black rounded-lg p-4 overflow-auto max-h-[600px]"
            dangerouslySetInnerHTML={{ __html: report.html_report }}
          />
        </div>
      </div>
    </div>
  );
}

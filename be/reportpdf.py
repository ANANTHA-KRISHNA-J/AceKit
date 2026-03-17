import json
from datetime import datetime , timezone
from typing import Dict



def load_resume_json(raw_text: str) -> Dict:
    """
    Parses resume JSON safely from text.
    """
    text = raw_text.strip()

    if text.startswith("```"):
        text = (
            text.replace("```json", "")
            .replace("```", "")
            .strip()
        )

    return json.loads(text)


def build_rows(report: Dict) -> str:
    rows = []
    for i, q in enumerate(report.get("per_question", []), start=1):
        rows.append(f"""
        <tr>
          <td>{i}</td>
          <td>{q.get("question","")}</td>
          <td>{q.get("candidate_answer","")}</td>
          <td>{q.get("score","")}</td>
          <td>{q.get("opinion","")}</td>
          <td>{q.get("more_better","")}</td>
          <td>{q.get("follow_up_question","")}</td>
        </tr>
        """)
    return "".join(rows)

     # <p>Face Match Status: {report.get("face_match_status")}</p>
def render_html(
    report: Dict,
    resume_data: Dict
) -> str:
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    student_name = resume_data.get("name", "").replace(" ", "_")
    role = resume_data.get("role", "")

    rows_html = build_rows(report)
#<!--Technical--> 
    return f"""
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body {{ font-family: Arial, sans-serif; }}
        .score-badge {{ font-size: 28px; font-weight: bold; }}
        .section-title {{ font-size: 20px; margin-top: 20px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; }}
        th, td {{ border: 1px solid #ccc; padding: 6px; font-size: 12px; }}
      </style>
    </head>
    <body>
      <h1>Mock Interview Report</h1>
      <p>Candidate Name: {student_name}</p>
      <p>Job Role: {role}</p>
      <p>Date: {date_str}</p>

      <p class="score-badge">
        Overall Score: {report["overall_score"]["obtained"]}/{report["overall_score"]["total"]}
      </p>

      <div class="section-title">Domain Analysis</div> 
      <p>{report.get("technical_analysis","")}</p>

      <div class="section-title">Communication Analysis</div>
      <p>{report.get("communication_analysis","")}</p>

      <div class="section-title">Recommendations</div>
      <p>{report.get("recommendations","")}</p>

      <div class="section-title">Per-question Breakdown</div>
      <table>
        <tr>
          <th>S.No</th>
          <th>Question</th>
          <th>Answer</th>
          <th>Score</th>
          <th>Opinion</th>
          <th>More Better</th>
          <th>Follow-up</th>
        </tr>
        {rows_html}
      </table>
    </body>
    </html>
    """

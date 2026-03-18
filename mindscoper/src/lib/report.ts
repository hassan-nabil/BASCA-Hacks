import type { Session } from "@/lib/types";

// Clean text for text-based report
function cleanText(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, '').replace(/→/g, '->');
}

function generateTextReport(session: Session): string {
  const date = new Date(session.timestamp);
  const a = session.analysis;
  const wordCount = session.transcript.trim().split(/\s+/).length;

  const report = [
    "=".repeat(80),
    "MINDSCOPER CLINICAL SESSION REPORT",
    "=".repeat(80),
    "",
    `Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
    `Session: ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`,
    `Input: ${session.inputMethod === "recording" ? "Live Recording" : session.fileName || "Uploaded File"}`,
    `Transcript Length: ${wordCount.toLocaleString()} words (~${Math.round(wordCount / 150)} minutes)`,
    "",
    "=".repeat(80),
    "CLINICAL ASSESSMENT",
    "=".repeat(80),
    "",
    `Overall Status: ${a.status}`,
    `Wellness Score: ${a.wellnessScore}/10 (${a.wellnessScore >= 8 ? "Good" : a.wellnessScore >= 6 ? "Fair" : a.wellnessScore >= 4 ? "Moderate" : a.wellnessScore >= 2 ? "Concerning" : "Critical"})`,
    "",
    "Clinical Summary:",
    cleanText(a.summary),
    "",
    "Primary Pattern:",
    cleanText(a.primaryPattern),
    "",
    "Temporal Pattern:",
    cleanText(a.temporalPattern),
    "",
    // Possible Condition Hints
    ...(a.possibleConditionHints.length > 0 ? [
      "Possible Condition Indicators:",
      ...a.possibleConditionHints.map(hint => `• ${cleanText(hint)}`),
      ""
    ] : []),
    // Session Topics (long sessions)
    ...(a.sessionTopics && a.sessionTopics.length > 0 ? [
      "Topics Covered:",
      ...a.sessionTopics.map(topic => `• ${cleanText(topic)}`),
      ""
    ] : []),
    // Therapeutic Techniques (long sessions)
    ...(a.therapeuticTechniques && a.therapeuticTechniques.length > 0 ? [
      "Therapeutic Techniques Observed:",
      ...a.therapeuticTechniques.map(tech => `• ${cleanText(tech)}`),
      ""
    ] : []),
    // Risk Factors
    ...(a.riskFactors && a.riskFactors.length > 0 ? [
      "Risk Factors:",
      ...a.riskFactors.map(risk => `⚠️ ${cleanText(risk)}`),
      ""
    ] : []),
    // Protective Factors
    ...(a.protectiveFactors && a.protectiveFactors.length > 0 ? [
      "Protective Factors:",
      ...a.protectiveFactors.map(factor => `✅ ${cleanText(factor)}`),
      ""
    ] : []),
    // Patient Insight
    ...(a.patientInsight ? [
      "Patient Insight:",
      cleanText(a.patientInsight),
      ""
    ] : []),
    "=".repeat(80),
    "NARRATIVE FLOW",
    "=".repeat(80),
    "",
    ...a.storyFlow.map((step, i) => [
      `[${step.stage}] ${cleanText(step.description)}`,
      i < a.storyFlow.length - 1 ? "" : ""
    ]).flat(),
    "",
    "=".repeat(80),
    "IDENTIFIED ENTITIES & RELATIONSHIPS",
    "=".repeat(80),
    "",
    // Group entities by type
    ...["symptom", "behavior", "emotion", "event", "trigger", "outcome"].map(type => {
      const entities = a.entities.filter((e) => e.type === type);
      if (entities.length === 0) return [];
      return [
        `${type.charAt(0).toUpperCase() + type.slice(1)}s: ${entities.map((e) => cleanText(e.label)).join(", ")}`,
        ""
      ];
    }).flat(),
    "",
    "Key Relationships:",
    ...a.edges.slice(0, 15).map(edge => {
      const sourceEntity = a.entities.find((e) => e.id === edge.source);
      const targetEntity = a.entities.find((e) => e.id === edge.target);
      const sourceLabel = cleanText(sourceEntity?.label || edge.source);
      const edgeLabel = cleanText(edge.label);
      const targetLabel = cleanText(targetEntity?.label || edge.target);
      return `• ${sourceLabel} -> ${edgeLabel} -> ${targetLabel}`;
    }),
    "",
    "=".repeat(80),
    "RECOMMENDED FOLLOW-UP",
    "=".repeat(80),
    "",
    cleanText(a.suggestedFollowUp),
    "",
    "=".repeat(80),
    "TRANSCRIPT",
    "=".repeat(80),
    "",
    cleanText(session.transcript),
    "",
    "=".repeat(80),
    "END OF REPORT",
    "=".repeat(80),
    "",
    "CONFIDENTIAL — This document contains protected health information (PHI).",
    "Handle in accordance with HIPAA regulations.",
    "",
    "MindScoper Clinical Report — AI-Generated, For Professional Review Only"
  ];

  return report.join("\n");
}

// Synchronous wrapper for dashboard usage
export function generateSessionReportSync(session: Session): void {
  try {
    const reportText = generateTextReport(session);
    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MindScoper_Report_${new Date(session.timestamp).toISOString().slice(0, 10)}_${session.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to generate report:", error);
    alert("Failed to generate report. Please try again.");
  }
}

export function downloadTranscript(session: Session): void {
  try {
    const date = new Date(session.timestamp);
    const header = [
      "MindScoper — Session Transcript",
      "================================",
      `Date: ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`,
      `Input: ${session.inputMethod === "recording" ? "Live Recording" : `Uploaded (${session.fileName || "unknown"})`}`,
      `Words: ${session.transcript.trim().split(/\s+/).length.toLocaleString()}`,
      "",
      "--- TRANSCRIPT ---",
      "",
    ].join("\n");

    const content = header + session.transcript;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MindScoper_Transcript_${date.toISOString().slice(0, 10)}_${session.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to download transcript:", error);
    alert("Failed to download transcript. Please try again.");
  }
}

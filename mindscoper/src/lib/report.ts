import { jsPDF } from "jspdf";
import type { Session } from "@/lib/types";

const MARGIN = 20;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 6;

function addPageIfNeeded(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) {
    doc.addPage();
    return MARGIN;
  }
  return y;
}

function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  y = addPageIfNeeded(doc, y, 14);
  doc.setFillColor(59, 130, 246);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(title, MARGIN + 3, y + 5.5);
  doc.setTextColor(33, 33, 33);
  return y + 12;
}

function drawField(doc: jsPDF, label: string, value: string, y: number): number {
  y = addPageIfNeeded(doc, y, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(label, MARGIN, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(33, 33, 33);
  const lines = doc.splitTextToSize(value, CONTENT_WIDTH);
  y += LINE_HEIGHT;
  y = addPageIfNeeded(doc, y, lines.length * LINE_HEIGHT);
  doc.text(lines, MARGIN, y);
  y += lines.length * LINE_HEIGHT + 2;
  return y;
}

function drawTagList(doc: jsPDF, label: string, tags: string[], color: [number, number, number], y: number): number {
  y = addPageIfNeeded(doc, y, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(label, MARGIN, y);
  y += LINE_HEIGHT;

  let x = MARGIN;
  for (const tag of tags) {
    const tagWidth = doc.getTextWidth(tag) + 6;
    if (x + tagWidth > MARGIN + CONTENT_WIDTH) {
      x = MARGIN;
      y += 7;
      y = addPageIfNeeded(doc, y, 8);
    }
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y - 4, tagWidth, 6, 3, 3, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);
    doc.text(tag, x + 3, y);
    x += tagWidth + 3;
  }
  return y + 8;
}

export function generateSessionReport(session: Session): void {
  const doc = new jsPDF("p", "mm", "a4");
  const date = new Date(session.timestamp);
  const a = session.analysis;

  // --- Header ---
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, PAGE_WIDTH, 40, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("MindScoper", MARGIN, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Clinical Session Report", MARGIN, 24);

  doc.setFontSize(8);
  doc.setTextColor(180, 200, 220);
  doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, MARGIN, 32);
  doc.text(`Session: ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`, MARGIN + 90, 32);

  // --- Confidentiality Notice ---
  let y = 46;
  doc.setFillColor(254, 243, 199);
  doc.rect(MARGIN, y, CONTENT_WIDTH, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14);
  doc.text("CONFIDENTIAL — This document contains protected health information (PHI). Handle in accordance with HIPAA regulations.", MARGIN + 3, y + 5);
  y += 14;

  // --- Session Overview ---
  y = drawSectionHeader(doc, "SESSION OVERVIEW", y);
  y = drawField(doc, "Date & Time:", `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`, y);
  y = drawField(doc, "Input Method:", session.inputMethod === "recording" ? "Live Recording" : `Uploaded File${session.fileName ? ` (${session.fileName})` : ""}`, y);

  const wordCount = session.transcript.trim().split(/\s+/).length;
  y = drawField(doc, "Transcript Length:", `${wordCount.toLocaleString()} words (~${Math.round(wordCount / 150)} minutes)`, y);
  y += 2;

  // --- Clinical Assessment ---
  y = drawSectionHeader(doc, "CLINICAL ASSESSMENT", y);
  y = drawField(doc, "Overall Status:", a.status, y);
  y = drawField(doc, "Wellness Score:", `${a.wellnessScore}/10 (${a.wellnessScore >= 8 ? "Good" : a.wellnessScore >= 6 ? "Fair" : a.wellnessScore >= 4 ? "Moderate" : a.wellnessScore >= 2 ? "Concerning" : "Critical"})`, y);
  y = drawField(doc, "Clinical Summary:", a.summary, y);
  y = drawField(doc, "Primary Pattern:", a.primaryPattern, y);
  y = drawField(doc, "Temporal Pattern:", a.temporalPattern, y);
  y += 2;

  // --- Possible Indicators ---
  if (a.possibleConditionHints.length > 0) {
    y = drawTagList(doc, "Possible Condition Indicators:", a.possibleConditionHints, [219, 234, 254], y);
  }

  // --- Session Topics (long sessions) ---
  if (a.sessionTopics && a.sessionTopics.length > 0) {
    y = drawTagList(doc, "Topics Covered:", a.sessionTopics, [219, 234, 254], y);
  }

  // --- Therapeutic Techniques ---
  if (a.therapeuticTechniques && a.therapeuticTechniques.length > 0) {
    y = drawTagList(doc, "Therapeutic Techniques Observed:", a.therapeuticTechniques, [233, 213, 255], y);
  }

  // --- Risk Factors ---
  if (a.riskFactors && a.riskFactors.length > 0) {
    y = drawSectionHeader(doc, "RISK FACTORS", y);
    for (const risk of a.riskFactors) {
      y = addPageIfNeeded(doc, y, 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(185, 28, 28);
      doc.text(`• ${risk}`, MARGIN + 2, y);
      y += LINE_HEIGHT;
    }
    y += 2;
  }

  // --- Protective Factors ---
  if (a.protectiveFactors && a.protectiveFactors.length > 0) {
    y = drawSectionHeader(doc, "PROTECTIVE FACTORS", y);
    for (const factor of a.protectiveFactors) {
      y = addPageIfNeeded(doc, y, 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(21, 128, 61);
      doc.text(`• ${factor}`, MARGIN + 2, y);
      y += LINE_HEIGHT;
    }
    y += 2;
  }

  // --- Patient Insight ---
  if (a.patientInsight) {
    y = drawSectionHeader(doc, "PATIENT INSIGHT", y);
    y = drawField(doc, "", a.patientInsight, y);
  }

  // --- Narrative Flow ---
  if (a.storyFlow && a.storyFlow.length > 0) {
    y = drawSectionHeader(doc, "NARRATIVE FLOW", y);
    for (const step of a.storyFlow) {
      y = addPageIfNeeded(doc, y, 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(59, 130, 246);
      doc.text(`[${step.stage}]`, MARGIN + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(33, 33, 33);
      const descLines = doc.splitTextToSize(step.description, CONTENT_WIDTH - 30);
      doc.text(descLines, MARGIN + 30, y);
      y += Math.max(LINE_HEIGHT, descLines.length * LINE_HEIGHT) + 2;
    }
    y += 2;
  }

  // --- Knowledge Graph Entities ---
  y = drawSectionHeader(doc, "IDENTIFIED ENTITIES & RELATIONSHIPS", y);

  const entityTypes = ["symptom", "behavior", "emotion", "event", "trigger", "outcome"] as const;
  for (const type of entityTypes) {
    const entities = a.entities.filter((e) => e.type === type);
    if (entities.length === 0) continue;
    y = addPageIfNeeded(doc, y, 10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${type.charAt(0).toUpperCase() + type.slice(1)}s:`, MARGIN + 2, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(33, 33, 33);
    doc.text(entities.map((e) => e.label).join(", "), MARGIN + 28, y);
    y += LINE_HEIGHT + 1;
  }

  y += 4;
  y = addPageIfNeeded(doc, y, 16);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Key Relationships:", MARGIN + 2, y);
  y += LINE_HEIGHT;
  for (const edge of a.edges.slice(0, 15)) {
    y = addPageIfNeeded(doc, y, 7);
    const sourceEntity = a.entities.find((e) => e.id === edge.source);
    const targetEntity = a.entities.find((e) => e.id === edge.target);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(
      `${sourceEntity?.label || edge.source} → ${edge.label} → ${targetEntity?.label || edge.target}`,
      MARGIN + 4,
      y
    );
    y += LINE_HEIGHT;
  }

  // --- Suggested Follow-up ---
  y += 4;
  y = drawSectionHeader(doc, "RECOMMENDED FOLLOW-UP", y);
  y = drawField(doc, "", a.suggestedFollowUp, y);

  // --- Footer on every page ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.line(MARGIN, 287, MARGIN + CONTENT_WIDTH, 287);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("MindScoper Clinical Report — AI-Generated, For Professional Review Only", MARGIN, 292);
    doc.text(`Page ${i} of ${pageCount}`, MARGIN + CONTENT_WIDTH - 20, 292);
  }

  // Download
  const fileName = `MindScoper_Report_${date.toISOString().slice(0, 10)}_${session.id.slice(0, 8)}.pdf`;
  doc.save(fileName);
}

export function downloadTranscript(session: Session): void {
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
}

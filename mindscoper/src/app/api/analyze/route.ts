import { NextRequest, NextResponse } from "next/server";
import { getGeminiFlash } from "@/lib/gemini";
import { ANALYSIS_PROMPT } from "@/lib/prompts";
import type { AnalysisResult } from "@/lib/types";

function extractJSON(text: string): string {
  let clean = text.trim();

  // Strip markdown code fences
  if (clean.startsWith("```")) {
    clean = clean
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
  }

  // Try to find JSON object boundaries if there's extra text
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }

  return clean;
}

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "No transcript provided" },
        { status: 400 }
      );
    }

    const result = await getGeminiFlash().generateContent(
      ANALYSIS_PROMPT + transcript
    );

    const responseText = result.response.text();
    const cleanJson = extractJSON(responseText);

    let analysis: AnalysisResult;
    try {
      analysis = JSON.parse(cleanJson);
    } catch {
      console.error("JSON parse error. Raw response:", responseText);
      return NextResponse.json(
        { error: "Gemini returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    // Validate required fields with defaults for resilience
    if (!analysis.summary) analysis.summary = "Analysis completed.";
    if (!analysis.status) analysis.status = "Moderate concern";
    if (typeof analysis.wellnessScore !== "number") analysis.wellnessScore = 5;
    if (!analysis.primaryPattern) analysis.primaryPattern = "Not determined";
    if (!analysis.suggestedFollowUp) analysis.suggestedFollowUp = "Follow up with patient.";
    if (!Array.isArray(analysis.entities)) analysis.entities = [];
    if (!Array.isArray(analysis.edges)) analysis.edges = [];
    if (!Array.isArray(analysis.possibleConditionHints)) analysis.possibleConditionHints = [];
    if (!analysis.temporalPattern) analysis.temporalPattern = "Not determined";
    if (!Array.isArray(analysis.storyFlow)) analysis.storyFlow = [];

    // Ensure patient entity exists
    if (!analysis.entities.find((e) => e.id === "patient")) {
      analysis.entities.unshift({
        id: "patient",
        label: "Patient",
        type: "patient",
      });
    }

    // Clamp wellness score
    analysis.wellnessScore = Math.max(
      1,
      Math.min(10, Math.round(analysis.wellnessScore))
    );

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown analysis error";
    return NextResponse.json(
      { error: `Failed to analyze transcript: ${message}` },
      { status: 500 }
    );
  }
}

"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Mic, Upload } from "lucide-react";
import { getSession } from "@/lib/sessions";
import type { Session } from "@/lib/types";
import { TranscriptPanel } from "@/components/TranscriptPanel";
import { AISummaryPanel } from "@/components/AISummaryPanel";
import { WellnessScore } from "@/components/WellnessScore";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const session: Session | null = useMemo(() => getSession(id), [id]);

  if (!session) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Session not found</p>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Home
        </button>
      </div>
    );
  }

  const date = new Date(session.timestamp);

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Session Analysis
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {date.toLocaleDateString()} at {date.toLocaleTimeString()}
              </span>
              <span className="flex items-center gap-1">
                {session.inputMethod === "recording" ? (
                  <Mic className="h-3 w-3" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
                {session.inputMethod === "recording"
                  ? "Live Recording"
                  : session.fileName || "Uploaded File"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Panel Grid */}
      <div className="grid gap-4 lg:grid-cols-2 lg:grid-rows-2" style={{ minHeight: "calc(100vh - 180px)" }}>
        {/* Top Left: Wellness Score */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <WellnessScore score={session.analysis.wellnessScore} />
        </div>

        {/* Top Right: AI Summary */}
        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <AISummaryPanel analysis={session.analysis} />
        </div>

        {/* Bottom Left: Transcript */}
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <TranscriptPanel transcript={session.transcript} />
        </div>

        {/* Bottom Right: Knowledge Graph */}
        <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <KnowledgeGraph
            entities={session.analysis.entities}
            edges={session.analysis.edges}
          />
        </div>
      </div>
    </div>
  );
}

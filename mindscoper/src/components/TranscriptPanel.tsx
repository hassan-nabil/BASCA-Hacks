"use client";

import { FileText } from "lucide-react";

interface TranscriptPanelProps {
  transcript: string;
}

export function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  const wordCount = transcript.trim().split(/\s+/).length;
  const estimatedMinutes = Math.round(wordCount / 150);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-card-foreground">
            Transcript
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {wordCount.toLocaleString()} words · ~{estimatedMinutes} min
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">
          {transcript}
        </div>
      </div>
    </div>
  );
}

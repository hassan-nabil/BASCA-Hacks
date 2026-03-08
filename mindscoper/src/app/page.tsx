"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Brain,
  Mic,
  Upload,
  ArrowRight,
  Activity,
  Network,
  FileText,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AudioRecorder } from "@/components/AudioRecorder";
import { FileUploader } from "@/components/FileUploader";
import type { AnalysisResult } from "@/lib/types";
import { saveSession } from "@/lib/sessions";

type InputMode = "select" | "record" | "upload";
type ProcessingStage =
  | "idle"
  | "transcribing"
  | "analyzing"
  | "complete";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("select");
  const [stage, setStage] = useState<ProcessingStage>("idle");

  const processAudio = useCallback(
    async (audioData: Blob | File, inputMethod: "recording" | "upload", fileName?: string) => {
      try {
        // Client-side file size check (25MB Whisper limit)
        if (audioData.size > 25 * 1024 * 1024) {
          toast.error(`File too large (${(audioData.size / 1024 / 1024).toFixed(1)}MB). Maximum is 25MB.`);
          return;
        }

        setStage("transcribing");
        toast.info("Transcribing audio with Whisper AI...");

        const formData = new FormData();
        formData.append("audio", audioData);

        const transcribeRes = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!transcribeRes.ok) {
          const err = await transcribeRes.json();
          throw new Error(err.error || "Transcription failed");
        }

        const { transcript } = await transcribeRes.json();

        setStage("analyzing");
        toast.info("Analyzing transcript with Gemini AI...");

        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });

        if (!analyzeRes.ok) {
          const err = await analyzeRes.json();
          throw new Error(err.error || "Analysis failed");
        }

        const { analysis }: { analysis: AnalysisResult } =
          await analyzeRes.json();

        const session = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          transcript,
          analysis,
          inputMethod,
          fileName,
        };

        saveSession(session);
        setStage("complete");
        toast.success("Analysis complete!");

        router.push(`/dashboard/${session.id}`);
      } catch (error) {
        console.error("Processing error:", error);
        toast.error(
          error instanceof Error ? error.message : "Processing failed"
        );
        setStage("idle");
      }
    },
    [router]
  );

  const handleRecordingComplete = useCallback(
    (blob: Blob) => {
      processAudio(blob, "recording");
    },
    [processAudio]
  );

  const handleFileSelected = useCallback(
    (file: File) => {
      processAudio(file, "upload", file.name);
    },
    [processAudio]
  );

  const isProcessing = stage !== "idle";

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="animate-fade-in-up">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent-dark">
            <Sparkles className="h-4 w-4" />
            Powered by Google Gemini AI
          </div>
          <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight text-foreground">
            Turn therapy conversations into{" "}
            <span className="text-accent">visual mental health maps</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Record or upload therapy sessions. MindScoper uses Gemini AI to
            transcribe, analyze, and visualize mental health patterns in
            real-time.
          </p>
        </div>

        {/* Feature pills */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: FileText, label: "Transcription" },
            { icon: Sparkles, label: "AI Analysis" },
            { icon: Network, label: "Knowledge Graph" },
            { icon: Activity, label: "Wellness Score" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-card-foreground shadow-sm"
            >
              <Icon className="h-3.5 w-3.5 text-accent" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* Processing status */}
      {isProcessing && (
        <div className="mx-auto mb-6 flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 px-6 py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <div>
            <p className="text-sm font-semibold text-accent-dark">
              {stage === "transcribing"
                ? "Transcribing audio..."
                : stage === "analyzing"
                  ? "Analyzing with Gemini AI..."
                  : "Finalizing..."}
            </p>
            <p className="text-xs text-muted-foreground">
              This may take a moment depending on the audio length
            </p>
          </div>
        </div>
      )}

      {/* Input Section */}
      <section className="mx-auto w-full max-w-3xl px-6 pb-20">
        {mode === "select" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => setMode("record")}
              disabled={isProcessing}
              className="group flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-accent/50 hover:shadow-md disabled:opacity-50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 transition-colors group-hover:bg-accent/20">
                <Mic className="h-8 w-8 text-accent" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-card-foreground">
                  Record Session
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Record a live therapy session using your microphone
                </p>
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-accent">
                Get started <ArrowRight className="h-4 w-4" />
              </span>
            </button>

            <button
              onClick={() => setMode("upload")}
              disabled={isProcessing}
              className="group flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-accent/50 hover:shadow-md disabled:opacity-50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 transition-colors group-hover:bg-accent/20">
                <Upload className="h-8 w-8 text-accent" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-card-foreground">
                  Upload Recording
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a Zoom, phone, or other therapy recording
                </p>
              </div>
              <span className="flex items-center gap-1 text-sm font-medium text-accent">
                Choose file <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={() => {
                if (!isProcessing) setMode("select");
              }}
              disabled={isProcessing}
              className="mb-4 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              &larr; Back to options
            </button>

            {mode === "record" ? (
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                isProcessing={isProcessing}
              />
            ) : (
              <FileUploader
                onFileSelected={handleFileSelected}
                isProcessing={isProcessing}
              />
            )}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-card/50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">
            How MindScoper Works
          </h2>
          <div className="grid gap-6 sm:grid-cols-5">
            {[
              {
                icon: Mic,
                title: "Input",
                desc: "Record or upload a therapy session",
              },
              {
                icon: FileText,
                title: "Transcribe",
                desc: "Gemini AI transcribes the audio",
              },
              {
                icon: Brain,
                title: "Analyze",
                desc: "AI extracts entities & patterns",
              },
              {
                icon: Network,
                title: "Visualize",
                desc: "Knowledge graph generated",
              },
              {
                icon: Activity,
                title: "Score",
                desc: "Patient wellness score computed",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="flex flex-col items-center text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <Icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-card-foreground">
                  {title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                {i < 4 && (
                  <ArrowRight className="mt-3 hidden h-4 w-4 text-muted-foreground sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

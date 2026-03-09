"use client";

import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { AnalysisResult } from "@/lib/types";

interface AISummaryPanelProps {
  analysis: AnalysisResult;
}

const statusConfig = {
  "Low concern": {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
  },
  "Moderate concern": {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
  },
  "High concern": {
    icon: AlertCircle,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  Critical: {
    icon: ShieldAlert,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

export function AISummaryPanel({ analysis }: AISummaryPanelProps) {
  const config = statusConfig[analysis.status] || statusConfig["Moderate concern"];
  const StatusIcon = config.icon;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Sparkles className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-card-foreground">
          AI Findings
        </h3>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {/* Status Badge */}
        <div
          className={`flex items-center gap-2 rounded-lg border ${config.border} ${config.bg} px-3 py-2`}
        >
          <StatusIcon className={`h-4 w-4 ${config.color}`} />
          <span className={`text-sm font-semibold ${config.color}`}>
            {analysis.status}
          </span>
        </div>

        {/* Summary */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Summary
          </p>
          <p className="mt-1 text-sm leading-relaxed text-card-foreground">
            {analysis.summary}
          </p>
        </div>

        {/* Primary Pattern */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Primary Pattern
          </p>
          <p className="mt-1 text-sm font-medium text-card-foreground">
            {analysis.primaryPattern}
          </p>
        </div>

        {/* Temporal Pattern */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Temporal Pattern
          </p>
          <p className="mt-1 text-sm text-card-foreground">
            {analysis.temporalPattern}
          </p>
        </div>

        {/* Condition Hints */}
        {analysis.possibleConditionHints.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Possible Indicators
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {analysis.possibleConditionHints.map((hint) => (
                <span
                  key={hint}
                  className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent-dark"
                >
                  {hint}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Story Flow */}
        {analysis.storyFlow && analysis.storyFlow.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Narrative Flow
            </p>
            <div className="mt-2 space-y-1.5">
              {analysis.storyFlow.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex items-center gap-1">
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded bg-accent/10 px-1 text-[10px] font-bold text-accent-dark">
                      {step.stage}
                    </span>
                    {i < analysis.storyFlow.length - 1 && (
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-xs text-card-foreground">
                    {step.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session Topics (long sessions) */}
        {analysis.sessionTopics && analysis.sessionTopics.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Topics Covered
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {analysis.sessionTopics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Therapeutic Techniques (long sessions) */}
        {analysis.therapeuticTechniques && analysis.therapeuticTechniques.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Techniques Observed
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {analysis.therapeuticTechniques.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Risk & Protective Factors (long sessions) */}
        {analysis.riskFactors && analysis.riskFactors.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Risk Factors
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {analysis.riskFactors.map((risk) => (
                <span
                  key={risk}
                  className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
                >
                  {risk}
                </span>
              ))}
            </div>
          </div>
        )}

        {analysis.protectiveFactors && analysis.protectiveFactors.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Protective Factors
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {analysis.protectiveFactors.map((factor) => (
                <span
                  key={factor}
                  className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700"
                >
                  {factor}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Patient Insight (long sessions) */}
        {analysis.patientInsight && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Patient Insight
            </p>
            <p className="mt-1 text-sm text-card-foreground">
              {analysis.patientInsight}
            </p>
          </div>
        )}

        {/* Suggested Follow-up */}
        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-accent-dark">
            Suggested Follow-up
          </p>
          <p className="mt-1 text-sm text-card-foreground">
            {analysis.suggestedFollowUp}
          </p>
        </div>
      </div>
    </div>
  );
}

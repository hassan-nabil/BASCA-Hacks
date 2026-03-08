"use client";

import { Heart } from "lucide-react";

interface WellnessScoreProps {
  score: number;
}

function getScoreColor(score: number): {
  stroke: string;
  text: string;
  bg: string;
  label: string;
} {
  if (score >= 8)
    return {
      stroke: "#10b981",
      text: "text-green-600",
      bg: "bg-green-50",
      label: "Good",
    };
  if (score >= 6)
    return {
      stroke: "#22c55e",
      text: "text-green-500",
      bg: "bg-green-50",
      label: "Fair",
    };
  if (score >= 4)
    return {
      stroke: "#f59e0b",
      text: "text-yellow-600",
      bg: "bg-yellow-50",
      label: "Moderate",
    };
  if (score >= 2)
    return {
      stroke: "#f97316",
      text: "text-orange-600",
      bg: "bg-orange-50",
      label: "Concerning",
    };
  return {
    stroke: "#ef4444",
    text: "text-red-600",
    bg: "bg-red-50",
    label: "Critical",
  };
}

export function WellnessScore({ score }: WellnessScoreProps) {
  const config = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const progress = (score / 10) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Heart className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-card-foreground">
          Wellness Score
        </h3>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-5">
        <div className="relative h-36 w-36">
          <svg
            className="h-full w-full -rotate-90"
            viewBox="0 0 120 120"
          >
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={config.stroke}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${config.text}`}>
              {score}
            </span>
            <span className="text-xs text-muted-foreground">/10</span>
          </div>
        </div>

        <div
          className={`rounded-full ${config.bg} px-3 py-1`}
        >
          <span className={`text-sm font-semibold ${config.text}`}>
            {config.label}
          </span>
        </div>

        {/* Score bar */}
        <div className="w-full max-w-[200px]">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Critical</span>
            <span>Good</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{
                width: `${(score / 10) * 100}%`,
                background: `linear-gradient(to right, #ef4444, #f59e0b, #10b981)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

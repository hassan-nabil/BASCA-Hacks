"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Network, Box, Grid2x2 } from "lucide-react";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import type { Entity, Edge } from "@/lib/types";

const KnowledgeGraph3D = dynamic(
  () =>
    import("@/components/KnowledgeGraph3D").then((mod) => mod.KnowledgeGraph3D),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-muted-foreground">Loading 3D graph...</div> }
);

const typeColors: Record<string, string> = {
  patient: "#0d9488",
  symptom: "#ef4444",
  behavior: "#f59e0b",
  emotion: "#8b5cf6",
  event: "#3b82f6",
  trigger: "#f97316",
  outcome: "#6366f1",
};

interface KnowledgeGraphWrapperProps {
  entities: Entity[];
  edges: Edge[];
}

export function KnowledgeGraphWrapper({ entities, edges }: KnowledgeGraphWrapperProps) {
  const [view, setView] = useState<"2d" | "3d">("3d");

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-card-foreground">
            Knowledge Relation Map
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden flex-wrap gap-2 md:flex">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[10px] capitalize text-muted-foreground">
                  {type}
                </span>
              </div>
            ))}
          </div>

          {/* 2D/3D Toggle */}
          <div className="flex rounded-lg border border-border bg-muted p-0.5">
            <button
              onClick={() => setView("2d")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                view === "2d"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid2x2 className="h-3 w-3" />
              2D
            </button>
            <button
              onClick={() => setView("3d")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                view === "3d"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Box className="h-3 w-3" />
              3D
            </button>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-[300px] overflow-hidden">
        {view === "2d" ? (
          <KnowledgeGraph entities={entities} edges={edges} />
        ) : (
          <KnowledgeGraph3D entities={entities} edges={edges} />
        )}
      </div>
    </div>
  );
}

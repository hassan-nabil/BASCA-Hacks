"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  Mic,
  Upload,
  Trash2,
  ArrowRight,
  Plus,
} from "lucide-react";
import { getSessions, deleteSession } from "@/lib/sessions";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  "Low concern": "bg-green-100 text-green-700",
  "Moderate concern": "bg-yellow-100 text-yellow-700",
  "High concern": "bg-orange-100 text-orange-700",
  Critical: "bg-red-100 text-red-700",
};

export default function SessionsPage() {
  const router = useRouter();
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const sessions = getSessions();

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteSession(id);
    forceUpdate();
    toast.success("Session deleted");
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Past Sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""} saved
            locally
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
        >
          <Plus className="h-4 w-4" />
          New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20">
          <History className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            No sessions yet
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Record or upload a therapy session to get started
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 flex items-center gap-1 text-sm font-medium text-accent hover:text-accent-dark"
          >
            Go to home <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const date = new Date(session.timestamp);
            return (
              <div
                key={session.id}
                onClick={() => router.push(`/dashboard/${session.id}`)}
                className="group flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-accent/30 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    {session.inputMethod === "recording" ? (
                      <Mic className="h-5 w-5 text-accent" />
                    ) : (
                      <Upload className="h-5 w-5 text-accent" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-card-foreground">
                        {session.inputMethod === "recording"
                          ? "Live Recording"
                          : session.fileName || "Uploaded File"}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          statusColors[session.analysis.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {session.analysis.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {date.toLocaleDateString()} at{" "}
                      {date.toLocaleTimeString()} — Wellness:{" "}
                      {session.analysis.wellnessScore}/10
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(session.id, e)}
                    className="rounded-lg p-2 text-muted-foreground opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

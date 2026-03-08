"use client";

import Link from "next/link";
import { Brain, Home, History } from "lucide-react";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-white/80 px-6 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2">
        <Brain className="h-7 w-7 text-accent" />
        <span className="text-xl font-bold tracking-tight text-foreground">
          MindScoper
        </span>
      </Link>

      <div className="flex items-center gap-1">
        <Link
          href="/"
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === "/"
              ? "bg-accent/10 text-accent-dark"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <Link
          href="/sessions"
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            pathname === "/sessions"
              ? "bg-accent/10 text-accent-dark"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <History className="h-4 w-4" />
          Sessions
        </Link>
      </div>
    </nav>
  );
}

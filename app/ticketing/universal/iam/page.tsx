"use client";

import { useEffect, useState } from "react";
import { DynamicForm } from "@/components/ticketing/forms/DynamicForm";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Moon, Sun } from "lucide-react";

// NOTE: Metadata cannot be exported directly from a "use client" file.
// If you need SEO metadata for this route, see the note below the code block!

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefers =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefers);
    document.documentElement.classList.toggle("dark", prefers);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <Button variant="outline" size="icon" onClick={toggle} aria-label="Toggle theme">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

export default function IndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              IT Service Portal
            </p>
            <h1 className="text-lg font-semibold">New request</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">
            Tell us what you need
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a request type. The form will adapt based on your answers.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <DynamicForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Form fields and types are defined in{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
            src/lib/form-config.ts
          </code>
        </p>
      </main>

      <Toaster />
    </div>
  );
}
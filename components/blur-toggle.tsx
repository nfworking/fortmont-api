"use client";

import { useBlur } from "@/components/blur-provider";
import { Eye, EyeOff } from "lucide-react";

export function BlurToggleButton() {
  const { isBlurred, toggleBlur } = useBlur();

  return (
    <button
      onClick={toggleBlur}
      aria-label={isBlurred ? "Unblur content" : "Blur content"}
      aria-pressed={isBlurred}
      className="
        relative inline-flex h-9 w-9 items-center justify-center
        rounded-md border border-input bg-transparent 
        text-foreground/80
        transition-colors 
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      "
    >
      <Eye
        className={`
          absolute h-[18px] w-[18px]
          transition-all duration-300 ease-in-out
          ${isBlurred ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}
        `}
      />
      <EyeOff
        className={`
          absolute h-[18px] w-[18px]
          transition-all duration-300 ease-in-out
          ${isBlurred ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}
        `}
      />
      <span className="sr-only">{isBlurred ? "Unblur content" : "Blur content"}</span>
    </button>
  );
}
// components/storage/video-player-dialog.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { Play, Download, X, Volume2, Maximize2 } from "lucide-react";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { formatBytes } from "@/lib/storage";
import type { StorageFile } from "@/lib/storage";

export function VideoPlayerDialog({ file }: { file: StorageFile }) {
  const [open, setOpen] = useState(false);
  const { url, loading } = useSignedUrl(file.id, open);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      // Pause video when closed
      videoRef.current?.pause();
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      {/* Play button overlay on the card */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="absolute inset-0 flex items-center justify-center
                   bg-black/50 opacity-0 group-hover:opacity-100
                   transition-opacity duration-200 rounded-md"
        aria-label={`Play ${file.name}`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-lg">
          <Play className="h-5 w-5 fill-black text-black translate-x-0.5" />
        </div>
      </button>

      {/* Portal-style backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={() => setOpen(false)}
        >
          {/* Dialog panel */}
          <div
            className="relative w-full max-w-3xl"
            style={{
              background: "#0a0a0a",
              borderRadius: "16px",
              border: "0.5px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
              animation: "vp-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full transition-colors"
              style={{ background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.7)" }}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Video */}
            <div className="relative w-full" style={{ background: "#000", aspectRatio: "16/9" }}>
              {loading || !url ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white/80"
                        style={{ animation: "spin 0.7s linear infinite" }}
                      />
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Loading…
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Failed to load video
                    </p>
                  )}
                </div>
              ) : (
                <video
                  ref={videoRef}
                  src={url}
                  controls
                  autoPlay
                  className="h-full w-full"
                  style={{ display: "block" }}
                />
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between gap-3 px-4 py-3"
              style={{ borderTop: "0.5px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                >
                  <Play className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
                </div>
                <div className="min-w-0">
                  <p
                    className="truncate text-sm font-medium"
                    style={{ color: "#fff" }}
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {formatBytes(file.size)} · MP4
                  </p>
                </div>
              </div>
              {url && (
                <a
                  href={url}
                  download={file.name}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors"
                  style={{
                    border: "0.5px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
    );
}
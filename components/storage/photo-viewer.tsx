// components/storage/photo-viewer-dialog.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import { X, Download, ZoomIn, ZoomOut } from "lucide-react";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { formatBytes, getFileExtension } from "@/lib/storage";
import type { StorageFile } from "@/lib/storage";

export function PhotoViewerDialog({ file }: { file: StorageFile }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false); // controls CSS animation class
  const [zoomed, setZoomed] = useState(false);
  const { url, loading } = useSignedUrl(file.id, open);

  const openDialog = () => {
    setOpen(true);
    // tiny delay so the element is mounted before we trigger the animation
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  };

  const closeDialog = () => {
    setVisible(false); // triggers exit animation
    // unmount after animation completes
    setTimeout(() => {
      setOpen(false);
      setZoomed(false);
    }, 200);
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && closeDialog();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const ext = getFileExtension(file.name).toUpperCase();

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); openDialog(); }}
        className="absolute inset-0 flex items-center justify-center
                   bg-black/40 opacity-0 group-hover:opacity-100
                   transition-opacity duration-200 rounded-md"
        aria-label={`View ${file.name}`}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-lg">
          <ZoomIn className="h-5 w-5 text-black" />
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          style={{
            background: "rgba(0,0,0,0.9)",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
          onClick={closeDialog}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "56rem",
              background: "#0a0a0a",
              borderRadius: "16px",
              border: "0.5px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
              transform: visible ? "scale(1) translateY(0)" : "scale(0.94) translateY(12px)",
              opacity: visible ? 1 : 0,
              transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}
            >
              <p
                className="truncate text-sm font-medium"
                style={{ color: "rgba(255,255,255,0.8)" }}
                title={file.name}
              >
                {file.name}
              </p>
              <div className="flex shrink-0 items-center gap-1 pl-4">
                <button
                  onClick={() => setZoomed((z) => !z)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  aria-label={zoomed ? "Zoom out" : "Zoom in"}
                >
                  {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                </button>
                <button
                  onClick={closeDialog}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Image area */}
            <div
              className="relative flex items-center justify-center"
              style={{
                background: "#000",
                minHeight: "320px",
                maxHeight: "70vh",
                overflow: zoomed ? "auto" : "hidden",
                cursor: zoomed ? "zoom-out" : "zoom-in",
              }}
              onClick={() => setZoomed((z) => !z)}
            >
              {loading || !url ? (
                <div className="flex flex-col items-center gap-3 py-20">
                  {loading ? (
                    <>
                      <div
                        className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white/80"
                        style={{ animation: "spin 0.7s linear infinite" }}
                      />
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Loading…
                      </span>
                    </>
                  ) : (
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Failed to load image
                    </p>
                  )}
                </div>
              ) : (
                <img
                  src={url}
                  alt={file.name}
                  style={{
                    display: "block",
                    maxHeight: zoomed ? "none" : "70vh",
                    width: zoomed ? "auto" : "100%",
                    objectFit: zoomed ? "none" : "contain",
                    transition: "transform 0.2s ease",
                  }}
                  draggable={false}
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
                  <ZoomIn className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.5)" }} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" style={{ color: "#fff" }} title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {formatBytes(file.size)} · {ext}
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
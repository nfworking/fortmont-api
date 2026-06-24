// hooks/use-signed-url.ts
"use client";
import { useState, useEffect } from "react";

export function useSignedUrl(fileId: string, enabled = true) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    setLoading(true);
    fetch(`/api/storage/download?fileId=${encodeURIComponent(fileId)}`)
      .then((r) => r.json())
      .then((d) => setUrl(d.downloadUrl ?? d.url ?? null))
      .finally(() => setLoading(false));
  }, [fileId, enabled]);

  return { url, loading };
}
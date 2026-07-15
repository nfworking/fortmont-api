// components/session-guard.tsx
"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

// Safety net only — SSE handles the real-time path. This just covers
// SSE reconnect gaps or proxies that silently kill idle connections.
const FALLBACK_CHECK_INTERVAL = 60_000;

export function SessionGuard() {
  const { data: session, status } = useSession();
  const sessionId = (session?.user as { sessionId?: string } | undefined)?.sessionId;

  useEffect(() => {
    console.log("[SessionGuard] status:", status, "sessionId:", sessionId, "user:", session?.user);
  }, [status, sessionId, session]);

  useEffect(() => {
    if (status !== "authenticated" || !sessionId) return;

    let cancelled = false;

    const verifyNow = async () => {
      try {
        const res = await fetch("/api/auth/verify-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await res.json().catch(() => ({ active: false }));
        if (!cancelled && (!res.ok || !data.active)) {
          signOut({ redirectTo: "/login" });
        }
      } catch {
        // Transient network error — don't sign the user out on a hiccup.
      }
    };

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const connect = () => {
      if (cancelled) return;
      eventSource = new EventSource("/api/auth/session-stream");

      eventSource.onopen = () => {
        attempt = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.status === "connected") return;
          if (payload?.type === "revoked") verifyNow();
        } catch {
          // ignore malformed payloads
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        if (cancelled) return;
        attempt += 1;
        reconnectTimer = setTimeout(connect, Math.min(1000 * 2 ** (attempt - 1), 15000));
      };
    };

    connect();
    const fallbackInterval = setInterval(verifyNow, FALLBACK_CHECK_INTERVAL);

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
      clearInterval(fallbackInterval);
    };
  }, [status, sessionId]);

  return null;
}
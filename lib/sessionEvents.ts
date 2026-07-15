// lib/sessionEvents.ts
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://172.20.0.25:6379";
let publisher: ReturnType<typeof createClient> | null = null;

async function getPublisher() {
  if (!publisher) {
    publisher = createClient({ url: redisUrl });
    publisher.on("error", (err) =>
      console.error("[sessionEvents] Redis publisher error:", err)
    );
    await publisher.connect();
  }
  return publisher;
}

export function sessionEventsChannel(userId: string) {
  return `session-events:${userId}`;
}

/**
 * Fire-and-forget nudge telling any connected client for this user to
 * re-verify their session against the DB. We intentionally don't put
 * "which session was revoked" in the payload — the client always
 * re-checks against /api/auth/verify-session as the source of truth,
 * so this is just a wake-up signal.
 */
export async function publishSessionRevoked(userId: string) {
  try {
    const client = await getPublisher();
    await client.publish(
      sessionEventsChannel(userId),
      JSON.stringify({ type: "revoked", at: Date.now() })
    );
  } catch (err) {
    console.error("[sessionEvents] Failed to publish revocation:", err);
  }
}
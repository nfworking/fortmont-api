// app/api/auth/session-stream/route.ts
import { NextRequest } from "next/server";
import { createClient } from "redis";
import { auth } from "@/lib/auth";
import { sessionEventsChannel } from "@/lib/sessionEvents";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const channel = sessionEventsChannel(session.user.id);
  const redisUrl = process.env.REDIS_URL || "redis://172.20.0.25:6379";

  const subscriber = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000,
      reconnectStrategy: (retries) =>
        retries > 3 ? new Error("Redis reconnect attempts exhausted") : Math.min(retries * 200, 1000),
    },
  });

  let isClosed = false;
  let cleanedUp = false;

  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    isClosed = true;
    try {
      if (subscriber.isOpen) await subscriber.unsubscribe(channel);
    } catch {}
    try {
      if (subscriber.isOpen) await subscriber.quit();
    } catch {}
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (data: string) => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {}
        }
      };
      const closeController = () => {
        try {
          controller.close();
        } catch {}
      };

      subscriber.on("error", (err) => {
        if (!isClosed) console.error("Redis session-stream error:", err);
      });

      req.signal.addEventListener("abort", async () => {
        await cleanup();
        closeController();
      });

      try {
        await subscriber.connect();
        emit("retry: 10000\n");
        emit('data: {"status":"connected"}\n\n');
        await subscriber.subscribe(channel, (message) => {
          emit(`data: ${message}\n\n`);
        });
      } catch (err) {
        console.error("Redis session-stream connection error:", err);
        await cleanup();
        try {
          controller.error(err);
        } catch {}
      }
    },
    cancel() {
      void cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
import { NextRequest } from "next/server";
import { createClient } from "redis";

// Force the route to bypass build-time static generation pings
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params;
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  // Bound how long we'll wait for Redis before giving up, so a stalled
  // connection attempt can't hang around indefinitely consuming a slot.
  const subscriber = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000,
      // Reconnect the underlying socket itself a few times before
      // surfacing an error, instead of failing on the first blip.
      reconnectStrategy: (retries) => {
        if (retries > 3) return new Error("Redis reconnect attempts exhausted");
        return Math.min(retries * 200, 1000);
      },
    },
  });

  // Guard flag to prevent stream interactions during/after teardown
  let isClosed = false;
  const channel = `ticket:${ticketId}:comments`;

  // Centralized teardown so every exit path (abort, subscribe failure,
  // connect failure, redis error) releases the same resources exactly
  // once. Without this, a failed connect()/subscribe() left the client
  // and its abort listener alive indefinitely, and repeated reconnects
  // (browser retry, polling, client-side backoff) would each leak
  // another half-open Redis connection until Redis started timing out
  // new connection attempts.
  let cleanedUp = false;
  const cleanup = async () => {
    if (cleanedUp) return;
    cleanedUp = true;
    isClosed = true;

    try {
      if (subscriber.isOpen) {
        await subscriber.unsubscribe(channel);
      }
    } catch {
      // Suppress errors during intentional teardown
    }

    try {
      if (subscriber.isOpen) {
        await subscriber.quit();
      }
    } catch {
      // Suppress errors during intentional teardown
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      // Helper to cleanly send structured text chunks to the client
      const emit = (data: string) => {
        if (!isClosed) {
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            // Stream might have already closed mid-transit
          }
        }
      };

      const closeController = () => {
        try {
          controller.close();
        } catch {
          // Already closed by the runtime; safe to ignore
        }
      };

      // Handle any client-side Redis connection errors gracefully.
      // Registered once, before connect(), so it stays attached to the
      // single client instance for this request's whole lifetime.
      subscriber.on("error", (err) => {
        if (!isClosed) {
          console.error("Redis client stream error:", err);
        }
      });

      // Tear down on abort (sheet closed, tab closed, refresh, or our
      // own teardown after a failed connect/subscribe below).
      req.signal.addEventListener("abort", async () => {
        await cleanup();
        closeController();
      });

      try {
        await subscriber.connect();

        // THE HANDSHAKE: Send an immediate confirmation to keep the line alive
        emit("retry: 10000\n"); // Tells browser to wait 10s before retrying if dropped
        emit('data: {"status":"connected"}\n\n');

        // Subscribe to your Redis channel
        await subscriber.subscribe(channel, (message) => {
          emit(`data: ${message}\n\n`); // Must have double newline trailing format
        });
      } catch (err) {
        console.error("Redis connection stream error:", err);
        // Connect/subscribe failed — release the client immediately
        // instead of leaving it dangling for the abort listener (which
        // may never fire if the browser doesn't get a response to
        // abort from). Then signal the error to the client and close.
        await cleanup();
        try {
          controller.error(err);
        } catch {
          // Controller may already be closed/errored
        }
      }
    },

    cancel() {
      // Fires if the consumer cancels the stream directly (e.g. browser
      // tears down the response without an abort event reaching us).
      void cleanup();
    },
  });

  // Return the explicit web stream with anti-buffering optimization flags
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Mandatory: Prevents NGINX/Proxies from buffering the line
    },
  });
}
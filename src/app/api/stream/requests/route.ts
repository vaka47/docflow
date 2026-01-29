import { prisma } from "@/lib/prisma";

export async function GET() {
  const encoder = new TextEncoder();
  let interval: NodeJS.Timeout | null = null;
  const stream = new ReadableStream({
    async start(controller) {
      let active = true;

      async function send() {
        if (!active) return;
        try {
          const count = await prisma.request.count();
          const payload = JSON.stringify({ count, ts: Date.now() });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          active = false;
          if (interval) clearInterval(interval);
        }
      }

      interval = setInterval(send, 5000);
      await send();

      return () => {
        active = false;
        if (interval) clearInterval(interval);
      };
    },
    cancel() {
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

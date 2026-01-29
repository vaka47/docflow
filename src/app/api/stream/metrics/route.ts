export async function GET() {
  const encoder = new TextEncoder();
  let interval: NodeJS.Timeout | null = null;
  const stream = new ReadableStream({
    async start(controller) {
      let active = true;

      function send() {
        if (!active) return;
        try {
          const payload = JSON.stringify({ ts: Date.now() });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          active = false;
          if (interval) clearInterval(interval);
        }
      }

      interval = setInterval(send, 8000);
      send();

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

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "MANAGER", "EDITOR", "LEGAL", "CROWD", "REQUESTER"]);
  if (!auth.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { message } = body;
  const webhook = process.env.CHAT_WEBHOOK_URL;

  if (!webhook) {
    return NextResponse.json({ ok: true, skipped: true, message: "Chat webhook not configured" });
  }

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message ?? "" }),
  });

  return NextResponse.json({ ok: true });
}

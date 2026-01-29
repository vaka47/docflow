import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";

export async function POST(request: Request) {
  const forbidden = await guard(["ADMIN", "MANAGER"]);
  if (forbidden) return forbidden;
  const expectedSecret = process.env.INTEGRATIONS_WEBHOOK_SECRET;
  if (expectedSecret) {
    const provided =
      request.headers.get("x-docflow-secret") ||
      new URL(request.url).searchParams.get("secret");
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }
  }
  const body = await request.json();
  const { title, description, audience, type, slaDays, ownerId, team } = body;
  const owner =
    (ownerId && (await prisma.user.findUnique({ where: { id: ownerId } }))) ||
    (team && (await prisma.user.findFirst({ where: { team } }))) ||
    (await prisma.user.findFirst({ where: { role: "MANAGER" } })) ||
    (await prisma.user.findFirst());
  if (!owner) {
    return NextResponse.json({ error: "No users available" }, { status: 400 });
  }
  const created = await prisma.request.create({
    data: {
      title: title || "Tracker: новая задача",
      description: description || "Автосоздано из Tracker",
      audience: audience || "Пользователи сервиса",
      type: type || "OTHER",
      slaDays: Number(slaDays || 7),
      ownerId: owner.id,
    },
  });
  await prisma.integrationLog.create({
    data: {
      requestId: created.id,
      system: "Tracker",
      status: "created",
      payload: JSON.stringify({ source: "tracker", ts: new Date().toISOString() }),
    },
  });
  return NextResponse.json({ createdRequestId: created.id });
}

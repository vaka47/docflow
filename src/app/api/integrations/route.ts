import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";

export async function GET() {
  const forbidden = await guard(["ADMIN", "MANAGER"]);
  if (forbidden) return forbidden;
  const logs = await prisma.integrationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(logs);
}

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
  const { requestId, system, status, payload, title, description, audience, type, slaDays, ownerId, team } = body;
  if (!system) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  let resolvedRequestId = requestId as string | undefined;
  let createdRequestId: string | null = null;
  if (!resolvedRequestId) {
    const owner =
      (ownerId && (await prisma.user.findUnique({ where: { id: ownerId } }))) ||
      (team && (await prisma.user.findFirst({ where: { team } }))) ||
      (await prisma.user.findFirst({ where: { role: "MANAGER" } })) ||
      (await prisma.user.findFirst());
    if (!owner) {
      return NextResponse.json({ error: "No users available" }, { status: 400 });
    }
    const fallbackTitle =
      title || payload?.title || `Webhook: ${system}`;
    const fallbackDescription =
      description || payload?.description || "Автосоздано из интеграции";
    const created = await prisma.request.create({
      data: {
        title: fallbackTitle,
        description: fallbackDescription,
        audience: audience || payload?.audience || "Пользователи сервиса",
        type: type || payload?.type || "OTHER",
        slaDays: Number(slaDays || payload?.slaDays || 7),
        ownerId: owner.id,
      },
    });
    resolvedRequestId = created.id;
    createdRequestId = created.id;
  }
  const created = await prisma.integrationLog.create({
    data: {
      requestId: resolvedRequestId,
      system,
      status: status ?? "ok",
      payload: payload ? JSON.stringify(payload) : "{}",
    },
  });
  return NextResponse.json({ log: created, createdRequestId });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";
import { getToken } from "next-auth/jwt";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await guard(["ADMIN", "MANAGER", "EDITOR", "LEGAL", "REQUESTER", "CROWD"]);
  if (forbidden) return forbidden;

  const resolved = await params;
  const items = await prisma.activity.findMany({
    where: { requestId: resolved.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forbidden = await guard(["ADMIN", "MANAGER", "EDITOR", "LEGAL", "REQUESTER", "CROWD"]);
  if (forbidden) return forbidden;
  const resolved = await params;
  const body = await request.json();
  const { action } = body;

  if (!action) {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const email = (token as { email?: string })?.email;
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const created = await prisma.activity.create({
    data: {
      requestId: resolved.id,
      userId: user.id,
      action,
    },
  });

  return NextResponse.json(created);
}

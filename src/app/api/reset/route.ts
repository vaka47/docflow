import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";

export async function POST() {
  const forbidden = await guard(["ADMIN"]);
  if (forbidden) return forbidden;

  await prisma.documentComment.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.integrationLog.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.knowledgeBaseItem.deleteMany();
  await prisma.request.deleteMany();
  await prisma.user.deleteMany();

  return NextResponse.json({ ok: true });
}

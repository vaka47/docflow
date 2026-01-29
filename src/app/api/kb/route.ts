import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";

export async function GET() {
  const forbidden = await guard(["ADMIN", "MANAGER", "EDITOR", "LEGAL", "CROWD", "REQUESTER"]);
  if (forbidden) return forbidden;
  const items = await prisma.knowledgeBaseItem.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const forbidden = await guard(["MANAGER"]);
  if (forbidden) return forbidden;
  const body = await request.json();
  const { title, content, tags } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const created = await prisma.knowledgeBaseItem.create({
    data: {
      title,
      content,
      tags: tags ?? [],
    },
  });

  return NextResponse.json(created);
}

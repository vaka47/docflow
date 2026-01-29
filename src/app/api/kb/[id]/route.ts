import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const forbidden = await guard(["MANAGER"]);
  if (forbidden) return forbidden;
  let body: { title?: string; content?: string; tags?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const { title, content, tags } = body;
  const urlId = request.url.split("/api/kb/")[1]?.split("?")[0];
  const id = params?.id || urlId;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const existing = await prisma.knowledgeBaseItem.findUnique({
    where: { id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const nextTitle = typeof title === "string" && title.trim().length > 0 ? title : existing.title;
  const nextContent = typeof content === "string" && content.trim().length > 0 ? content : existing.content;
  const nextTags = Array.isArray(tags) ? tags : existing.tags;
  const updated = await prisma.knowledgeBaseItem.update({
    where: { id },
    data: {
      title: nextTitle,
      content: nextContent,
      tags: nextTags,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const forbidden = await guard(["MANAGER"]);
  if (forbidden) return forbidden;
  const urlId = request.url.split("/api/kb/")[1]?.split("?")[0];
  const id = params?.id || urlId;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await prisma.knowledgeBaseItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

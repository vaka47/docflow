import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const id = resolved?.id ?? new URL(_request.url).pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: "Docs fetch failed" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const id = resolved?.id ?? new URL(request.url).pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const auth = await requireRole(["ADMIN", "MANAGER", "EDITOR"]);
    if (!auth.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { title, content, version, sections, publishedAt } = body;
    const publishValue =
      typeof publishedAt === "string"
        ? new Date(publishedAt)
        : publishedAt === null
          ? null
          : undefined;
    const isDraft = new URL(request.url).searchParams.get("draft") === "1";
    const doc = await prisma.document.update({
      where: { id },
      data: { title, content, version, sections, publishedAt: publishValue },
    });
    if (!isDraft) {
      await prisma.documentVersion.create({
        data: {
          documentId: doc.id,
          title: doc.title,
          content: doc.content,
          version: doc.version,
        },
      });
    }
    return NextResponse.json(doc);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Docs update failed:", message);
    return NextResponse.json({ error: "Docs update failed", detail: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolved = await params;
    const id = resolved?.id ?? new URL(request.url).pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const auth = await requireRole(["ADMIN", "MANAGER"]);
    if (!auth.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    await prisma.$transaction([
      prisma.documentComment.deleteMany({ where: { documentId: id } }),
      prisma.documentVersion.deleteMany({ where: { documentId: id } }),
      prisma.document.delete({ where: { id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Docs delete failed", detail: message }, { status: 500 });
  }
}

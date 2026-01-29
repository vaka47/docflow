import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const forbidden = await guard(["ADMIN", "MANAGER", "EDITOR", "LEGAL", "REQUESTER"]);
    if (forbidden) return forbidden;
    const resolved = await params;
    const id = resolved?.id ?? new URL(_request.url).pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const comments = await prisma.documentComment.findMany({
      where: { documentId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(comments);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comments fetch failed";
    return NextResponse.json({ error: "Comments fetch failed", detail: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const forbidden = await guard(["ADMIN", "MANAGER", "EDITOR", "LEGAL", "REQUESTER"]);
    if (forbidden) return forbidden;
    const resolved = await params;
    const id = resolved?.id ?? new URL(request.url).pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const exists = await prisma.document.findUnique({ where: { id } });
    const body = await request.json();
    const { author, content, line } = body;
    if (!author || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!exists) {
      await prisma.document.create({
        data: {
          id,
          title: "Восстановленный документ",
          content: "",
          version: "1.0",
          sections: [],
        },
      });
    }
    const comment = await prisma.documentComment.create({
      data: {
        documentId: id,
        author,
        content,
        line: typeof line === "number" ? line : typeof line === "string" ? Number(line) : null,
      },
    });
    return NextResponse.json(comment);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comment create failed";
    return NextResponse.json({ error: "Comment create failed", detail: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const forbidden = await guard(["ADMIN", "MANAGER", "EDITOR", "LEGAL", "REQUESTER"]);
    if (forbidden) return forbidden;
    const resolved = await params;
    const id = resolved?.id ?? new URL(request.url).pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const body = await request.json();
    const { commentId, author } = body as { commentId?: string; author?: string };
    if (!commentId || !author) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const comment = await prisma.documentComment.findUnique({ where: { id: commentId } });
    if (!comment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (comment.author !== author) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.documentComment.delete({ where: { id: commentId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Comment delete failed";
    return NextResponse.json({ error: "Comment delete failed", detail: message }, { status: 500 });
  }
}

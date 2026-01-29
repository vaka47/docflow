import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function GET() {
  try {
    const docs = await prisma.document.findMany({ orderBy: { updatedAt: "desc" } });
    return NextResponse.json(docs);
  } catch (error) {
    return NextResponse.json({ error: "Docs fetch failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireRole(["ADMIN", "MANAGER", "EDITOR"]);
    if (!auth.allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { title, content, version, sections, publishedAt } = body;
    if (!title || !content) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const doc = await prisma.document.create({
      data: {
        title,
        content,
        version: version ?? "1.0",
        sections: sections ?? [],
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
      },
    });
    await prisma.documentVersion.create({
      data: {
        documentId: doc.id,
        title: doc.title,
        content: doc.content,
        version: doc.version,
      },
    });
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: "Docs create failed" }, { status: 500 });
  }
}

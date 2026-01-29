import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const versions = await prisma.documentVersion.findMany({
      where: { documentId: params.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(versions);
  } catch (error) {
    return NextResponse.json({ error: "Versions fetch failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const forbidden = await guard(["ADMIN", "MANAGER", "EDITOR"]);
    if (forbidden) return forbidden;
    const body = await request.json();
    const { versionId } = body;
    if (!versionId) return NextResponse.json({ error: "Missing versionId" }, { status: 400 });

    const version = await prisma.documentVersion.findUnique({ where: { id: versionId } });
    if (!version) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const doc = await prisma.document.update({
      where: { id: params.id },
      data: {
        title: version.title,
        content: version.content,
        version: version.version,
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
    return NextResponse.json({ error: "Version restore failed" }, { status: 500 });
  }
}

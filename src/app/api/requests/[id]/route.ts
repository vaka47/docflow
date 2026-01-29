import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";
import { getToken } from "next-auth/jwt";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params?.id ?? new URL(request.url).pathname.split("/").pop();
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const forbidden = await guard(["ADMIN", "MANAGER", "EDITOR", "LEGAL"]);
    if (forbidden) return forbidden;
    const body = await request.json();
    const { status, ownerId, slaDays, dueAt } = body;

    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const role = (token as { role?: string })?.role ?? "MANAGER";
    if (role === "LEGAL") {
      if (ownerId || typeof slaDays === "number" || dueAt) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const allowed = ["REVIEW", "APPROVAL", "PUBLISHED"];
      if (status && !allowed.includes(status)) {
        return NextResponse.json({ error: "Forbidden status" }, { status: 403 });
      }
    }

    const updated = await prisma.request.update({
      where: { id },
      data: {
        status,
        ownerId,
        slaDays: typeof slaDays === "number" ? slaDays : undefined,
        dueAt: dueAt ? new Date(dueAt) : undefined,
        publishedAt: status === "PUBLISHED" ? new Date() : undefined,
      },
    });

    if (status) {
      const email = (token as { email?: string })?.email;
      if (email) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          await prisma.activity.create({
            data: {
              requestId: id,
              userId: user.id,
              action: `status:${status}`,
            },
          });
        }
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Request update failed:", message);
    return NextResponse.json({ error: "Request update failed", detail: message }, { status: 500 });
  }
}

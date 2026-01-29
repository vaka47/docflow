import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const forbidden = await guard(["ADMIN"]);
    if (forbidden) return forbidden;
    const body = await request.json();
    const { role, team, extraRoles } = body;

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        role,
        team,
        extraRoles: Array.isArray(extraRoles) ? extraRoles : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "User update failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";

export async function guard(roles: string[]) {
  const auth = await requireRole(roles);
  if (!auth.allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

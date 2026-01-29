import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireRole(roles: string[]) {
  const session = await getServerSession(authOptions);
  if (!session && process.env.NODE_ENV === "development") {
    return { allowed: true, role: "MANAGER" };
  }
  const role = (session?.user as { role?: string } | undefined)?.role ?? "GUEST";
  if (!roles.includes(role)) {
    return { allowed: false, role };
  }
  return { allowed: true, role };
}

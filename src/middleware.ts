import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { isRouteAllowed } from "@/lib/role-access";

const protectedRoutes = [
  "/workflow",
  "/intake",
  "/metrics",
  "/knowledge",
  "/workspace",
  "/integrations",
  "/roles",
  "/crowd",
  "/home",
  "/playbook",
  "/account",
  "/admin",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    const role = (token as { role?: string }).role ?? "MANAGER";
    const extraRoles = (token as { extraRoles?: string[] }).extraRoles ?? [];
    const allowed = isRouteAllowed(role, pathname) || extraRoles.some((r) => isRouteAllowed(r, pathname));
    if (!allowed) {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

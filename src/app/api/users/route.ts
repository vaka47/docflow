import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";
import bcrypt from "bcryptjs";
import { demoUsers } from "@/lib/demo-users";

export async function GET() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      const password = await bcrypt.hash("demo", 10);
      await Promise.all(
        demoUsers.map((user) =>
          prisma.user.create({
            data: {
              name: user.name,
              email: user.email,
              role: user.role,
              team: user.team,
              extraRoles: user.extraRoles ?? [],
              password,
            },
          })
        )
      );
    }
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, team: true, extraRoles: true },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Users fetch failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const forbidden = await guard(["ADMIN"]);
    if (forbidden) return forbidden;
    const body = await request.json();
    const { name, email, role, password, team, extraRoles } = body;
    if (!name || !email || !role || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        name,
        email,
        role,
        password: hashed,
        team: team || "General",
        extraRoles: Array.isArray(extraRoles) ? extraRoles : [],
      },
    });
    return NextResponse.json(created);
  } catch (error) {
    return NextResponse.json({ error: "User create failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";
import { seedRequests } from "@/lib/seed";
import { RequestStatus, RequestType } from "@prisma/client";

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export async function GET() {
  try {
    const forbidden = await guard(["ADMIN", "MANAGER", "EDITOR", "LEGAL", "CROWD", "REQUESTER"]);
    if (forbidden) return forbidden;
    const count = await prisma.request.count();
    if (count === 0) {
      const users = await prisma.user.findMany();
      if (users.length > 0) {
        await Promise.all(
          seedRequests.map((req) => {
            const owner = pick(users);
            const createdAt = new Date();
            const dueAt = new Date(createdAt.getTime() + (req.slaDays ?? 7) * 86400000);
            return prisma.request.create({
              data: {
                title: req.title,
                description: req.description,
                type: req.type as RequestType,
                status: req.status as RequestStatus,
                slaDays: req.slaDays,
                audience: (req as { audience?: string }).audience ?? "Пользователи сервиса",
                ownerId: owner.id,
                dueAt,
              },
            });
          })
        );
      }
    }
    const requests = await prisma.request.findMany({
      include: { owner: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: "Requests fetch failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const forbidden = await guard(["ADMIN", "MANAGER", "EDITOR", "REQUESTER"]);
    if (forbidden) return forbidden;
    const body = await request.json();
    const { title, description, type, slaDays, ownerId, audience, dueAt } = body;

    if (!title || !description || !ownerId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const created = await prisma.request.create({
      data: {
        title,
        description,
        audience: audience || "Пользователи сервиса",
        type,
        slaDays: Number(slaDays) || 7,
        dueAt: dueAt ? new Date(dueAt) : undefined,
        ownerId,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    return NextResponse.json({ error: "Request create failed" }, { status: 500 });
  }
}

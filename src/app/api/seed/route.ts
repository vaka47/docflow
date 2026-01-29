import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateSeedUsers, seedRequests } from "@/lib/seed";
import { UserRole, RequestStatus, RequestType } from "@prisma/client";

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export async function POST(request: Request) {
  try {
    return NextResponse.json({ ok: false, message: "Seed disabled. Demo users are created on login." }, { status: 410 });
    // unreachable: demo seed disabled
    const url = new URL(request.url);
    const count = Math.max(5, Number(url.searchParams.get("count") ?? "40"));
    const append = url.searchParams.get("append") === "true";

    const existing = await prisma.user.count();
    if (existing > 0 && !append) {
      return NextResponse.json({ ok: true, message: "Seed already exists (use ?append=true)" });
    }

    const password = await bcrypt.hash("password123", 10);
    const seedUsers = generateSeedUsers(count);
    await Promise.all(
      seedUsers.map(async (user) => {
        return prisma.user.upsert({
          where: { email: user.email },
          data: {
            ...user,
            password,
            role: user.role as UserRole,
          },
          update: {},
        });
      })
    );

    const users = await prisma.user.findMany();
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

    await prisma.knowledgeBaseItem.createMany({
      data: [
        {
          title: "Как оформить заявку",
          content: "Заполните форму: цель, аудитория, канал, сроки.",
          tags: ["intake", "SLA"],
        },
        {
          title: "Что такое DoD",
          content: "Definition of Done: чек-лист качества, ссылки, терминология, preview.",
          tags: ["quality"],
        },
      ],
    });

    const docsCount = await prisma.document.count();
    if (docsCount === 0) {
      const doc = await prisma.document.create({
        data: {
          title: "FAQ по запуску Алисы",
          content:
            "<h1>FAQ</h1><p>Короткие ответы для B2B клиентов.</p><h2>Запуск</h2><p>1. Заполнить intake. 2. Согласовать DoD.</p>",
          version: "1.0",
          sections: ["Введение", "Сценарии", "FAQ"],
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
    }

    const policy = await prisma.document.findFirst({ where: { title: "Регламент выпуска документации" } });
    if (!policy) {
      const doc = await prisma.document.create({
        data: {
          title: "Регламент выпуска документации",
          content:
            "<h1>Регламент</h1><p>Цель: обеспечить качество и соблюдение сроков.</p>" +
            "<h2>DoD</h2><ul><li>Чек-лист терминов</li><li>Preview</li><li>Legal approval</li></ul>" +
            "<h2>Процесс</h2><ol><li>Intake</li><li>Триаж</li><li>Работа</li><li>Review</li><li>Публикация</li></ol>",
          version: "1.0",
          sections: ["Цель", "DoD", "Процесс"],
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
    }

    return NextResponse.json({ ok: true, users: users.length, message: "Seeded demo users" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

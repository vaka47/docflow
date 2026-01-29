import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/api-guard";

type MetricRow = {
  key: string;
  title: string;
  unit: string;
  current: number;
  previous: number;
  target: number;
  better: "lower" | "higher";
  definition: string;
  formula: string;
  breakdown: string[];
  trend: { week: string; value: number }[];
  auto: boolean;
};

function daysBetween(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return Number((values.reduce((acc, v) => acc + v, 0) / values.length).toFixed(1));
}

export async function GET() {
  const forbidden = await guard(["ADMIN", "MANAGER"]);
  if (forbidden) return forbidden;

  const requests = await prisma.request.findMany({
    include: { activities: true },
  });

  const now = new Date();
  const currentStart = new Date(now.getTime() - 30 * 86400000);
  const previousStart = new Date(now.getTime() - 60 * 86400000);

  function windowed(filterFrom: Date, filterTo: Date) {
    return requests.filter((req) => req.createdAt >= filterFrom && req.createdAt <= filterTo);
  }

  const current = windowed(currentStart, now);
  const previous = windowed(previousStart, currentStart);

  function leadTimes(list: typeof requests) {
    return list
      .filter((req) => req.publishedAt)
      .map((req) => daysBetween(req.createdAt, req.publishedAt!));
  }

  function cycleTimes(list: typeof requests) {
    return list
      .filter((req) => req.publishedAt)
      .map((req) => {
        const start = req.activities
          .filter((act) => act.action === "status:IN_PROGRESS")
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]?.createdAt;
        if (!start) return null;
        return daysBetween(start, req.publishedAt!);
      })
      .filter((v): v is number => v !== null);
  }

  function reworkRate(list: typeof requests) {
    if (!list.length) return 0;
    const rework = list.filter((req) => req.activities.filter((a) => a.action === "status:REVIEW").length > 1).length;
    return Math.round((rework / list.length) * 100);
  }

  function slaBreach(list: typeof requests) {
    if (!list.length) return 0;
    const breached = list.filter((req) => {
      const deadline = req.dueAt ?? new Date(req.createdAt.getTime() + req.slaDays * 86400000);
      if (req.publishedAt) return req.publishedAt > deadline;
      return now > deadline;
    }).length;
    return Math.round((breached / list.length) * 100);
  }

  const metrics: MetricRow[] = [
    {
      key: "lead",
      title: "Lead time",
      unit: "дн.",
      current: avg(leadTimes(current)),
      previous: avg(leadTimes(previous)),
      target: 5,
      better: "lower",
      definition: "Время от создания заявки до публикации документации.",
      formula: "Lead time = publishedAt − createdAt",
      breakdown: ["Источник: Request.createdAt и publishedAt", "Срез за 30 дней", "Сравнение с предыдущим периодом"],
      trend: [
        { week: "W1", value: avg(leadTimes(windowed(new Date(now.getTime() - 28 * 86400000), new Date(now.getTime() - 21 * 86400000)))) },
        { week: "W2", value: avg(leadTimes(windowed(new Date(now.getTime() - 21 * 86400000), new Date(now.getTime() - 14 * 86400000)))) },
        { week: "W3", value: avg(leadTimes(windowed(new Date(now.getTime() - 14 * 86400000), new Date(now.getTime() - 7 * 86400000)))) },
        { week: "W4", value: avg(leadTimes(windowed(new Date(now.getTime() - 7 * 86400000), now))) },
      ],
      auto: true,
    },
    {
      key: "cycle",
      title: "Cycle time",
      unit: "дн.",
      current: avg(cycleTimes(current)),
      previous: avg(cycleTimes(previous)),
      target: 3,
      better: "lower",
      definition: "Время в работе (без ожиданий) от старта до публикации.",
      formula: "Cycle time = first IN_PROGRESS → publishedAt",
      breakdown: ["Источник: Activity статус IN_PROGRESS", "Срез за 30 дней", "Сравнение с предыдущим периодом"],
      trend: [
        { week: "W1", value: avg(cycleTimes(windowed(new Date(now.getTime() - 28 * 86400000), new Date(now.getTime() - 21 * 86400000)))) },
        { week: "W2", value: avg(cycleTimes(windowed(new Date(now.getTime() - 21 * 86400000), new Date(now.getTime() - 14 * 86400000)))) },
        { week: "W3", value: avg(cycleTimes(windowed(new Date(now.getTime() - 14 * 86400000), new Date(now.getTime() - 7 * 86400000)))) },
        { week: "W4", value: avg(cycleTimes(windowed(new Date(now.getTime() - 7 * 86400000), now))) },
      ],
      auto: true,
    },
    {
      key: "rework",
      title: "Rework rate",
      unit: "%",
      current: reworkRate(current),
      previous: reworkRate(previous),
      target: 10,
      better: "lower",
      definition: "Доля задач, где требуются повторные правки после review.",
      formula: "Rework = tasks_with_review>1 / total_tasks",
      breakdown: ["Источник: Activity status REVIEW", "Срез за 30 дней", "Сравнение с предыдущим периодом"],
      trend: [
        { week: "W1", value: reworkRate(windowed(new Date(now.getTime() - 28 * 86400000), new Date(now.getTime() - 21 * 86400000))) },
        { week: "W2", value: reworkRate(windowed(new Date(now.getTime() - 21 * 86400000), new Date(now.getTime() - 14 * 86400000))) },
        { week: "W3", value: reworkRate(windowed(new Date(now.getTime() - 14 * 86400000), new Date(now.getTime() - 7 * 86400000))) },
        { week: "W4", value: reworkRate(windowed(new Date(now.getTime() - 7 * 86400000), now)) },
      ],
      auto: true,
    },
    {
      key: "sla",
      title: "SLA breach",
      unit: "%",
      current: slaBreach(current),
      previous: slaBreach(previous),
      target: 5,
      better: "lower",
      definition: "Доля задач, вышедших за SLA.",
      formula: "SLA breach = overdue / total_tasks",
      breakdown: ["Источник: dueAt + publishedAt", "Срез за 30 дней", "Сравнение с предыдущим периодом"],
      trend: [
        { week: "W1", value: slaBreach(windowed(new Date(now.getTime() - 28 * 86400000), new Date(now.getTime() - 21 * 86400000))) },
        { week: "W2", value: slaBreach(windowed(new Date(now.getTime() - 21 * 86400000), new Date(now.getTime() - 14 * 86400000))) },
        { week: "W3", value: slaBreach(windowed(new Date(now.getTime() - 14 * 86400000), new Date(now.getTime() - 7 * 86400000))) },
        { week: "W4", value: slaBreach(windowed(new Date(now.getTime() - 7 * 86400000), now)) },
      ],
      auto: true,
    },
  ];

  return NextResponse.json(metrics);
}

"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Metric = {
  key: string;
  title: string;
  unit: string;
  current: number;
  previous: number;
  target: number;
  targetWindow: string;
  better: "lower" | "higher";
  definition: string;
  formula: string;
  breakdown: string[];
  trend: { week: string; value: number }[];
};

const fallbackMetrics: Metric[] = [
  {
    key: "lead",
    title: "Lead time",
    unit: "дн.",
    current: 6,
    previous: 12,
    target: 5,
    targetWindow: "4–8 недель",
    better: "lower",
    definition: "Время от создания заявки до публикации документации.",
    formula: "Lead time = publishedAt − createdAt",
    breakdown: ["Считаем по Tracker", "Срез раз в неделю", "Сравнение по типам задач"],
    trend: [
      { week: "W1", value: 14 },
      { week: "W2", value: 12 },
      { week: "W3", value: 9 },
      { week: "W4", value: 6 },
    ],
  },
  {
    key: "cycle",
    title: "Cycle time",
    unit: "дн.",
    current: 3,
    previous: 7,
    target: 3,
    targetWindow: "4–8 недель",
    better: "lower",
    definition: "Время в работе (без ожиданий) от старта до публикации.",
    formula: "Cycle time = inProgressAt − publishedAt",
    breakdown: ["Исключаем паузы", "Анализируем узкие места", "Цель — стабильность"],
    trend: [
      { week: "W1", value: 8 },
      { week: "W2", value: 6 },
      { week: "W3", value: 4 },
      { week: "W4", value: 3 },
    ],
  },
  {
    key: "rework",
    title: "Rework rate",
    unit: "%",
    current: 12,
    previous: 35,
    target: 10,
    targetWindow: "4–8 недель",
    better: "lower",
    definition: "Доля задач, где требуются повторные правки после review.",
    formula: "Rework = tasks_with_rework / total_tasks",
    breakdown: ["DocOps линтеры", "DoD чек‑лист", "Review стандартизирован"],
    trend: [
      { week: "W1", value: 38 },
      { week: "W2", value: 30 },
      { week: "W3", value: 18 },
      { week: "W4", value: 12 },
    ],
  },
  {
    key: "sla",
    title: "SLA breach",
    unit: "%",
    current: 6,
    previous: 18,
    target: 5,
    targetWindow: "4–8 недель",
    better: "lower",
    definition: "Доля задач, вышедших за SLA.",
    formula: "SLA breach = overdue_tasks / total_tasks",
    breakdown: ["Авто‑напоминания", "Управляемая очередь", "Приоритеты"],
    trend: [
      { week: "W1", value: 22 },
      { week: "W2", value: 16 },
      { week: "W3", value: 10 },
      { week: "W4", value: 6 },
    ],
  },
];

const sources = [
  {
    title: "Tracker",
    subtitle: "дата создания → публикация",
    description: "Источник для Lead/Cycle time. Время берём из задач трекера и даты публикации.",
    formula: "Lead = createdAt → publishedAt",
  },
  {
    title: "DocOps",
    subtitle: "итерации правок",
    description: "История правок и ревью. Считаем rework и качество.",
    formula: "Rework = iterations / tasks",
  },
  {
    title: "Release/PR",
    subtitle: "триггеры обновления",
    description: "Сигнал, что документация должна обновиться. Используется для SLA и контроля релизов.",
    formula: "Trigger = release → doc task",
  },
];

export default function MetricsClient() {
  const [active, setActive] = useState<Metric | null>(null);
  const [source, setSource] = useState<typeof sources[number] | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>(fallbackMetrics);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const es = new EventSource("/api/stream/metrics");
    es.onmessage = () => setTick((prev) => prev + 1);
    return () => es.close();
  }, []);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/metrics");
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((item: Metric) => ({
          ...item,
          targetWindow: "4–8 недель",
        }));
        setMetrics(mapped);
      }
    }
    load();
  }, [tick]);

  return (
    <>
      <div className="hidden">{tick}</div>
      <section className="grid gap-6 md:grid-cols-2">
        {metrics.map((item) => {
          const improved = item.better === "lower" ? item.current < item.previous : item.current > item.previous;
          const color = improved ? "text-emerald-600" : "text-red-600";
          return (
            <button
              key={item.key}
              className="surface p-6 text-left hover:border-[var(--accent)] cursor-pointer"
              onClick={() => setActive(item)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <span
                  className="pill bg-white"
                  title={`Цель на ${item.targetWindow}: ${item.target}${item.unit}`}
                >
                  Target {item.target}{item.unit}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-black/50">Текущий</p>
                  <p className={`text-2xl font-semibold ${color}`}>{item.current}{item.unit}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-black/50">Прошлый</p>
                  <p className="text-2xl font-semibold">{item.previous}{item.unit}</p>
                </div>
              </div>
              <p className="subtle mt-4 text-sm">Target = цель на {item.targetWindow}. Нажмите для деталей.</p>
            </button>
          );
        })}
      </section>

      <section className="surface p-8">
        <h2 className="section-title text-2xl">Источники данных</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3 text-sm">
          {sources.map((item) => (
            <button
              key={item.title}
              className="rounded-2xl border border-black/10 bg-white p-4 text-left hover:border-[var(--accent)] cursor-pointer"
              onClick={() => setSource(item)}
            >
              <p className="font-semibold">{item.title}</p>
              <p className="subtle mt-1 text-xs">{item.subtitle}</p>
            </button>
          ))}
        </div>
      </section>

      <Modal open={Boolean(active)} title={active?.title ?? ""} onClose={() => setActive(null)}>
        {active && (
          <div className="grid gap-4">
            <p><strong>Определение:</strong> {active.definition}</p>
            <p><strong>Формула:</strong> {active.formula}</p>
            <p><strong>Target:</strong> {active.target}{active.unit} за {active.targetWindow}. Это ожидаемый уровень улучшения после оптимизаций.</p>
            <div>
              <p className="font-semibold">Примечания</p>
              <ul className="mt-2 list-disc pl-5">
                {active.breakdown.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={active.trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#ff0000" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(source)} title={source?.title ?? ""} onClose={() => setSource(null)}>
        {source && (
          <div className="grid gap-2">
            <p>{source.description}</p>
            <p><strong>Формула:</strong> {source.formula}</p>
          </div>
        )}
      </Modal>
    </>
  );
}

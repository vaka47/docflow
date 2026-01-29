"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";

type Owner = { id: string; name: string; email: string; role: string };

type RequestItem = {
  id: string;
  title: string;
  status: string;
  type: string;
  slaDays: number;
  createdAt: string;
  dueAt?: string | null;
  owner: Owner;
};

type View = "month" | "week";

const statusTone: Record<string, string> = {
  NEW: "bg-amber-100 text-amber-900",
  TRIAGE: "bg-emerald-100 text-emerald-900",
  IN_PROGRESS: "bg-blue-100 text-blue-900",
  REVIEW: "bg-violet-100 text-violet-900",
  APPROVAL: "bg-orange-100 text-orange-900",
  PUBLISHED: "bg-slate-100 text-slate-800",
};

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default function WorkflowCalendarClient() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [view, setView] = useState<View>("week");
  const [current, setCurrent] = useState<Date>(() => new Date());
  const [active, setActive] = useState<RequestItem | null>(null);

  async function load() {
    const res = await fetch("/api/requests", { cache: "no-store" });
    if (!res.ok) {
      setRequests([]);
      return;
    }
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/stream/requests");
    es.onmessage = () => load();
    return () => es.close();
  }, []);

  function getDueDate(item: RequestItem) {
    if (item.dueAt) return new Date(item.dueAt);
    const created = new Date(item.createdAt);
    return new Date(created.getTime() + item.slaDays * 86400000);
  }

  const days = useMemo(() => {
    const base = new Date(current);
    if (view === "week") {
      const start = startOfWeek(base);
      return Array.from({ length: 7 }).map((_, idx) => addDays(start, idx));
    }
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    const start = startOfWeek(first);
    const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    const end = addDays(startOfWeek(addDays(last, 6)), 6);
    const total = Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
    return Array.from({ length: total }).map((_, idx) => addDays(start, idx));
  }, [current, view]);

  const grouped = useMemo(() => {
    const map: Record<string, RequestItem[]> = {};
    requests.forEach((item) => {
      const due = getDueDate(item);
      const key = toKey(due);
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [requests]);

  async function updateDueAt(id: string, date: Date) {
    const iso = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12).toISOString();
    setRequests((prev) => prev.map((item) => (item.id === id ? { ...item, dueAt: iso } : item)));
    await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueAt: iso }),
    });
    await load();
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>, day: Date) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (id) updateDueAt(id, day);
  }

  return (
    <section className="surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Календарь дедлайнов</h3>
          <p className="subtle text-sm">Перетаскивайте задачи на нужную дату.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            className={`rounded-full border px-3 py-1 ${view === "month" ? "bg-[var(--accent)] text-white" : "border-black/10"}`}
            onClick={() => setView("month")}
          >
            Месяц
          </button>
          <button
            className={`rounded-full border px-3 py-1 ${view === "week" ? "bg-[var(--accent)] text-white" : "border-black/10"}`}
            onClick={() => setView("week")}
          >
            Неделя
          </button>
          <button
            className="rounded-full border border-black/10 px-3 py-1"
            onClick={() => setCurrent(addDays(current, view === "week" ? -7 : -30))}
          >
            ←
          </button>
          <button
            className="rounded-full border border-black/10 px-3 py-1"
            onClick={() => setCurrent(addDays(current, view === "week" ? 7 : 30))}
          >
            →
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-black/50 md:grid-cols-7">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((label) => (
          <div key={label} className="text-center">{label}</div>
        ))}
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-7">
        {days.map((day) => {
          const key = toKey(day);
          const isCurrentMonth = day.getMonth() === current.getMonth();
          return (
            <div
              key={key}
              className={`flex min-h-[120px] flex-col rounded-2xl border border-black/10 bg-white p-2 ${isCurrentMonth ? "" : "opacity-40"}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => onDrop(event, day)}
            >
              <div className="flex items-center justify-between text-xs text-black/50">
                <span>{day.getDate()}</span>
                <span>{day.toLocaleDateString("ru-RU", { month: "short" })}</span>
              </div>
              <div className="mt-2 grid max-h-[120px] flex-1 gap-1 overflow-auto pr-1">
                {(grouped[key] ?? []).map((item) => (
                  <button
                    key={item.id}
                    className="flex max-w-full items-center justify-between gap-2 overflow-hidden rounded-xl border border-black/10 bg-white px-2 py-1 text-left text-xs hover:border-[var(--accent)]"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
                    onClick={() => setActive(item)}
                  >
                    <span className="min-w-0 flex-1 truncate">{item.title}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${statusTone[item.status] || "bg-black/5"}`}>
                      {item.status.replace("_", " ")}
                    </span>
                  </button>
                ))}
                {(grouped[key] ?? []).length === 0 && (
                  <div className="rounded-xl border border-dashed border-black/10 px-2 py-1 text-[10px] text-black/30">
                    —
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={Boolean(active)} title={active?.title ?? ""} onClose={() => setActive(null)}>
        {active && (
          <div className="grid gap-3 text-sm">
            <p><strong>Статус:</strong> {active.status}</p>
            <p><strong>Владелец:</strong> {active.owner.name}</p>
            <p><strong>Тип:</strong> {active.type}</p>
            <p><strong>Дедлайн:</strong> {getDueDate(active).toLocaleDateString()}</p>
          </div>
        )}
      </Modal>
    </section>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import Link from "next/link";

type RequestItem = {
  id: string;
  title: string;
  status: string;
  slaDays: number;
  createdAt: string;
  dueAt?: string | null;
  owner: { name: string; email: string };
};

type User = { name: string; email: string; role: string };

type NotificationItem = { id: string; message: string; ts: string };

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [active, setActive] = useState<RequestItem | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(Date.now());
    try {
      const saved = localStorage.getItem("docflow-notifications");
      setNotifications(saved ? JSON.parse(saved) : []);
    } catch {
      setNotifications([]);
    }
    async function load() {
      const me = await fetch("/api/me");
      if (me.ok) {
        setUser(await me.json());
      }
      const res = await fetch("/api/requests", { cache: "no-store" });
      if (!res.ok) {
        setRequests([]);
        return;
      }
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    }
    load();
  }, []);

  const myTasks = useMemo(() => {
    if (!user) return [];
    return requests.filter((item) => item.owner.email === user.email);
  }, [requests, user]);

  const tasksWithDeadline = useMemo(() => {
    if (now === null) return [];
    const mapped = myTasks.map((task) => {
      const created = new Date(task.createdAt);
      const deadline = task.dueAt
        ? new Date(task.dueAt)
        : new Date(created.getTime() + task.slaDays * 24 * 60 * 60 * 1000);
      const daysLeft = Math.ceil((deadline.getTime() - now) / (1000 * 60 * 60 * 24));
      return { ...task, deadline, daysLeft };
    });
    return mapped.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }, [myTasks, now]);

  const completed = requests.filter((item) => item.status === "PUBLISHED").length;
  const total = requests.length;

  function getBorderClass(task: { status: string; daysLeft: number }) {
    if (task.status === "PUBLISHED") {
      return "border-emerald-200";
    }
    if (task.daysLeft <= 0) return "border-red-500";
    if (task.daysLeft <= 1) return "border-red-400";
    if (task.daysLeft <= 3) return "border-red-300";
    if (task.daysLeft <= 5) return "border-red-200";
    return "border-black/10";
  }

  return (
    <div className="grid gap-8">
      <section className="surface p-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-semibold">Профиль</h3>
            <p className="subtle mt-2 text-sm">{user?.name ?? "—"}</p>
            <p className="subtle text-sm">{user?.email ?? "—"}</p>
            <p className="mt-3 text-sm"><strong>Роль:</strong> {user?.role ?? "—"}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Статистика</h3>
            <div className="mt-2 text-sm">
              <p>Задачи всего: <strong>{total}</strong></p>
              <p>Завершено: <strong>{completed}</strong></p>
              <p>В работе: <strong>{total - completed}</strong></p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Проекты</h3>
            <ul className="mt-2 text-sm">
              <li>Документация Такси</li>
              <li>Алиса B2B</li>
              <li>Поиск API</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="surface p-6">
        <h3 className="text-lg font-semibold">Мои задачи</h3>
        <div className="mt-4 grid gap-3 text-sm">
          {tasksWithDeadline.map((task) => (
            <button
              key={task.id}
              className={`rounded-2xl border bg-white p-3 text-left hover:border-[var(--accent)] cursor-pointer ${getBorderClass(task)}`}
              onClick={() => setActive(task)}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{task.title}</p>
                <span className="text-xs text-black/50">
                  Дедлайн: {mounted ? task.deadline.toLocaleDateString() : "—"}
                </span>
              </div>
              <p className="subtle text-xs">
                Статус: {task.status} · {task.daysLeft <= 0 ? "Просрочено" : `Осталось ${task.daysLeft} дн.`}
              </p>
            </button>
          ))}
          {tasksWithDeadline.length === 0 && <p className="text-sm text-black/50">Нет задач</p>}
        </div>
      </section>

      <section className="surface p-6">
        <h3 className="text-lg font-semibold">Уведомления</h3>
        <div className="mt-4 grid gap-3 text-sm">
          {notifications.map((item) => (
            <div key={item.id} className="rounded-2xl border border-black/10 bg-white p-3">
              <p>{item.message}</p>
              <p className="subtle text-xs">{new Date(item.ts).toLocaleString()}</p>
            </div>
          ))}
          {notifications.length === 0 && <p className="text-sm text-black/50">Нет уведомлений</p>}
        </div>
      </section>

      <Modal
        open={Boolean(active)}
        title={active?.title ?? ""}
        onClose={() => setActive(null)}
      >
        {active && (
          <div className="grid gap-3">
            <p><strong>Статус:</strong> {active.status}</p>
            <p><strong>SLA:</strong> {active.slaDays} дней</p>
            <Link
              href="/workflow"
              className="inline-flex w-fit rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
            >
              Открыть воркфлоу
            </Link>
          </div>
        )}
      </Modal>
    </div>
  );
}

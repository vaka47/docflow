"use client";

import { useEffect, useState } from "react";
import RoleGate from "@/components/RoleGate";

export default function IntakePage() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string; role: string; team: string; email?: string }[]>([]);

  useEffect(() => {
    async function loadUsers() {
      const res = await fetch("/api/users");
      if (!res.ok) {
        setUsers([]);
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    }
    loadUsers();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const me = await fetch("/api/me");
    if (!me.ok) {
      setSubmitted("Нужна авторизация");
      return;
    }
    const user = await me.json();
    const ownerValue = String(form.get("owner") || "");
    let ownerId = ownerValue || user.id;
    if (ownerValue.startsWith("user:")) {
      const email = ownerValue.replace("user:", "").trim();
      const found = users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
      if (found) ownerId = found.id;
    } else if (ownerValue.startsWith("team:")) {
      const teamName = ownerValue.replace("team:", "").trim();
      const teamMembers = users.filter((member) => member.team === teamName);
      const preferred = teamMembers.find((member) => member.role === "MANAGER") ?? teamMembers[0];
      if (preferred) ownerId = preferred.id;
    } else if (!ownerValue && user?.id) {
      ownerId = user.id;
    }
    const dueAt = form.get("dueAt");
    const payload = {
      title: form.get("title"),
      description: form.get("description"),
      type: form.get("type"),
      audience: form.get("audience"),
      ownerId,
      dueAt: dueAt ? new Date(String(dueAt)).toISOString() : undefined,
    };

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setSubmitted("Ошибка при создании заявки");
      return;
    }

    setSubmitted("Заявка создана · статус BACKLOG");
    event.currentTarget.reset();
  }

  const teams = Array.from(new Set(users.map((item) => item.team).filter(Boolean))).sort();

  return (
    <RoleGate allow={["ADMIN", "MANAGER", "REQUESTER"]}>
      <div className="grid gap-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form className="surface grid gap-4 p-8 text-sm" onSubmit={handleSubmit}>
          <label className="grid gap-2 font-semibold">
            Название задачи
            <input
              name="title"
              className="rounded-2xl border border-black/10 px-4 py-3"
              placeholder="Например: Обновить справку по Такси"
              required
            />
          </label>
          <label className="grid gap-2 font-semibold">
            Цель / аудитория
            <input
              name="description"
              className="rounded-2xl border border-black/10 px-4 py-3"
              placeholder="Кому и зачем это нужно"
              required
            />
          </label>
          <label className="grid gap-2 font-semibold">
            Аудитория заявки
            <select name="audience" className="rounded-2xl border border-black/10 px-4 py-3">
              <option>Пользователи сервиса</option>
              <option>Водители / исполнители</option>
              <option>Партнеры B2B</option>
              <option>Внутренние команды</option>
              <option>Регуляторы / Legal</option>
            </select>
          </label>
          <label className="grid gap-2 font-semibold">
            Тип запроса
            <select name="type" className="rounded-2xl border border-black/10 px-4 py-3">
              <option value="FEATURE">Feature</option>
              <option value="CHANGE">Change</option>
              <option value="REGULATORY">Regulatory</option>
              <option value="FAQ">FAQ</option>
            </select>
          </label>
          <label className="grid gap-2 font-semibold">
            Дедлайн
            <input
              type="date"
              name="dueAt"
              className="rounded-2xl border border-black/10 px-4 py-3"
            />
            <p className="text-xs text-black/50">Если дата не выбрана, применяется стандартный SLA.</p>
          </label>
          <label className="grid gap-2 font-semibold">
            Исполнитель (опционально)
            <input
              name="owner"
              list="owner-options"
              className="rounded-2xl border border-black/10 px-4 py-3"
              placeholder="Начните вводить имя, команду или email"
            />
            <datalist id="owner-options">
              {teams.map((team) => (
                <option key={`team-${team}`} value={`team:${team}`}>
                  Команда · {team}
                </option>
              ))}
              {users.map((user) => (
                <option key={`user-${user.id}`} value={`user:${user.email ?? user.name}`}>
                  {user.name} · {user.role}
                </option>
              ))}
            </datalist>
          </label>
          <label className="grid gap-2 font-semibold">
            Источник истины
            <input className="rounded-2xl border border-black/10 px-4 py-3" placeholder="Ссылка на PR, релиз, документ" />
          </label>
          <button className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white">
            Создать заявку
          </button>
          {submitted && (
            <div className="rounded-2xl border border-[var(--accent)] bg-[var(--accent)]/10 px-4 py-3">
              {submitted}
            </div>
          )}
        </form>
        <div className="grid gap-4">
          <div className="surface p-6">
            <h3 className="text-lg font-semibold">Команда</h3>
            <div className="mt-4 grid gap-2 text-sm">
              {users.slice(0, 6).map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-3 py-2">
                  <span>{user.name}</span>
                  <span className="text-xs text-black/50">{user.role}</span>
                </div>
              ))}
              {users.length === 0 && <p className="text-sm text-black/50">Команда не загружена</p>}
            </div>
          </div>
          <div className="surface p-6">
            <h3 className="text-lg font-semibold">DoD по умолчанию</h3>
            <ul className="mt-4 grid gap-2 text-sm">
              <li>Чек-лист терминов и стиля</li>
              <li>Preview публикации</li>
              <li>Источник истины привязан</li>
              <li>Согласование product + legal</li>
            </ul>
          </div>
          <div className="surface p-6">
            <h3 className="text-lg font-semibold">Триаж логика</h3>
            <p className="subtle mt-3 text-sm">Приоритет и SLA выставляются автоматически на основе типа и срока.</p>
            <div className="mt-4 rounded-2xl border border-black/10 bg-white p-3 text-xs">
              P0 → Legal/Compliance · P1 → Editor · P2 → Crowd
            </div>
          </div>
          <RoleGate allow={["ADMIN", "MANAGER", "CROWD"]}>
            <div className="surface p-6">
              <h3 className="text-lg font-semibold">Crowd‑пул задач</h3>
              <p className="subtle mt-2 text-sm">Исполнителям доступен отдельный экран микрозадач.</p>
              <a
                href="/crowd"
                className="mt-3 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold !text-white"
              >
                Перейти в крауд
              </a>
            </div>
          </RoleGate>
        </div>
      </section>
      </div>
    </RoleGate>
  );
}

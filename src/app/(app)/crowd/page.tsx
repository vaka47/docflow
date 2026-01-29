"use client";

import { useEffect, useState } from "react";
import RoleGate from "@/components/RoleGate";
import Modal from "@/components/Modal";

type Microtask = {
  id: string;
  title: string;
  status: "Open" | "In progress" | "Done";
  description?: string;
  source?: string;
  createdBy?: string;
  assignee?: string | null;
  team?: string;
  updatedAt?: string;
};

const crowdTeams = ["Crowd Pool", "Crowd QA", "Crowd Editors", "Crowd Review"];

const defaultMicrotasks: Microtask[] = [
  {
    id: "MT-01",
    title: "Проверить терминологию",
    status: "Open",
    description: "Сверить термины с глоссарием и отметить расхождения.",
    source: "FAQ по запуску Алисы",
    createdBy: "Анна Смирнова",
    team: "Crowd Pool",
  },
  {
    id: "MT-02",
    title: "Собрать FAQ по такси",
    status: "Open",
    description: "Собрать 10–15 типовых вопросов от поддержки.",
    source: "Intake: Taxi",
    createdBy: "Алексей Новиков",
    team: "Crowd QA",
  },
  {
    id: "MT-03",
    title: "Сверить ссылки на регламенты",
    status: "In progress",
    description: "Проверить актуальность ссылок на правовые документы.",
    source: "Регуляторика: отчетность",
    createdBy: "Юлия Волкова",
    assignee: "Игорь Денисов",
    team: "Crowd Pool",
  },
];

export default function CrowdPage() {
  const [items, setItems] = useState<Microtask[]>(() => {
    if (typeof window === "undefined") return defaultMicrotasks;
    const saved = localStorage.getItem("docflow-microtasks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Microtask[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // ignore
      }
    }
    localStorage.setItem("docflow-microtasks", JSON.stringify(defaultMicrotasks));
    return defaultMicrotasks;
  });
  const [role, setRole] = useState<string>("");
  const [meName, setMeName] = useState<string>("Неизвестный");
  const [meTeam, setMeTeam] = useState<string>("");
  const [active, setActive] = useState<Microtask | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newTeam, setNewTeam] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "progress" | "done">("all");
  const [activity, setActivity] = useState<string[]>([]);

  useEffect(() => {
    async function loadMe() {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const user = await res.json();
      if (user?.role) setRole(user.role);
      if (user?.name) setMeName(user.name);
      if (user?.team) setMeTeam(user.team);
    }
    loadMe();
  }, []);

  const canManage = role === "ADMIN" || role === "MANAGER";

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("docflow-microtasks-activity");
    if (saved) {
      try {
        setActivity(JSON.parse(saved));
      } catch {
        setActivity([]);
      }
    }
  }, []);

  function pushActivity(message: string) {
    setActivity((prev) => {
      const next = [`${new Date().toLocaleString()} · ${message}`, ...prev].slice(0, 50);
      if (typeof window !== "undefined") {
        localStorage.setItem("docflow-microtasks-activity", JSON.stringify(next));
      }
      return next;
    });
  }

  function sync(next: Microtask[]) {
    setItems(next);
    localStorage.setItem("docflow-microtasks", JSON.stringify(next));
  }

  function claim(id: string) {
    const current = items.find((item) => item.id === id);
    if (!current || current.status !== "Open") return;
    sync(
      items.map((item) =>
        item.id === id
          ? { ...item, status: "In progress", assignee: meName, updatedAt: new Date().toISOString() }
          : item
      )
    );
    const task = items.find((t) => t.id === id);
    pushActivity(`Взял задачу ${id} (${task?.title ?? "Без названия"}) — ${meName}`);
  }

  function done(id: string) {
    sync(
      items.map((item) =>
        item.id === id ? { ...item, status: "Done", updatedAt: new Date().toISOString() } : item
      )
    );
    const task = items.find((t) => t.id === id);
    pushActivity(`Завершил задачу ${id} (${task?.title ?? "Без названия"}) — ${meName}`);
  }

  function createTask() {
    if (!newTitle.trim()) return;
    const id = `MT-${String(items.length + 1).padStart(2, "0")}`;
    const resolvedTeam = teamOptions.includes(newTeam.trim())
      ? newTeam.trim()
      : teamOptions.includes(meTeam)
        ? meTeam
        : crowdTeams[0];
    const task: Microtask = {
      id,
      title: newTitle.trim(),
      description: newDescription.trim() || "Описание не указано.",
      source: newSource.trim() || "Не указан источник",
      status: "Open",
      createdBy: meName,
      team: resolvedTeam,
      updatedAt: new Date().toISOString(),
    };
    sync([task, ...items]);
    setNewTitle("");
    setNewDescription("");
    setNewSource("");
    setNewTeam("");
    pushActivity(`Создана задача ${id} (${task.title}) — ${meName}`);
  }

  const teamOptions = Array.from(
    new Set(
      [
        ...crowdTeams,
        ...items.map((item) => item.team).filter((team): team is string => Boolean(team)),
        ...(meTeam ? [meTeam] : []),
      ].filter(Boolean)
    )
  );
  const enforceMyTeamOnly = role === "CROWD" && Boolean(meTeam);

  return (
    <RoleGate allow={["CROWD", "ADMIN", "MANAGER"]}>
      <div className="grid gap-8">
        {canManage && (
          <section className="surface p-6">
            <h3 className="text-lg font-semibold">Создать микрозадачу</h3>
            <div className="mt-4 grid gap-3">
              <input
                className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
                placeholder="Заголовок"
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
              />
              <textarea
                className="min-h-[90px] rounded-2xl border border-black/10 px-3 py-2 text-sm"
                placeholder="Описание"
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
              />
              <input
                className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
                placeholder="Источник (документ/ссылка)"
                value={newSource}
                onChange={(event) => setNewSource(event.target.value)}
              />
              <div className="grid gap-2">
                <input
                  list="microtask-team-options"
                  className="rounded-2xl border border-black/10 px-3 py-2 text-sm"
                  placeholder="Подкоманда крауда (например, Crowd Pool)"
                  value={newTeam}
                  onChange={(event) => setNewTeam(event.target.value)}
                />
                <datalist id="microtask-team-options">
                  {teamOptions.map((team) => (
                    <option key={team} value={team} />
                  ))}
                </datalist>
              </div>
              <button
                className="w-fit rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
                onClick={createTask}
              >
                Добавить в пул
              </button>
            </div>
          </section>
        )}

        <section className="surface p-6">
          <h3 className="text-lg font-semibold">Мои задачи</h3>
          <div className="mt-4 grid gap-3 text-sm">
            {items
              .filter((item) => item.assignee === meName && item.status !== "Done")
              .map((item) => (
                <button
                  key={item.id}
                  className="rounded-2xl border border-black/10 bg-white p-3 text-left hover:border-[var(--accent)]"
                  onClick={() => setActive(item)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{item.title}</p>
                    <span className="text-xs text-black/50">{item.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-black/50 line-clamp-2">
                    {item.description || "Описание отсутствует"}
                  </p>
                </button>
              ))}
            {items.filter((item) => item.assignee === meName && item.status !== "Done").length === 0 && (
              <p className="text-xs text-black/50">Пока нет назначенных задач.</p>
            )}
          </div>
        </section>

        <section className="surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Очередь микрозадач</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-black/60">
              <button
                className={`rounded-full border px-3 py-1 ${statusFilter === "all" ? "border-[var(--accent)] text-[var(--accent)]" : "border-black/10"}`}
                onClick={() => setStatusFilter("all")}
              >
                Все
              </button>
              <button
                className={`rounded-full border px-3 py-1 ${statusFilter === "open" ? "border-[var(--accent)] text-[var(--accent)]" : "border-black/10"}`}
                onClick={() => setStatusFilter("open")}
              >
                Open
              </button>
              <button
                className={`rounded-full border px-3 py-1 ${statusFilter === "progress" ? "border-[var(--accent)] text-[var(--accent)]" : "border-black/10"}`}
                onClick={() => setStatusFilter("progress")}
              >
                In progress
              </button>
              <button
                className={`rounded-full border px-3 py-1 ${statusFilter === "done" ? "border-[var(--accent)] text-[var(--accent)]" : "border-black/10"}`}
                onClick={() => setStatusFilter("done")}
              >
                Done
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            {items
              .filter((item) => {
                if (enforceMyTeamOnly) {
                  return item.team === meTeam;
                }
                if (statusFilter === "open") return item.status === "Open";
                if (statusFilter === "progress") return item.status === "In progress";
                if (statusFilter === "done") return item.status === "Done";
                return true;
              })
              .map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                className="rounded-2xl border border-black/10 bg-white p-3 text-left hover:border-[var(--accent)] cursor-pointer"
                onClick={() => setActive(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActive(item);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{item.title}</p>
                  <span className="text-xs text-black/50">{item.status}</span>
                </div>
                {item.team && <p className="mt-1 text-xs text-black/40">Команда: {item.team}</p>}
                <p className="mt-2 text-xs text-black/50 line-clamp-2">
                  {item.description || "Описание отсутствует"}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    className={`rounded-full border px-3 py-1 text-xs ${
                      item.status === "Open"
                        ? "border-black/10"
                        : "border-black/10 text-black/40 cursor-not-allowed"
                    }`}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (item.status === "Open") claim(item.id);
                    }}
                    disabled={item.status !== "Open"}
                  >
                    {item.status === "Open" ? "Взять" : "Занято"}
                  </button>
                  <button
                    className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white"
                    onClick={(event) => {
                      event.stopPropagation();
                      done(item.id);
                    }}
                  >
                    Завершить
                  </button>
                </div>
              </div>
              ))}
            {items.filter((item) => {
              if (enforceMyTeamOnly) {
                return item.team === meTeam;
              }
              if (statusFilter === "open") return item.status === "Open";
              if (statusFilter === "progress") return item.status === "In progress";
              if (statusFilter === "done") return item.status === "Done";
              return true;
            }).length === 0 && (
              <p className="text-xs text-black/50">
                {enforceMyTeamOnly ? "Пока нет задач вашей команды." : "Пока нет задач."}
              </p>
            )}
          </div>
        </section>

        <section className="surface p-6">
          <h3 className="text-lg font-semibold">Лента действий</h3>
          <div className="mt-3 grid gap-2 text-xs text-black/60">
            {activity.map((item, idx) => (
              <div key={`${item}-${idx}`} className="rounded-2xl border border-black/10 bg-white px-3 py-2">
                {item}
              </div>
            ))}
            {activity.length === 0 && <p className="text-xs text-black/50">Действий пока нет.</p>}
          </div>
        </section>
      </div>

      <Modal
        open={Boolean(active)}
        title={active?.title ?? ""}
        onClose={() => setActive(null)}
      >
        {active && (
          <div className="grid gap-3 text-sm">
            <p><strong>Статус:</strong> {active.status}</p>
            <p><strong>Команда:</strong> {active.team ?? "—"}</p>
            <p><strong>Источник:</strong> {active.source ?? "—"}</p>
            <p><strong>Создал:</strong> {active.createdBy ?? "—"}</p>
            <p><strong>Исполнитель:</strong> {active.assignee ?? "—"}</p>
            <p><strong>Описание:</strong> {active.description ?? "—"}</p>
          </div>
        )}
      </Modal>
    </RoleGate>
  );
}

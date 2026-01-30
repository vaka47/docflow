"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Modal from "@/components/Modal";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Owner = { id: string; name: string; email: string; role: string; team?: string };

type RequestItem = {
  id: string;
  title: string;
  description: string;
  audience?: string;
  status: string;
  slaDays: number;
  dueAt?: string | null;
  type: string;
  owner: Owner;
  createdAt: string;
};

const statusMap: Record<string, { title: string; tone: string }> = {
  NEW: { title: "New", tone: "bg-amber-100 text-amber-900" },
  TRIAGE: { title: "Triage", tone: "bg-emerald-100 text-emerald-900" },
  IN_PROGRESS: { title: "In progress", tone: "bg-blue-100 text-blue-900" },
  REVIEW: { title: "Review", tone: "bg-violet-100 text-violet-900" },
  APPROVAL: { title: "Approval", tone: "bg-orange-100 text-orange-900" },
  PUBLISHED: { title: "Published", tone: "bg-slate-100 text-slate-800" },
};

const statuses = Object.keys(statusMap);

export default function WorkflowBoardClient() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [users, setUsers] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [meTeam, setMeTeam] = useState<string | null>(null);
  const [role, setRole] = useState<string>("MANAGER");
  const [toast, setToast] = useState<string | null>(null);
  const [activity, setActivity] = useState<{ id: string; action: string; createdAt: string; user: { name: string } }[]>([]);
  const [commentText, setCommentText] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  type Filter = "all" | "mine" | "overdue" | "regulatory" | "team";
  const [filter, setFilter] = useState<Filter>("all");
  const [now] = useState(() => Date.now());
  const lastCountRef = useRef<number | null>(null);
  const searchParams = useSearchParams();

  async function load() {
    setLoading(true);
    const res = await fetch("/api/requests", { cache: "no-store" });
    if (!res.ok) {
      setRequests([]);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setRequests(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function loadUsers() {
    const res = await fetch("/api/users");
    if (!res.ok) {
      setUsers([]);
      return;
    }
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  }

  async function loadMe() {
    const res = await fetch("/api/me");
    if (!res.ok) return;
    const user = await res.json();
    setMeEmail(user.email);
    setMeId(user.id);
    setRole(user.role || "MANAGER");
    setMeTeam(user.team || null);
  }

  useEffect(() => {
    load();
    loadUsers();
    loadMe();
  }, []);

  useEffect(() => {
    const id = searchParams.get("req");
    if (!id || requests.length === 0) return;
    const found = requests.find((item) => item.id === id);
    if (found) setSelected(found);
  }, [searchParams, requests]);

  useEffect(() => {
    if (!selected) return;
    const updated = requests.find((item) => item.id === selected.id);
    if (updated) {
      setSelected(updated);
    }
  }, [requests, selected]);

  useEffect(() => {
    async function loadActivity() {
      if (!selected) return;
      const res = await fetch(`/api/requests/${selected.id}/activity`);
      const data = await res.json();
      setActivity(Array.isArray(data) ? data : []);
    }
    loadActivity();
  }, [selected]);

  useEffect(() => {
    const es = new EventSource("/api/stream/requests");
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const count = typeof data?.count === "number" ? data.count : null;
        if (count === null || lastCountRef.current === null) {
          lastCountRef.current = count;
          load();
          return;
        }
        if (count !== lastCountRef.current) {
          lastCountRef.current = count;
          load();
        }
      } catch {
        load();
      }
    };
    return () => es.close();
  }, []);

  function pushNotification(message: string) {
    const list = JSON.parse(localStorage.getItem("docflow-notifications") || "[]");
    const item = { id: crypto.randomUUID(), message, ts: new Date().toISOString() };
    localStorage.setItem("docflow-notifications", JSON.stringify([item, ...list]));
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  function createMicrotaskFromTask(title: string) {
    const list = JSON.parse(localStorage.getItem("docflow-microtasks") || "[]");
    const item = {
      id: `MT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      title,
      status: "Open",
      team: "Crowd Pool",
    };
    localStorage.setItem("docflow-microtasks", JSON.stringify([item, ...list]));
    setToast("Микрозадача создана для crowd");
    setTimeout(() => setToast(null), 3000);
  }

  async function updateStatus(id: string, status: string) {
    const current = requests.find((item) => item.id === id);
    if (!current || current.status === status) return;
    const previous = requests;
    setRequests((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    if (selected && selected.id === id) {
      setSelected({ ...selected, status });
    }
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const data = await res.json();
          message = data?.detail || data?.error || message;
        } catch {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(message);
      }
      const updated = await res.json();
      setRequests((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
      await load();
      try {
        const list = JSON.parse(localStorage.getItem("docflow-chat-messages") || "[]");
        const message = {
          id: crypto.randomUUID(),
          channelId: status === "APPROVAL" || status === "PUBLISHED" ? "approvals" : "general",
          author: "System",
          text: `Статус задачи “${current.title}” изменен на ${statusMap[status]?.title ?? status}`,
          ts: new Date().toISOString(),
          type: "approval",
        };
        localStorage.setItem("docflow-chat-messages", JSON.stringify([message, ...list]));
      } catch {
        // ignore localStorage errors
      }
      if (meEmail && current.owner.email === meEmail) {
        pushNotification(`Статус задачи “${current.title}” изменен на ${statusMap[status].title}`);
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: current.owner.email,
            subject: "DocFlow: обновление статуса",
            text: `Статус задачи “${current.title}” изменен на ${statusMap[status].title}`,
          }),
        });
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `Обновлен статус: ${current.title} → ${statusMap[status].title}` }),
        });
      }
    } catch (error) {
      setRequests(previous);
      if (selected && selected.id === id) {
        setSelected(current);
      }
      setToast(error instanceof Error ? error.message : "Не удалось обновить статус (нет прав или ошибка сервера)");
    }
  }

  async function updateAssignment(id: string, ownerId: string, slaDays: number) {
    const current = requests.find((item) => item.id === id);
    setRequests((prev) =>
      prev.map((item) => (item.id === id ? { ...item, owner: users.find((u) => u.id === ownerId) || item.owner, slaDays } : item))
    );
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ownerId, slaDays }),
      });
      if (!res.ok) throw new Error("assignment failed");
      await load();
      const newOwner = users.find((user) => user.id === ownerId);
      if (newOwner) {
        if (meEmail && newOwner.email === meEmail) {
          pushNotification(`Вам назначена задача “${current?.title ?? "Документация"}”`);
        }
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: newOwner.email,
            subject: "DocFlow: назначена задача",
            text: `Вам назначена задача “${current?.title ?? "Документация"}”`,
          }),
        });
      }
    } catch {
      await load();
    }
  }

  async function updateDueAt(id: string, dueAt: string) {
    setRequests((prev) => prev.map((item) => (item.id === id ? { ...item, dueAt } : item)));
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ dueAt }),
      });
      if (!res.ok) throw new Error("due date failed");
      await load();
    } catch {
      await load();
    }
  }

  async function addComment() {
    if (!selected || !commentText.trim()) return;
    const text = commentText.trim();
    await fetch(`/api/requests/${selected.id}/activity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: `comment:${text}` }),
    });
    try {
      const list = JSON.parse(localStorage.getItem("docflow-chat-messages") || "[]");
      const dmChannelId = meId ? `dm:${[meId, selected.owner.id].sort().join(":")}` : `dm:${selected.owner.id}`;
      const message = {
        id: crypto.randomUUID(),
        channelId: dmChannelId,
        author: "System",
        text: `Комментарий к задаче “${selected.title}”: ${text}`,
        ts: new Date().toISOString(),
        type: "comment",
      };
      localStorage.setItem("docflow-chat-messages", JSON.stringify([message, ...list]));
    } catch {
      // ignore localStorage errors
    }
    setCommentText("");
    const res = await fetch(`/api/requests/${selected.id}/activity`);
    const data = await res.json();
    setActivity(Array.isArray(data) ? data : []);
  }

  function toDateInputValue(date: Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  const filterOptions = useMemo<Filter[]>(() => {
    if (role === "CROWD") return ["team"];
    return ["all", "mine", "overdue", "regulatory"];
  }, [role]);

  useEffect(() => {
    if (role === "CROWD") {
      setFilter("team");
    }
  }, [role]);

  const filtered = useMemo(() => {
    return requests.filter((item) => {
      if (role === "CROWD") {
        return meTeam ? item.owner.team === meTeam : false;
      }
      if (role === "REQUESTER") {
        return meEmail && item.owner.email === meEmail;
      }
      if (role === "LEGAL") {
        return item.type === "REGULATORY" || item.status === "APPROVAL";
      }
      if (filter === "team") return meTeam ? item.owner.team === meTeam : false;
      if (filter === "mine") return meEmail && item.owner.email === meEmail;
      if (filter === "regulatory") return item.type === "REGULATORY";
      if (filter === "overdue") {
        const created = new Date(item.createdAt);
        const deadline = new Date(created.getTime() + item.slaDays * 86400000);
        return now > deadline.getTime() && item.status !== "PUBLISHED";
      }
      return true;
    });
  }, [requests, filter, meEmail, now, role, meTeam]);

  const grouped = statuses.map((status) => ({
    status,
    ...statusMap[status],
    items: filtered.filter((item) => item.status === status),
  }));

  const canEdit = ["ADMIN", "MANAGER", "EDITOR"].includes(role);
  const canLegalApprove = role === "LEGAL";

  function onDragStart(event: React.DragEvent<HTMLDivElement>, id: string) {
    event.dataTransfer.setData("text/plain", id);
    setDraggingId(id);
  }

  function onDrop(event: React.DragEvent<HTMLDivElement>, status: string) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain") || draggingId;
    if (id) {
      updateStatus(id, status);
    }
    setDraggingId(null);
  }

  return (
    <section className="grid gap-6">
      {toast && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
        {filterOptions.map((key) => (
          <button
            key={key}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              filter === key ? "bg-[var(--accent)] text-white" : "border-black/10 bg-white"
            }`}
            onClick={() => setFilter(key)}
          >
            {key === "all" && "Все"}
            {key === "mine" && "Мои"}
            {key === "overdue" && "Просрочено"}
            {key === "regulatory" && "Регуляторика"}
            {key === "team" && "Моя команда"}
          </button>
        ))}
        {(role === "ADMIN" || role === "MANAGER" || role === "CROWD") && (
          <Link
            href="/crowd"
            className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-semibold text-black/70 hover:bg-black/5"
          >
            Crowd
          </Link>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {grouped.map((column) => (
          <div
            key={column.status}
            className="surface p-4 min-w-0"
            onDragOver={(event) => {
              if (!canEdit) return;
              event.preventDefault();
            }}
            onDrop={(event) => {
              if (!canEdit) return;
              onDrop(event, column.status);
            }}
          >
            <div className={`mb-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${column.tone}`}>
              {column.title}
            </div>
            <div className="grid gap-3">
              {loading && Array.from({ length: 2 }).map((_, idx) => (
                <div key={idx} className="rounded-2xl border border-black/5 bg-white p-3 text-xs text-black/30">Загрузка...</div>
              ))}
              {column.items.map((item) => {
                const isMine = meEmail && item.owner.email === meEmail;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border bg-white p-3 text-sm transition hover:border-[var(--accent)] cursor-pointer min-w-0 break-words ${
                      isMine ? "border-[var(--accent)]" : "border-black/10"
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(item)}
                    draggable={canEdit}
                    onDragStart={(event) => {
                      if (!canEdit) return;
                      onDragStart(event, item.id);
                    }}
                  >
                    <p className="text-xs text-black/40">{item.id.slice(-4).toUpperCase()}</p>
                    <p className="mt-2 font-semibold break-words">{item.title}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-black/50">
                      <span>{item.owner.name}</span>
                      <span className="rounded-full bg-black/5 px-2 py-1">SLA {item.slaDays}d</span>
                    </div>
                    {isMine && <span className="mt-2 inline-block text-xs font-semibold text-[var(--accent)]">Моя задача</span>}
                    {(canEdit || canLegalApprove) && (
                      <div className="mt-3">
                        <select
                          className="w-full rounded-xl border border-black/10 px-2 py-2 text-xs"
                          value={item.status}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => updateStatus(item.id, event.target.value)}
                        >
                        {(canLegalApprove
                          ? ["REVIEW", "APPROVAL", "PUBLISHED"]
                          : statuses
                        ).map((status) => (
                          <option key={status} value={status}>
                            {statusMap[status]?.title ?? status}
                          </option>
                        ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
              {!loading && column.items.length === 0 && (
                <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-3 text-xs text-black/40">
                  Нет задач
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={Boolean(selected)}
        title={selected ? `Задача ${selected.id.slice(-4).toUpperCase()}` : ""}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="grid gap-3">
            <p><strong>Название:</strong> {selected.title}</p>
            <p><strong>Описание:</strong> {selected.description}</p>
            {selected.audience && <p><strong>Аудитория:</strong> {selected.audience}</p>}
            <p><strong>Тип:</strong> {selected.type}</p>
            <p><strong>Статус:</strong> {statusMap[selected.status]?.title ?? selected.status}</p>
            <div className="grid gap-2">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Комментарий</label>
              <textarea
                className="min-h-[80px] rounded-xl border border-black/10 px-3 py-2 text-sm"
                placeholder="Комментарий для ответственного"
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
              />
              <button
                className="rounded-full border border-black/10 px-3 py-2 text-xs font-semibold"
                onClick={addComment}
              >
                Отправить комментарий
              </button>
            </div>
            {canEdit && (
              <>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Дедлайн</label>
                  <input
                    type="date"
                    className="rounded-xl border border-black/10 px-3 py-2 text-sm"
                    defaultValue={toDateInputValue(
                      selected.dueAt
                        ? new Date(selected.dueAt)
                        : new Date(new Date(selected.createdAt).getTime() + selected.slaDays * 86400000)
                    )}
                    onBlur={(event) => updateDueAt(selected.id, new Date(event.target.value).toISOString())}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Ответственный</label>
                  <select
                    className="rounded-xl border border-black/10 px-3 py-2 text-sm"
                    value={selected.owner.id}
                    onChange={(event) => updateAssignment(selected.id, event.target.value, selected.slaDays)}
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} · {user.role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">SLA (дней)</label>
                  <input
                    type="number"
                    min={1}
                    className="rounded-xl border border-black/10 px-3 py-2 text-sm"
                    defaultValue={selected.slaDays}
                    onBlur={(event) => updateAssignment(selected.id, selected.owner.id, Number(event.target.value))}
                  />
                </div>
                <button
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
                  onClick={() => createMicrotaskFromTask(selected.title)}
                >
                  Создать микрозадачу
                </button>
              </>
            )}
            <div className="mt-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Approval / история</p>
              <div className="mt-2 grid gap-2 text-xs">
                {activity
                  .filter((item) => item.action.startsWith("status:") || item.action.startsWith("comment:"))
                  .map((item) => (
                    <div key={item.id} className="rounded-xl border border-black/10 bg-white p-2">
                      <p className="font-semibold">{item.user?.name ?? "System"}</p>
                      <p className="text-black/60">{item.action.replace("status:", "Статус: ").replace("comment:", "Комментарий: ")}</p>
                      <p className="text-black/40">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                {activity.length === 0 && <p className="text-black/40">Нет событий</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import RoleGate from "@/components/RoleGate";
import Modal from "@/components/Modal";

type User = { id: string; name: string; email: string; role: string; team?: string | null };
type RequestItem = {
  id: string;
  title: string;
  status: string;
  owner: { id: string };
  createdAt: string;
  dueAt?: string | null;
  slaDays: number;
  publishedAt?: string | null;
  description?: string;
  type?: string;
  audience?: string;
};
type Message = {
  id: string;
  channelId: string;
  author: string;
  authorId?: string | null;
  text: string;
  ts: string;
  type?: "text" | "approval" | "comment";
  replyTo?: { id: string; author: string; text: string } | null;
  attachments?: { name: string; type: string; size: number; dataUrl?: string }[];
};

const baseChannels = [
  { id: "general", name: "#general" },
  { id: "approvals", name: "#approvals" },
  { id: "support", name: "#support" },
];

const messageKey = "docflow-chat-messages";
const readKey = "docflow-chat-lastread";

function safeParse<T>(value: string | null, fallback: T): T {
  try {
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getDmChannelId(a: string, b: string) {
  return `dm:${[a, b].sort().join(":")}`;
}

export default function TeamChatClient() {
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    return safeParse(localStorage.getItem(messageKey), []);
  });
  const [active, setActive] = useState<string>("general");
  const [text, setText] = useState("");
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"team" | "chat">("team");
  const [now] = useState(() => Date.now());
  const [teamQuery, setTeamQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [chatQuery, setChatQuery] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [attachment, setAttachment] = useState<{ name: string; type: string; size: number; dataUrl: string } | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<RequestItem | null>(null);
  const [lastRead, setLastRead] = useState<Record<string, Record<string, number>>>(() => {
    if (typeof window === "undefined") return {};
    return safeParse(localStorage.getItem(readKey), {});
  });

  useEffect(() => {
    async function load() {
      const u = await fetch("/api/users");
      const r = await fetch("/api/requests", { cache: "no-store" });
      const m = await fetch("/api/me");
      const uData = u.ok ? await u.json() : [];
      const rData = r.ok ? await r.json() : [];
      const mData = m.ok ? await m.json() : null;
      setUsers(Array.isArray(uData) ? uData : []);
      setRequests(Array.isArray(rData) ? rData : []);
      setMe(mData?.id ? mData : null);
    }
    load();
  }, []);

  useEffect(() => {
    function syncStorage(event: StorageEvent) {
      if (event.key === messageKey) {
        setMessages(safeParse(event.newValue, []));
      }
      if (event.key === readKey) {
        setLastRead(safeParse(event.newValue, {}));
      }
    }
    window.addEventListener("storage", syncStorage);
    return () => window.removeEventListener("storage", syncStorage);
  }, []);

  useEffect(() => {
    if (!me?.id || messages.length === 0) return;
    let changed = false;
    const normalized = messages.map((msg) => {
      if (!msg.channelId.startsWith("dm:")) return msg;
      const parts = msg.channelId.split(":");
      if (parts.length === 2) {
        const otherId = parts[1];
        const nextId = getDmChannelId(me.id, otherId);
        if (nextId !== msg.channelId) {
          changed = true;
          return { ...msg, channelId: nextId };
        }
      }
      return msg;
    });
    if (changed) save(normalized);
  }, [me, messages]);

  const dmChannels = useMemo(() => {
    if (!me?.id) return [];
    return users
      .filter((user) => user.id !== me.id)
      .map((user) => ({
        id: getDmChannelId(me.id, user.id),
        name: `@${user.name}`,
        user,
      }));
  }, [users, me]);

  const teamChannels = useMemo(() => {
    const names = Array.from(new Set(users.map((u) => u.team || u.role).filter(Boolean)));
    return names.map((name) => ({
      id: `team:${name}`,
      name: `#${name}`,
    }));
  }, [users]);

  const activeMessages = useMemo(() => {
    return messages
      .filter((msg) => msg.channelId === active)
      .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
  }, [messages, active]);

  const lastReadForMe = useMemo(() => {
    if (!me?.id) return {};
    return lastRead[me.id] ?? {};
  }, [lastRead, me]);

  const unreadByChannel = useMemo(() => {
    if (!me?.id) return {};
    const result: Record<string, number> = {};
    for (const msg of messages) {
      const last = lastReadForMe[msg.channelId] ?? 0;
      const ts = new Date(msg.ts).getTime();
      if (ts <= last) continue;
      if (msg.authorId && msg.authorId === me.id) continue;
      result[msg.channelId] = (result[msg.channelId] ?? 0) + 1;
    }
    return result;
  }, [messages, lastReadForMe, me]);

  const totalUnread = useMemo(() => {
    return Object.values(unreadByChannel).reduce((sum, value) => sum + value, 0);
  }, [unreadByChannel]);

  const sortedDmChannels = useMemo(() => {
    return [...dmChannels]
      .filter((channel) => channel.user)
      .sort((a, b) => {
        const unreadA = unreadByChannel[a.id] ?? 0;
        const unreadB = unreadByChannel[b.id] ?? 0;
        if (unreadA !== unreadB) return unreadB - unreadA;
        return a.user.name.localeCompare(b.user.name);
      });
  }, [dmChannels, unreadByChannel]);

  const unreadContacts = useMemo(() => {
    return sortedDmChannels
      .filter((channel) => (unreadByChannel[channel.id] ?? 0) > 0)
      .map((channel) => ({
        id: channel.id,
        name: channel.user?.name ?? "User",
        unread: unreadByChannel[channel.id] ?? 0,
      }));
  }, [sortedDmChannels, unreadByChannel]);

  const filteredTeamChannels = useMemo(() => {
    const q = chatQuery.trim().toLowerCase();
    if (!q) return teamChannels;
    return teamChannels.filter((channel) => channel.name.toLowerCase().includes(q));
  }, [teamChannels, chatQuery]);

  const filteredDmChannels = useMemo(() => {
    const q = chatQuery.trim().toLowerCase();
    if (!q) return sortedDmChannels;
    return sortedDmChannels.filter((channel) => {
      const name = channel.user?.name ?? "";
      const email = channel.user?.email ?? "";
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
    });
  }, [sortedDmChannels, chatQuery]);

  const teamStats = useMemo(() => {
    const teamNames = Array.from(
      new Set(
        users
          .map((u) => u.team || u.role)
          .filter(Boolean)
      )
    );
    return teamNames.map((teamName) => {
      const members = users.filter((u) => (u.team || u.role) === teamName);
      const owned = requests.filter((req) => members.some((m) => m.id === req.owner.id));
      const done = owned.filter((req) => req.status === "PUBLISHED").length;
      return { team: { id: teamName, name: teamName }, members, total: owned.length, done };
    });
  }, [users, requests]);

  const kpi = useMemo(() => {
    return users.map((user) => {
      const owned = requests.filter((req) => req.owner.id === user.id);
      const leadTimes = owned
        .filter((req) => req.publishedAt)
        .map((req) => {
          const created = new Date(req.createdAt);
          const published = new Date(req.publishedAt as string);
          return Math.round((published.getTime() - created.getTime()) / 86400000);
        });
      const leadAvg = leadTimes.length ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length) : 0;
      const overdue = owned.filter((req) => {
        const deadline = req.dueAt
          ? new Date(req.dueAt)
          : new Date(new Date(req.createdAt).getTime() + req.slaDays * 86400000);
        if (req.publishedAt) return new Date(req.publishedAt) > deadline;
        return now > deadline.getTime();
      }).length;
      return { user, total: owned.length, leadAvg, overdue };
    });
  }, [users, requests, now]);

  const kpiGrouped = useMemo(() => {
    const sorted = [...kpi].sort((a, b) => {
      const teamA = (a.user.team || a.user.role || "").toString();
      const teamB = (b.user.team || b.user.role || "").toString();
      if (teamA !== teamB) return teamA.localeCompare(teamB);
      return a.user.name.localeCompare(b.user.name);
    });
    const groups: { team: string; rows: typeof kpi }[] = [];
    for (const row of sorted) {
      const team = (row.user.team || row.user.role || "General").toString();
      const last = groups[groups.length - 1];
      if (!last || last.team !== team) {
        groups.push({ team, rows: [row] });
      } else {
        last.rows.push(row);
      }
    }
    return groups;
  }, [kpi]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.team || user.role).toLowerCase().includes(q)
      );
    });
  }, [users, userQuery]);

  const filteredTeamStats = useMemo(() => {
    const q = teamQuery.trim().toLowerCase();
    const userQ = userQuery.trim().toLowerCase();
    const base = teamStats.filter((item) => {
      if (!q) return true;
      if (item.team.name.toLowerCase().includes(q)) return true;
      return item.members.some((member) => member.name.toLowerCase().includes(q) || member.email.toLowerCase().includes(q));
    });
    if (!userQ) return base;
    const teamsFromUsers = new Set(
      filteredUsers.map((user) => (user.team || user.role)).filter(Boolean)
    );
    return base.filter((item) => teamsFromUsers.has(item.team.name) || item.team.name.toLowerCase().includes(q));
  }, [teamStats, teamQuery, userQuery, filteredUsers]);

  function save(next: Message[]) {
    const sorted = [...next].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
    setMessages(sorted);
    localStorage.setItem(messageKey, JSON.stringify(sorted));
  }

  useEffect(() => {
    if (!me?.id) return;
    const latest = activeMessages[activeMessages.length - 1];
    if (!latest) return;
    const last = lastReadForMe[active] ?? 0;
    const ts = new Date(latest.ts).getTime();
    if (ts <= last) return;
    const updated = {
      ...lastRead,
      [me.id]: { ...lastReadForMe, [active]: Date.now() },
    };
    setLastRead(updated);
    localStorage.setItem(readKey, JSON.stringify(updated));
  }, [active, activeMessages, lastRead, lastReadForMe, me]);

  function sendMessage() {
    if (!text.trim() && !attachment) return;
    if (attachmentError) return;
    const item: Message = {
      id: crypto.randomUUID(),
      channelId: active,
      author: me?.name ?? "User",
      authorId: me?.id ?? null,
      text: text.trim(),
      ts: new Date().toISOString(),
      type: "text",
      replyTo: replyTo
        ? {
            id: replyTo.id,
            author: replyTo.author,
            text: replyTo.text,
          }
        : null,
      attachments: attachment ? [attachment] : [],
    };
    save([...messages, item]);
    if (me?.id) {
      const updated = {
        ...lastRead,
        [me.id]: { ...(lastReadForMe || {}), [active]: Date.now() },
      };
      setLastRead(updated);
      localStorage.setItem(readKey, JSON.stringify(updated));
    }
    setText("");
    setReplyTo(null);
    setAttachment(null);
    setAttachmentError(null);
  }

  function handleAttach(file: File | null) {
    if (!file) return;
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      setAttachmentError("Только PDF/DOC/DOCX");
      setAttachment(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAttachmentError("Файл больше 10MB");
      setAttachment(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: typeof reader.result === "string" ? reader.result : "",
      });
      setAttachmentError(null);
    };
    reader.onerror = () => {
      setAttachmentError("Не удалось прочитать файл");
      setAttachment(null);
    };
    reader.readAsDataURL(file);
  }

  return (
    <RoleGate allow={["ADMIN", "MANAGER", "EDITOR", "LEGAL", "REQUESTER", "CROWD"]}>
      <div className="grid gap-8">
        <section className="surface p-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "team", label: "Команда" },
              { id: "chat", label: "Чат" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  activeTab === tab.id ? "bg-[var(--accent)] text-white" : "border-black/10 bg-white"
                }`}
                onClick={() => setActiveTab(tab.id as "team" | "chat")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "team" && (
            <div className="mt-6 grid gap-6">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
                  placeholder="Поиск команды..."
                  value={teamQuery}
                  onChange={(event) => setTeamQuery(event.target.value)}
                />
                <input
                  className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
                  placeholder="Поиск сотрудника..."
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                />
              </div>

              {userQuery.trim() && (
                <div className="grid gap-3 md:grid-cols-3 text-sm">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      className="rounded-2xl border border-black/10 bg-white p-4 text-left hover:border-[var(--accent)]"
                      onClick={() => setActiveUser(user)}
                    >
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-black/50">{user.email}</p>
                      <p className="mt-2 text-xs text-black/50">{user.team || user.role}</p>
                    </button>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-4 text-xs text-black/40">
                      Пользователь не найден.
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3 text-sm">
                  {filteredTeamStats.map((item) => {
                  const members = userQuery
                    ? item.members.filter((member) => {
                        const q = userQuery.toLowerCase();
                        return (
                          member.name.toLowerCase().includes(q) ||
                          member.email.toLowerCase().includes(q) ||
                          (member.team || member.role).toLowerCase().includes(q)
                        );
                      })
                    : item.members;
                  return (
                  <div
                    key={item.team.id}
                    className="rounded-2xl border border-black/10 bg-white p-4 text-left hover:border-[var(--accent)] cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveTeam(item.team.id)}
                  >
                    <p className="font-semibold">{item.team.name}</p>
                    <p className="text-xs text-black/50">Участников: {item.members.length}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="pill bg-white">Всего: {item.total}</span>
                      <span className="pill bg-white">Готово: {item.done}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {members.slice(0, 6).map((member) => (
                        <button
                          key={member.id}
                          className="rounded-full border border-black/10 bg-white px-2 py-1 hover:border-[var(--accent)]"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveUser(member);
                          }}
                        >
                          {member.name}
                        </button>
                      ))}
                      {members.length === 0 && <span className="text-black/40">Нет участников</span>}
                    </div>
                  </div>
                )})}
                {filteredTeamStats.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 p-4 text-xs text-black/40">
                    Ничего не найдено по запросу.
                  </div>
                )}
              </div>

              <div className="surface p-4">
                <h2 className="text-lg font-semibold">Командный отчет (KPI)</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-black text-white">
                      <tr>
                        <th className="p-3">Сотрудник</th>
                        <th className="p-3">Команда</th>
                        <th className="p-3">Роль</th>
                        <th className="p-3">Задач</th>
                        <th className="p-3">Средн. Lead time</th>
                        <th className="p-3">SLA просрочки</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kpiGrouped.map((group) => (
                        <Fragment key={`team-${group.team}`}>
                          <tr className="bg-black/5 text-xs font-semibold">
                            <td className="p-3" colSpan={6}>
                              {group.team}
                            </td>
                          </tr>
                          {group.rows.map((row) => (
                            <tr key={row.user.id} className="border-b border-black/5">
                              <td className="p-3">
                                <button
                                  className="text-left font-semibold text-[var(--accent)] underline"
                                  onClick={() => setActiveUser(row.user)}
                                >
                                  {row.user.name}
                                </button>
                              </td>
                              <td className="p-3">{row.user.team || row.user.role}</td>
                              <td className="p-3">{row.user.role}</td>
                              <td className="p-3">{row.total}</td>
                              <td className="p-3">{row.leadAvg} дн.</td>
                              <td className="p-3 text-red-600">{row.overdue}</td>
                            </tr>
                          ))}
                        </Fragment>
                      ))}
                      {kpiGrouped.length === 0 && (
                        <tr>
                          <td className="p-3 text-sm text-black/50" colSpan={6}>
                            Нет данных по KPI.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="mt-6 grid gap-4 lg:grid-cols-[0.28fr_0.72fr]">
              <div className="surface p-4">
                <h3 className="text-lg font-semibold">Каналы</h3>
                <div className="mt-3 rounded-2xl border-2 border-black/80 bg-white p-1">
                  <input
                    className="w-full rounded-xl border border-transparent px-3 py-2 text-sm outline-none"
                    placeholder="Поиск каналов, команд, людей..."
                    value={chatQuery}
                    onChange={(event) => setChatQuery(event.target.value)}
                  />
                </div>
                <div className="mt-3 grid gap-2 text-sm">
                  {baseChannels
                    .filter((channel) => channel.name.toLowerCase().includes(chatQuery.trim().toLowerCase()))
                    .map((channel) => (
                    <button
                      key={channel.id}
                      className={`rounded-2xl border px-3 py-2 text-left ${
                        active === channel.id ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-black/10"
                      }`}
                      onClick={() => setActive(channel.id)}
                    >
                      <span className="flex items-center justify-between">
                        <span>{channel.name}</span>
                        {unreadByChannel[channel.id] ? (
                          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] text-white">
                            {unreadByChannel[channel.id] > 9 ? "9+" : unreadByChannel[channel.id]}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>

                <h3 className="mt-6 text-lg font-semibold">Командные</h3>
                <div className="mt-3 grid gap-2 text-sm">
                  {filteredTeamChannels.map((channel) => (
                    <button
                      key={channel.id}
                      className={`rounded-2xl border px-3 py-2 text-left ${
                        active === channel.id ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-black/10"
                      }`}
                      onClick={() => setActive(channel.id)}
                    >
                      <span className="flex items-center justify-between">
                        <span>{channel.name}</span>
                        {unreadByChannel[channel.id] ? (
                          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] text-white">
                            {unreadByChannel[channel.id] > 9 ? "9+" : unreadByChannel[channel.id]}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                  {filteredTeamChannels.length === 0 && <p className="text-xs text-black/40">Нет команд</p>}
                </div>

                <h3 className="mt-6 text-lg font-semibold">Личные</h3>
                <div className="mt-3 grid gap-2 text-sm">
                  {filteredDmChannels.map((channel) => (
                    <button
                      key={channel.id}
                      className={`rounded-2xl border px-3 py-2 text-left ${
                        active === channel.id ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-black/10"
                      }`}
                      onClick={() => setActive(channel.id)}
                    >
                      <span className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span>{channel.name}</span>
                          {(unreadByChannel[channel.id] ?? 0) > 0 && (
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                          )}
                        </span>
                        {unreadByChannel[channel.id] ? (
                          <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[10px] text-white">
                            {unreadByChannel[channel.id] > 9 ? "9+" : unreadByChannel[channel.id]}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                  {filteredDmChannels.length === 0 && <p className="text-xs text-black/40">Нет участников</p>}
                </div>
              </div>

            <div className="surface p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {baseChannels.find((c) => c.id === active)?.name ??
                    teamChannels.find((c) => c.id === active)?.name ??
                    dmChannels.find((c) => c.id === active)?.name ??
                    "Чат"}
                </h3>
                <span className="text-xs text-black/40">Онлайн: {users.length}</span>
              </div>

              {unreadContacts.length > 0 && (
                <div className="mt-3 rounded-2xl border border-black/10 bg-white px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/50">
                    Непрочитанные
                  </p>
                  <div className="mt-2 flex items-center gap-2 overflow-x-auto text-xs">
                    {unreadContacts.map((contact) => (
                      <button
                        key={contact.id}
                        className="whitespace-nowrap rounded-full border border-black/10 bg-white px-3 py-1"
                        onClick={() => setActive(contact.id)}
                      >
                        {contact.name} · {contact.unread > 9 ? "9+" : contact.unread}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex min-h-[320px] flex-col gap-2 overflow-auto rounded-2xl border border-black/10 bg-white p-3 text-sm">
                  {activeMessages.length === 0 && <p className="text-xs text-black/40">Сообщений пока нет.</p>}
                  {activeMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl border p-2 text-left ${
                        msg.authorId && msg.authorId === me?.id
                          ? "border-black/10 bg-slate-100 self-end"
                          : "border-red-100 bg-red-50"
                      }`}
                      onClick={() => setReplyTo(msg)}
                    >
                      <div className="flex items-center justify-between text-xs text-black/50">
                        <span>{msg.author}</span>
                        <span>{new Date(msg.ts).toLocaleTimeString()}</span>
                      </div>
                      {msg.replyTo && (
                        <div className="mt-1 rounded-lg border border-black/10 bg-black/5 px-2 py-1 text-[11px] text-black/60">
                          <strong>{msg.replyTo.author}:</strong> {msg.replyTo.text}
                        </div>
                      )}
                      <p className="mt-1">{msg.text}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-black/60">
                          {msg.attachments.map((file) => (
                            <button
                              key={file.name}
                              className="rounded-full border border-black/10 px-2 py-1 underline"
                              onClick={(event) => {
                                event.stopPropagation();
                                if (!file.dataUrl) return;
                                const link = document.createElement("a");
                                link.href = file.dataUrl;
                                link.download = file.name;
                                link.click();
                              }}
                            >
                              Скачать {file.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  {replyTo && (
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs">
                      <span>
                        Ответ: <strong>{replyTo.author}</strong> · {replyTo.text}
                      </span>
                      <button className="text-xs font-semibold text-[var(--accent)]" onClick={() => setReplyTo(null)}>
                        Отменить
                      </button>
                    </div>
                  )}
                  {attachment && (
                    <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs">
                      <span>Файл: {attachment.name}</span>
                      <button className="text-xs font-semibold text-[var(--accent)]" onClick={() => setAttachment(null)}>
                        Убрать
                      </button>
                    </div>
                  )}
                  {attachmentError && <p className="text-xs text-red-600">{attachmentError}</p>}
                  <textarea
                    className="min-h-[90px] rounded-2xl border border-black/10 px-3 py-2 text-sm"
                    placeholder="Напишите сообщение..."
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="cursor-pointer rounded-2xl border border-black/10 px-4 py-2 text-xs font-semibold">
                      Прикрепить файл
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(event) => handleAttach(event.target.files?.[0] ?? null)}
                      />
                    </label>
                    <button
                      className="rounded-2xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white"
                      onClick={sendMessage}
                    >
                      Отправить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <Modal
        open={Boolean(activeUser)}
        title={activeUser ? `Профиль: ${activeUser.name}` : ""}
        onClose={() => setActiveUser(null)}
      >
        {activeUser && (
          <div className="grid gap-3 text-sm">
            <p><strong>Роль:</strong> {activeUser.role}</p>
            <p><strong>Email:</strong> {activeUser.email}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Задачи</p>
            <div className="grid gap-2">
              {requests.filter((req) => req.owner.id === activeUser.id).map((req) => (
                <button
                  key={req.id}
                  className="rounded-xl border border-black/10 bg-white p-2 text-left text-xs hover:border-[var(--accent)]"
                  onClick={() => setActiveTask(req)}
                >
                  <p className="font-semibold">{req.title}</p>
                  <p className="text-black/50">{req.status}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(activeTeam)}
        title={activeTeam ? `Команда: ${activeTeam}` : ""}
        onClose={() => setActiveTeam(null)}
      >
        {activeTeam && (
          <div className="grid gap-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Участники</p>
            <div className="grid gap-2">
              {filteredUsers
                .filter((u) => (u.team || u.role) === activeTeam)
                .map((u) => (
                <button
                  key={u.id}
                  className="rounded-xl border border-black/10 bg-white p-2 text-left text-xs hover:border-[var(--accent)]"
                  onClick={() => setActiveUser(u)}
                >
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-black/50">{u.email}</p>
                </button>
              ))}
              {filteredUsers.filter((u) => (u.team || u.role) === activeTeam).length === 0 && (
                <p className="text-xs text-black/40">Нет участников по фильтру.</p>
              )}
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Задачи команды</p>
            <div className="grid gap-2">
              {requests
                .filter((req) => (users.find((u) => u.id === req.owner.id)?.team || users.find((u) => u.id === req.owner.id)?.role) === activeTeam)
                .map((req) => (
                  <div key={req.id} className="rounded-xl border border-black/10 bg-white p-2 text-xs">
                    <p className="font-semibold">{req.title}</p>
                    <p className="text-black/50">{req.status}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(activeTask)}
        title={activeTask ? `Задача: ${activeTask.title}` : ""}
        onClose={() => setActiveTask(null)}
      >
        {activeTask && (
          <div className="grid gap-2 text-sm">
            <p><strong>Статус:</strong> {activeTask.status}</p>
            {activeTask.type && <p><strong>Тип:</strong> {activeTask.type}</p>}
            {activeTask.audience && <p><strong>Аудитория:</strong> {activeTask.audience}</p>}
            {activeTask.description && <p><strong>Описание:</strong> {activeTask.description}</p>}
            <p><strong>SLA:</strong> {activeTask.slaDays} дней</p>
          </div>
        )}
      </Modal>
    </RoleGate>
  );
}

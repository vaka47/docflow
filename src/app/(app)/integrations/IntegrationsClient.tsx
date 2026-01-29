"use client";

import { useEffect, useState } from "react";

type LogItem = {
  id: string;
  requestId: string;
  system: string;
  status: string;
  payload: string;
  createdAt: string;
};

const connections = [
  {
    name: "Tracker",
    status: "Connected",
    description: "Создание задач, статусы и SLA",
  },
  {
    name: "Wiki",
    status: "Connected",
    description: "Публикации и версии документов",
  },
  {
    name: "Chat",
    status: "Pending",
    description: "Оповещения о назначениях и SLA",
  },
  {
    name: "Release",
    status: "Connected",
    description: "Триггеры из релизов/PR",
  },
];

export default function IntegrationsClient() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [requestId, setRequestId] = useState("");
  const [system, setSystem] = useState("Tracker");
  const [autoTitle, setAutoTitle] = useState("Новая задача из интеграции");
  const [autoDescription, setAutoDescription] = useState("Автосоздано через webhook");
  const [autoTeam, setAutoTeam] = useState("");
  const [autoOwnerId, setAutoOwnerId] = useState("");
  const [autoAudience, setAutoAudience] = useState("Пользователи сервиса");
  const [autoType, setAutoType] = useState("OTHER");
  const [autoSla, setAutoSla] = useState("7");
  const [secret, setSecret] = useState("");
  const [autoCreatedId, setAutoCreatedId] = useState("");
  const [copied, setCopied] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("/api/integrations");
  const [trackerUrl, setTrackerUrl] = useState("/api/integrations/tracker");
  const [users, setUsers] = useState<{ id: string; name: string; team?: string | null; role?: string }[]>([]);

  async function load() {
    const res = await fetch("/api/integrations", { cache: "no-store" });
    const data = await res.json();
    setLogs(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    if (typeof window !== "undefined") {
      setWebhookUrl(`${window.location.origin}/api/integrations`);
      setTrackerUrl(`${window.location.origin}/api/integrations/tracker`);
    }
  }, []);

  useEffect(() => {
    async function loadUsers() {
      const res = await fetch("/api/users");
      if (!res.ok) return;
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    }
    loadUsers();
  }, []);

  async function sendTest(event: React.FormEvent) {
    event.preventDefault();
    await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(secret ? { "x-docflow-secret": secret } : {}) },
      body: JSON.stringify({
        requestId,
        system,
        status: "ok",
        payload: { event: "webhook", ts: new Date().toISOString() },
      }),
    });
    setRequestId("");
    await load();
  }

  async function sendAutoCreate(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(secret ? { "x-docflow-secret": secret } : {}) },
      body: JSON.stringify({
        system: "Webhook",
        title: autoTitle,
        description: autoDescription,
        audience: autoAudience,
        type: autoType,
        slaDays: autoSla,
        ownerId: autoOwnerId || undefined,
        status: "created",
        payload: { source: "integration", team: autoTeam, ts: new Date().toISOString() },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setAutoCreatedId(data?.createdRequestId || "");
    }
    await load();
  }

  async function copyWebhook() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="grid gap-8">
      <section className="surface p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">Integrations</p>
        <h1 className="section-title mt-3 text-3xl md:text-4xl">Интеграции и события</h1>
        <p className="subtle mt-3 text-sm">
          Здесь подключаем источники сигналов: трекер, релизы, чат и базу публикаций. Это позволяет автоматически создавать
          задачи, менять статусы и отправлять уведомления.
        </p>
        <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="font-semibold">1. Подключите системы</p>
            <p className="subtle mt-2 text-xs">Добавьте webhook в трекер/релиз и выберите события.</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="font-semibold">2. Проверьте события</p>
            <p className="subtle mt-2 text-xs">Отправьте тестовый webhook и проверьте лог.</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="font-semibold">3. Запускайте автоматизацию</p>
            <p className="subtle mt-2 text-xs">Статусы и SLA обновляются автоматически.</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {connections.map((item) => (
          <div key={item.name} className="surface p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <span
                className={`pill ${
                  item.status === "Connected"
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {item.status}
              </span>
            </div>
            <p className="subtle mt-2 text-sm">{item.description}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-black/10 px-3 py-1">Webhook</span>
              <span className="rounded-full border border-black/10 px-3 py-1">{webhookUrl}</span>
              <button
                className="rounded-full border border-black/10 px-3 py-1"
                type="button"
                onClick={copyWebhook}
              >
                {copied ? "Скопировано" : "Скопировать"}
              </button>
            </div>
            <div className="mt-4 flex gap-2 text-xs">
              <button className="rounded-full border border-black/10 px-3 py-1" type="button">
                Настроить
              </button>
              <button className="rounded-full border border-black/10 px-3 py-1" type="button">
                Проверить
              </button>
            </div>
          </div>
        ))}
      </section>

      <form className="surface grid gap-4 p-6" onSubmit={sendAutoCreate}>
        <h3 className="text-lg font-semibold">Автосоздание заявки (входящий webhook)</h3>
        <p className="subtle text-sm">
          Прямо сейчас можно подключить только входящий webhook. Он создаёт новую заявку автоматически.
        </p>
        <input
          className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          placeholder="Webhook secret (если задан в .env)"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
        />
        <input
          className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          placeholder="Заголовок заявки"
          value={autoTitle}
          onChange={(event) => setAutoTitle(event.target.value)}
          required
        />
        <textarea
          className="min-h-[100px] rounded-2xl border border-black/10 px-4 py-3 text-sm"
          placeholder="Описание"
          value={autoDescription}
          onChange={(event) => setAutoDescription(event.target.value)}
          required
        />
        <input
          className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          placeholder="Команда (опционально)"
          value={autoTeam}
          onChange={(event) => setAutoTeam(event.target.value)}
        />
        <select
          className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          value={autoOwnerId}
          onChange={(event) => setAutoOwnerId(event.target.value)}
        >
          <option value="">Автоназначение</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} · {u.role}
            </option>
          ))}
        </select>
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
            value={autoAudience}
            onChange={(event) => setAutoAudience(event.target.value)}
          >
            <option>Пользователи сервиса</option>
            <option>Водители / исполнители</option>
            <option>Партнеры B2B</option>
            <option>Внутренние команды</option>
            <option>Регуляторы / Legal</option>
          </select>
          <select
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
            value={autoType}
            onChange={(event) => setAutoType(event.target.value)}
          >
            <option value="FEATURE">Feature</option>
            <option value="CHANGE">Change</option>
            <option value="REGULATORY">Regulatory</option>
            <option value="FAQ">FAQ</option>
            <option value="OTHER">Other</option>
          </select>
          <select
            className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
            value={autoSla}
            onChange={(event) => setAutoSla(event.target.value)}
          >
            <option value="2">2 дня</option>
            <option value="5">5 дней</option>
            <option value="10">10 дней</option>
            <option value="7">7 дней</option>
          </select>
        </div>
        <button className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white">
          Создать заявку
        </button>
        {autoCreatedId && (
          <p className="text-xs text-emerald-700">Создана заявка: {autoCreatedId}</p>
        )}
      </form>

      <form className="surface grid gap-4 p-6" onSubmit={sendTest}>
        <h3 className="text-lg font-semibold">Тестовый webhook</h3>
        <p className="subtle text-sm">
          Быстрый способ проверить интеграцию. Request ID можно указать, чтобы привязать событие к задаче.
        </p>
        <div className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs">
          Endpoint: <span className="font-semibold">{webhookUrl}</span>
        </div>
        <div className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-xs">
          Tracker endpoint: <span className="font-semibold">{trackerUrl}</span>
        </div>
        <input
          className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          placeholder="Request ID (опционально)"
          value={requestId}
          onChange={(event) => setRequestId(event.target.value)}
        />
        <select
          className="rounded-2xl border border-black/10 px-4 py-3 text-sm"
          value={system}
          onChange={(event) => setSystem(event.target.value)}
        >
          <option>Tracker</option>
          <option>Wiki</option>
          <option>Chat</option>
          <option>Release</option>
        </select>
        <button className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white">
          Отправить
        </button>
      </form>

      <section className="surface p-6">
        <h3 className="text-lg font-semibold">API ключи</h3>
        <p className="subtle mt-2 text-sm">
          Для демо ключи не обязательны: достаточно webhook. В проде понадобятся токены сервисов для чтения/записи статусов.
          Обычно их выдает владелец сервиса (Tracker, Wiki, Chat).
        </p>
      </section>

      <section className="surface p-6">
        <h3 className="text-lg font-semibold">Последние события</h3>
        <div className="mt-4 grid gap-3 text-sm">
          {logs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-black/10 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{log.system}</span>
                <span className="text-xs text-black/50">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-black/50">Request: {log.requestId}</p>
              <p className="text-xs text-black/50">Status: {log.status}</p>
            </div>
          ))}
          {logs.length === 0 && <p className="text-sm text-black/50">Пока нет событий.</p>}
        </div>
      </section>
    </div>
  );
}

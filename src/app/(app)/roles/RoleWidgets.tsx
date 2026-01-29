"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";

type RequestItem = { id: string; title: string; status: string; type: string };

const widgetDetails: Record<string, { title: string; description: string; detail: string }> = {
  "SLA контроль": {
    title: "SLA контроль",
    description: "Просрочки и риски по SLA",
    detail: "Отслеживание дедлайнов и SLA-таймеров для заявок. Подсветка задач с риском просрочки и отчет по SLA.",
  },
  "WIP баланс": {
    title: "WIP баланс",
    description: "Баланс загрузки редакторов",
    detail: "Распределение задач по редакторам, чтобы избегать перегрузок и простаивания.",
  },
  "Интеграции": {
    title: "Интеграции",
    description: "Сигналы из релизов",
    detail: "Подключение tracker/релизов/чатов для авто-триггеров по обновлению документации.",
  },
  "Очередь review": {
    title: "Очередь review",
    description: "Документы, ожидающие проверки",
    detail: "Список документов в статусе review с чек-листом качества и комментариями.",
  },
  "Док‑листер": {
    title: "Док‑листер",
    description: "Линтеры и DoD",
    detail: "Проверка терминов, ссылок, структуры и соответствия DoD перед публикацией.",
  },
  Workspace: {
    title: "Workspace",
    description: "Черновики и версии",
    detail: "Единый редактор, версии, комментарии, экспорт и публикация.",
  },
  "Approval пакет": {
    title: "Approval пакет",
    description: "Список согласований",
    detail: "Очередь документов, ожидающих согласования и юридической проверки.",
  },
  Регуляторика: {
    title: "Регуляторика",
    description: "Изменения закона",
    detail: "Триггеры из нормативных изменений, требующих обновления документации.",
  },
  "Audit log": {
    title: "Audit log",
    description: "История версий",
    detail: "Журнал изменений, кто/когда/что правил в документе и запросах.",
  },
  Микрозадачи: {
    title: "Микрозадачи",
    description: "Список задач на разбор",
    detail: "Крауд-задачи с минимальным брифом, контроль полноты и сборка секций.",
  },
  Шаблоны: {
    title: "Шаблоны",
    description: "Единые шаблоны",
    detail: "Единые шаблоны текстов и терминологии для стабильного качества.",
  },
  "Сборка секций": {
    title: "Сборка секций",
    description: "Прогресс сборки",
    detail: "Сборка микросекций в единый документ и контроль покрытия.",
  },
  "Статус заявки": {
    title: "Статус заявки",
    description: "Текущий статус",
    detail: "Прозрачный прогресс по заявке с ожидаемыми сроками.",
  },
  Сроки: {
    title: "Сроки",
    description: "Прогноз публикации",
    detail: "Прогноз дедлайна по SLA и этапам согласования.",
  },
  Комментарии: {
    title: "Комментарии",
    description: "Правки от редакторов",
    detail: "Комментарии редактора и согласующих по содержанию документа.",
  },
  Роли: {
    title: "Роли",
    description: "Доступы и политики",
    detail: "Назначение ролей, команд и дополнительных прав.",
  },
  "SLA матрица": {
    title: "SLA матрица",
    description: "Правила SLA",
    detail: "Категории задач и целевые сроки для каждой категории.",
  },
  "Интеграции (Admin)": {
    title: "Интеграции",
    description: "Коннекторы",
    detail: "Настройка webhook-ов, тестирование событий и логов.",
  },
};


const roleWidgets: Record<string, { title: string; description: string }[]> = {
  MANAGER: [
    { title: "SLA контроль", description: "Просрочки и риски по SLA" },
    { title: "WIP баланс", description: "Баланс загрузки редакторов" },
    { title: "Интеграции", description: "Сигналы из релизов" },
  ],
  EDITOR: [
    { title: "Очередь review", description: "Документы, ожидающие проверки" },
    { title: "Док‑листер", description: "Линтеры и DoD" },
    { title: "Workspace", description: "Черновики и версии" },
  ],
  LEGAL: [
    { title: "Approval пакет", description: "Список согласований" },
    { title: "Регуляторика", description: "Изменения закона" },
    { title: "Audit log", description: "История версий" },
  ],
  CROWD: [
    { title: "Микрозадачи", description: "Список задач на разбор" },
    { title: "Шаблоны", description: "Единые шаблоны" },
    { title: "Сборка секций", description: "Прогресс сборки" },
  ],
  REQUESTER: [
    { title: "Статус заявки", description: "Текущий статус" },
    { title: "Сроки", description: "Прогноз публикации" },
    { title: "Комментарии", description: "Правки от редакторов" },
  ],
  ADMIN: [
    { title: "Роли", description: "Доступы и политики" },
    { title: "SLA матрица", description: "Правила SLA" },
    { title: "Интеграции", description: "Коннекторы" },
  ],
};

export default function RoleWidgets() {
  const [role, setRole] = useState<string>("MANAGER");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [activeWidget, setActiveWidget] = useState<{ title: string; description: string } | null>(null);
  const [activeTask, setActiveTask] = useState<RequestItem | null>(null);

  useEffect(() => {
    async function load() {
      const me = await fetch("/api/me");
      if (me.ok) {
        const user = await me.json();
        setRole(user.role || "MANAGER");
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

  return (
    <div className="grid gap-6">
      <section className="surface p-6">
        <h3 className="text-lg font-semibold">Панель роли: {role}</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm">
          {(roleWidgets[role] ?? roleWidgets.MANAGER).map((item) => (
            <button
              key={item.title}
              className="rounded-2xl border border-black/10 bg-white p-3 text-left hover:border-[var(--accent)]"
              onClick={() => setActiveWidget(item)}
            >
              <p className="font-semibold">{item.title}</p>
              <p className="subtle text-xs">{item.description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="surface p-6">
        <h3 className="text-lg font-semibold">Срез задач</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 text-sm">
          {requests.slice(0, 6).map((item) => (
            <button
              key={item.id}
              className="rounded-2xl border border-black/10 bg-white p-3 text-left hover:border-[var(--accent)]"
              onClick={() => setActiveTask(item)}
            >
              <p className="font-semibold">{item.title}</p>
              <p className="subtle text-xs">{item.status} · {item.type}</p>
            </button>
          ))}
        </div>
      </section>

      <Modal
        open={Boolean(activeWidget)}
        title={activeWidget ? activeWidget.title : ""}
        onClose={() => setActiveWidget(null)}
      >
        {activeWidget && (
          <div className="grid gap-3 text-sm">
            <p className="subtle">{activeWidget.description}</p>
            <p>{widgetDetails[activeWidget.title]?.detail ?? "Подробное описание будет добавлено."}</p>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(activeTask)}
        title={activeTask ? activeTask.title : ""}
        onClose={() => setActiveTask(null)}
      >
        {activeTask && (
          <div className="grid gap-3 text-sm">
            <p><strong>ID:</strong> {activeTask.id.slice(-4).toUpperCase()}</p>
            <p><strong>Статус:</strong> {activeTask.status}</p>
            <p><strong>Тип:</strong> {activeTask.type}</p>
            <p className="subtle">Задача в срезе показывает статус, тип и место в процессе.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

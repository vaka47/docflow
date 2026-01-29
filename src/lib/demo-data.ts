export const workflowColumns = [
  {
    title: "New",
    tone: "bg-amber-100 text-amber-900",
    items: [
      { id: "R-102", title: "FAQ по запуску Алисы в корпоративном режиме", owner: "Менеджер", sla: "3d" },
      { id: "R-105", title: "Регуляторика: отчетность для госорганов", owner: "Юрист", sla: "7d" },
    ],
  },
  {
    title: "Triage",
    tone: "bg-emerald-100 text-emerald-900",
    items: [
      { id: "R-096", title: "Изменения в справке Такси: тарифы", owner: "Редактор", sla: "2d" },
    ],
  },
  {
    title: "In progress",
    tone: "bg-blue-100 text-blue-900",
    items: [
      { id: "R-089", title: "Онбординг водителей: новая структура", owner: "Крауд", sla: "5d" },
      { id: "R-092", title: "Обновление политики хранения данных", owner: "Редактор", sla: "4d" },
    ],
  },
  {
    title: "Review",
    tone: "bg-violet-100 text-violet-900",
    items: [
      { id: "R-081", title: "Гайд по API поиска: новые примеры", owner: "Product", sla: "1d" },
    ],
  },
  {
    title: "Approval",
    tone: "bg-orange-100 text-orange-900",
    items: [
      { id: "R-074", title: "Юридическое согласование промо-материалов", owner: "Legal", sla: "2d" },
    ],
  },
  {
    title: "Published",
    tone: "bg-slate-100 text-slate-800",
    items: [
      { id: "R-061", title: "FAQ по подписке Яндекс Плюс", owner: "Docs", sla: "done" },
      { id: "R-065", title: "Документация к новой функции поиска", owner: "Docs", sla: "done" },
    ],
  },
];

export const metrics = [
  {
    title: "Lead time",
    before: "12 дней",
    after: "6 дней",
    note: "Сокращение за счет прозрачных статусов и SLA",
  },
  {
    title: "Cycle time",
    before: "7 дней",
    after: "3 дня",
    note: "Меньше ручных согласований и ожиданий",
  },
  {
    title: "Rework rate",
    before: "35%",
    after: "12%",
    note: "Линтеры + чек-листы + preview",
  },
  {
    title: "SLA breach",
    before: "часто",
    after: "редко",
    note: "Управляемая очередь и напоминания",
  },
];

export const kbItems = [
  {
    title: "Как оформить заявку",
    tags: ["intake", "SLA"],
    content: "Заполните форму: цель, аудитория, канал, сроки. Без этого задача не запускается.",
  },
  {
    title: "Кто согласует публикации",
    tags: ["approval", "legal"],
    content: "Финальное согласование: product owner + legal по регуляторике.",
  },
  {
    title: "Что такое DoD",
    tags: ["quality"],
    content: "Definition of Done: чек-лист качества, ссылки, корректные термины, preview.",
  },
  {
    title: "Как работает крауд-конвейер",
    tags: ["crowd"],
    content: "Микрозадачи с шаблонами, сборка редактором, контроль полноты.",
  },
];

export const integrations = [
  {
    name: "Yandex Tracker",
    status: "Connected",
    description: "Авто-создание задач и статусов",
  },
  {
    name: "Yandex Wiki",
    status: "Connected",
    description: "Публикация и версия документации",
  },
  {
    name: "Messenger / Chat",
    status: "Pending",
    description: "Уведомления и офис-хауры",
  },
  {
    name: "CI / Release",
    status: "Connected",
    description: "Триггеры из релизов и PR",
  },
  {
    name: "Legal Archive",
    status: "Pending",
    description: "Аудит-лог и экспорт пакетов",
  },
];

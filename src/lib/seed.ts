type SeedUser = {
  name: string;
  email: string;
  role: string;
  team: string;
  extraRoles: string[];
};

const firstNames = [
  "Анна",
  "Илья",
  "Мария",
  "Елена",
  "Игорь",
  "Дмитрий",
  "Алексей",
  "Ольга",
  "Павел",
  "Сергей",
  "Юлия",
  "Никита",
  "Кирилл",
  "Алена",
  "Максим",
  "Софья",
  "Артем",
  "Виктория",
  "Роман",
  "Наталья",
];

const lastNames = [
  "Иванова",
  "Смирнов",
  "Петрова",
  "Кузнецов",
  "Соколова",
  "Попов",
  "Лебедева",
  "Новиков",
  "Морозова",
  "Волков",
  "Федорова",
  "Орлов",
  "Громова",
  "Денисов",
  "Жукова",
  "Соловьев",
  "Ковалева",
  "Титов",
  "Белоусова",
  "Андреев",
];

const roleTeams: Record<string, string[]> = {
  ADMIN: ["Program Management"],
  MANAGER: ["Program Management", "Workflow Ops", "Delivery Ops", "Taxi Docs"],
  EDITOR: ["Docs Production", "Alice Docs", "Search Docs", "Market Docs"],
  CROWD: ["Crowd Pool", "Crowd QA"],
  LEGAL: ["Legal", "Compliance"],
  REQUESTER: ["Taxi", "Alice", "Search", "Market", "Cloud"],
};

const weightedRoles = [
  "MANAGER",
  "MANAGER",
  "MANAGER",
  "EDITOR",
  "EDITOR",
  "EDITOR",
  "EDITOR",
  "CROWD",
  "CROWD",
  "LEGAL",
  "REQUESTER",
  "REQUESTER",
];

function pick<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateSeedUsers(count: number) {
  const users: SeedUser[] = [];
  users.push({
    name: "Админ Демо",
    email: "admin@docflow.local",
    role: "ADMIN",
    team: "Program Management",
    extraRoles: ["ADMIN"],
  });

  for (let i = 0; i < count; i += 1) {
    const first = pick(firstNames);
    const last = pick(lastNames);
    const role = pick(weightedRoles);
    const team = pick(roleTeams[role] ?? ["Docs"]);
    users.push({
      name: `${first} ${last}`,
      email: `user${i + 1}@docflow.local`,
      role,
      team,
      extraRoles: [],
    });
  }

  return users;
}

export const seedRequests = [
  {
    title: "FAQ по запуску Алисы в корпоративном режиме",
    description: "Нужны сценарии для B2B клиентов",
    type: "FAQ",
    status: "NEW",
    slaDays: 3,
    audience: "Партнеры B2B",
    ownerIndex: 0,
  },
  {
    title: "Регуляторика: отчетность для госорганов",
    description: "Обновление требования по хранению данных",
    type: "REGULATORY",
    status: "TRIAGE",
    slaDays: 7,
    audience: "Регуляторы / Legal",
    ownerIndex: 2,
  },
  {
    title: "Изменения в справке Такси: тарифы",
    description: "Обновить таблицу тарифов",
    type: "CHANGE",
    status: "IN_PROGRESS",
    slaDays: 2,
    audience: "Пользователи сервиса",
    ownerIndex: 1,
  },
  {
    title: "Онбординг водителей: новая структура",
    description: "Переписать onboarding",
    type: "FEATURE",
    status: "IN_PROGRESS",
    slaDays: 5,
    audience: "Водители / исполнители",
    ownerIndex: 3,
  },
  {
    title: "Гайд по API поиска: новые примеры",
    description: "Добавить новые примеры",
    type: "CHANGE",
    status: "REVIEW",
    slaDays: 1,
    audience: "Партнеры B2B",
    ownerIndex: 1,
  },
  {
    title: "Юридическое согласование промо-материалов",
    description: "Проверка юридических формулировок",
    type: "REGULATORY",
    status: "APPROVAL",
    slaDays: 2,
    audience: "Регуляторы / Legal",
    ownerIndex: 2,
  },
  {
    title: "FAQ по новым правилам промокодов",
    description: "Обновить раздел про промо и ограничения",
    type: "FAQ",
    status: "NEW",
    slaDays: 4,
    audience: "Пользователи сервиса",
    ownerIndex: 0,
  },
  {
    title: "Справка Маркета: возвраты и сроки",
    description: "Обновить правила возврата для пользователей",
    type: "CHANGE",
    status: "REVIEW",
    slaDays: 3,
    audience: "Пользователи сервиса",
    ownerIndex: 1,
  },
  {
    title: "Юр. пакет: согласование оферты для партнеров",
    description: "Нужен approval от Legal",
    type: "REGULATORY",
    status: "APPROVAL",
    slaDays: 6,
    audience: "Партнеры B2B",
    ownerIndex: 2,
  },
  {
    title: "DocOps: обновить глоссарий терминов",
    description: "Новые термины сервиса и согласованные формулировки",
    type: "CHANGE",
    status: "IN_PROGRESS",
    slaDays: 5,
    audience: "Внутренние команды",
    ownerIndex: 3,
  },
  {
    title: "Справка Такси: новые бонусы",
    description: "Обновить раздел про бонусы и статусы",
    type: "CHANGE",
    status: "TRIAGE",
    slaDays: 4,
    audience: "Водители / исполнители",
    ownerIndex: 6,
  },
  {
    title: "Гайд по Алисе: сценарии для бизнеса",
    description: "Добавить примеры для B2B",
    type: "FEATURE",
    status: "IN_PROGRESS",
    slaDays: 6,
    audience: "Партнеры B2B",
    ownerIndex: 7,
  },
  {
    title: "Search API: лимиты и квоты",
    description: "Уточнить лимиты и привести примеры",
    type: "CHANGE",
    status: "REVIEW",
    slaDays: 3,
    audience: "Партнеры B2B",
    ownerIndex: 8,
  },
  {
    title: "Compliance: пакет согласования для Маркета",
    description: "Проверка юридических формулировок и экспорт пакета",
    type: "REGULATORY",
    status: "APPROVAL",
    slaDays: 5,
    audience: "Регуляторы / Legal",
    ownerIndex: 9,
  },
  {
    title: "FAQ Маркета: возвраты",
    description: "Собрать ответы на частые вопросы",
    type: "FAQ",
    status: "NEW",
    slaDays: 4,
    audience: "Пользователи сервиса",
    ownerIndex: 10,
  },
  {
    title: "Crowd: разметить структуру справки",
    description: "Собрать первичные секции",
    type: "OTHER",
    status: "IN_PROGRESS",
    slaDays: 8,
    audience: "Внутренние команды",
    ownerIndex: 11,
  },
];

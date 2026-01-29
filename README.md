# DocFlow OS MVP

MVP за 24 часа: единый intake, workflow, DocOps и интеграции для команды документирования.

## Стек
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- Postgres + Prisma
- NextAuth Credentials (демо‑вход по выбору пользователя)

## Запуск (локально)
```bash
cp .env.example .env
npm install
npm run dev
```

## Postgres + Prisma
1) Поднимите Postgres локально (или через Docker).
```bash
docker-compose up -d
```
2) Укажите `DATABASE_URL` в `.env`.
Пример: `postgresql://docflow:docflow@localhost:5432/docflow`
3) Миграция:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Демо‑вход
Вход без пароля через `/login` (выбор пользователя из списка).
Админ: `admin@docflow.local`.

## Уведомления
Опционально подключить SMTP/чат:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `CHAT_WEBHOOK_URL`

## Деплой
Vercel:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (например, `https://<project>.vercel.app`)

Яндекс сервер: `npm run build` и `npm start`.

## Что внутри
- /workflow — end-to-end board
- /intake — форма intake + triage
- /metrics — метрики до/после
- /knowledge — база знаний и поиск
- /workspace — рабочая зона документов
- /roles — интерфейсы по ролям
- /crowd — микрозадачи исполнителей
- /integrations — интеграции и автоматизация
- /playbook — ответы на тестовое задание
- /admin — RACI и compliance
- /home — роль‑ориентированный старт

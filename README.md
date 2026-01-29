# DocFlow OS MVP

MVP за 24 часа: единый intake, workflow, DocOps и интеграции для команды документирования.

## Стек
- Next.js 16 (App Router)
- React 19
- Tailwind CSS v4
- Postgres + Prisma
- NextAuth Credentials (email + password)

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
Если migrate недоступен, можно применить SQL напрямую:
```bash
PGPASSWORD=docflow psql -h 127.0.0.1 -U docflow -d docflow -f scripts/bootstrap.sql
```

## Seed демо-данных
После миграций можно заполнить демо-данными:
- Откройте `/admin` и нажмите **Seed demo data**
 - Демо‑пользователи: `anna@yandex.ru`, `ilya@yandex.ru`, `maria@yandex.ru` пароль `password123`

## Auth
- Регистрация: `/register`
- Вход: `/login`
- Быстрый seed: `/setup`

## Документы (DB)
Для хранения документов в БД выполните:
```bash
PGPASSWORD=docflow psql -h 127.0.0.1 -U docflow -d docflow -f scripts/upgrade_docs.sql
```
Для комментариев:
```bash
PGPASSWORD=docflow psql -h 127.0.0.1 -U docflow -d docflow -f scripts/upgrade_comments.sql
```
Для поля аудитории заявки:
```bash
PGPASSWORD=docflow psql -h 127.0.0.1 -U docflow -d docflow -f scripts/upgrade_audience.sql
```
Для дедлайнов (dueAt):
```bash
PGPASSWORD=docflow psql -h 127.0.0.1 -U docflow -d docflow -f scripts/upgrade_dueat.sql
```

## Уведомления
Опционально подключить SMTP/чат:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `CHAT_WEBHOOK_URL`

## Деплой
- Vercel: импортируйте репозиторий, задайте переменные окружения.
- Яндекс сервер: `npm run build` и `npm start`.

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

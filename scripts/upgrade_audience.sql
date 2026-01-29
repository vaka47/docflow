ALTER TABLE "Request"
ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'Пользователи сервиса';

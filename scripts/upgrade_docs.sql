CREATE TABLE IF NOT EXISTS "Document" (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL,
  sections TEXT[] NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "DocumentVersion" (
  id TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES "Document"(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

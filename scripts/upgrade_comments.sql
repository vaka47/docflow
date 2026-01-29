CREATE TABLE IF NOT EXISTS "DocumentComment" (
  id TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES "Document"(id),
  author TEXT NOT NULL,
  line INT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

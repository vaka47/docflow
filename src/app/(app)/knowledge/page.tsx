import KnowledgeClient from "./KnowledgeClient";
import { Suspense } from "react";

export default function KnowledgePage() {
  return (
    <div className="grid gap-8">
      <Suspense fallback={<div className="surface p-6 text-sm text-black/50">Загрузка...</div>}>
        <KnowledgeClient />
      </Suspense>
    </div>
  );
}

"use client";

import { useState } from "react";
import Modal from "@/components/Modal";

const artifacts = [
  {
    title: "Intake бриф + SLA",
    description:
      "Стандартизированная форма запроса: цель, аудитория, канал, сроки. На основе брифа автоматически выставляется SLA и приоритет.",
  },
  {
    title: "План и DoD",
    description:
      "План структуры документа и Definition of Done: критерии качества, терминология, ссылки, обязательные проверки.",
  },
  {
    title: "Пакет микрозадач",
    description:
      "Декомпозиция на крауд‑микрозадачи с шаблонами и единой терминологией.",
  },
  {
    title: "Сборка и review",
    description:
      "Редакторская сборка, проверка логики, стиля, полноты. Peer‑review при необходимости.",
  },
  {
    title: "Approval пакет",
    description:
      "Пакет для согласования с продуктом и legal: версия, изменения, audit‑log.",
  },
  {
    title: "Публикация + метрики",
    description:
      "Выпуск документации и отслеживание эффективности: lead/cycle, rework, SLA.",
  },
];

export default function WorkflowArtifactsClient() {
  const [active, setActive] = useState<typeof artifacts[number] | null>(null);

  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {artifacts.map((item) => (
          <button
            key={item.title}
            className="rounded-2xl border border-black/10 bg-white p-4 text-left text-sm hover:border-[var(--accent)] cursor-pointer"
            onClick={() => setActive(item)}
          >
            {item.title}
          </button>
        ))}
      </div>

      <Modal open={Boolean(active)} title={active?.title ?? ""} onClose={() => setActive(null)}>
        <p>{active?.description}</p>
      </Modal>
    </>
  );
}

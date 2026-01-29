import RoleGate from "@/components/RoleGate";

export default function PlaybookPage() {
  return (
    <RoleGate allow={["ADMIN", "MANAGER"]}>
      <div className="grid gap-8">
      <section className="surface p-8">
        <h2 className="section-title text-2xl">1. Типовой флоу</h2>
        <div className="mt-4 grid gap-3 text-sm">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            Запрос заказчика → Intake форма → Триаж (SLA/тип) → План + DoD → Крауд‑конвейер →
            Сборка → Review → Legal/Compliance → Публикация → Метрики + поддержка.
          </div>
          <p className="subtle">
            Ключевые артефакты: бриф, DoD, пакет микрозадач, approval‑пакет, публикация, метрики.
          </p>
        </div>
      </section>

      <section className="surface p-8">
        <h2 className="section-title text-2xl">2. Серые зоны и риски</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="font-semibold">Интейк без брифа</p>
            <p className="subtle mt-2">Снижаем риск: единая форма, обязательные поля, авто‑SLA.</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="font-semibold">Источник истины</p>
            <p className="subtle mt-2">Триггер из релиза/PR + owner на стороне продукта.</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="font-semibold">Сборка из крауда</p>
            <p className="subtle mt-2">Шаблоны, автолинтеры, peer‑review.</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="font-semibold">Финальные согласования</p>
            <p className="subtle mt-2">RACI, audit‑log, статусы approve/consult.</p>
          </div>
        </div>
      </section>

      <section className="surface p-8">
        <h2 className="section-title text-2xl">3. Оптимизация</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm">
          {[
            "Единый intake + DoD",
            "Статус‑машина и SLA",
            "DocOps: линтеры, preview",
            "Крауд‑конвейер задач",
            "Approval workflow",
            "Дашборды по lead/cycle/rework",
          ].map((item) => (
            <div key={item} className="rounded-2xl border border-black/10 bg-white p-4">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="surface p-8">
        <h2 className="section-title text-2xl">4. Измерение эффективности</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 text-sm">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            Lead time, Cycle time, Rework rate, SLA breach, Post‑errors.
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            Источники: Tracker, DocOps, Release‑лог, аудит публикаций.
          </div>
        </div>
      </section>

      <section className="surface p-8">
        <h2 className="section-title text-2xl">5. Roadmap + RACI</h2>
        <div className="mt-4 grid gap-3 text-sm">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            0. Baseline (1–2 недели) → 1. Intake + Workflow (2–4) → 2. DocOps (3–5) →
            3. Crowd pipeline (4–6) → 4. Compliance (2–4).
          </div>
          <p className="subtle">RACI внедрен в Admin‑модуле.</p>
        </div>
      </section>

      <section className="surface p-8">
        <h2 className="section-title text-2xl">6. Повторы в чате</h2>
        <p className="subtle mt-3 text-sm">
          Повторы — нормальны, но их можно снизить: база знаний, шаблоны ответов, бот с подсказками,
          office hours 1 раз в неделю и регулярный апдейт FAQ.
        </p>
      </section>
      </div>
    </RoleGate>
  );
}

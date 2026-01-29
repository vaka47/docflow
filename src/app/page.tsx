import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="container py-20">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="section-title mt-6 text-4xl md:text-6xl">
              Система для управления документацией в крауд‑команде Яндекса
            </h1>
            <p className="subtle mt-6 text-lg">
              Единый intake, прозрачные статусы, DocOps‑конвейер и согласования —
              чтобы выпускать документацию быстрее без потери качества.
            </p>
            <ul className="mt-6 grid gap-3 text-sm">
              {[
                "Убирает «серые зоны»: понятные роли и владельцы этапов",
                "Снижает rework за счёт DoD, шаблонов и quality‑контроля",
                "Прозрачные сроки: SLA, дедлайны, статусы в одном месте",
                "Crowd‑масштабирование без потери качества",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-[var(--accent)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-6 lg:mt-10">
            <div className="surface p-8">
              <h2 className="section-title text-2xl">Ключевые преимущества</h2>
              <ul className="mt-6 grid gap-4 text-sm">
                {[
                  "Один поток от заявки до публикации",
                  "Роли, RACI и согласования по правилам",
                  "DocOps: версии, ревью, экспорт",
                  "Crowd‑конвейер с контролем качества",
                  "Интеграции и автосоздание задач",
                  "Метрики эффекта «до/после»",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-2xl border border-black/10 bg-black px-5 py-4 text-sm text-white">
                One flow → one owner → measurable outcome
              </div>
            </div>
            <div className="mt-3">
              <Link href="/login" className="w-full rounded-full bg-[var(--accent)] px-6 py-4 text-center text-base font-semibold !text-white inline-flex justify-center">
                Запустить демо
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

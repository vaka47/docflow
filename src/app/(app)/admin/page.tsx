import AdminClient from "./AdminClient";

export default function AdminPage() {
  return (
    <div className="grid gap-8">
      <section className="surface overflow-hidden">
        <div className="p-6">
          <h2 className="section-title text-2xl">RACI на ключевые этапы</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="p-4">Этап</th>
                <th className="p-4">R</th>
                <th className="p-4">A</th>
                <th className="p-4">C</th>
                <th className="p-4">I</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Intake & triage", "Менеджер", "Менеджер", "Редактор, Заказчик", "Разработка"],
                ["DoD & план", "Редактор", "Менеджер", "Заказчик", "Юристы"],
                ["Крауд‑конвейер", "Редактор", "Редактор", "Менеджер", "Заказчик"],
                ["Review", "Редактор", "Редактор", "Product", "Разработка"],
                ["Approval", "Legal", "Legal", "Product", "Менеджер"],
                ["Публикация", "Редактор", "Заказчик", "Legal", "Менеджер"],
              ].map((row, rowIdx) => (
                <tr key={row[0]} className="border-b border-black/5">
                  {row.map((cell, cellIdx) => (
                    <td key={`${rowIdx}-${cellIdx}`} className="p-4">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="surface p-6">
          <h3 className="text-lg font-semibold">SLA матрица</h3>
          <ul className="mt-4 grid gap-2 text-sm">
            <li>P0 — 48 часов, Legal по умолчанию</li>
            <li>P1 — 5 дней, редактор + product</li>
            <li>P2 — 10 дней, крауд + редактор</li>
          </ul>
        </div>
        <div className="surface p-6">
          <h3 className="text-lg font-semibold">Compliance пакет</h3>
          <ul className="mt-4 grid gap-2 text-sm">
            <li>Аудит-лог изменений</li>
            <li>Экспорт пакета в PDF</li>
            <li>Версионирование публикаций</li>
          </ul>
        </div>
      </section>

      <AdminClient />
    </div>
  );
}

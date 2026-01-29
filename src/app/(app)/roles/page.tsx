import RoleWidgets from "./RoleWidgets";
import RoleGate from "@/components/RoleGate";

export default function RolesPage() {
  return (
    <RoleGate allow={["ADMIN", "MANAGER"]}>
      <div className="grid gap-8">
        <RoleWidgets />

        <section className="surface p-6">
          <h3 className="text-lg font-semibold">Матрица доступов (preview)</h3>
          <p className="subtle mt-2 text-sm">Можно временно отключать/включать разделы для ролей (демо).</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black text-white">
                <tr>
                  <th className="p-3">Роль</th>
                  <th className="p-3">Workflow</th>
                  <th className="p-3">Knowledge</th>
                  <th className="p-3">Workspace</th>
                  <th className="p-3">Metrics</th>
                  <th className="p-3">Integrations</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["MANAGER", "✓", "✓", "✓", "✓", "✓"],
                  ["EDITOR", "✓", "✓", "✓", "—", "—"],
                  ["LEGAL", "✓", "✓", "—", "—", "—"],
                  ["REQUESTER", "✓", "✓", "—", "—", "—"],
                  ["CROWD", "—", "—", "—", "—", "—"],
                ].map((row, rowIdx) => (
                  <tr key={row[0]} className="border-b border-black/5">
                    {row.map((cell, cellIdx) => (
                      <td key={`${rowIdx}-${cellIdx}`} className="p-3">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </RoleGate>
  );
}

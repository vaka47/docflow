import IntegrationsClient from "./IntegrationsClient";
import RoleGate from "@/components/RoleGate";

export default function IntegrationsPage() {
  return (
    <RoleGate allow={["ADMIN", "MANAGER"]}>
      <div className="grid gap-8">
      <IntegrationsClient />

      <section className="surface p-8">
        <h2 className="section-title text-2xl">Что можно сделать сейчас</h2>
        <p className="subtle mt-3 text-sm">
          Отправьте тестовый webhook, чтобы увидеть, как событие попадает в журнал. Это имитация боевой интеграции.
        </p>
        <pre className="mt-4 overflow-x-auto rounded-2xl border border-black/10 bg-white p-4 text-xs">
{`POST /api/integrations
{
  "requestId": "<id из workflow>",
  "system": "Tracker",
  "status": "ok",
  "payload": { "event": "status.change" }
}`}
        </pre>
      </section>
    </div>
    </RoleGate>
  );
}

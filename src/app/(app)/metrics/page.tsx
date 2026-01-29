import MetricsClient from "./MetricsClient";
import RoleGate from "@/components/RoleGate";
import SlaReportClient from "./SlaReportClient";

export default function MetricsPage() {
  return (
    <RoleGate allow={["ADMIN", "MANAGER"]}>
      <div className="grid gap-8">
      <MetricsClient />
      <SlaReportClient />
      </div>
    </RoleGate>
  );
}

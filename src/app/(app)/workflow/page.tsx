import WorkflowBoardClient from "./WorkflowBoardClient";
import WorkflowArtifactsClient from "./WorkflowArtifactsClient";
import WorkflowCalendarClient from "./WorkflowCalendarClient";
import ApprovalInboxClient from "./ApprovalInboxClient";
import { Suspense } from "react";

export default function WorkflowPage() {
  return (
    <div className="grid gap-8">
      <Suspense fallback={<div className="surface p-6 text-sm text-black/50">Загрузка...</div>}>
        <WorkflowBoardClient />
      </Suspense>

      <WorkflowCalendarClient />

      <ApprovalInboxClient />

      <section className="surface p-8">
        <h2 className="section-title text-2xl">Ключевые артефакты</h2>
        <WorkflowArtifactsClient />
      </section>
    </div>
  );
}

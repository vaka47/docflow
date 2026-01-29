import WorkflowBoardClient from "./WorkflowBoardClient";
import WorkflowArtifactsClient from "./WorkflowArtifactsClient";
import WorkflowCalendarClient from "./WorkflowCalendarClient";
import ApprovalInboxClient from "./ApprovalInboxClient";

export default function WorkflowPage() {
  return (
    <div className="grid gap-8">
      <WorkflowBoardClient />

      <WorkflowCalendarClient />

      <ApprovalInboxClient />

      <section className="surface p-8">
        <h2 className="section-title text-2xl">Ключевые артефакты</h2>
        <WorkflowArtifactsClient />
      </section>
    </div>
  );
}

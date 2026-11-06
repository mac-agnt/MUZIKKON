import { Page, PageHead } from "../ui";
import Calendar from "./work/Calendar";
import Tasks from "./work/Tasks";
import WorkApprovals from "./work/WorkApprovals";
import Workflows from "./work/Workflows";

const HEAD: Record<string, { title: string; sub: string }> = {
  tasks: { title: "Tasks", sub: "What needs doing across the team. Tasks close themselves when the related work is finished elsewhere in Pulse." },
  approvals: { title: "Approvals", sub: "Your decision queue. Agents prepare, you decide." },
  workflows: { title: "Workflows", sub: "Repeatable processes with the human approval gates marked. Run them on demo data." },
  calendar: { title: "Calendar", sub: "Task deadlines, dispatch targets, invoice due dates and expected stock receipts in one week view." },
};

export default function WorkPage({ tab }: { tab: string }) {
  const h = HEAD[tab] ?? HEAD.tasks;
  return (
    <Page>
      <PageHead eyebrow="Work" title={h.title} sub={h.sub} />
      {tab === "approvals" ? <WorkApprovals /> : tab === "workflows" ? <Workflows /> : tab === "calendar" ? <Calendar /> : <Tasks />}
    </Page>
  );
}

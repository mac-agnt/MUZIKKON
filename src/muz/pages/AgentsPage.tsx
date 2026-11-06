import { Page, PageHead } from "../ui";
import Approvals from "./agents/Approvals";
import Overview from "./agents/Overview";
import Playbooks from "./agents/Playbooks";
import Runs from "./agents/Runs";

const HEAD: Record<string, { title: string; sub: string }> = {
  overview: { title: "Agents", sub: "Eight agents watch orders, stock, dispatch, finance and support, and prepare work for your team. They propose, people approve." },
  runs: { title: "Agent runs", sub: "A chronological log of everything the agents did. All runs are simulated against demo data." },
  playbooks: { title: "Playbooks", sub: "How each agent would work, where a person must approve, and how the five demo stories cross agents." },
  approvals: { title: "Approvals", sub: "Every proposal that needs a decision. Approve or reject here and the change shows up in Orders, Finance, Inventory and Activity." },
};

export default function AgentsPage({ tab }: { tab: string }) {
  const h = HEAD[tab] ?? HEAD.overview;
  return (
    <Page>
      <PageHead eyebrow="Agents" title={h.title} sub={h.sub} />
      {tab === "runs" ? <Runs /> : tab === "playbooks" ? <Playbooks /> : tab === "approvals" ? <Approvals /> : <Overview />}
    </Page>
  );
}

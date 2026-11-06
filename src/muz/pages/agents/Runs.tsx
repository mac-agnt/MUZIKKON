import { Fragment, useMemo, useState } from "react";
import { AGENTS } from "../../dataset";
import { useMuz } from "../../store";
import { Card, Chips, Row, SearchBox } from "../../ui";
import { DayHeader, agentName, sortRuns } from "../common";
import RunRow from "./RunRow";

const OUTCOMES = [
  { id: "all", label: "All outcomes" },
  { id: "completed", label: "Completed" },
  { id: "proposed", label: "Proposed" },
  { id: "needs_approval", label: "Needs approval" },
  { id: "flagged", label: "Flagged" },
];

export default function Runs() {
  const s = useMuz();
  const [agent, setAgent] = useState("all");
  const [outcome, setOutcome] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setOpen((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const all = useMemo(() => sortRuns(s.runs), [s.runs]);
  const rows = all.filter((r) => {
    if (agent !== "all" && r.agentId !== agent) return false;
    if (outcome !== "all" && r.outcome !== outcome) return false;
    const t = q.trim().toLowerCase();
    if (t && !(`${r.summary} ${agentName(r.agentId)} ${r.refs.map((x) => x.id).join(" ")} ${r.steps.join(" ")}`.toLowerCase().includes(t))) return false;
    return true;
  });
  const agentOpts = [{ id: "all", label: "All agents", count: all.length }, ...AGENTS.map((a) => ({ id: a.id, label: a.name, count: all.filter((r) => r.agentId === a.id).length }))];
  const outcomeOpts = OUTCOMES.map((o) => ({ ...o, count: o.id === "all" ? undefined : all.filter((r) => r.outcome === o.id).length }));

  let lastDay = "";
  return (
    <>
      <Card pad={16}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Row gap={12} style={{ justifyContent: "space-between" }}>
            <Chips options={agentOpts} value={agent} onChange={setAgent} />
          </Row>
          <Row gap={12} style={{ justifyContent: "space-between" }}>
            <Chips options={outcomeOpts} value={outcome} onChange={setOutcome} />
            <SearchBox value={q} onChange={setQ} placeholder="Search runs, steps, records" width={280} />
          </Row>
        </div>
      </Card>
      <Card flush title="Agent runs" hint={`${rows.length} of ${all.length} runs, newest first. Every run is simulated: agents read demo state and propose, nothing external is called.`}>
        {rows.length === 0 ? (
          <div style={{ padding: "36px 20px", textAlign: "center", fontSize: 13, color: "var(--dim)" }}>No runs match these filters.</div>
        ) : rows.map((r) => {
          const day = r.at.slice(0, 10);
          const head = day !== lastDay;
          lastDay = day;
          return (
            <Fragment key={r.id}>
              {head && <DayHeader iso={r.at} />}
              <RunRow r={r} open={open.has(r.id)} onToggle={() => toggle(r.id)} />
            </Fragment>
          );
        })}
      </Card>
    </>
  );
}

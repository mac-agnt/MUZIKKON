import type { AgentRun } from "../../types";
import { whenLabel } from "../../format";
import { Badge, DemoTag, Label, Timeline } from "../../ui";
import { AgentDot, OUTCOME, RefLinks, agentName, mono } from "../common";

/* One agent run: collapsed summary row, expands to the steps the agent took. */
export default function RunRow({ r, open, onToggle, showAgent = true }: { r: AgentRun; open: boolean; onToggle: () => void; showAgent?: boolean }) {
  const o = OUTCOME[r.outcome];
  return (
    <div style={{ borderBottom: "1px solid var(--border)", background: open ? "var(--surface-faint)" : undefined }}>
      <div onClick={onToggle} className="mz-row mz-click" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 16px", cursor: "pointer" }}>
        <span style={{ ...mono, fontSize: 11, color: "var(--faint)", width: 104, flex: "none" }}>{whenLabel(r.at)}</span>
        {showAgent && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, width: 168, flex: "none", fontSize: 12.5, fontWeight: 500, color: "var(--ink)" }}>
            <AgentDot id={r.agentId} size={22} />
            {agentName(r.agentId)}
          </span>
        )}
        <span style={{ flex: "1 1 240px", minWidth: 0, fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}>{r.summary}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flex: "none" }}>
          <Badge tone={o.tone} dot>{o.label}</Badge>
          <span style={{ ...mono, fontSize: 10.5, color: "var(--faint)" }}>{r.duration}</span>
          {r.simulated && <DemoTag>Simulated</DemoTag>}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s var(--ease)" }}><path d="m6 9 6 6 6-6" /></svg>
        </span>
      </div>
      {open && (
        <div style={{ padding: "4px 16px 16px 132px" }}>
          <Label style={{ marginBottom: 10 }}>Steps taken</Label>
          <Timeline items={r.steps.map((st) => ({ title: st, tone: "accent" as const }))} />
          <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginTop: 2, fontSize: 12.5, color: "var(--dim)" }}>
            <span>Related records: <RefLinks refs={r.refs} /></span>
            <span>Actions proposed: <span style={{ color: "var(--ink)" }}>{r.proposed}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

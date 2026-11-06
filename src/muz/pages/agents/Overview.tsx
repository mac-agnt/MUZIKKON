import { useState } from "react";
import AgentFace from "../../../components/AgentFace";
import { SNAPSHOT_DATE } from "../../dataset";
import { whenLabel } from "../../format";
import { pendingApprovals } from "../../selectors";
import { actions, useMuz, type MuzState } from "../../store";
import type { AgentDef } from "../../types";
import { Badge, Btn, Callout, Card, DemoTag, Empty, Grid, Kpi, Label, Row, Section } from "../../ui";
import { AGENT_MAP, ApprovalButtons, KIND_LABEL, RefLink, RefLinks, agentPending, agentRuns, agentStatus, mono, sum } from "../common";
import RunRow from "./RunRow";
import { AGENTS } from "../../dataset";

const activityOf = (s: MuzState, a: AgentDef) => s.activity.filter((e) => e.actor === a.name).sort((x, y) => y.at.localeCompare(x.at));

function AgentCard({ a, s, selected, onSelect }: { a: AgentDef; s: MuzState; selected: boolean; onSelect: () => void }) {
  const st = agentStatus(s, a.id);
  const runs = agentRuns(s, a.id);
  const latest = runs[0];
  const proposed = sum(runs.map((r) => r.proposed));
  const acts = activityOf(s, a).slice(0, 3);
  return (
    <div onClick={onSelect} className="mz-click" style={{ display: "flex", cursor: "pointer" }}>
      <Card style={{ flex: 1, border: `1px solid ${selected ? "var(--accent-line)" : "var(--border)"}`, background: selected ? "var(--accent-faint)" : "var(--surface)" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ flex: "none", width: 44, height: 44 }}>
            <AgentFace shape={a.shape} state={st.state} tint={a.tint} size={"40"} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-.2px" }}>{a.name}</div>
            <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2, lineHeight: 1.4 }}>{a.role}</div>
          </div>
          <Badge tone={st.tone} dot>{st.label}</Badge>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "var(--body)", lineHeight: 1.55 }}>{a.blurb}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8, marginTop: 14 }}>
          {([["Proposed", proposed], ["Need approval", st.pending], ["Runs", runs.length]] as [string, number][]).map(([k, v]) => (
            <div key={k} style={{ padding: "8px 10px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)" }}>
              <div style={{ ...mono, fontSize: 8.5, letterSpacing: ".12em", color: "var(--faint)" }}>{k.toUpperCase()}</div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 3, color: k === "Need approval" && v > 0 ? "var(--accent)" : "var(--ink)" }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <Label style={{ marginBottom: 6 }}>Latest run</Label>
          {latest ? (
            <>
              <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}>{latest.summary}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <span style={{ ...mono, fontSize: 10.5, color: "var(--faint)" }}>{whenLabel(latest.at)}</span>
                <DemoTag>Simulated</DemoTag>
              </div>
              {latest.refs.length > 0 && <div style={{ marginTop: 8, fontSize: 12.5 }}><RefLinks refs={latest.refs.slice(0, 3)} /></div>}
            </>
          ) : <div style={{ fontSize: 12.5, color: "var(--faint)" }}>No runs yet</div>}
        </div>

        {acts.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <Label style={{ marginBottom: 6 }}>Recent activity</Label>
            {acts.map((e) => (
              <div key={e.id} style={{ display: "flex", gap: 8, fontSize: 11.5, color: "var(--dim)", lineHeight: 1.5, padding: "2px 0" }}>
                <span style={{ ...mono, fontSize: 10, color: "var(--faint)", flex: "none", width: 88 }}>{whenLabel(e.at)}</span>
                <span style={{ minWidth: 0 }}>{e.text}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 14, fontSize: 11.5, color: "var(--accent)", fontWeight: 500 }}>Open agent detail</div>
      </Card>
    </div>
  );
}

function AgentDetail({ a, s, onClose }: { a: AgentDef; s: MuzState; onClose: () => void }) {
  const st = agentStatus(s, a.id);
  const runs = agentRuns(s, a.id);
  const pend = agentPending(s, a.id);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setOpen((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <Card pad={20} style={{ position: "sticky", top: 8 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <div style={{ flex: "none", width: 56, height: 56 }}><AgentFace shape={a.shape} state={st.state} tint={a.tint} size={"52"} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-.4px" }}>{a.name}</div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3, lineHeight: 1.45 }}>{a.role}</div>
          <div style={{ marginTop: 8 }}><Badge tone={st.tone} dot>{st.label}</Badge></div>
        </div>
        <Btn size="sm" onClick={onClose} title="Close detail">Close</Btn>
      </div>
      <p style={{ fontSize: 13, color: "var(--body)", lineHeight: 1.6, margin: "14px 0 0" }}>{a.blurb}</p>
      <Row style={{ marginTop: 14 }}>
        <Btn kind="primary" onClick={() => actions.runAgent(a.id)}>Run now (simulated)</Btn>
        <span style={{ fontSize: 11.5, color: "var(--faint)" }}>Reads demo state only. Nothing external is called.</span>
      </Row>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 20 }}>
        <Section title="Data this agent would need" right={<Badge tone="neutral">Demo data</Badge>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {a.data.map((d) => (
              <div key={d} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 11px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)", fontSize: 12.5 }}>
                <span style={{ flex: 1, minWidth: 0 }}>{d}</span>
                <DemoTag>Not connected</DemoTag>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 8, lineHeight: 1.5 }}>None of these sources is connected to Pulse. This demo reads fictional records held in the browser.</div>
        </Section>

        <Section title={`Waiting for approval (${pend.length})`}>
          {pend.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--dim)", padding: "4px 0" }}>Nothing waiting for this agent.</div> : pend.map((p) => (
            <div key={p.id} style={{ padding: "11px 12px", marginBottom: 8, background: "var(--accent-faint)", border: "1px solid var(--accent-line)", borderRadius: "var(--r-md,12px)" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}><Badge tone="accent">{KIND_LABEL[p.kind]}</Badge><RefLink r={p.ref} style={{ fontSize: 12 }} /></div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: 1.4 }}>{p.title}</div>
              <div style={{ fontSize: 12, color: "var(--dim)", margin: "4px 0 10px", lineHeight: 1.5 }}>{p.impact}</div>
              <ApprovalButtons a={p} />
            </div>
          ))}
        </Section>

        <Section title={`Execution history (${runs.length})`}>
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-md,12px)", overflow: "hidden" }}>
            {runs.length === 0 ? <Empty>No runs yet.</Empty> : runs.map((r) => <RunRow key={r.id} r={r} showAgent={false} open={open.has(r.id)} onToggle={() => toggle(r.id)} />)}
          </div>
        </Section>
      </div>
    </Card>
  );
}

export default function Overview() {
  const s = useMuz();
  const [sel, setSel] = useState<string | null>(null);
  const pend = pendingApprovals(s);
  const today = s.runs.filter((r) => r.at.slice(0, 10) === SNAPSHOT_DATE);
  const proposedToday = sum(today.map((r) => r.proposed));
  const flagged = AGENTS.filter((a) => agentStatus(s, a.id).state === "attention").length;
  const selected = sel ? AGENT_MAP[sel] : null;
  return (
    <>
      <Grid min={190}>
        <Kpi label="Pending approvals" value={pend.length} tone={pend.length ? "accent" : "ok"} sub={pend.length ? "Waiting for a person" : "All caught up"} onClick={() => actions.nav("Agents", "approvals")} hint="Open the approval queue" />
        <Kpi label="Runs today" value={today.length} sub={`${AGENTS.length} agents available`} onClick={() => actions.nav("Agents", "runs")} hint="Open agent runs" />
        <Kpi label="Actions proposed today" value={proposedToday} sub="Each one waits for a decision" />
        <Kpi label="Agents flagged" value={flagged} tone={flagged ? "warn" : "ok"} sub="Latest run raised an exception" />
      </Grid>
      <Callout tone="info">Agents propose, people approve. Nothing is sent or changed outside this demo.</Callout>

      <div style={{ display: "grid", gap: 14, alignItems: "start", gridTemplateColumns: selected ? "minmax(0,1fr) minmax(360px,460px)" : "minmax(0,1fr)" }}>
        <Grid min={selected ? 270 : 300} style={{ alignItems: "stretch" }}>
          {AGENTS.map((a) => <AgentCard key={a.id} a={a} s={s} selected={sel === a.id} onSelect={() => setSel(sel === a.id ? null : a.id)} />)}
        </Grid>
        {selected && <AgentDetail key={selected.id} a={selected} s={s} onClose={() => setSel(null)} />}
      </div>
    </>
  );
}

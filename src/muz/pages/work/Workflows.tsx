import { useState } from "react";
import { WORKFLOWS } from "../../dataset";
import { whenLabel } from "../../format";
import { actions, useMuz } from "../../store";
import type { Workflow } from "../../types";
import { Badge, Btn, Callout, Card, DemoTag, Label, Timeline } from "../../ui";
import { AgentDot, StepFlow, Toggle, agentName, agentRuns, mono } from "../common";

export default function Workflows() {
  const s = useMuz();
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() => Object.fromEntries(WORKFLOWS.map((w) => [w.id, w.status === "active_demo"])));
  const [open, setOpen] = useState<string | null>(null);
  const flip = (w: Workflow, on: boolean) => {
    setEnabled((p) => ({ ...p, [w.id]: on }));
    actions.toast(`${w.name} ${on ? "enabled" : "paused"} (demo setting, not saved)`, on ? "ok" : "info");
  };
  return (
    <>
      <Callout tone="info">Workflows describe what an agent does and where a person must decide. Run now is simulated against demo data and creates an agent run you can see in Agents.</Callout>
      <Card flush title="Workflows" hint={`${Object.values(enabled).filter(Boolean).length} of ${WORKFLOWS.length} enabled`}>
        {WORKFLOWS.map((w) => {
          const on = enabled[w.id];
          const isOpen = open === w.id;
          const last = agentRuns(s, w.agentId)[0];
          return (
            <div key={w.id} style={{ borderTop: "1px solid var(--border)", background: isOpen ? "var(--surface-faint)" : undefined }}>
              <div onClick={() => setOpen(isOpen ? null : w.id)} className="mz-row mz-click" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", padding: "14px 18px", cursor: "pointer", opacity: on ? 1 : 0.7 }}>
                <Toggle on={on} onChange={(v) => flip(w, v)} label={on ? `Pause ${w.name}` : `Enable ${w.name}`} />
                <div style={{ flex: "1 1 240px", minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 9, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{w.name}</span>
                    <Badge tone={w.status === "active_demo" ? "ok" : "neutral"} dot>{w.status === "active_demo" ? "Active in demo" : "Proposed"}</Badge>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>Trigger: {w.trigger}</div>
                </div>
                <div style={{ flex: "1 1 220px", minWidth: 0, display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <AgentDot id={w.agentId} size={22} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--ink)" }}>{agentName(w.agentId)}</div>
                    <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2, lineHeight: 1.45 }}>{last ? <>Last run {whenLabel(last.at)}: {last.summary.length > 90 ? last.summary.slice(0, 88).trimEnd() + "..." : last.summary}</> : "No runs yet"}</div>
                  </div>
                </div>
                <Btn size="sm" kind="soft" disabled={!on} title={on ? undefined : "Enable the workflow to run it"} onClick={(e) => { e.stopPropagation(); actions.runAgent(w.agentId); }}>Run now (simulated)</Btn>
              </div>
              {isOpen && (
                <div style={{ padding: "4px 18px 20px 70px", display: "grid", gap: 18 }}>
                  <p style={{ margin: 0, fontSize: 12.5, color: "var(--body)", lineHeight: 1.55, maxWidth: 720 }}>{w.note}</p>
                  <div>
                    <Label style={{ marginBottom: 10 }}>Steps</Label>
                    <StepFlow steps={w.steps} />
                  </div>
                  <div style={{ maxWidth: 560 }}>
                    <Label style={{ marginBottom: 10 }}>Step detail</Label>
                    <Timeline items={w.steps.map((st) => ({ title: st.label, sub: st.gate ? "A person must approve before this workflow continues." : undefined, tone: st.gate ? "accent" as const : "neutral" as const }))} />
                  </div>
                  <div>
                    <Label style={{ marginBottom: 8 }}>Recent runs</Label>
                    {agentRuns(s, w.agentId).slice(0, 3).map((r) => (
                      <div key={r.id} style={{ display: "flex", gap: 10, fontSize: 12, color: "var(--dim)", padding: "4px 0", lineHeight: 1.5 }}>
                        <span style={{ ...mono, fontSize: 10.5, color: "var(--faint)", width: 100, flex: "none" }}>{whenLabel(r.at)}</span>
                        <span style={{ flex: 1 }}>{r.summary}</span>
                        <DemoTag>Simulated</DemoTag>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </>
  );
}

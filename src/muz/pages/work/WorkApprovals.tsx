import { useState } from "react";
import { useMuz } from "../../store";
import { Badge, Card, Chips, Empty, Label } from "../../ui";
import { ApprovalButtons, DecidedInfo, KIND_LABEL, RefLink, agentName, AgentDot } from "../common";

export default function WorkApprovals() {
  const s = useMuz();
  const [view, setView] = useState("pending");
  const [open, setOpen] = useState<string | null>(null);
  const pend = s.approvals.filter((a) => a.status === "pending");
  const done = s.approvals.filter((a) => a.status !== "pending");
  const rows = view === "pending" ? pend : done;
  return (
    <>
      <Chips options={[{ id: "pending", label: "Awaiting you", count: pend.length }, { id: "decided", label: "Decided", count: done.length }]} value={view} onChange={setView} />
      <Card flush title={view === "pending" ? "Awaiting you" : "Decided"} hint="Proposals prepared by agents. A decision here is recorded locally and shows up in Orders, Finance, Inventory and Activity. Nothing is sent.">
        {rows.length === 0 ? <Empty>{view === "pending" ? "All caught up. Nothing is waiting for you." : "No decisions recorded yet."}</Empty> : rows.map((a) => {
          const isOpen = open === a.id;
          return (
            <div key={a.id} style={{ borderTop: "1px solid var(--border)", background: isOpen ? "var(--surface-faint)" : undefined }}>
              <div onClick={() => setOpen(isOpen ? null : a.id)} className="mz-row mz-click" style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 18px", cursor: "pointer" }}>
                <AgentDot id={a.agentId} size={24} />
                <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: 1.4 }}>{a.title}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <span>{agentName(a.agentId)}</span><Badge tone="neutral">{KIND_LABEL[a.kind]}</Badge>
                    <span onClick={(e) => e.stopPropagation()}><RefLink r={a.ref} /></span>
                  </div>
                </div>
                {a.status === "pending" ? <ApprovalButtons a={a} /> : <DecidedInfo a={a} />}
              </div>
              {isOpen && (
                <div style={{ padding: "2px 18px 16px 54px", display: "grid", gap: 12, maxWidth: 760 }}>
                  <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.55 }}>{a.detail}</div>
                  <div style={{ padding: "10px 12px", borderRadius: "var(--r-sm,10px)", background: "var(--chip)", border: "1px solid var(--chip-border)" }}>
                    <Label style={{ marginBottom: 4 }}>If approved</Label>
                    <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}>{a.impact}</div>
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

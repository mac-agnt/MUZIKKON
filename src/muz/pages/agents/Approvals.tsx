import { useState } from "react";
import { useMuz } from "../../store";
import type { Approval } from "../../types";
import { Badge, Card, Chips, Empty, Label, Row } from "../../ui";
import { AgentDot, ApprovalButtons, DecidedInfo, KIND_LABEL, RefLink, agentName } from "../common";

const ALWAYS = [
  ["Sending customer emails", "Every reply is a draft until a person approves it."],
  ["Creating ERP orders", "Imports are prepared by Order Intake and entered only after approval."],
  ["Changing inventory quantities", "Stock on hand moves at goods receipt or dispatch, never on a proposal."],
  ["Confirming refunds", "Refund decisions are recorded locally. No payment is issued."],
  ["Sending overdue reminders", "Reminders stay drafts. Invoices are never marked paid automatically."],
];

function ApprovalCard({ a }: { a: Approval }) {
  const pending = a.status === "pending";
  return (
    <Card style={{ border: `1px solid ${pending ? "var(--accent-line)" : "var(--border)"}`, opacity: pending ? 1 : 0.9 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <AgentDot id={a.agentId} size={24} />
        <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)" }}>{agentName(a.agentId)}</span>
        <Badge tone="neutral">{KIND_LABEL[a.kind]}</Badge>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "var(--faint)", fontFamily: "var(--mono)" }}>{a.id}</span>
      </div>
      <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-.2px", lineHeight: 1.4 }}>{a.title}</div>
      <p style={{ margin: "7px 0 0", fontSize: 12.5, color: "var(--body)", lineHeight: 1.55 }}>{a.detail}</p>
      <div style={{ margin: "12px 0", padding: "10px 12px", borderRadius: "var(--r-sm,10px)", background: "var(--chip)", border: "1px solid var(--chip-border)" }}>
        <Label style={{ marginBottom: 4 }}>If approved</Label>
        <div style={{ fontSize: 12.5, color: "var(--body)", lineHeight: 1.5 }}>{a.impact}</div>
      </div>
      <Row gap={14} style={{ justifyContent: "space-between" }}>
        <span style={{ fontSize: 12.5, color: "var(--dim)" }}>Record: <RefLink r={a.ref} /></span>
        {pending ? <ApprovalButtons a={a} size="md" /> : <DecidedInfo a={a} />}
      </Row>
    </Card>
  );
}

export default function Approvals() {
  const s = useMuz();
  const [view, setView] = useState("pending");
  const pend = s.approvals.filter((a) => a.status === "pending");
  const done = s.approvals.filter((a) => a.status !== "pending");
  const rows = view === "pending" ? pend : view === "decided" ? done : s.approvals;
  const opts = [
    { id: "pending", label: "Pending", count: pend.length },
    { id: "decided", label: "Decided", count: done.length },
    { id: "all", label: "All", count: s.approvals.length },
  ];
  return (
    <>
      <Chips options={opts} value={view} onChange={setView} />
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "2 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {rows.length === 0 ? (
            <Card><Empty>{view === "pending" ? "All caught up. Nothing is waiting for a decision." : "No decisions recorded yet."}</Empty></Card>
          ) : rows.map((a) => <ApprovalCard key={a.id} a={a} />)}
        </div>
        <div style={{ flex: "1 1 290px", minWidth: 0 }}>
          <Card title="Human approval required" hint="These actions always wait for a person, whatever an agent proposes.">
            {ALWAYS.map(([t, d]) => (
              <div key={t} style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>{t}</div>
                <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3, lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 12, lineHeight: 1.5 }}>In this demo an approval only changes local state and writes an activity row. No email, ERP, Shopify or payment call is made.</div>
          </Card>
        </div>
      </div>
    </>
  );
}

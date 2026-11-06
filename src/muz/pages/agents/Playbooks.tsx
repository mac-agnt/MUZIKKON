import { Fragment } from "react";
import { WORKFLOWS } from "../../dataset";
import { qcStatusOf, stageIndex } from "../../selectors";
import { actions, useMuz, type MuzState } from "../../store";
import type { RecordRef } from "../../types";
import { Badge, Btn, Callout, Card, Grid, Row, TONE } from "../../ui";
import { AgentDot, RefLink, StepFlow, agentName, mono } from "../common";

interface StoryStep { who: string; label: string; done: boolean; gate?: boolean }
interface Story { key: string; title: string; sub: string; ref: RecordRef; steps: StoryStep[]; go: () => void; goLabel: string }

function stories(s: MuzState): Story[] {
  const ord = (id: string) => s.orders.find((o) => o.id === id);
  const appr = (kind: string, refId: string) => s.approvals.find((a) => a.kind === kind && a.ref.id === refId);
  const o42 = ord("MZ-1042"), o44 = ord("MZ-1044");
  const imp = appr("erp_import", "MZ-1042");
  const rem = appr("overdue_reminder", "INV-208");
  const cred = appr("credit_release", "B2B-301");
  const cv = s.conversations.find((c) => c.id === "CV-01");
  const po = s.pos.find((p) => p.id === "PO-D-014");
  const qc44 = o44 ? qcStatusOf(s, o44) : "n/a";
  const afterQc = !!o44 && stageIndex(o44.stage) > stageIndex("qc");
  const carrierOpened = s.activity.some((e) => e.text.startsWith("Carrier investigation opened for MZ-1041"));
  return [
    {
      key: "A", title: "Unmatched Shopify order to ERP", sub: "Online orders are moved by hand today. Pulse prepares the import, a person approves.", ref: { type: "order", id: "MZ-1042" },
      goLabel: "Go to Channel Imports", go: () => actions.nav("Orders", "imports"),
      steps: [
        { who: "Ops Watchdog", label: "Flags MZ-1042 missing from the ERP", done: true },
        { who: "Order Intake", label: "Prepares the ERP import", done: true },
        { who: "Manager", label: "Approves the import", done: imp?.status === "approved" || o42?.erp === "in_erp", gate: true },
        { who: "Pulse", label: "Simulated ERP import", done: o42?.erp === "in_erp" },
      ],
    },
    {
      key: "B", title: "Overdue invoice and credit hold", sub: "Reminder and credit decision stay with people. The invoice is never marked paid by Pulse.", ref: { type: "invoice", id: "INV-208" },
      goLabel: "Go to Receivables", go: () => actions.nav("Finance", "receivables"),
      steps: [
        { who: "Finance Assistant", label: "Flags INV-208 as overdue", done: true },
        { who: "Finance Assistant", label: "Drafts the reminder", done: true },
        { who: "Manager", label: "Approves the reminder (not sent)", done: rem?.status === "approved", gate: true },
        { who: "Manager", label: "Decides on B2B-301 credit hold", done: !!cred && cred.status !== "pending", gate: true },
      ],
    },
    {
      key: "C", title: "Lute quality check to packing", sub: "Dispatch due today. The checklist must be complete before the order can be packed.", ref: { type: "order", id: "MZ-1044" },
      goLabel: "Go to Quality Control", go: () => actions.nav("Fulfilment", "qc"),
      steps: [
        { who: "Dispatch Coordinator", label: "Flags the lute QC due today", done: true },
        { who: "Warehouse", label: "Completes the checklist", done: qc44 === "ready" || qc44 === "passed" },
        { who: "Warehouse", label: "Submits QC, released to packing", done: afterQc, gate: true },
      ],
    },
    {
      key: "D", title: "Delayed US shipment to customer update", sub: "A reply is drafted from the tracking record, then approved before anything would be sent.", ref: { type: "order", id: "MZ-1041" },
      goLabel: "Go to Conversations", go: () => actions.nav("Customers", "conversations"),
      steps: [
        { who: "Dispatch Coordinator", label: "Flags no scan on MZ-1041", done: true },
        { who: "Dispatch Coordinator", label: "Opens the carrier investigation", done: carrierOpened },
        { who: "Customer Service", label: "Drafts the update for CV-01", done: !!cv && (!!cv.draft || cv.status !== "open") },
        { who: "Support", label: "Approves the reply (not sent)", done: cv?.status === "reply_approved", gate: true },
      ],
    },
    {
      key: "E", title: "Stock shortage to purchase order", sub: "Approving the order changes procurement state only. Stock on hand moves at goods receipt.", ref: { type: "po", id: "PO-D-014" },
      goLabel: "Go to Replenishment", go: () => actions.nav("Inventory", "replenishment"),
      steps: [
        { who: "Inventory Planner", label: "Flags 0 available on the 15 String Cèilidh Harp", done: true },
        { who: "Inventory Planner", label: "Drafts PO-D-014", done: !!po },
        { who: "Manager", label: "Approves the purchase order", done: po?.status === "approved" || po?.status === "received", gate: true },
        { who: "Warehouse", label: "Records goods receipt (simulated)", done: po?.status === "received" },
      ],
    },
  ];
}

function StoryRow({ st }: { st: Story }) {
  const doneN = st.steps.filter((x) => x.done).length;
  const next = st.steps.find((x) => !x.done);
  const complete = !next;
  const label = complete ? "Complete" : next!.gate ? "Awaiting approval" : doneN > 2 ? "In progress" : "Open";
  const tone = complete ? "ok" : next!.gate ? "accent" : "info";
  return (
    <div style={{ padding: "16px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <span style={{ flex: "none", width: 28, height: 28, borderRadius: 9, background: "var(--accent-soft)", border: "1px solid var(--accent-line)", color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", ...mono, fontSize: 12, fontWeight: 600 }}>{st.key}</span>
        <div style={{ flex: "1 1 280px", minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{st.title}</div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3, lineHeight: 1.5 }}>{st.sub}</div>
        </div>
        <Row gap={10} style={{ flex: "none" }}>
          <span style={{ fontSize: 12.5 }}><RefLink r={st.ref} /></span>
          <Badge tone={tone} dot>{label}</Badge>
          <span style={{ ...mono, fontSize: 10.5, color: "var(--faint)" }}>{doneN}/{st.steps.length}</span>
          <Btn size="sm" kind="soft" onClick={st.go}>{st.goLabel}</Btn>
        </Row>
      </div>
      <div style={{ display: "flex", alignItems: "stretch", gap: 6, overflowX: "auto", margin: "12px 0 0 40px", paddingBottom: 4 }}>
        {st.steps.map((x, i) => {
          const current = !x.done && st.steps.findIndex((y) => !y.done) === i;
          const t = x.done ? TONE.ok : current ? TONE.accent : TONE.neutral;
          return (
            <Fragment key={i}>
              <div style={{ flex: "none", width: 176, padding: "9px 11px", borderRadius: "var(--r-sm,10px)", background: x.done ? "var(--ok-soft)" : current ? "var(--accent-faint)" : "var(--surface-2)", border: `1px ${x.gate && !x.done ? "dashed" : "solid"} ${t.line}` }}>
                <div style={{ ...mono, fontSize: 8.5, letterSpacing: ".12em", color: t.fg }}>{x.done ? "DONE" : current ? "NEXT" : "LATER"}{x.gate ? ", APPROVAL" : ""}</div>
                <div style={{ fontSize: 12, color: "var(--ink)", marginTop: 4, lineHeight: 1.4 }}>{x.label}</div>
                <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 3 }}>{x.who}</div>
              </div>
              {i < st.steps.length - 1 && <span style={{ alignSelf: "center", color: "var(--faint)", fontSize: 12 }}>→</span>}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default function Playbooks() {
  const s = useMuz();
  return (
    <>
      <Callout tone="info" title="Playbooks are proposals, not live automations">
        Each playbook shows what an agent would do and where a person must decide. Gates marked human approval cannot be skipped. Pulse sits alongside the ERP and never replaces its stock ledger.
      </Callout>
      <Grid min={440}>
        {WORKFLOWS.map((wf) => (
          <Card key={wf.id} title={wf.name} hint={`Trigger: ${wf.trigger}`} right={<Badge tone={wf.status === "active_demo" ? "ok" : "neutral"} dot>{wf.status === "active_demo" ? "Active in demo" : "Proposed"}</Badge>}>
            <Row gap={9} style={{ marginBottom: 12 }}>
              <AgentDot id={wf.agentId} size={22} />
              <span style={{ fontSize: 12.5, color: "var(--body)" }}>Owned by <span style={{ color: "var(--ink)", fontWeight: 500 }}>{agentName(wf.agentId)}</span></span>
            </Row>
            <StepFlow steps={wf.steps} />
            <p style={{ margin: "12px 0 14px", fontSize: 12.5, color: "var(--dim)", lineHeight: 1.55 }}>{wf.note}</p>
            <Btn size="sm" onClick={() => actions.runAgent(wf.agentId)}>Run now (simulated)</Btn>
          </Card>
        ))}
      </Grid>
      <Card title="Coordination map" hint="Five story threads that cross agents and people. Status is computed from the live demo state, so it moves as you approve things elsewhere.">
        {stories(s).map((st) => <StoryRow key={st.key} st={st} />)}
      </Card>
    </>
  );
}

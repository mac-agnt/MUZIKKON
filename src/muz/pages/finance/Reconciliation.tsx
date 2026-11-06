import { useState } from "react";
import { actions, useMuz } from "../../store";
import { CUSTOMER_BY_ID } from "../../dataset";
import { reconciliation, type MatchState } from "../../selectors";
import { eur } from "../../format";
import { Badge, Btn, Callout, Card, Chips, Col, DataTable, Grid, Kpi, Page, PageHead, RecLink, DemoTag } from "../../ui";
import type { Tone } from "../../types";
import { mono } from "./shared";

type Row = ReturnType<typeof reconciliation>[number];
type F = "all" | "attention" | "matched";
const STATE: Record<MatchState, { tone: Tone; label: string }> = {
  matched: { tone: "ok", label: "Matched" },
  unmatched: { tone: "warn", label: "Unmatched" },
  approval: { tone: "bad", label: "Approval required" },
};

export default function Reconciliation() {
  const s = useMuz();
  const [f, setF] = useState<F>("all");
  const all = reconciliation(s);
  const count = (st: MatchState) => all.filter((r) => r.state === st).length;
  const rows = all.filter((r) => f === "all" || (f === "matched" ? r.state === "matched" : r.state !== "matched"));

  const cols: Col<Row>[] = [
    {
      key: "shop", label: "Shopify order", w: "minmax(120px,1fr)",
      render: (r) => (r.order.shopifyRef ? <span style={mono}>Shopify {r.order.shopifyRef}</span> : <span style={{ color: "var(--faint)" }}>Not a Shopify order</span>),
      sort: (a, b) => (a.order.shopifyRef ?? "").localeCompare(b.order.shopifyRef ?? ""),
    },
    {
      key: "cust", label: "Customer", w: "minmax(150px,1.2fr)",
      render: (r) => <RecLink r={{ type: "customer", id: r.order.customerId }} style={{ color: "var(--ink)" }}>{CUSTOMER_BY_ID[r.order.customerId].name}</RecLink>,
    },
    {
      key: "pay", label: "Payment", w: "130px",
      render: (r) => (r.order.channel === "online" ? <Badge tone="ok">Paid on Shopify</Badge> : <Badge>On account</Badge>),
    },
    {
      key: "erp", label: "ERP order", w: "100px",
      render: (r) => (r.order.erp === "in_erp" ? <RecLink r={{ type: "order", id: r.order.id }}>{r.order.id}</RecLink> : <span style={{ color: "var(--warn)" }}>Not in ERP</span>),
      sort: (a, b) => Number(a.order.erp === "in_erp") - Number(b.order.erp === "in_erp"),
    },
    {
      key: "inv", label: "ERP invoice", w: "130px",
      render: (r) => (r.invoice ? <span><RecLink r={{ type: "invoice", id: r.invoice.id }}>{r.invoice.id}</RecLink> <span style={{ ...mono, fontSize: 11, color: "var(--faint)" }}>{eur(r.invoice.amount)}</span></span> : <span style={{ color: "var(--warn)" }}>None yet</span>),
    },
    {
      key: "state", label: "Match", w: "150px",
      render: (r) => <Badge tone={STATE[r.state].tone} dot>{STATE[r.state].label}</Badge>,
      sort: (a, b) => Number(a.state === "matched") - Number(b.state === "matched"),
    },
    { key: "note", label: "Note", w: "minmax(240px,2.2fr)", render: (r) => <span title={r.note}>{r.note}</span> },
    {
      key: "act", label: "Action", w: "minmax(190px,1.4fr)",
      render: (r) =>
        r.state === "unmatched" ? <Btn size="sm" kind="primary" onClick={(e) => { e.stopPropagation(); actions.importOrder(r.order.id); }}>Resolve via simulated import</Btn>
        : r.state === "approval" ? <Btn size="sm" kind="soft" onClick={(e) => { e.stopPropagation(); actions.nav("Agents", "approvals"); }}>Open approvals</Btn>
        : <span style={{ color: "var(--faint)" }}>No action</span>,
    },
  ];

  return (
    <Page>
      <PageHead
        eyebrow="Finance"
        title="Reconciliation"
        sub="Each order in flight is checked against the ERP order and the ERP invoice. A mismatch becomes a suggestion for a person to approve."
        right={<DemoTag>Simulated matching</DemoTag>}
      />

      <Grid min={190}>
        <Kpi label="Matched" value={count("matched")} sub="Shopify, ERP order and invoice agree" tone="ok" />
        <Kpi label="Unmatched" value={count("unmatched")} sub="paid on Shopify, missing in ERP" tone={count("unmatched") ? "warn" : "ok"} />
        <Kpi label="Approval required" value={count("approval")} sub="held for a credit decision" tone={count("approval") ? "bad" : "ok"} />
      </Grid>

      <Callout tone="info" title="What is being matched">
        No bank transactions or accounting system are connected. Matching is between Shopify, ERP order and ERP invoice records only, and the results here are simulated from demo data.
      </Callout>

      <Chips<F>
        value={f}
        onChange={setF}
        options={[
          { id: "all", label: "All orders", count: all.length },
          { id: "attention", label: "Needs attention", count: all.length - count("matched") },
          { id: "matched", label: "Matched", count: count("matched") },
        ]}
      />

      <Card flush>
        <DataTable cols={cols} rows={rows} rowKey={(r) => r.order.id} onRow={(r) => actions.open({ type: "order", id: r.order.id })} empty="Nothing in this view." />
      </Card>
    </Page>
  );
}

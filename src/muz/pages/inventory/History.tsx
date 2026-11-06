import { useState } from "react";
import { actions, useMuz } from "../../store";
import { PRODUCT_BY_SKU, PRODUCTS } from "../../dataset";
import { eur, whenLabel } from "../../format";
import { orderValue } from "../../selectors";
import { Badge, Btn, Card, Chips, Col, DataTable, DemoTag, Empty, Grid, Kpi, Page, PageHead, RecLink, Row } from "../../ui";
import type { StockEvent, Tone } from "../../types";
import { mono, reservedBy, Select } from "./shared";

type K = "all" | StockEvent["kind"];
const KIND_LABEL: Record<StockEvent["kind"], string> = { allocation: "Allocation", release: "Release", dispatch: "Dispatch", receipt: "Receipt", proposal: "Proposal", adjustment: "Adjustment" };
const KIND_TONE: Record<StockEvent["kind"], Tone> = { allocation: "info", release: "neutral", dispatch: "accent", receipt: "ok", proposal: "warn", adjustment: "neutral" };

export default function History() {
  const s = useMuz();
  const [kind, setKind] = useState<K>("all");
  const [sku, setSku] = useState("all");

  /* Newest first. Events prepended by the store keep their order for equal timestamps. */
  const ordered = s.stockEvents
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.at < b.e.at ? 1 : a.e.at > b.e.at ? -1 : a.i - b.i))
    .map((x) => x.e);
  const rows = ordered.filter((e) => (kind === "all" || e.kind === kind) && (sku === "all" || e.sku === sku));
  const kinds = (Object.keys(KIND_LABEL) as StockEvent["kind"][]).filter((k) => s.stockEvents.some((e) => e.kind === k));

  /* Tentative holds: orders whose stock is reserved but not confirmed in the ERP, or held for credit review. */
  const tentative = s.orders.filter((o) => o.erp === "not_in_erp" || o.creditHold);

  const refCell = (ref: string) => {
    if (s.orders.some((o) => o.id === ref)) return <RecLink r={{ type: "order", id: ref }}>{ref}</RecLink>;
    if (s.pos.some((p) => p.id === ref)) return <RecLink r={{ type: "po", id: ref }}>{ref}</RecLink>;
    return <span style={{ color: "var(--dim)" }}>{ref}</span>;
  };

  const cols: Col<StockEvent>[] = [
    { key: "at", label: "When", w: "130px", render: (e) => <span style={{ color: "var(--dim)" }}>{whenLabel(e.at)}</span>, sort: (a, b) => (a.at < b.at ? -1 : 1) },
    { key: "sku", label: "Product", w: "minmax(170px,1.5fr)", render: (e) => <RecLink r={{ type: "product", id: e.sku }}>{PRODUCT_BY_SKU[e.sku].short}</RecLink>, sort: (a, b) => a.sku.localeCompare(b.sku) },
    { key: "kind", label: "Event", w: "104px", render: (e) => <Badge tone={KIND_TONE[e.kind]}>{KIND_LABEL[e.kind]}</Badge> },
    {
      key: "qty", label: "Qty", w: "92px", align: "right",
      render: (e) => e.kind === "proposal" ? <span style={{ ...mono, color: "var(--faint)" }}>{e.qty ? `${e.qty} proposed` : "no change"}</span> : <span style={{ ...mono, color: e.qty > 0 ? "var(--ok)" : "var(--ink)" }}>{e.qty > 0 ? `+${e.qty}` : e.qty}</span>,
      sort: (a, b) => a.qty - b.qty,
    },
    { key: "ref", label: "Reference", w: "110px", render: (e) => refCell(e.ref) },
    { key: "note", label: "Note", w: "minmax(260px,2.4fr)", render: (e) => <span title={e.note}>{e.note}</span> },
    { key: "src", label: "Source", w: "140px", render: (e) => (e.simulated ? <Badge tone="accent">Simulated</Badge> : <Badge>Current process</Badge>) },
  ];

  const simulated = s.stockEvents.filter((e) => e.simulated).length;

  return (
    <Page>
      <PageHead
        eyebrow="Inventory"
        title="Stock history"
        sub="Every movement Pulse can see, newest first. Entries marked Simulated come from actions in this demo; Current process entries describe what happens in the ERP today."
        right={<Badge tone="neutral">Ledger stays in the ERP</Badge>}
      />

      <Grid min={190}>
        <Kpi label="Events logged" value={s.stockEvents.length} sub="in this session" />
        <Kpi label="Simulated by Pulse" value={simulated} sub="demo actions and proposals" tone="accent" />
        <Kpi label="Current process" value={s.stockEvents.length - simulated} sub="as recorded today" />
        <Kpi label="Receipts" value={s.stockEvents.filter((e) => e.kind === "receipt").length} sub="simulated goods receipts" tone={s.stockEvents.some((e) => e.kind === "receipt") ? "ok" : "neutral"} />
      </Grid>

      <Card
        title="Proposed allocation changes"
        hint="Tentative holds that exist only until the ERP confirms them."
        right={<DemoTag>Proposed Pulse visibility</DemoTag>}
      >
        {tentative.length === 0 && <Empty>No tentative holds. Every allocation is confirmed in the ERP.</Empty>}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tentative.map((o) => {
            const l = o.lines[0];
            const p = PRODUCT_BY_SKU[l.sku];
            const heldTotal = reservedBy(s, l.sku).reduce((a, x) => a + x.qty, 0);
            const notInErp = o.erp === "not_in_erp";
            return (
              <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-md,14px)", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    <RecLink r={{ type: "order", id: o.id }}>{o.id}</RecLink>
                    <span style={{ color: "var(--dim)", fontWeight: 400 }}> holds {l.qty} × {p.short}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3, lineHeight: 1.5 }}>
                    {notInErp
                      ? `Tentative hold before ERP entry. The ERP has no order yet, so the ${l.qty} unit is not confirmed. Order value ${eur(orderValue(o))}, paid on Shopify.`
                      : `Allocation held while the order is on credit hold. ${heldTotal} unit${heldTotal === 1 ? "" : "s"} of this product are reserved in total.`}
                  </div>
                </div>
                <Badge tone={notInErp ? "warn" : "bad"} dot>{notInErp ? "Awaiting ERP entry" : "Credit hold"}</Badge>
                {notInErp ? (
                  <Btn size="sm" kind="primary" onClick={() => actions.importOrder(o.id)}>Confirm via simulated import</Btn>
                ) : (
                  <Btn size="sm" onClick={() => actions.nav("Finance", "receivables")}>Review in Finance</Btn>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Row gap={12} style={{ justifyContent: "space-between" }}>
        <Chips<K>
          value={kind}
          onChange={setKind}
          options={[{ id: "all", label: "All events", count: s.stockEvents.length }, ...kinds.map((k) => ({ id: k as K, label: KIND_LABEL[k], count: s.stockEvents.filter((e) => e.kind === k).length }))]}
        />
        <Select value={sku} onChange={setSku} options={[{ id: "all", label: "All products" }, ...PRODUCTS.map((p) => ({ id: p.sku, label: p.short }))]} />
      </Row>

      <Card flush>
        <DataTable cols={cols} rows={rows} rowKey={(e) => e.id} empty="No stock events match these filters." />
      </Card>
    </Page>
  );
}

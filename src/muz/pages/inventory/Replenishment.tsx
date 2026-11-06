import type { ReactNode } from "react";
import { actions, useMuz } from "../../store";
import type { MuzState } from "../../store";
import { demandPerWeek, lowStock, stockOf, stockTable, suggestQty } from "../../selectors";
import { PRODUCT_BY_SKU, SNAPSHOT_DATE, SUPPLIERS } from "../../dataset";
import { addDays, dmy, eur0 } from "../../format";
import { Badge, Btn, Callout, Card, Col, DataTable, DemoTag, Grid, Kpi, Label, Page, PageHead, RecLink, Row, Thumb } from "../../ui";
import type { PurchaseOrder } from "../../types";
import { mono, openPo, openProduct, poStatusLabel, poStatusTone, relatedOrders, StatusBadge, supplierOf } from "./shared";

export default function Replenishment() {
  const s = useMuz();
  const low = lowStock(s);
  const proposed = s.pos.filter((p) => p.status === "proposed");
  const approved = s.pos.filter((p) => p.status === "approved");
  const openValue = [...proposed, ...approved].reduce((a, p) => a + p.qty * p.unitCost, 0);

  /* Candidates: low-stock products plus anything that has a purchase order in play. */
  const candidates = stockTable(s)
    .filter((r) => r.low || s.pos.some((p) => p.sku === r.product.sku))
    .sort((a, b) => Number(b.out) - Number(a.out) || a.available - b.available);

  const poCols: Col<PurchaseOrder>[] = [
    { key: "id", label: "PO", w: "100px", render: (p) => <RecLink r={{ type: "po", id: p.id }}>{p.id}</RecLink>, sort: (a, b) => a.id.localeCompare(b.id) },
    { key: "prod", label: "Product", w: "minmax(180px,1.6fr)", render: (p) => <span style={{ color: "var(--ink)" }}>{PRODUCT_BY_SKU[p.sku].short}</span>, sort: (a, b) => a.sku.localeCompare(b.sku) },
    { key: "qty", label: "Qty", w: "56px", align: "right", render: (p) => <span style={mono}>{p.qty}</span>, sort: (a, b) => a.qty - b.qty },
    { key: "sup", label: "Supplier (mock)", w: "minmax(150px,1.3fr)", render: (p) => supplierOf(p.supplierId).name },
    { key: "cost", label: "Est. cost", w: "96px", align: "right", render: (p) => <span style={mono}>{eur0(p.qty * p.unitCost)}</span>, sort: (a, b) => a.qty * a.unitCost - b.qty * b.unitCost },
    { key: "when", label: "Raised", w: "78px", render: (p) => dmy(p.createdAt) },
    { key: "st", label: "Status", w: "140px", render: (p) => <Badge tone={poStatusTone(p.status)} dot>{poStatusLabel(p.status)}</Badge> },
    {
      key: "act", label: "Next step", w: "minmax(190px,1.4fr)",
      render: (p) =>
        p.status === "proposed" ? <Btn size="sm" kind="primary" onClick={(e) => { e.stopPropagation(); actions.approvePO(p.id); }}>Approve</Btn>
        : p.status === "approved" ? <Btn size="sm" kind="soft" onClick={(e) => { e.stopPropagation(); actions.receiveGoods(p.id); }}>Record goods receipt</Btn>
        : <span style={{ color: "var(--faint)" }}>Complete</span>,
    },
  ];

  return (
    <Page>
      <PageHead
        eyebrow="Inventory"
        title="Replenishment"
        sub="Suggested purchase orders for every low-stock product. Pulse drafts; a person approves; stock only moves when goods are received."
        right={<DemoTag>Suppliers and costs are mock</DemoTag>}
      />

      <Grid min={190}>
        <Kpi label="Products to review" value={low.length} sub="below reorder point" tone={low.length ? "warn" : "ok"} />
        <Kpi label="Draft purchase orders" value={proposed.length} sub="waiting for approval" tone={proposed.length ? "accent" : "neutral"} />
        <Kpi label="Approved, not received" value={approved.length} sub="stock still unchanged" tone={approved.length ? "info" : "neutral"} />
        <Kpi label="Open PO value" value={eur0(openValue)} sub="demo cost estimate" />
      </Grid>

      {candidates.length === 0 && <Callout tone="ok" title="Nothing to replenish">Every product is above its reorder point.</Callout>}

      <Grid min={470}>
        {candidates.map((r) => <Candidate key={r.product.sku} s={s} sku={r.product.sku} />)}
      </Grid>

      <Card title="Purchase orders" hint="All drafts and orders in this demo. Approving does not change stock; goods receipt does." flush right={<span style={{ paddingRight: 4 }}><DemoTag>Simulated</DemoTag></span>}>
        <DataTable cols={poCols} rows={s.pos} rowKey={(p) => p.id} onRow={(p) => actions.open({ type: "po", id: p.id })} empty="No purchase orders yet." />
      </Card>

      <div>
        <Row style={{ marginBottom: 10 }}><Label>Suppliers</Label><DemoTag>Mock suppliers, not real vendors</DemoTag></Row>
        <Grid min={260}>
          {SUPPLIERS.map((sup) => {
            const skus = Object.values(PRODUCT_BY_SKU).filter((p) => p.supplierId === sup.id);
            const pos = s.pos.filter((p) => p.supplierId === sup.id && p.status !== "received");
            return (
              <div key={sup.id} className="mz-click" onClick={() => actions.open({ type: "supplier", id: sup.id })} style={{ display: "flex", cursor: "pointer" }}>
                <Card style={{ flex: 1 }} pad={16}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{sup.name}</div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>{sup.speciality}</div>
                  <Row gap={8} style={{ marginTop: 12 }}>
                    <Badge>{sup.leadTimeDays} day lead time</Badge>
                    <Badge>{skus.length} products</Badge>
                    <Badge tone={pos.length ? "accent" : "neutral"}>{pos.length} open PO</Badge>
                  </Row>
                  <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 12 }}>Mock supplier, not a real vendor</div>
                </Card>
              </div>
            );
          })}
        </Grid>
      </div>
    </Page>
  );
}

/* One product's replenishment card with the three-step flow. */
function Candidate({ s, sku }: { s: MuzState; sku: string }) {
  const p = PRODUCT_BY_SKU[sku];
  const r = stockOf(s, sku);
  const po = openPo(s, sku);
  const received = !po ? s.pos.find((x) => x.sku === sku && x.status === "received") : undefined;
  const shown = po ?? received;
  const sup = supplierOf(p.supplierId);
  const qty = shown ? shown.qty : suggestQty(s, sku);
  const unit = shown ? shown.unitCost : p.cost;
  const demand = demandPerWeek(sku);
  const cover = r.available <= 0 ? 0 : r.available / demand;
  const noOrders = r.onHand === 0 && relatedOrders(s, sku).length === 0;

  const d1 = !!shown;
  const d2 = !!shown && shown.status !== "proposed";
  const d3 = !!shown && shown.status === "received";
  const active = !d1 ? 1 : !d2 ? 2 : !d3 ? 3 : 4;

  const headline = d3
    ? `Goods received (simulated). On hand is now ${r.onHand}, ${r.available} available.`
    : po?.status === "approved" ? `${po.id} approved. Waiting for goods.`
    : po ? `Review replenishment: draft ${po.id} (${po.qty} units).`
    : noOrders && r.out ? "Currently unavailable in demo scenario (no active paid order)."
    : "Below reorder point.";

  return (
    <Card pad={18} style={{ borderColor: d3 ? "rgba(94,231,154,.3)" : undefined }}>
      <div style={{ display: "flex", gap: 14 }}>
        <Thumb src={p.image} size={56} label={p.short} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Row gap={8} style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
            <button onClick={() => openProduct(sku)} className="mz-reclink" style={{ border: 0, background: "none", padding: 0, textAlign: "left", fontSize: 15, fontWeight: 600, color: "var(--ink)", cursor: "pointer" }}>{p.short}</button>
            <StatusBadge r={r} />
          </Row>
          <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 5, lineHeight: 1.5 }}>{headline}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(104px,1fr))", gap: 8, marginTop: 14 }}>
        <Fact k="Suggested qty" v={qty} />
        <Fact k="Supplier" v={sup.name.replace(" (demo)", "")} small />
        <Fact k="Lead time" v={`${sup.leadTimeDays} days`} />
        <Fact k="Unit cost" v={eur0(unit)} note="estimate" />
        <Fact k="Est. cost" v={eur0(qty * unit)} note="estimate" />
        <Fact k="Demand / week" v={demand.toFixed(1)} />
        <Fact k="Weeks of cover" v={cover.toFixed(1)} tone={cover < 1 ? "bad" : cover < 2 ? "warn" : undefined} />
        <Fact k="Earliest arrival" v={dmy(addDays(SNAPSHOT_DATE, sup.leadTimeDays))} note="if approved today" />
      </div>

      <div style={{ marginTop: 16 }}>
        <Stepper active={active} steps={[
          { label: "Reorder proposal", sub: d1 ? shown!.id : "Not started" },
          { label: "Approve", sub: d2 ? "Approved" : d1 ? "Waiting" : "After proposal" },
          { label: "Goods receipt", sub: d3 ? `+${shown!.qty} on hand` : "After approval" },
        ]} />
      </div>

      <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {active === 1 && <Btn kind="primary" onClick={() => actions.createReorderProposal(sku)}>Create reorder proposal</Btn>}
        {active === 2 && po && <Btn kind="primary" onClick={() => actions.approvePO(po.id)}>Approve {po.id}</Btn>}
        {active === 3 && po && <Btn kind="soft" onClick={() => actions.receiveGoods(po.id)}>Record simulated goods receipt</Btn>}
        {active === 4 && <Btn disabled title="This purchase order is complete">Goods received</Btn>}
        {active === 2 && <span style={{ fontSize: 12, color: "var(--dim)" }}>Nothing is ordered until this is approved.</span>}
        {active === 3 && <span style={{ fontSize: 12, color: "var(--warn)" }}>Inventory unchanged until goods receipt.</span>}
        {active === 4 && <span style={{ fontSize: 12, color: "var(--ok)" }}>On hand is now {r.onHand}.</span>}
        {active === 1 && <span style={{ fontSize: 12, color: "var(--dim)" }}>Drafts a purchase order for approval. No stock change.</span>}
      </div>
    </Card>
  );
}

function Fact({ k, v, note, tone, small }: { k: string; v: ReactNode; note?: string; tone?: "bad" | "warn"; small?: boolean }) {
  return (
    <div style={{ padding: "8px 10px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)", minWidth: 0 }}>
      <div style={{ ...mono, fontSize: 8.5, letterSpacing: ".1em", color: "var(--faint)" }}>{k.toUpperCase()}</div>
      <div style={{ fontSize: small ? 12 : 15, fontWeight: 600, marginTop: 4, color: tone ? `var(--${tone})` : "var(--ink)", fontVariantNumeric: "tabular-nums", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: small ? "normal" : "nowrap", lineHeight: 1.3 }}>{v}</div>
      {note && <div style={{ fontSize: 10, color: "var(--faint)", marginTop: 2 }}>{note}</div>}
    </div>
  );
}

function Stepper({ active, steps }: { active: number; steps: { label: string; sub: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${steps.length},minmax(0,1fr))`, gap: 8 }}>
      {steps.map((st, i) => {
        const n = i + 1;
        const done = n < active;
        const on = n === active;
        return (
          <div key={st.label} style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ flex: "none", width: 22, height: 22, borderRadius: 7, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, background: done ? "var(--ok-soft)" : on ? "var(--accent-soft)" : "var(--surface-2)", color: done ? "var(--ok)" : on ? "var(--accent)" : "var(--faint)", border: `1px solid ${done ? "rgba(94,231,154,.3)" : on ? "var(--accent-line)" : "var(--border)"}` }}>
                {done ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg> : n}
              </span>
              <span style={{ flex: 1, height: 2, borderRadius: 2, background: done ? "var(--ok)" : "var(--track)", opacity: i === steps.length - 1 ? 0 : 1 }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 7, color: on || done ? "var(--ink)" : "var(--dim)" }}>{st.label}</div>
            <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{st.sub}</div>
          </div>
        );
      })}
    </div>
  );
}


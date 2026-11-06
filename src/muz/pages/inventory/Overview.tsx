import { actions, useMuz } from "../../store";
import { lowStock, outOfStock, stockTable, stockUnits } from "../../selectors";
import { PRODUCT_BY_SKU } from "../../dataset";
import { Badge, Btn, Callout, Card, DemoTag, Empty, Grid, Kpi, Page, PageHead, RecLink, Row, Thumb } from "../../ui";
import { mono, openPo, openProduct, poStatusLabel, poStatusTone, reasonText, relatedOrders, StatusBadge, StockBars, supplierOf } from "./shared";
import { dmy, eur } from "../../format";

export default function Overview() {
  const s = useMuz();
  const u = stockUnits(s);
  const low = lowStock(s);
  const out = outOfStock(s);
  const table = stockTable(s);
  const chartRows = [...table].sort((a, b) => a.available - b.available || b.onHand - a.onHand);
  const channel = s.approvals.filter((a) => a.kind === "channel_stock");

  return (
    <Page>
      <PageHead
        eyebrow="Inventory"
        title="Stock at a glance"
        sub="On hand, allocated and available for every product, with the items that need a decision first."
        right={<Badge tone="neutral">Source of truth stays in the ERP</Badge>}
      />

      <Grid min={190}>
        <Kpi label="On hand" value={u.onHand} sub={`units across ${table.length} products`} onClick={() => actions.setTab("Inventory", "levels")} hint="Open stock levels" />
        <Kpi label="Allocated" value={u.allocated} sub="held by orders not yet dispatched" tone="info" />
        <Kpi label="Available" value={u.available} sub="on hand minus allocated" tone="accent" />
        <Kpi label="Low-stock items" value={low.length} sub="available below reorder point" tone={low.length ? "warn" : "ok"} onClick={() => actions.setTab("Inventory", "replenishment")} hint="Open replenishment" />
        <Kpi label="No available stock" value={out.length} sub="cannot take new orders" tone={out.length ? "bad" : "ok"} onClick={() => actions.setTab("Inventory", "levels")} hint="Open stock levels" />
      </Grid>

      <Grid cols="repeat(auto-fit,minmax(min(100%,460px),1fr))">
        <Card title="Availability by product" hint="Allocated against available units, lowest availability first. Click a product to open it.">
          <StockBars rows={chartRows} onPick={openProduct} />
        </Card>

        <Card
          title="Needs replenishment"
          hint="Available stock is below the reorder point."
          right={<Btn size="sm" onClick={() => actions.setTab("Inventory", "replenishment")}>Open replenishment</Btn>}
        >
          {low.length === 0 && <Empty>Nothing is below its reorder point.</Empty>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {low.map((r) => {
              const po = openPo(s, r.product.sku);
              const noOrders = r.onHand === 0 && relatedOrders(s, r.product.sku).length === 0;
              return (
                <div key={r.product.sku} style={{ display: "flex", gap: 12, padding: 12, background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-md,14px)" }}>
                  <Thumb src={r.product.image} size={46} label={r.product.short} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Row gap={8} style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.product.short}</span>
                      <StatusBadge r={r} />
                    </Row>
                    <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4, lineHeight: 1.5 }}>{reasonText(r)}</div>
                    {noOrders && <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 3 }}>No active paid order in the demo scenario.</div>}
                    <Row gap={8} style={{ marginTop: 10 }}>
                      {po ? (
                        <Badge tone={poStatusTone(po.status)}>
                          {po.status === "proposed" ? `Draft ${po.id} pending` : `${po.id} ${poStatusLabel(po.status).toLowerCase()}`}
                        </Badge>
                      ) : (
                        <Btn size="sm" kind="soft" onClick={() => actions.createReorderProposal(r.product.sku)}>Create reorder proposal</Btn>
                      )}
                      <Btn size="sm" onClick={() => openProduct(r.product.sku)}>Open product</Btn>
                    </Row>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Grid>

      <Grid cols="repeat(auto-fit,minmax(min(100%,460px),1fr))">
        <Card
          title="Proposed channel stock updates"
          hint="Stop online sales of a product that has nothing available. Recorded locally only."
          right={<DemoTag>Shopify not connected</DemoTag>}
        >
          {channel.length === 0 && <Empty>No channel updates are proposed.</Empty>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {channel.map((a) => {
              const sku = a.ref.id;
              const p = PRODUCT_BY_SKU[sku];
              const state = s.channelStock[sku] ?? (a.status === "pending" ? "proposed" : undefined);
              return (
                <div key={a.id} style={{ padding: 14, background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-md,14px)" }}>
                  <Row gap={10} style={{ flexWrap: "nowrap" }}>
                    <Thumb src={p.image} size={40} label={p.short} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title}</div>
                      <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3, lineHeight: 1.5 }}>{a.detail}</div>
                    </div>
                  </Row>
                  <Row gap={8} style={{ marginTop: 12, justifyContent: "space-between" }}>
                    <Row gap={8}>
                      <span style={{ ...mono, fontSize: 9.5, letterSpacing: ".1em", color: "var(--faint)" }}>SHOPIFY LISTING (DEMO)</span>
                      {state === "proposed" && <Badge tone="warn">Out of stock proposed</Badge>}
                      {state === "approved" && <Badge tone="ok">Marked out of stock (demo)</Badge>}
                      {!state && <Badge tone="neutral">{a.status === "rejected" ? "No change, proposal rejected" : "No change"}</Badge>}
                    </Row>
                    {a.status === "pending" ? (
                      <Row gap={8}>
                        <Btn size="sm" kind="primary" onClick={() => actions.approve(a.id)}>Approve</Btn>
                        <Btn size="sm" kind="danger" onClick={() => actions.reject(a.id)}>Reject</Btn>
                      </Row>
                    ) : (
                      <Badge tone={a.status === "approved" ? "ok" : "neutral"}>{a.status === "approved" ? "Approved locally, Shopify not called" : "Rejected"}</Badge>
                    )}
                  </Row>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Purchase orders" hint="Procurement state only. Stock on hand changes at goods receipt." right={<Btn size="sm" onClick={() => actions.setTab("Inventory", "replenishment")}>Manage</Btn>}>
          {s.pos.length === 0 && <Empty>No purchase orders yet.</Empty>}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {s.pos.map((po) => {
              const p = PRODUCT_BY_SKU[po.sku];
              return (
                <div key={po.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
                  <Thumb src={p.image} size={34} label={p.short} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13 }}><RecLink r={{ type: "po", id: po.id }}>{po.id}</RecLink> <span style={{ color: "var(--dim)" }}>{po.qty} × {p.short}</span></div>
                    <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>{supplierOf(po.supplierId).name}, est. {eur(po.qty * po.unitCost)} (demo estimate), raised {dmy(po.createdAt)}</div>
                  </div>
                  <Badge tone={poStatusTone(po.status)}>{poStatusLabel(po.status)}</Badge>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12 }}>
            <Callout tone="info" title="Inventory unchanged until goods receipt">
              Approving a purchase order does not add stock. Units appear on hand only after a simulated goods receipt.
            </Callout>
          </div>
        </Card>
      </Grid>
    </Page>
  );
}

import { useMemo, useState } from "react";
import { useMuz } from "../../store";
import { stockOf } from "../../selectors";
import { PRODUCTS } from "../../dataset";
import { Badge, Card, Chips, DemoTag, Empty, Grid, Label, PageHead, Page, RecLink, Row, SearchBox, Thumb } from "../../ui";
import { eur0 } from "../../format";
import { mono, openProduct, relatedOrders, StatusBadge } from "./shared";

export default function Catalogue() {
  const s = useMuz();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  const cats = useMemo(() => Array.from(new Set(PRODUCTS.map((p) => p.category))), []);
  const list = PRODUCTS.filter((p) => (cat === "all" || p.category === cat) && (!q || `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(q.toLowerCase())));

  return (
    <Page>
      <PageHead
        eyebrow="Inventory"
        title="Product catalogue"
        sub="Prices follow the public website listings. Cost is a demo estimate, not Muzikkon's real cost."
        right={<SearchBox value={q} onChange={setQ} placeholder="Search name or SKU" width={260} />}
      />
      <Chips
        value={cat}
        onChange={setCat}
        options={[{ id: "all", label: "All products", count: PRODUCTS.length }, ...cats.map((c) => ({ id: c, label: c, count: PRODUCTS.filter((p) => p.category === c).length }))]}
      />

      {list.length === 0 && <Card><Empty>No products match this search.</Empty></Card>}
      <Grid min={330}>
        {list.map((p) => {
          const r = stockOf(s, p.sku);
          const orders = relatedOrders(s, p.sku);
          const margin = Math.round(((p.price - p.cost) / p.price) * 100);
          return (
            <div key={p.sku} className="mz-click" onClick={() => openProduct(p.sku)} style={{ display: "flex", cursor: "pointer" }}>
              <Card style={{ flex: 1 }} pad={16}>
                <div style={{ display: "flex", gap: 14 }}>
                  <Thumb src={p.image} size={72} label={p.short} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Row gap={8} style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
                      <span style={{ ...mono, fontSize: 10.5, color: "var(--faint)", letterSpacing: ".06em" }}>{p.sku}</span>
                      <StatusBadge r={r} />
                    </Row>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 5, lineHeight: 1.3 }}>{p.short}</div>
                    <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{p.category}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8, marginTop: 14 }}>
                  <Stat k="On hand" v={r.onHand} />
                  <Stat k="Allocated" v={r.allocated} />
                  <Stat k="Available" v={r.available} tone={r.out ? "bad" : r.low ? "warn" : undefined} />
                  <Stat k="Reorder at" v={p.reorderPoint} />
                </div>

                <div style={{ display: "flex", gap: 14, marginTop: 14, alignItems: "baseline", flexWrap: "wrap" }}>
                  <div>
                    <Label>Website price</Label>
                    <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{eur0(p.price)}</div>
                  </div>
                  <div>
                    <Label>Cost estimate</Label>
                    <div style={{ fontSize: 13, marginTop: 4, color: "var(--dim)", fontVariantNumeric: "tabular-nums" }}>{eur0(p.cost)} <span style={{ fontSize: 11, color: "var(--faint)" }}>({margin}% margin)</span></div>
                  </div>
                  <span style={{ marginLeft: "auto" }}><DemoTag>Demo estimate</DemoTag></span>
                </div>

                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--dim)", lineHeight: 1.7 }}>
                  <span style={{ color: "var(--faint)" }}>Orders containing this product: </span>
                  {orders.length === 0 && "none in flight"}
                  {orders.map((o, i) => (
                    <span key={o.id}>
                      {i > 0 && ", "}
                      <RecLink r={{ type: "order", id: o.id }}>{o.id}</RecLink>
                    </span>
                  ))}
                  {orders.length > 0 && <Badge style={{ marginLeft: 8 }}>{orders.length}</Badge>}
                </div>
              </Card>
            </div>
          );
        })}
      </Grid>
    </Page>
  );
}

function Stat({ k, v, tone }: { k: string; v: number; tone?: "bad" | "warn" }) {
  return (
    <div style={{ padding: "8px 10px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)" }}>
      <div style={{ ...mono, fontSize: 8.5, letterSpacing: ".1em", color: "var(--faint)" }}>{k.toUpperCase()}</div>
      <div style={{ fontSize: 17, fontWeight: 600, marginTop: 3, color: tone ? `var(--${tone})` : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{v}</div>
    </div>
  );
}

import { useState } from "react";
import { useMuz } from "../../store";
import { stockTable } from "../../selectors";
import { Card, Chips, Col, DataTable, Page, PageHead, Row, SearchBox, Thumb } from "../../ui";
import { mono, openProduct, ReservedLinks, reservedBy, StatusBadge, StockBars, type StockRow } from "./shared";

type F = "all" | "low" | "out" | "ok";

export default function Levels() {
  const s = useMuz();
  const [q, setQ] = useState("");
  const [f, setF] = useState<F>("all");
  const all = stockTable(s);

  const counts = { all: all.length, low: all.filter((r) => r.low).length, out: all.filter((r) => r.out).length, ok: all.filter((r) => !r.low).length };
  const rows = all.filter((r) => {
    const hit = !q || `${r.product.name} ${r.product.sku} ${r.product.category}`.toLowerCase().includes(q.toLowerCase());
    const fit = f === "all" || (f === "low" && r.low) || (f === "out" && r.out) || (f === "ok" && !r.low);
    return hit && fit;
  });

  const cols: Col<StockRow>[] = [
    {
      key: "product", label: "Product", w: "minmax(230px,2.2fr)",
      render: (r) => (
        <Row gap={10} style={{ flexWrap: "nowrap" }}>
          <Thumb src={r.product.image} size={30} label={r.product.short} />
          <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", color: "var(--ink)", fontWeight: 500 }}>{r.product.short}</span>
        </Row>
      ),
      sort: (a, b) => a.product.short.localeCompare(b.product.short),
    },
    { key: "sku", label: "SKU", w: "110px", render: (r) => <span style={{ ...mono, fontSize: 11, color: "var(--faint)" }}>{r.product.sku}</span>, sort: (a, b) => a.product.sku.localeCompare(b.product.sku) },
    { key: "onHand", label: "On hand", w: "84px", align: "right", render: (r) => <span style={mono}>{r.onHand}</span>, sort: (a, b) => a.onHand - b.onHand },
    { key: "alloc", label: "Allocated", w: "88px", align: "right", render: (r) => <span style={mono}>{r.allocated}</span>, sort: (a, b) => a.allocated - b.allocated },
    { key: "avail", label: "Available", w: "88px", align: "right", render: (r) => <span style={{ ...mono, color: r.out ? "var(--bad)" : r.low ? "var(--warn)" : "var(--ink)", fontWeight: 600 }}>{r.available}</span>, sort: (a, b) => a.available - b.available },
    { key: "rp", label: "Reorder at", w: "92px", align: "right", render: (r) => <span style={mono}>{r.reorderPoint}</span>, sort: (a, b) => a.reorderPoint - b.reorderPoint },
    { key: "status", label: "Status", w: "88px", render: (r) => <StatusBadge r={r} />, sort: (a, b) => Number(b.low) + Number(b.out) - (Number(a.low) + Number(a.out)) },
    { key: "by", label: "Reserved by", w: "minmax(180px,1.6fr)", render: (r) => <ReservedLine sku={r.product.sku} /> },
  ];

  return (
    <Page>
      <PageHead
        eyebrow="Inventory"
        title="Stock levels"
        sub="Available is on hand minus units allocated to orders that have not been dispatched. Click a row for the product record."
        right={<SearchBox value={q} onChange={setQ} placeholder="Search products" width={240} />}
      />

      <Card title="Availability chart" hint="Bar length is units on hand, split into allocated and available.">
        <StockBars rows={[...all].sort((a, b) => b.onHand - a.onHand)} onPick={openProduct} columns={340} />
      </Card>

      <Chips<F>
        value={f}
        onChange={setF}
        options={[
          { id: "all", label: "All", count: counts.all },
          { id: "low", label: "Low", count: counts.low },
          { id: "out", label: "Out of stock", count: counts.out },
          { id: "ok", label: "Healthy", count: counts.ok },
        ]}
      />

      <Card flush>
        <DataTable cols={cols} rows={rows} rowKey={(r) => r.product.sku} onRow={(r) => openProduct(r.product.sku)} empty="No products match these filters." />
      </Card>
    </Page>
  );
}

function ReservedLine({ sku }: { sku: string }) {
  const s = useMuz();
  return <ReservedLinks items={reservedBy(s, sku)} />;
}

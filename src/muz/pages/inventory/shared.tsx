/* Inventory: shared helpers for the five tabs. Pulse is an oversight layer; the ERP stays the stock ledger. */
import type { CSSProperties, ReactNode } from "react";
import type { MuzState } from "../../store";
import { actions } from "../../store";
import { PRODUCT_BY_SKU, SUPPLIERS } from "../../dataset";
import type { Order, PurchaseOrder, Tone } from "../../types";
import { Badge, CHART, RecLink, Row } from "../../ui";
import { stageIndex, stockOf } from "../../selectors";

export const mono: CSSProperties = { fontFamily: "var(--mono)" };

export type StockRow = ReturnType<typeof stockOf>;

export const supplierOf = (id: string) => SUPPLIERS.find((x) => x.id === id)!;

export function statusOf(r: StockRow): { tone: Tone; label: string } {
  if (r.out) return { tone: "bad", label: "Out" };
  if (r.low) return { tone: "warn", label: "Low" };
  return { tone: "ok", label: "OK" };
}
export const StatusBadge = ({ r }: { r: StockRow }) => {
  const st = statusOf(r);
  return <Badge tone={st.tone} dot>{st.label}</Badge>;
};

/** Orders that currently hold allocation on a SKU (not yet dispatched). */
export function reservedBy(s: MuzState, sku: string): { order: Order; qty: number }[] {
  return s.orders
    .filter((o) => stageIndex(o.stage) < stageIndex("dispatched"))
    .map((o) => ({ order: o, qty: o.lines.filter((l) => l.sku === sku).reduce((a, l) => a + l.qty, 0) }))
    .filter((x) => x.qty > 0);
}
/** Every order that contains a SKU (in flight or delivered). */
export const relatedOrders = (s: MuzState, sku: string): Order[] => s.orders.filter((o) => o.lines.some((l) => l.sku === sku));

export const openPo = (s: MuzState, sku: string): PurchaseOrder | undefined => s.pos.find((p) => p.sku === sku && p.status !== "received");
export const latestPo = (s: MuzState, sku: string): PurchaseOrder | undefined => s.pos.find((p) => p.sku === sku);

export const reasonText = (r: StockRow) => `${r.onHand} on hand, ${r.allocated} allocated, ${r.available} available, reorder point ${r.reorderPoint}`;

export const poStatusTone = (st: PurchaseOrder["status"]): Tone => (st === "received" ? "ok" : st === "approved" ? "info" : "warn");
export const poStatusLabel = (st: PurchaseOrder["status"]) => (st === "received" ? "Received (simulated)" : st === "approved" ? "Approved" : "Proposed");

/** Stacked allocated + available bars per product. Scaled to the largest on-hand figure. */
export function StockBars({ rows, onPick, columns }: { rows: StockRow[]; onPick?: (sku: string) => void; columns?: number }) {
  const max = Math.max(...rows.map((r) => r.onHand), 1);
  return (
    <div>
      <div style={{ display: "grid", gap: "10px 28px", gridTemplateColumns: columns ? `repeat(auto-fit,minmax(${columns}px,1fr))` : "1fr" }}>
        {rows.map((r) => {
          const st = statusOf(r);
          const alloc = Math.max(0, Math.min(r.allocated, r.onHand));
          const avail = Math.max(0, r.onHand - alloc);
          return (
            <div key={r.product.sku} onClick={onPick ? () => onPick(r.product.sku) : undefined} className={onPick ? "mz-click" : undefined} style={{ cursor: onPick ? "pointer" : "default", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontSize: 12.5 }}>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.product.short}</span>
                <span style={{ ...mono, fontSize: 11, color: "var(--faint)" }}>{r.allocated} alloc</span>
                <span style={{ ...mono, fontSize: 12, color: st.tone === "ok" ? "var(--ink)" : `var(--${st.tone === "bad" ? "bad" : "warn"})` }}>{r.available} avail</span>
              </div>
              <div style={{ display: "flex", height: 8, borderRadius: 99, background: "var(--track)", marginTop: 6, overflow: "hidden" }}>
                {r.onHand > 0 && (
                  <>
                    <div title={`${alloc} allocated`} style={{ width: `${(alloc / max) * 100}%`, background: CHART[3], transition: "width .5s var(--ease)" }} />
                    <div title={`${avail} available`} style={{ width: `${(avail / max) * 100}%`, background: st.tone === "ok" ? CHART[0] : st.tone === "bad" ? "var(--bad)" : "var(--warn)", transition: "width .5s var(--ease)" }} />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Row gap={16} style={{ marginTop: 14 }}>
        <Legend color={CHART[3]}>Allocated to orders</Legend>
        <Legend color={CHART[0]}>Available</Legend>
        <Legend color="var(--warn)">Available, below reorder point</Legend>
        <Legend color="var(--bad)">Nothing available</Legend>
      </Row>
    </div>
  );
}
const Legend = ({ color, children }: { color: string; children: ReactNode }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--dim)" }}>
    <span style={{ width: 8, height: 8, borderRadius: 3, background: color }} />
    {children}
  </span>
);

/** Comma-separated order links with quantity. */
export function ReservedLinks({ items }: { items: { order: Order; qty: number }[] }) {
  if (!items.length) return <span style={{ color: "var(--faint)" }}>None</span>;
  return (
    <span>
      {items.map((x, i) => (
        <span key={x.order.id}>
          {i > 0 && ", "}
          <RecLink r={{ type: "order", id: x.order.id }}>{x.order.id}</RecLink>
          <span style={{ color: "var(--faint)" }}> ×{x.qty}</span>
        </span>
      ))}
    </span>
  );
}

export const openProduct = (sku: string) => actions.open({ type: "product", id: sku });
export const productName = (sku: string) => PRODUCT_BY_SKU[sku].short;

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ height: 30, padding: "0 12px", borderRadius: "var(--r-ctl,999px)", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--ink)", fontSize: 12, outline: 0, cursor: "pointer", maxWidth: 240 }}>
      {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );
}

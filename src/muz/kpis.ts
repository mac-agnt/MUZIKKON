/* KPI definitions for the Dashboard band, derived from the store. */
import { getState } from "./store";
import { attention, lowStock, outOfStock, receivables, totals } from "./selectors";
import { eur, plural } from "./format";
import { SNAPSHOT_DATE } from "./dataset";

export const MUZ_KPI_ORDER = ["flight", "attention", "receivables", "lowstock", "overdue", "orders", "online", "dueToday"];

export function muzKpiDefs(): Record<string, { label: string; value: string; delta: string; dir: "up" | "down"; hint: string }> {
  const s = getState();
  const t = totals(s);
  const r = receivables(s);
  const low = lowStock(s);
  const out = outOfStock(s);
  const att = attention(s);
  const due = s.orders.filter((o) => o.stage !== "dispatched" && o.stage !== "delivered" && o.dispatchBy <= SNAPSHOT_DATE).length;
  return {
    flight: { label: "Value in flight", value: eur(t.totalValue), delta: plural(t.count, "order"), dir: "up", hint: "not revenue" },
    attention: { label: "Needs attention", value: String(att.length), delta: `of ${t.count}`, dir: att.length ? "down" : "up", hint: "flagged" },
    receivables: { label: "Wholesale owed", value: eur(r.outstanding), delta: plural(r.openCount, "invoice"), dir: "up", hint: "not extra sales" },
    lowstock: { label: "Low-stock warnings", value: String(low.length), delta: `${out.length} at zero`, dir: low.length ? "down" : "up", hint: "below reorder point" },
    overdue: { label: "Overdue invoices", value: eur(r.overdueAmount), delta: plural(r.overdueCount, "invoice"), dir: r.overdueCount ? "down" : "up", hint: "wholesale" },
    orders: { label: "Orders in flight", value: String(t.count), delta: `${t.onlineCount} online`, dir: "up", hint: `${t.wholesaleCount} wholesale` },
    online: { label: "Online order value", value: eur(t.onlineValue), delta: plural(t.onlineCount, "order"), dir: "up", hint: "Shopify" },
    dueToday: { label: "Due to dispatch today", value: String(due), delta: "target 24 to 48h", dir: due ? "down" : "up", hint: "published goal" },
  };
}

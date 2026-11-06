/* Pure derived values. Every total in the demo comes from here, from the same state. */
import type { MuzState } from "./store";
import { CUSTOMER_BY_ID, HISTORY, PRODUCT_BY_SKU, PRODUCTS, SNAPSHOT_DATE, STAFF } from "./dataset";
import { daysBetween } from "./format";
import type { Approval, Customer, Invoice, Issue, Order, StageId } from "./types";
import { STAGES } from "./types";

export const stageIndex = (id: StageId) => STAGES.findIndex((s) => s.id === id);
export const stageLabel = (id: StageId) => STAGES.find((s) => s.id === id)!.label;

export const orderValue = (o: Order) => o.lines.reduce((a, l) => a + l.qty * l.unitPrice, 0);
export const round2 = (n: number) => Math.round(n * 100) / 100;
export const customerOf = (o: Order): Customer => CUSTOMER_BY_ID[o.customerId];
export const staffName = (id: string) => STAFF.find((s) => s.id === id)?.name ?? id;

export const productLabel = (o: Order) =>
  o.lines.map((l) => `${PRODUCT_BY_SKU[l.sku].short}${l.qty > 1 ? ` ×${l.qty}` : ""}`).join(", ");
export const orderQty = (o: Order) => o.lines.reduce((a, l) => a + l.qty, 0);

/* In flight = anything not yet delivered. */
export const inFlight = (s: MuzState) => s.orders.filter((o) => o.stage !== "delivered");

export function totals(s: MuzState) {
  const f = inFlight(s);
  const online = f.filter((o) => o.channel === "online");
  const wholesale = f.filter((o) => o.channel === "wholesale");
  const sum = (xs: Order[]) => round2(xs.reduce((a, o) => a + orderValue(o), 0));
  return {
    count: f.length,
    onlineCount: online.length,
    wholesaleCount: wholesale.length,
    onlineValue: sum(online),
    wholesaleValue: sum(wholesale),
    totalValue: sum(f),
    flagged: attention(s).length,
    avgOnline: online.length ? round2(sum(online) / online.length) : 0,
    avgWholesale: wholesale.length ? round2(sum(wholesale) / wholesale.length) : 0,
  };
}

export const attention = (s: MuzState): Issue[] => s.issues.filter((i) => !i.resolved);
export const issueFor = (s: MuzState, orderId: string): Issue | undefined =>
  s.issues.find((i) => i.orderId === orderId && !i.resolved);

/* Allocated = lines on orders that have not left the building (shipped orders are not reserved). */
export function allocated(s: MuzState, sku: string): number {
  return s.orders
    .filter((o) => stageIndex(o.stage) < stageIndex("dispatched"))
    .reduce((a, o) => a + o.lines.filter((l) => l.sku === sku).reduce((b, l) => b + l.qty, 0), 0);
}
export function stockOf(s: MuzState, sku: string) {
  const p = PRODUCT_BY_SKU[sku];
  const onHand = s.onHand[sku] ?? 0;
  const alloc = allocated(s, sku);
  const available = onHand - alloc;
  return {
    product: p,
    onHand,
    allocated: alloc,
    available,
    reorderPoint: p.reorderPoint,
    low: available < p.reorderPoint,
    out: available <= 0,
  };
}
export const stockTable = (s: MuzState) => PRODUCTS.map((p) => stockOf(s, p.sku));
export const lowStock = (s: MuzState) => stockTable(s).filter((r) => r.low);
export const outOfStock = (s: MuzState) => stockTable(s).filter((r) => r.out);
export const stockUnits = (s: MuzState) => {
  const t = stockTable(s);
  return { onHand: t.reduce((a, r) => a + r.onHand, 0), allocated: t.reduce((a, r) => a + r.allocated, 0), available: t.reduce((a, r) => a + r.available, 0) };
};

/** Suggested replenishment quantity: bring available up to twice the reorder point, minimum 3. */
export function suggestQty(s: MuzState, sku: string): number {
  const r = stockOf(s, sku);
  if (sku === "MZ-HRP-015") return 8;
  if (sku === "MZ-BZK-008") return 6;
  if (sku === "MZ-HRP-036") return 3;
  return Math.max(3, r.reorderPoint * 2 - r.available);
}
export const demandPerWeek = (sku: string): number => {
  const m: Record<string, number> = { "MZ-HRP-015": 2.4, "MZ-BZK-008": 1.8, "MZ-HRP-036": 0.7, "MZ-HRP-029": 1.5, "MZ-HRP-022": 1.4, "MZ-LUT-006": 0.6, "MZ-KAL-001": 3.2 };
  return m[sku] ?? 0.8;
};

export function pipelineCounts(s: MuzState) {
  return STAGES.map((st) => ({
    ...st,
    count: s.orders.filter((o) => o.stage === st.id).length,
    value: round2(s.orders.filter((o) => o.stage === st.id).reduce((a, o) => a + orderValue(o), 0)),
  }));
}

/* Finance */
export const daysOverdue = (inv: Invoice) => (inv.status === "paid" ? 0 : Math.max(0, daysBetween(inv.due, SNAPSHOT_DATE)));
export const isOverdue = (inv: Invoice) => daysOverdue(inv) > 0;
export const wholesaleInvoices = (s: MuzState) => s.invoices.filter((i) => CUSTOMER_BY_ID[i.customerId].type !== "retail");
export function receivables(s: MuzState) {
  const open = wholesaleInvoices(s).filter((i) => i.status === "outstanding");
  const overdue = open.filter(isOverdue);
  return {
    outstanding: round2(open.reduce((a, i) => a + i.amount, 0)),
    overdueAmount: round2(overdue.reduce((a, i) => a + i.amount, 0)),
    overdueCount: overdue.length,
    openCount: open.length,
    open,
    overdue,
    remindersAwaiting: s.approvals.filter((a) => a.kind === "overdue_reminder" && a.status === "pending").length,
  };
}
export function onlinePaid(s: MuzState) {
  const o = inFlight(s).filter((x) => x.channel === "online" && x.payment === "paid");
  return { count: o.length, value: round2(o.reduce((a, x) => a + orderValue(x), 0)) };
}

export type MatchState = "matched" | "unmatched" | "approval";
export function reconciliation(s: MuzState) {
  return inFlight(s).map((o) => {
    const inv = s.invoices.find((i) => i.id === o.invoiceId);
    let state: MatchState = "matched";
    let note = "Shopify, ERP order and invoice agree";
    if (o.channel === "online" && o.erp === "not_in_erp") { state = "unmatched"; note = "Paid on Shopify, no ERP order or invoice yet"; }
    else if (o.creditHold) { state = "approval"; note = "Held for credit review; invoice overdue"; }
    else if (o.channel === "wholesale") { note = "ERP order and invoice agree; awaiting customer payment"; }
    return { order: o, invoice: inv, state, note };
  });
}

/* Customers */
export const ordersOfCustomer = (s: MuzState, id: string) => s.orders.filter((o) => o.customerId === id);
export const historyOfCustomer = (id: string) => HISTORY.filter((h) => h.customerId === id);
export function customerSpend(s: MuzState, id: string): number {
  const a = ordersOfCustomer(s, id).reduce((x, o) => x + orderValue(o), 0);
  const b = historyOfCustomer(id).reduce((x, h) => x + h.value, 0);
  return round2(a + b);
}
export const openCases = (s: MuzState, id: string) =>
  s.conversations.filter((c) => c.customerId === id && c.status !== "reply_approved");
export const balanceOf = (s: MuzState, id: string) =>
  round2(s.invoices.filter((i) => i.customerId === id && i.status === "outstanding").reduce((a, i) => a + i.amount, 0));

export const pendingApprovals = (s: MuzState): Approval[] => s.approvals.filter((a) => a.status === "pending");
export const openTasks = (s: MuzState) => s.tasks.filter((t) => t.status !== "done");

/* Shipments: orders that are packed or beyond. */
export function shipments(s: MuzState) {
  return s.orders.filter((o) => stageIndex(o.stage) >= stageIndex("packed")).map((o) => {
    let status = "Awaiting dispatch";
    if (o.stage === "packed") status = o.packStatus === "packed" ? "Packed, ready to dispatch" : "Ready to pack";
    if (o.stage === "dispatched") status = o.tracking?.status === "no_update" ? "Dispatched, tracking exception" : "In transit";
    if (o.stage === "delivered") status = "Delivered";
    const progress = o.stage === "packed" ? (o.packStatus === "packed" ? 0.4 : 0.2) : o.stage === "dispatched" ? (o.tracking?.status === "no_update" ? 0.55 : 0.8) : 1;
    return { order: o, status, progress };
  });
}

export function exceptionsByCause(s: MuzState) {
  const labels: Record<string, string> = { erp_missing: "Missing from ERP", qc_pending: "Quality check pending", tracking_exception: "Tracking exception", credit_hold: "Credit hold" };
  const kinds = Object.keys(labels);
  return kinds.map((k) => ({ kind: k, label: labels[k], count: s.issues.filter((i) => i.kind === k && !i.resolved).length }));
}

export const qcStatusOf = (s: MuzState, o: Order): "pending" | "in_progress" | "ready" | "passed" | "n/a" => {
  if (o.stage !== "qc") return stageIndex(o.stage) > stageIndex("qc") ? "passed" : "n/a";
  const st = s.qc[o.id] || {};
  const n = Object.values(st).filter(Boolean).length;
  const family = qcFamily(o);
  const total = (qcItemsFor(family)).length;
  if (n === 0) return "pending";
  if (n < total) return "in_progress";
  return "ready";
};
export const qcFamily = (o: Order): string => {
  const f = PRODUCT_BY_SKU[o.lines[0].sku].family;
  return f === "harp" || f === "lute" || f === "bouzouki" ? f : "general";
};
import { QC_CHECKLISTS } from "./dataset";
export const qcItemsFor = (family: string) => (QC_CHECKLISTS[family] || QC_CHECKLISTS.general).items;

export const orderStatusText = (s: MuzState, o: Order): string => {
  if (o.creditHold) return "Credit hold";
  if (o.erp === "not_in_erp") return "Awaiting ERP entry";
  switch (o.stage) {
    case "new": return "New";
    case "erp": return "Awaiting picking";
    case "picking": return "Picking";
    case "qc": return qcStatusOf(s, o) === "pending" ? "Quality check pending" : "Quality check in progress";
    case "packed": return o.packStatus === "packed" ? "Ready to dispatch" : "Ready to pack";
    case "dispatched": return o.tracking?.status === "no_update" ? "Shipped, tracking update needed" : "Shipped";
    case "delivered": return "Delivered";
  }
};

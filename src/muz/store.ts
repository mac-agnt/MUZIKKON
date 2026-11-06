/* Local demo state. Nothing here calls a network, a database or an external system.
   Every "send", "import" or "approve" only changes this in-memory state and writes an activity row. */
import { useSyncExternalStore } from "react";
import {
  AGENTS, CUSTOMER_BY_ID, PRODUCT_BY_SKU, QC_SEED_STATE, SEED_ACTIVITY, SEED_APPROVALS, SEED_CONVERSATIONS, SEED_IMPORTS,
  SEED_INVOICES, SEED_ISSUES, SEED_ORDERS, SEED_POS, SEED_RUNS, SEED_STOCK_EVENTS, SEED_TASKS, SEED_ON_HAND, SNAPSHOT_NOW, STAFF, SUPPLIERS, SNAPSHOT_DATE,
} from "./dataset";
import { hhmm, isoAddMinutes, eur, dmy } from "./format";
import {
  allocated, daysOverdue, orderValue, qcFamily, qcItemsFor, stageIndex, stockOf, suggestQty,
} from "./selectors";
import type {
  Activity, AgentRun, Approval, Conversation, ImportRecord, Invoice, Issue, Order, PurchaseOrder, RecordRef, StageId, StockEvent, Task, Tone,
} from "./types";
import { STAGES } from "./types";

export interface Toast { id: number; text: string; tone: Tone }
export interface MuzState {
  orders: Order[];
  issues: Issue[];
  onHand: Record<string, number>;
  invoices: Invoice[];
  pos: PurchaseOrder[];
  stockEvents: StockEvent[];
  conversations: Conversation[];
  tasks: Task[];
  approvals: Approval[];
  activity: Activity[];
  runs: AgentRun[];
  imports: ImportRecord[];
  qc: Record<string, Record<string, boolean>>;
  channelStock: Record<string, "proposed" | "approved">;
  clock: number;
  seq: number;
  toasts: Toast[];
  tabs: Record<string, string>;
  drawer: RecordRef | null;
  chatSeen: number;
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

function seed(): MuzState {
  return {
    orders: clone(SEED_ORDERS),
    issues: clone(SEED_ISSUES),
    onHand: { ...SEED_ON_HAND },
    invoices: clone(SEED_INVOICES),
    pos: clone(SEED_POS),
    stockEvents: clone(SEED_STOCK_EVENTS),
    conversations: clone(SEED_CONVERSATIONS),
    tasks: clone(SEED_TASKS),
    approvals: clone(SEED_APPROVALS),
    activity: clone(SEED_ACTIVITY),
    runs: clone(SEED_RUNS),
    imports: clone(SEED_IMPORTS),
    qc: clone(QC_SEED_STATE),
    channelStock: {},
    clock: 0,
    seq: 100,
    toasts: [],
    tabs: {},
    drawer: null,
    chatSeen: 0,
  };
}

let state: MuzState = seed();
const listeners = new Set<() => void>();
let navHandler: ((page: string) => void) | null = null;

function emit() { listeners.forEach((l) => l()); }
function set(fn: (s: MuzState) => MuzState) { state = fn(state); emit(); }
export function getState() { return state; }
export function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }
export function useMuz(): MuzState { return useSyncExternalStore(subscribe, getState, getState); }

/* ── helpers ─────────────────────────────────────────────────────────────── */
const nowIso = (s: MuzState) => isoAddMinutes(SNAPSHOT_NOW, s.clock);
const nid = (s: MuzState, p: string) => `${p}-${s.seq}`;

function withEvent(s: MuzState, e: Omit<Activity, "id" | "at">): MuzState {
  const at = nowIso(s);
  return { ...s, seq: s.seq + 1, activity: [{ ...e, id: nid(s, "A"), at }, ...s.activity] };
}
function tick(s: MuzState, mins = 2): MuzState { return { ...s, clock: s.clock + mins }; }
function toast(s: MuzState, text: string, tone: Tone = "ok"): MuzState {
  const t = { id: s.seq + 1, text, tone };
  setTimeout(() => dismissToast(t.id), 4200);
  return { ...s, seq: s.seq + 2, toasts: [...s.toasts, t].slice(-3) };
}
export function dismissToast(id: number) { set((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })); }
function patchOrder(s: MuzState, id: string, p: Partial<Order>): MuzState {
  return { ...s, orders: s.orders.map((o) => (o.id === id ? { ...o, ...p } : o)) };
}
function resolveIssue(s: MuzState, orderId: string, kind: Issue["kind"]): MuzState {
  return { ...s, issues: s.issues.map((i) => (i.orderId === orderId && i.kind === kind ? { ...i, resolved: true } : i)) };
}
function doneTasksFor(s: MuzState, ref: RecordRef, ids?: string[]): MuzState {
  return { ...s, tasks: s.tasks.map((t) => ((ids ? ids.includes(t.id) : t.ref.type === ref.type && t.ref.id === ref.id) ? { ...t, status: "done" } : t)) };
}
function stockEvent(s: MuzState, e: Omit<StockEvent, "id" | "at">): MuzState {
  return { ...s, seq: s.seq + 1, stockEvents: [{ ...e, id: nid(s, "SE"), at: nowIso(s) }, ...s.stockEvents] };
}
function decide(s: MuzState, id: string, status: "approved" | "rejected"): MuzState {
  return { ...s, approvals: s.approvals.map((a) => (a.id === id ? { ...a, status, decidedAt: nowIso(s), decidedBy: "Umer Farooq (demo)" } : a)) };
}
function pendingFor(s: MuzState, kind: Approval["kind"], ref: RecordRef) {
  return s.approvals.find((a) => a.kind === kind && a.ref.type === ref.type && a.ref.id === ref.id && a.status === "pending");
}
function runLine(s: MuzState, agentId: string, summary: string, refs: RecordRef[], steps: string[]): MuzState {
  const r: AgentRun = { id: nid(s, "RUN"), agentId, at: nowIso(s), duration: "3s", outcome: "completed", proposed: 0, summary, refs, steps, simulated: true };
  return { ...s, seq: s.seq + 1, runs: [r, ...s.runs] };
}

/* ── public actions ──────────────────────────────────────────────────────── */
export const actions = {
  /* navigation / ui */
  registerNav(fn: (page: string) => void) { navHandler = fn; },
  nav(page: string, tab?: string) {
    if (tab) set((s) => ({ ...s, tabs: { ...s.tabs, [page]: tab } }));
    navHandler?.(page);
  },
  setTab(page: string, tab: string) { set((s) => ({ ...s, tabs: { ...s.tabs, [page]: tab } })); },
  open(ref: RecordRef | null) { set((s) => ({ ...s, drawer: ref })); },
  toast(text: string, tone: Tone = "ok") { set((s) => toast(s, text, tone)); },
  reset() { set(() => { const n = seed(); return toast(n, "Demo reset to the Friday 6 November 2026 snapshot", "info"); }); },

  /* ── Orders ── */
  importOrder(orderId: string) {
    set((s) => {
      const o = s.orders.find((x) => x.id === orderId);
      if (!o || o.erp === "in_erp") return toast(s, "Order is already in the ERP", "info");
      const cust = CUSTOMER_BY_ID[o.customerId];
      let n = tick(s);
      const invId = "INV-210";
      n = patchOrder(n, orderId, { erp: "in_erp", stage: "erp", invoiceId: invId, note: "Imported into the ERP (simulated)" });
      n = { ...n, invoices: [...n.invoices, { id: invId, customerId: o.customerId, orderId, amount: orderValue(o), issued: SNAPSHOT_DATE, due: SNAPSHOT_DATE, status: "paid", reminder: "none", note: "Prepared by simulated import. Paid on Shopify" }] };
      n = resolveIssue(n, orderId, "erp_missing");
      n = doneTasksFor(n, { type: "order", id: orderId }, ["T-01"]);
      n = { ...n, approvals: n.approvals.map((a) => (a.kind === "erp_import" && a.ref.id === orderId && a.status === "pending" ? { ...a, status: "approved", decidedAt: nowIso(n), decidedBy: "Umer Farooq (demo)" } : a)) };
      const imp: ImportRecord = { id: nid(n, "IMP"), orderId, at: nowIso(n), result: "imported", note: `Simulated import for ${cust.name}. No Shopify or ERP call was made.`, simulated: true };
      n = { ...n, seq: n.seq + 1, imports: [imp, ...n.imports] };
      n = withEvent(n, { source: "Pulse", actorType: "staff", actor: "Umer Farooq", text: `Approved simulated ERP import for ${orderId}`, ref: { type: "order", id: orderId }, simulated: true, approval: true });
      n = tick(n, 1);
      n = withEvent(n, { source: "Muzikkon ERP", actorType: "system", actor: "Simulated ERP import", text: `Simulated ERP import completed for ${orderId} (${cust.name}); invoice ${invId} prepared`, ref: { type: "order", id: orderId }, simulated: true });
      n = withEvent(n, { source: "Muzikkon ERP", actorType: "system", actor: "Simulated ERP import", text: `Order allocation confirmed for ${orderId}`, ref: { type: "order", id: orderId }, simulated: true });
      n = stockEvent(n, { sku: o.lines[0].sku, kind: "allocation", qty: -o.lines[0].qty, ref: orderId, note: "Allocation confirmed after simulated ERP import", simulated: true });
      n = runLine(n, "intake", `Simulated ERP import completed for ${orderId}`, [{ type: "order", id: orderId }], ["Manager approved import", "Created ERP order (simulated)", "Confirmed allocation"]);
      return toast(n, `${orderId} imported into the ERP (simulated, nothing external was called)`);
    });
  },
  startPicking(orderId: string) {
    set((s) => {
      const o = s.orders.find((x) => x.id === orderId)!;
      if (o.erp === "not_in_erp") return toast(s, "Import this order into the ERP first", "warn");
      if (o.creditHold) return toast(s, "Order is on credit hold", "warn");
      let n = patchOrder(tick(s), orderId, { stage: "picking", pickStarted: true });
      n = withEvent(n, { source: "Staff", actorType: "staff", actor: "Cathal Doyle", text: `Started picking ${orderId}`, ref: { type: "order", id: orderId }, simulated: true });
      return toast(n, `Picking started for ${orderId}`);
    });
  },
  completePicking(orderId: string) {
    set((s) => {
      let n = patchOrder(tick(s), orderId, { stage: "qc" });
      n = withEvent(n, { source: "Staff", actorType: "staff", actor: "Cathal Doyle", text: `Picked ${orderId}; sent to quality check`, ref: { type: "order", id: orderId }, simulated: true });
      return toast(n, `${orderId} moved to quality check`);
    });
  },
  setQc(orderId: string, key: string, val: boolean) {
    set((s) => ({ ...s, qc: { ...s.qc, [orderId]: { ...(s.qc[orderId] || {}), [key]: val } } }));
  },
  qcAll(orderId: string) {
    set((s) => {
      const o = s.orders.find((x) => x.id === orderId)!;
      const items = qcItemsFor(qcFamily(o));
      return { ...s, qc: { ...s.qc, [orderId]: Object.fromEntries(items.map((i) => [i.key, true])) } };
    });
  },
  submitQc(orderId: string) {
    set((s) => {
      const o = s.orders.find((x) => x.id === orderId)!;
      const items = qcItemsFor(qcFamily(o));
      const st = s.qc[orderId] || {};
      if (!items.every((i) => st[i.key])) return toast(s, "Complete every check before submitting", "warn");
      let n = patchOrder(tick(s), orderId, { stage: "packed", packStatus: "ready" });
      n = resolveIssue(n, orderId, "qc_pending");
      n = doneTasksFor(n, { type: "order", id: orderId });
      n = withEvent(n, { source: "Staff", actorType: "staff", actor: "Cathal Doyle", text: `Quality check submitted for ${orderId}; eligible for packing`, ref: { type: "order", id: orderId }, simulated: true });
      return toast(n, `${orderId} passed quality control and is ready to pack`);
    });
  },
  markPacked(orderId: string) {
    set((s) => {
      let n = patchOrder(tick(s), orderId, { packStatus: "packed" });
      n = withEvent(n, { source: "Staff", actorType: "staff", actor: "Cathal Doyle", text: `Marked ${orderId} packed and ready to dispatch`, ref: { type: "order", id: orderId }, simulated: true });
      return toast(n, `${orderId} packed, ready to dispatch`);
    });
  },
  dispatch(orderId: string) {
    set((s) => {
      const o = s.orders.find((x) => x.id === orderId)!;
      let n = tick(s);
      const ref = `DEMO-TRK-${orderId.replace(/\D/g, "")}`;
      n = patchOrder(n, orderId, { stage: "dispatched", tracking: { ref, carrier: "Carrier TBC", status: "label_created", lastUpdate: "Label created (placeholder)" } });
      const onHand = { ...n.onHand };
      o.lines.forEach((l) => { onHand[l.sku] = Math.max(0, (onHand[l.sku] ?? 0) - l.qty); });
      n = { ...n, onHand };
      o.lines.forEach((l) => { n = stockEvent(n, { sku: l.sku, kind: "dispatch", qty: -l.qty, ref: orderId, note: `Shipped to ${o.destination}`, simulated: true }); });
      n = withEvent(n, { source: "Staff", actorType: "staff", actor: "Cathal Doyle", text: `Dispatched ${orderId} to ${o.destination}`, ref: { type: "order", id: orderId }, simulated: true });
      return toast(n, `${orderId} dispatched. Stock on hand reduced.`);
    });
  },
  markDelivered(orderId: string) {
    set((s) => {
      let n = patchOrder(tick(s), orderId, { stage: "delivered", tracking: { ...(s.orders.find((x) => x.id === orderId)!.tracking!), status: "delivered", lastUpdate: "Delivered (demo)" } });
      n = withEvent(n, { source: "Carrier", actorType: "system", actor: "Carrier TBC", text: `${orderId} marked delivered (demo state)`, ref: { type: "order", id: orderId }, simulated: true });
      return toast(n, `${orderId} marked delivered. It leaves the in-flight totals.`);
    });
  },
  advanceOrder(orderId: string) {
    const o = state.orders.find((x) => x.id === orderId)!;
    if (o.creditHold) return actions.toast("Order is on credit hold. Review it in Finance or Agents.", "warn");
    if (o.erp === "not_in_erp") return actions.importOrder(orderId);
    if (o.stage === "new") set((s) => toast(patchOrder(s, orderId, { stage: "erp" }), `${orderId} ERP checked`));
    else if (o.stage === "erp") actions.startPicking(orderId);
    else if (o.stage === "picking") actions.completePicking(orderId);
    else if (o.stage === "qc") {
      actions.qcAll(orderId);
      actions.submitQc(orderId);
    } else if (o.stage === "packed") {
      if (o.packStatus !== "packed") actions.markPacked(orderId); else actions.dispatch(orderId);
    } else if (o.stage === "dispatched") actions.markDelivered(orderId);
  },
  requestCarrierUpdate(orderId: string) {
    set((s) => {
      let n = tick(s);
      n = doneTasksFor(n, { type: "order", id: orderId }, ["T-05"]);
      n = withEvent(n, { source: "Carrier", actorType: "agent", actor: "Dispatch Coordinator", text: `Carrier investigation opened for ${orderId} (demo, no carrier contacted)`, ref: { type: "order", id: orderId }, simulated: true });
      n = runLine(n, "dispatch", `Opened carrier investigation for ${orderId}`, [{ type: "order", id: orderId }], ["Recorded tracking gap", "Raised investigation task"]);
      return toast(n, "Carrier investigation recorded (no carrier was contacted)", "info");
    });
  },
  resolveTracking(orderId: string) {
    set((s) => {
      const o = s.orders.find((x) => x.id === orderId)!;
      let n = patchOrder(tick(s), orderId, { tracking: { ...o.tracking!, status: "in_transit", lastUpdate: "Fri 6 Nov, 11:05 (scan received, demo)" } });
      n = resolveIssue(n, orderId, "tracking_exception");
      n = withEvent(n, { source: "Carrier", actorType: "system", actor: "Carrier TBC", text: `Tracking exception cleared for ${orderId} (demo scan)`, ref: { type: "order", id: orderId }, simulated: true });
      return toast(n, "Tracking exception cleared (demo state)");
    });
  },

  /* ── Approvals (agents) ── */
  approve(id: string) {
    const a = state.approvals.find((x) => x.id === id);
    if (!a || a.status !== "pending") return;
    if (a.kind === "erp_import") return actions.importOrder(a.ref.id);
    set((s) => {
      let n = tick(decide(s, id, "approved"));
      const log = (text: string, src: Activity["source"] = "Pulse") => { n = withEvent(n, { source: src, actorType: "staff", actor: "Umer Farooq", text, ref: a.ref, simulated: true, approval: true }); };
      switch (a.kind) {
        case "overdue_reminder": {
          n = { ...n, invoices: n.invoices.map((i) => (i.id === a.ref.id ? { ...i, reminder: "approved" } : i)) };
          n = doneTasksFor(n, a.ref, ["T-10"]);
          log(`Approved overdue reminder for ${a.ref.id} (demo: no email sent)`);
          n = toast(n, "Reminder approved and recorded. No email was sent.", "info");
          break;
        }
        case "credit_release": {
          n = patchOrder(n, a.ref.id, { creditHold: false, stage: "picking", pickStarted: true, note: "Conditionally released by management; INV-208 still outstanding" });
          n = resolveIssue(n, a.ref.id, "credit_hold");
          n = doneTasksFor(n, a.ref, ["T-04"]);
          log(`Approved conditional release of ${a.ref.id}; INV-208 remains overdue`);
          n = toast(n, `${a.ref.id} released to picking. INV-208 stays outstanding.`);
          break;
        }
        case "customer_reply": {
          n = approveReplyIn(n, a.ref.id);
          log(`Approved customer reply on ${a.ref.id} (demo: no message sent)`);
          n = toast(n, "Reply approved and logged. Nothing was sent.", "info");
          break;
        }
        case "refund": {
          n = approveReplyIn(n, a.ref.id, "Partial refund of €25.00 approved for the replacement case (demo: no payment issued).");
          n = doneTasksFor(n, a.ref, ["T-14"]);
          log(`Approved €25.00 partial refund on ${a.ref.id} (demo: no payment issued)`);
          n = toast(n, "Refund decision recorded. No payment was issued.", "info");
          break;
        }
        case "purchase_order": {
          const sku = a.ref.id;
          n = { ...n, pos: n.pos.map((p) => (p.sku === sku && p.status === "proposed" ? { ...p, status: "approved" } : p)) };
          n = doneTasksFor(n, a.ref, sku === "MZ-HRP-015" ? ["T-07"] : sku === "MZ-BZK-008" ? ["T-08"] : undefined);
          n = stockEvent(n, { sku, kind: "proposal", qty: 0, ref: "PO approval", note: "Purchase order approved. Stock on hand unchanged until goods receipt.", simulated: true });
          log(`Approved purchase order for ${PRODUCT_BY_SKU[sku].short}. Inventory unchanged until goods receipt`);
          n = toast(n, "Purchase order approved. Stock stays the same until a simulated goods receipt.");
          break;
        }
        case "channel_stock": {
          n = { ...n, channelStock: { ...n.channelStock, [a.ref.id]: "approved" } };
          log(`Approved proposed Shopify out-of-stock flag for ${PRODUCT_BY_SKU[a.ref.id].short} (demo: Shopify not called)`);
          n = toast(n, "Channel update recorded locally. Shopify was not called.", "info");
          break;
        }
        default: break;
      }
      return n;
    });
  },
  reject(id: string) {
    set((s) => {
      const a = s.approvals.find((x) => x.id === id);
      if (!a) return s;
      let n = tick(decide(s, id, "rejected"));
      n = withEvent(n, { source: "Pulse", actorType: "staff", actor: "Umer Farooq", text: `Rejected: ${a.title}`, ref: a.ref, simulated: true, approval: true });
      return toast(n, "Proposal rejected. Nothing changed.", "warn");
    });
  },

  /* ── Customers ── */
  generateDraft(convId: string) {
    set((s) => {
      const c = s.conversations.find((x) => x.id === convId)!;
      const draft = draftFor(s, c);
      let n = tick(s);
      n = { ...n, conversations: n.conversations.map((x) => (x.id === convId ? { ...x, draft, status: "draft_ready" } : x)) };
      n = withEvent(n, { source: "Pulse", actorType: "agent", actor: "Customer Service", text: `Draft reply generated for ${CUSTOMER_BY_ID[c.customerId].name}`, ref: { type: "conversation", id: convId }, simulated: true });
      return toast(n, "AI draft ready for review. Nothing has been sent.", "info");
    });
  },
  approveReply(convId: string) {
    const ap = state.approvals.find((a) => (a.kind === "customer_reply" || a.kind === "refund") && a.ref.id === convId && a.status === "pending");
    if (ap) return actions.approve(ap.id);
    set((s) => {
      let n = approveReplyIn(tick(s), convId);
      n = withEvent(n, { source: "Pulse", actorType: "staff", actor: "Umer Farooq", text: `Approved reply on ${convId} (demo: no message sent)`, ref: { type: "conversation", id: convId }, simulated: true, approval: true });
      return toast(n, "Reply approved and logged. Nothing was sent.", "info");
    });
  },
  setDraft(convId: string, text: string) {
    set((s) => ({ ...s, conversations: s.conversations.map((c) => (c.id === convId ? { ...c, draft: text } : c)) }));
  },

  /* ── Finance ── */
  prepareReminder(invoiceId: string) {
    set((s) => {
      const inv = s.invoices.find((i) => i.id === invoiceId)!;
      if (inv.reminder !== "none") return s;
      let n = tick(s);
      n = { ...n, invoices: n.invoices.map((i) => (i.id === invoiceId ? { ...i, reminder: "drafted" } : i)) };
      if (!n.approvals.some((a) => a.kind === "overdue_reminder" && a.ref.id === invoiceId)) {
        const ap: Approval = { id: nid(n, "APR"), kind: "overdue_reminder", agentId: "finance", title: `Send reminder for ${invoiceId}`, detail: `${CUSTOMER_BY_ID[inv.customerId].name}, ${eur(inv.amount)}, due ${dmy(inv.due)}.`, impact: "Demo only: records the approval locally. No email is sent.", ref: { type: "invoice", id: invoiceId }, status: "pending" };
        n = { ...n, seq: n.seq + 1, approvals: [ap, ...n.approvals] };
      }
      n = withEvent(n, { source: "Pulse", actorType: "agent", actor: "Finance Assistant", text: `Prepared payment reminder for ${invoiceId}`, ref: { type: "invoice", id: invoiceId }, simulated: true });
      return toast(n, "Reminder prepared for review. Nothing has been sent.", "info");
    });
  },
  approveReminder(invoiceId: string) {
    const ap = state.approvals.find((a) => a.kind === "overdue_reminder" && a.ref.id === invoiceId && a.status === "pending");
    if (ap) return actions.approve(ap.id);
    set((s) => toast(s, "Prepare the reminder first", "warn"));
  },

  /* ── Inventory ── */
  createReorderProposal(sku: string, qty?: number) {
    set((s) => {
      const existing = s.pos.find((p) => p.sku === sku && p.status !== "received");
      if (existing) return toast(s, `A purchase order for ${PRODUCT_BY_SKU[sku].short} is already ${existing.status}`, "info");
      const p = PRODUCT_BY_SKU[sku];
      const q = qty ?? suggestQty(s, sku);
      let n = tick(s);
      const po: PurchaseOrder = { id: `PO-D-${String(14 + n.pos.length + 1).padStart(3, "0")}`, sku, qty: q, supplierId: p.supplierId, unitCost: p.cost, status: "proposed", raisedBy: "Umer Farooq (demo)", createdAt: nowIso(n), reason: `Created from Inventory (${stockOf(n, sku).available} available, reorder point ${p.reorderPoint})` };
      const ap: Approval = { id: nid(n, "APR"), kind: "purchase_order", agentId: "planner", title: `Approve draft purchase order: ${p.short}`, detail: `Order ${q} units from ${SUPPLIERS.find((x) => x.id === p.supplierId)!.name}. ${stockOf(n, sku).available} available, reorder point ${p.reorderPoint}.`, impact: "Procurement state only. Stock on hand is unchanged until a simulated goods receipt.", ref: { type: "product", id: sku }, status: "pending" };
      n = { ...n, seq: n.seq + 1, pos: [po, ...n.pos], approvals: [ap, ...n.approvals] };
      n = stockEvent(n, { sku, kind: "proposal", qty: q, ref: po.id, note: "Reorder proposal drafted (no stock change)", simulated: true });
      n = withEvent(n, { source: "Pulse", actorType: "staff", actor: "Umer Farooq", text: `Drafted purchase order ${po.id} for ${q} × ${p.short}`, ref: { type: "po", id: po.id }, simulated: true });
      return toast(n, `Draft ${po.id} created. Approve it in Agents or below.`, "info");
    });
  },
  approvePO(poId: string) {
    const po = state.pos.find((p) => p.id === poId)!;
    const ap = state.approvals.find((a) => a.kind === "purchase_order" && a.ref.id === po.sku && a.status === "pending");
    if (ap) return actions.approve(ap.id);
    set((s) => toast({ ...s, pos: s.pos.map((p) => (p.id === poId ? { ...p, status: "approved" } : p)) }, "Purchase order approved", "ok"));
  },
  receiveGoods(poId: string) {
    set((s) => {
      const po = s.pos.find((p) => p.id === poId)!;
      if (po.status !== "approved") return toast(s, "Approve the purchase order before recording goods receipt", "warn");
      let n = tick(s);
      n = { ...n, pos: n.pos.map((p) => (p.id === poId ? { ...p, status: "received" } : p)), onHand: { ...n.onHand, [po.sku]: (n.onHand[po.sku] ?? 0) + po.qty } };
      n = stockEvent(n, { sku: po.sku, kind: "receipt", qty: po.qty, ref: poId, note: "Simulated goods receipt", simulated: true });
      n = withEvent(n, { source: "Muzikkon ERP", actorType: "staff", actor: "Seán Fitzpatrick", text: `Simulated goods receipt: ${po.qty} × ${PRODUCT_BY_SKU[po.sku].short} (${poId})`, ref: { type: "po", id: poId }, simulated: true });
      return toast(n, `Goods received (simulated). ${PRODUCT_BY_SKU[po.sku].short} on hand is now ${n.onHand[po.sku]}.`);
    });
  },

  /* ── Agents ── */
  runAgent(agentId: string) {
    set((s) => {
      const a = AGENTS.find((x) => x.id === agentId)!;
      const att = s.issues.filter((i) => !i.resolved);
      const low = Object.keys(s.onHand).filter((sku) => stockOf(s, sku).low).length;
      const summaries: Record<string, string> = {
        briefing: `Briefing refreshed: ${s.orders.filter((o) => o.stage !== "delivered").length} orders in flight, ${att.length} needing attention, ${low} low-stock products.`,
        watchdog: `Exception scan finished: ${att.length} open exceptions across orders, stock and dispatch.`,
        intake: `Order Intake scan finished: ${s.orders.filter((o) => o.erp === "not_in_erp").length} Shopify order(s) still awaiting ERP entry.`,
        planner: `Stock scan finished: ${low} product(s) below reorder point.`,
        dispatch: `Dispatch scan finished: ${s.orders.filter((o) => o.stage === "dispatched" && o.tracking?.status === "no_update").length} shipment(s) with a tracking gap.`,
        service: `Inbox scan finished: ${s.conversations.filter((c) => c.status === "open").length} conversation(s) awaiting a draft or reply.`,
        finance: `Receivables scan finished: ${s.invoices.filter((i) => i.status === "outstanding").length} open wholesale invoice(s).`,
        marketing: "Channel summary refreshed from illustrative demo data.",
      };
      const r: AgentRun = { id: nid(s, "RUN"), agentId, at: nowIso(s), duration: "4s", outcome: "completed", proposed: 0, summary: summaries[agentId] || "Run finished.", refs: [], steps: ["Read current demo state", "Compared against rules", "Wrote result (nothing external was called)"], simulated: true };
      let n: MuzState = { ...tick(s), seq: s.seq + 1, runs: [r, ...s.runs] };
      n = withEvent(n, { source: "Pulse", actorType: "agent", actor: a.name, text: `Manual run: ${r.summary}`, simulated: true });
      return toast(n, `${a.name} ran (simulated). ${r.summary}`, "info");
    });
  },

  /* ── Work ── */
  toggleTask(id: string) {
    set((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: t.status === "done" ? "open" : "done" } : t)) }));
  },
  startTask(id: string) {
    set((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: "in_progress" } : t)) }));
  },
};

/* ── internal helpers needing the full state ─────────────────────────────── */
function approveReplyIn(s: MuzState, convId: string, extra?: string): MuzState {
  const c = s.conversations.find((x) => x.id === convId)!;
  const text = extra || c.draft || draftFor(s, c);
  const msg = { from: "staff" as const, who: "Muzikkon support (approved in demo, not sent)", at: hhmm(nowIso(s)), text };
  let n: MuzState = { ...s, conversations: s.conversations.map((x) => (x.id === convId ? { ...x, status: "reply_approved", draft: undefined, messages: [...x.messages, msg] } : x)) };
  n = doneTasksFor(n, { type: "conversation", id: convId });
  return n;
}

export function draftFor(s: MuzState, c: Conversation): string {
  const cust = CUSTOMER_BY_ID[c.customerId];
  const first = cust.name.split(" ")[0];
  const o = c.orderId ? s.orders.find((x) => x.id === c.orderId) : undefined;
  switch (c.kind) {
    case "tracking":
      if (o) return `Hi ${first},\n\nThanks for getting in touch, and sorry for the worry. Your ${o.lines[0] ? PRODUCT_BY_SKU[o.lines[0].sku].short : "order"} (${o.id}) left our Dublin warehouse on Tuesday 3 November. The last carrier scan on tracking reference ${o.tracking?.ref} was ${o.tracking?.lastUpdate}. International parcels sometimes pause between handovers, but we have opened an investigation with the carrier and will update you by the end of the day tomorrow.\n\nIf anything changes sooner, we will tell you straight away.\n\nKind regards,\nMuzikkon support`;
      return `Hi ${first},\n\nThanks for your message. We are checking the latest tracking status now and will come back to you shortly.\n\nKind regards,\nMuzikkon support`;
    case "new_enquiry": {
      const st = stockOf(s, "MZ-HRP-036");
      return `Hi ${first},\n\nThanks for your interest in the 36 String Trinity Harp. It is currently out of stock (${st.available} available), and we are reviewing a restock. Our Dublin showroom has the 29 String Trinity Harp if you would like to try a similar instrument in person, and we can note your interest so you hear first when the 36 string arrives.\n\nKind regards,\nMuzikkon sales`;
    }
    case "delivery_issue":
      return `Hi ${first},\n\nThanks for letting us know, and sorry about the zip on your case. We would like to put this right: we can offer a partial refund of €25.00 towards a replacement case. If that works for you, reply to confirm and we will arrange it.\n\nKind regards,\nMuzikkon support`;
    case "product_advice":
      return `Hi ${first},\n\nCongratulations on the 22 String Boru Harp. Every harp is inspected and tuned before it leaves us (order ${c.orderId}). For a beginner we would suggest keeping one spare set of the most commonly broken strings and a tuning key; we will include a care leaflet in the box.\n\nKind regards,\nMuzikkon support`;
    case "wholesale":
      return `Hi,\n\nThanks for the enquiry. For six 22 String Boru Harps we would prepare a trade quote on your 30-day account terms. Current availability is ${stockOf(s, "MZ-HRP-022").available} in stock with the remainder on a 21-day lead time. Róisín Keane will send the formal quote once reviewed.\n\nKind regards,\nMuzikkon sales`;
  }
}

export function reminderText(s: MuzState, inv: Invoice): string {
  const cust = CUSTOMER_BY_ID[inv.customerId];
  const days = daysOverdue(inv);
  return `Subject: Friendly reminder, invoice ${inv.id}\n\nHello ${cust.contact || cust.name},\n\nOur records show invoice ${inv.id} for ${eur(inv.amount)} was due on ${dmy(inv.due)}${days > 0 ? ` and is now ${days} days overdue` : " and falls due soon"}. Your account is on ${cust.terms?.toLowerCase()}.\n\nCould you let us know when payment is expected? If it has already been sent, please ignore this note and let us know so we can match it.\n\nThank you,\nMuzikkon accounts\n\n[Demo draft. Not sent.]`;
}

export { allocated, stageIndex, STAGES };
export type { StageId };
export const AGENT_BY_ID = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
export { STAFF };

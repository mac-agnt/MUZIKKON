/* Pre-programmed Pulse AI answers, grounded in the same state every other screen reads. No LLM, no network. */
import { getState } from "./store";
import {
  attention, customerOf, daysOverdue, lowStock, orderStatusText, orderValue, outOfStock, pendingApprovals,
  receivables, stageIndex, stockOf, totals, pipelineCounts,
} from "./selectors";
import { AGENTS, CUSTOMER_BY_ID, SNAPSHOT_DATE } from "./dataset";
import { dmy, eur, hhmm, plural } from "./format";
import type { RecordRef } from "./types";

export type ChatTarget = { page?: string; tab?: string; open?: RecordRef };
export interface ChatAnswer {
  text: string;
  tool: string;
  effect: "read" | "write";
  cols?: string[];
  rows?: string[][];
  actions?: [string, number, ChatTarget?][];
}

const rx = (q: string, re: RegExp) => re.test(q.toLowerCase());

export function pickMuzAnswer(q: string): ChatAnswer {
  const s = getState();
  const t = totals(s);
  const att = attention(s);

  if (rx(q, /1042|eimear|shopify|erp|import|manual|not in/)) {
    const o = s.orders.find((x) => x.id === "MZ-1042")!;
    const inErp = o.erp === "in_erp";
    return {
      tool: "orders.match_shopify_to_erp", effect: "read",
      text: inErp
        ? `MZ-1042 (Eimear Byrne, 29 String Trinity Harp, ${eur(orderValue(o))}) is now in the ERP via the simulated import. Allocation is confirmed, invoice INV-210 is prepared and the task is closed. Nothing external was called: this is the demo state only.`
        : `Shopify order #1042 from Eimear Byrne (29 String Trinity Harp, ${eur(orderValue(o))}, paid) has no matching ERP order. Today that means someone keys it in by hand. Order Intake has prepared the import: new customer record, no duplicate found, 2 harps available. It waits for your approval, and nothing is sent to Shopify or the ERP in this demo.`,
      cols: ["Check", "Result"],
      rows: [["Customer match", "New customer, record to create"], ["Duplicate check", "None found"], ["Stock check", `${stockOf(s, "MZ-HRP-029").available} available, 1 required`], ["ERP status", inErp ? "In ERP (simulated)" : "Not in ERP"]],
      actions: inErp ? [["Open MZ-1042", 1, { open: { type: "order", id: "MZ-1042" } }]] : [["Review and simulate import", 1, { page: "Orders", tab: "imports" }], ["Open MZ-1042", 0, { open: { type: "order", id: "MZ-1042" } }]],
    };
  }
  if (rx(q, /brigid|b2b-301|credit|inv-208|reminder|overdue/)) {
    const o = s.orders.find((x) => x.id === "B2B-301")!;
    const inv = s.invoices.find((x) => x.id === "INV-208")!;
    return {
      tool: "finance.receivables", effect: "read",
      text: `St Brigid's Music School has ${eur(inv.amount)} on INV-208, ${daysOverdue(inv)} days past due (14-day terms, due ${dmy(inv.due)}). Their new order B2B-301 (4 × 15 String Trinity Harp) is ${o.creditHold ? "on credit hold" : "released to picking by management"}, and the four harps stay allocated. The invoice is not marked paid: that only happens when Finance records a payment. A reminder is ${inv.reminder === "none" ? "ready to prepare" : inv.reminder === "drafted" ? "drafted and waiting for approval" : "approved locally (nothing was sent)"}.`,
      cols: ["Item", "Status"],
      rows: [["INV-208", `${eur(inv.amount)} · ${daysOverdue(inv)}d overdue`], ["B2B-301", o.creditHold ? "Credit hold" : "Picking"], ["Reminder", inv.reminder === "none" ? "Not prepared" : inv.reminder === "drafted" ? "Drafted" : "Approved (demo)"]],
      actions: [["Open INV-208", 1, { open: { type: "invoice", id: "INV-208" } }], ["Open approvals", 0, { page: "Agents", tab: "approvals" }]],
    };
  }
  if (rx(q, /owe|wholesale|receivable|outstanding|debt|school|reseller|galway/)) {
    const r = receivables(s);
    return {
      tool: "finance.receivables", effect: "read",
      text: `Two wholesale invoices are open, ${eur(r.outstanding)} in total. ${r.overdueCount ? `${eur(r.overdueAmount)} is overdue: INV-208 for St Brigid's Music School.` : "Nothing is overdue."} INV-209 for Galway Folk Music is due on 14 Nov. These are receivables on orders already counted, not extra sales.`,
      cols: ["Invoice", "Customer", "Amount", "Due"],
      rows: r.open.map((i) => [i.id, CUSTOMER_BY_ID[i.customerId].name, eur(i.amount), daysOverdue(i) ? `${daysOverdue(i)}d overdue` : dmy(i.due)]),
      actions: [["Open receivables", 1, { page: "Finance", tab: "receivables" }]],
    };
  }
  if (rx(q, /stock|low|inventory|reorder|running|harp.*available|36/)) {
    const low = lowStock(s);
    const out = outOfStock(s);
    return {
      tool: "inventory.stock_levels", effect: "read",
      text: `${plural(low.length, "product")} ${low.length === 1 ? "is" : "are"} below ${low.length === 1 ? "its" : "their"} reorder point and ${out.length} ${out.length === 1 ? "has" : "have"} nothing available. The 15 String Trinity Cèilidh Harp has ${stockOf(s, "MZ-HRP-015").onHand} on hand and ${stockOf(s, "MZ-HRP-015").allocated} allocated. The 36 String Trinity Harp has none, and there is customer interest in it. The ERP stays the stock ledger: Pulse only watches and drafts.`,
      cols: ["Product", "Available", "On hand", "Reorder pt"],
      rows: low.map((r) => [r.product.short, String(r.available), String(r.onHand), String(r.reorderPoint)]),
      actions: [["Open replenishment", 1, { page: "Inventory", tab: "replenishment" }], ["Open PO draft", 0, { open: { type: "po", id: "PO-D-014" } }]],
    };
  }
  if (rx(q, /dispatch|holding|late|due today|ship|delay/)) {
    const due = s.orders.filter((o) => o.stage !== "dispatched" && o.stage !== "delivered" && o.dispatchBy <= SNAPSHOT_DATE);
    const blocked = att.map((i) => i.orderId);
    return {
      tool: "fulfilment.queue", effect: "read",
      text: `${plural(due.length, "order")} ${due.length === 1 ? "is" : "are"} due to leave today: ${due.map((o) => o.id).join(", ") || "none"}. ${att.some((i) => i.kind === "qc_pending") ? "MZ-1044 (Renaissance lute) is the blocker: its quality check has not been completed. " : ""}${att.some((i) => i.kind === "erp_missing") ? "MZ-1042 cannot be picked until it is in the ERP. " : ""}${att.some((i) => i.kind === "credit_hold") ? "B2B-301 is held for credit review. " : ""}${att.some((i) => i.kind === "tracking_exception") ? "MZ-1041 has already shipped but has no carrier scan for 41 hours." : ""}`,
      cols: ["Order", "Customer", "Stage", "Blocker"],
      rows: s.orders.filter((o) => due.includes(o) || blocked.includes(o.id)).map((o) => [o.id, customerOf(o).name, orderStatusText(s, o), att.find((i) => i.orderId === o.id)?.title ?? "On track"]),
      actions: [["Open Fulfilment", 1, { page: "Fulfilment", tab: "overview" }], ["Open MZ-1044 QC", 0, { page: "Fulfilment", tab: "qc" }]],
    };
  }
  if (rx(q, /1044|lute|quality|qc|luca/)) {
    const o = s.orders.find((x) => x.id === "MZ-1044")!;
    const passed = stageIndex(o.stage) > stageIndex("qc");
    return {
      tool: "fulfilment.quality_control", effect: "read",
      text: passed
        ? "MZ-1044 passed its lute checklist and is eligible for packing. The activity log has the submission."
        : "MZ-1044 (Luca Rossi, Renaissance Lute 6 Course, €899.99) is waiting for its inspection and is due to leave today. The checklist covers body, tuning pegs, strings and bridge, finish and protective packaging. Completing it makes the order eligible for packing.",
      actions: [["Open QC checklist", 1, { page: "Fulfilment", tab: "qc" }], ["Open MZ-1044", 0, { open: { type: "order", id: "MZ-1044" } }]],
    };
  }
  if (rx(q, /1041|ava|tracking|united states|us order/)) {
    const cv = s.conversations.find((c) => c.id === "CV-01")!;
    return {
      tool: "orders.tracking_status", effect: "read",
      text: `MZ-1041 (Ava Wilson, 22 String Boru Harp, United States) left on 3 Nov. The last carrier scan was Wednesday 16:40, so there has been no update for 41 hours. Customer Service drafted a reply from the real tracking data. Status: ${cv.status === "reply_approved" ? "approved locally, nothing sent" : cv.draft ? "draft ready for your approval, not sent" : "ready to draft"}. The carrier is still to be confirmed.`,
      actions: [["Open conversation", 1, { open: { type: "conversation", id: "CV-01" } }], ["Open MZ-1041", 0, { open: { type: "order", id: "MZ-1041" } }]],
    };
  }
  if (rx(q, /agent|handled|did our|today|ran/)) {
    const today = s.runs.filter((r) => r.at.slice(0, 10) === SNAPSHOT_DATE);
    return {
      tool: "agents.runs", effect: "read",
      text: `${plural(today.length, "agent run")} today. ${pendingApprovals(s).length} proposals are waiting for you; nothing has been sent or changed outside this demo.`,
      cols: ["Agent", "Time", "Result"],
      rows: today.slice(0, 6).map((r) => [AGENTS.find((a) => a.id === r.agentId)!.name, hhmm(r.at), r.summary.length > 70 ? r.summary.slice(0, 68) + "…" : r.summary]),
      actions: [["Open agent runs", 1, { page: "Agents", tab: "runs" }], ["Open approvals", 0, { page: "Agents", tab: "approvals" }]],
    };
  }
  if (rx(q, /approv|decision|waiting on me|needs me/)) {
    const p = pendingApprovals(s);
    return {
      tool: "agents.approvals", effect: "read",
      text: p.length ? `${plural(p.length, "proposal")} ${p.length === 1 ? "needs" : "need"} your decision. Approving only updates this demo; nothing is sent.` : "Everything is decided. No proposals are waiting.",
      cols: ["Agent", "Proposal"],
      rows: p.slice(0, 7).map((a) => [AGENTS.find((x) => x.id === a.agentId)!.name, a.title]),
      actions: [["Open approvals", 1, { page: "Agents", tab: "approvals" }]],
    };
  }
  if (rx(q, /attention|flag|issue|problem|wrong|exception|priorit/)) {
    return {
      tool: "orders.exceptions", effect: "read",
      text: att.length ? `${plural(att.length, "order")} ${att.length === 1 ? "needs" : "need"} your attention, together ${eur(att.reduce((a, i) => a + orderValue(s.orders.find((o) => o.id === i.orderId)!), 0))} of the ${eur(t.totalValue)} in flight.` : "No open exceptions. Everything in flight is on track.",
      cols: ["Order", "Customer", "Issue", "Value"],
      rows: att.map((i) => { const o = s.orders.find((x) => x.id === i.orderId)!; return [o.id, customerOf(o).name, i.title, eur(orderValue(o))]; }),
      actions: [["Open exceptions", 1, { page: "Orders", tab: "exceptions" }], ["Open MZ-1042", 0, { open: { type: "order", id: "MZ-1042" } }]],
    };
  }
  if (rx(q, /brief|summary|snapshot|morning|changed|overview|how are we/)) {
    const r = receivables(s);
    return {
      tool: "briefing.today", effect: "read",
      text: `${t.count} orders in flight worth ${eur(t.totalValue)} (${t.onlineCount} online, ${t.wholesaleCount} wholesale). ${att.length} need attention, ${lowStock(s).length} products are low on stock, and ${eur(r.outstanding)} is owed by wholesale accounts (${eur(r.overdueAmount)} overdue). That is order value in flight, not revenue recognised.`,
      cols: ["Stage", "Orders"],
      rows: pipelineCounts(s).filter((p) => p.count).map((p) => [p.label, String(p.count)]),
      actions: [["Open Orders", 1, { page: "Orders", tab: "overview" }], ["Open Dashboard", 0, { page: "Dashboard", tab: "executive" }]],
    };
  }
  return {
    tool: "pulse.search", effect: "read",
    text: `I can answer from the Muzikkon demo records: ${t.count} orders in flight, ${att.length} flagged, ${lowStock(s).length} low-stock products, ${pendingApprovals(s).length} proposals awaiting you. Try asking which orders need attention, what stock is low, who owes us money, what is holding up dispatch, or what the agents handled today.`,
    actions: [["Which orders need my attention?", 1], ["What stock is running low?", 0]],
  };
}

export const MUZ_SUGGESTIONS = [
  "Which orders need my attention?",
  "What stock is running low?",
  "Which wholesale customers owe us money?",
  "What's holding up dispatch?",
  "What did our agents handle today?",
];

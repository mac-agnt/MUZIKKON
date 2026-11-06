/* Customers: shared helpers. All customers and spend figures are fictional / illustrative. */
import type { CSSProperties } from "react";
import type { MuzState } from "../../store";
import { CUSTOMERS } from "../../dataset";
import { daysBetween } from "../../format";
import { SNAPSHOT_DATE } from "../../dataset";
import type { Conversation, Customer, Tone } from "../../types";
import { attention, balanceOf, customerSpend, daysOverdue, historyOfCustomer, isOverdue, openCases, ordersOfCustomer, productLabel } from "../../selectors";

export const mono: CSSProperties = { fontFamily: "var(--mono)" };

export type SegmentId = "retail" | "international" | "schools" | "resellers";
export const SEGMENT_LABEL: Record<SegmentId, string> = { retail: "Retail (Ireland)", international: "International", schools: "Schools", resellers: "Resellers" };

export function segmentOf(c: Customer): SegmentId {
  if (c.type === "school") return "schools";
  if (c.type === "reseller") return "resellers";
  return c.country === "Ireland" ? "retail" : "international";
}

export function segments(s: MuzState) {
  const ids: SegmentId[] = ["retail", "international", "schools", "resellers"];
  return ids.map((id) => {
    const members = CUSTOMERS.filter((c) => segmentOf(c) === id);
    const sum = (f: (c: Customer) => number) => members.reduce((a, c) => a + f(c), 0);
    return {
      id,
      label: SEGMENT_LABEL[id],
      members,
      spend: Math.round(sum((c) => customerSpend(s, c.id)) * 100) / 100,
      active: sum((c) => activeOrders(s, c.id).length),
      balance: Math.round(sum((c) => balanceOf(s, c.id)) * 100) / 100,
      enquiries: sum((c) => openCases(s, c.id).length),
      tab: id === "schools" || id === "resellers" ? "b2b" : "retail",
    };
  });
}

export const activeOrders = (s: MuzState, id: string) => ordersOfCustomer(s, id).filter((o) => o.stage !== "delivered");
export const orderHistoryCount = (s: MuzState, id: string) => ordersOfCustomer(s, id).length + historyOfCustomer(id).length;
export const overdueInvoices = (s: MuzState, id: string) => s.invoices.filter((i) => i.customerId === id && i.status === "outstanding" && isOverdue(i));

export function recentProducts(s: MuzState, id: string): string[] {
  const items = [
    ...ordersOfCustomer(s, id).map((o) => ({ date: o.placedAt, label: productLabel(o) })),
    ...historyOfCustomer(id).map((h) => ({ date: h.date, label: h.item })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));
  return Array.from(new Set(items.map((x) => x.label))).slice(0, 2);
}

const ISSUE_TEXT: Record<string, string> = { erp_missing: "not in the ERP yet", qc_pending: "quality check pending", tracking_exception: "tracking exception", credit_hold: "on credit hold" };
export function attentionReasons(s: MuzState, c: Customer): { tone: Tone; text: string }[] {
  const out: { tone: Tone; text: string }[] = [];
  const ids = new Set(ordersOfCustomer(s, c.id).map((o) => o.id));
  attention(s).filter((i) => ids.has(i.orderId)).forEach((i) => out.push({ tone: i.kind === "credit_hold" ? "bad" : "warn", text: `${i.orderId} ${ISSUE_TEXT[i.kind]}` }));
  overdueInvoices(s, c.id).forEach((i) => out.push({ tone: "bad", text: `${i.id} ${daysOverdue(i)} days overdue` }));
  openCases(s, c.id).forEach((cv) => out.push({ tone: "info", text: `Open case ${cv.id}` }));
  return out;
}
export const attentionScore = (r: { tone: Tone }[]) => r.reduce((a, x) => a + (x.tone === "bad" ? 3 : x.tone === "warn" ? 2 : 1), 0);

export const KIND_LABEL: Record<Conversation["kind"], string> = { new_enquiry: "New enquiry", tracking: "Tracking", delivery_issue: "Delivery issue", product_advice: "Product advice", wholesale: "Wholesale" };
export const CONV_STATUS: Record<Conversation["status"], { tone: Tone; label: string }> = {
  open: { tone: "warn", label: "Needs reply" },
  draft_ready: { tone: "accent", label: "Draft ready" },
  reply_approved: { tone: "ok", label: "Reply approved (demo)" },
  waiting: { tone: "neutral", label: "Waiting" },
};

/** Account status for schools and resellers. */
export function accountStatus(s: MuzState, id: string): { tone: Tone; label: string } {
  if (ordersOfCustomer(s, id).some((o) => o.creditHold)) return { tone: "bad", label: "On credit hold" };
  if (overdueInvoices(s, id).length) return { tone: "warn", label: "Watch" };
  return { tone: "ok", label: "Good" };
}

export const monthsSince = (date: string) => Math.round((daysBetween(date, SNAPSHOT_DATE) / 30.4) * 10) / 10;

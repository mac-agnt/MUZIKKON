/* Small helpers shared by the Orders and Fulfilment pages. */
import type { CSSProperties } from "react";
import { Badge, toneForStage } from "../../ui";
import type { MuzState } from "../../store";
import { SNAPSHOT_DATE, PRODUCT_BY_SKU } from "../../dataset";
import { daysBetween, dueLabel } from "../../format";
import { stageIndex, stageLabel } from "../../selectors";
import type { Order, Tone } from "../../types";

/* Cross-tab hand-off (e.g. clicking a pipeline stage on Overview opens All Orders pre-filtered).
   Module scope so it survives the tab switch whether or not the page stays mounted. */
export const handoff: { stage: string | null; qcOrder: string | null } = { stage: null, qcOrder: null };

export const FlagIcon = ({ size = 12, color = "var(--bad)" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}>
    <path d="M5 21V4 M5 4h11l-2 4 2 4H5" />
  </svg>
);

export const StageBadge = ({ o }: { o: Order }) => <Badge tone={toneForStage(o.stage)}>{stageLabel(o.stage)}</Badge>;
export const ChannelBadge = ({ o }: { o: Order }) => <Badge tone={o.channel === "online" ? "info" : "accent"}>{o.channel === "online" ? "Online" : "Wholesale"}</Badge>;

/** Dispatch-by badge. Only meaningful before the order has been dispatched. */
export function DueBadge({ o }: { o: Order }) {
  if (stageIndex(o.stage) >= stageIndex("dispatched")) return <Badge tone="neutral">Shipped</Badge>;
  const diff = daysBetween(SNAPSHOT_DATE, o.dispatchBy);
  const tone: Tone = diff < 0 ? "bad" : diff === 0 ? "warn" : diff <= 1 ? "info" : "neutral";
  return <Badge tone={tone}>{diff < 0 ? dueLabel(o.dispatchBy) : `Due ${dueLabel(o.dispatchBy)}`}</Badge>;
}

export const paymentLabel = (o: Order) => (o.payment === "paid" ? "Paid on Shopify" : "On account");
export const erpLabel = (o: Order) => (o.erp === "in_erp" ? "In ERP" : "Not in ERP");

/** What the "advance" button will do for an order, derived from stage and ERP state. */
export function nextStep(o: Order): { label: string; disabled?: boolean; reason?: string } | null {
  if (o.stage === "delivered") return null;
  if (o.creditHold) return { label: "On hold", disabled: true, reason: "Credit hold: review in Finance or Agents before this order can move" };
  if (o.erp === "not_in_erp") return { label: "Import to ERP" };
  switch (o.stage) {
    case "new": return { label: "ERP check" };
    case "erp": return { label: "Start picking" };
    case "picking": return { label: "Send to QC" };
    case "qc": return { label: "Submit QC" };
    case "packed": return { label: o.packStatus === "packed" ? "Dispatch" : "Mark packed" };
    case "dispatched": return { label: "Mark delivered (demo)" };
  }
  return null;
}

export const thumbOf = (o: Order) => PRODUCT_BY_SKU[o.lines[0].sku].image;
export const countryOf = (dest: string) => dest.split(",").pop()!.trim();

export const hasIssue = (s: MuzState, id: string) => s.issues.some((i) => i.orderId === id && !i.resolved);

export const mono: CSSProperties = { fontFamily: "var(--mono)" };

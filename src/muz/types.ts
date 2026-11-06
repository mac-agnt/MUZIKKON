/* Muzikkon demo: shared types. All data is illustrative. */

export type StageId = "new" | "erp" | "picking" | "qc" | "packed" | "dispatched" | "delivered";
export const STAGES: { id: StageId; label: string; short: string }[] = [
  { id: "new", label: "New", short: "New" },
  { id: "erp", label: "ERP Checked", short: "ERP" },
  { id: "picking", label: "Picking", short: "Pick" },
  { id: "qc", label: "Quality Check", short: "QC" },
  { id: "packed", label: "Packed", short: "Pack" },
  { id: "dispatched", label: "Dispatched", short: "Sent" },
  { id: "delivered", label: "Delivered", short: "Done" },
];

export type Channel = "online" | "wholesale";
export type CustomerType = "retail" | "school" | "reseller";
export type Tone = "ok" | "warn" | "bad" | "info" | "neutral" | "accent";

export interface Product {
  sku: string;
  name: string;
  short: string;
  category: string;
  family: "harp" | "lute" | "bouzouki" | "percussion" | "accessory";
  price: number;
  cost: number; // demo cost estimate
  reorderPoint: number;
  image?: string;
  supplierId: string;
  location: string; // pick location
}

export interface Customer {
  id: string;
  name: string;
  type: CustomerType;
  country: string;
  email: string; // synthetic
  accountManager?: string; // staff id (B2B)
  terms?: string;
  creditLimit?: number;
  contact?: string;
  since: string;
}

export interface OrderLine {
  sku: string;
  qty: number;
  unitPrice: number;
}

export interface TrackingInfo {
  ref: string;
  carrier: string;
  status: "label_created" | "in_transit" | "no_update" | "delivered";
  lastUpdate: string; // label
  note?: string;
}

export interface Order {
  id: string;
  shopifyRef?: string;
  customerId: string;
  channel: Channel;
  lines: OrderLine[];
  placedAt: string; // ISO date
  payment: "paid" | "on_account";
  erp: "in_erp" | "not_in_erp";
  stage: StageId;
  packStatus?: "ready" | "packed";
  pickStarted?: boolean;
  destination: string;
  assignee: string; // staff id
  dispatchBy: string; // ISO date
  priority: "high" | "normal";
  tracking?: TrackingInfo;
  creditHold?: boolean;
  invoiceId?: string;
  note?: string;
}

export type IssueKind = "erp_missing" | "qc_pending" | "tracking_exception" | "credit_hold";
export interface Issue {
  id: string;
  orderId: string;
  kind: IssueKind;
  title: string;
  detail: string;
  resolved: boolean;
}

export interface Invoice {
  id: string;
  customerId: string;
  orderId?: string;
  amount: number;
  issued: string;
  due: string;
  status: "outstanding" | "paid";
  reminder: "none" | "drafted" | "approved";
  note?: string;
}

export interface Supplier {
  id: string;
  name: string; // clearly demo
  speciality: string;
  leadTimeDays: number;
}

export interface PurchaseOrder {
  id: string;
  sku: string;
  qty: number;
  supplierId: string;
  unitCost: number;
  status: "proposed" | "approved" | "received";
  raisedBy: string;
  createdAt: string;
  reason: string;
}

export interface StockEvent {
  id: string;
  at: string;
  sku: string;
  kind: "allocation" | "release" | "dispatch" | "receipt" | "proposal" | "adjustment";
  qty: number;
  ref: string;
  note: string;
  simulated: boolean;
}

export interface Message {
  from: "customer" | "staff" | "agent";
  who: string;
  at: string;
  text: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  orderId?: string;
  subject: string;
  kind: "new_enquiry" | "tracking" | "delivery_issue" | "product_advice" | "wholesale";
  channel: "Website live chat" | "Email";
  status: "open" | "draft_ready" | "reply_approved" | "waiting";
  messages: Message[];
  draft?: string;
  receivedAt: string;
}

export interface Task {
  id: string;
  title: string;
  owner: string; // staff id
  due: string;
  priority: "High" | "Medium" | "Low";
  status: "open" | "in_progress" | "done";
  dept: string;
  ref: RecordRef;
}

export interface Staff {
  id: string;
  name: string;
  role: string; // demo role / department
  dept: string;
  email: string;
  demo: boolean; // fictional
  known?: boolean; // real call participant
  initials: string;
  tint: string;
}

export type RecordType =
  | "order"
  | "product"
  | "customer"
  | "invoice"
  | "conversation"
  | "po"
  | "task"
  | "agent"
  | "shipment"
  | "supplier"
  | "staff";
export interface RecordRef {
  type: RecordType;
  id: string;
}

export interface AgentDef {
  id: string;
  name: string;
  role: string;
  blurb: string;
  data: string[]; // data the agent would need
  tint: string;
  shape: string;
}

export interface AgentRun {
  id: string;
  agentId: string;
  at: string;
  duration: string;
  summary: string;
  outcome: "completed" | "proposed" | "needs_approval" | "flagged";
  proposed: number;
  refs: RecordRef[];
  steps: string[];
  simulated: boolean;
}

export type ApprovalKind =
  | "erp_import"
  | "overdue_reminder"
  | "credit_release"
  | "customer_reply"
  | "purchase_order"
  | "channel_stock"
  | "refund"
  | "qc_release";

export interface Approval {
  id: string;
  kind: ApprovalKind;
  agentId: string;
  title: string;
  detail: string;
  impact: string;
  ref: RecordRef;
  status: "pending" | "approved" | "rejected";
  decidedAt?: string;
  decidedBy?: string;
}

export interface Activity {
  id: string;
  at: string; // ISO timestamp
  source: "Shopify" | "Muzikkon ERP" | "Pulse" | "Staff" | "Carrier" | "Website chat";
  actorType: "staff" | "agent" | "system";
  actor: string;
  text: string;
  ref?: RecordRef;
  simulated: boolean; // true => proposed / simulated by Pulse demo; false => current-state description
  approval?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  steps: { label: string; gate?: boolean }[];
  agentId: string;
  status: "proposed" | "active_demo";
  note: string;
}

export interface ImportRecord {
  id: string;
  orderId: string;
  at: string;
  result: "imported" | "duplicate_skipped" | "failed_retry";
  note: string;
  simulated: boolean;
}

export interface QcItem {
  key: string;
  label: string;
}

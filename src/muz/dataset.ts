/* Muzikkon demo: the single central dataset. Every page, total, agent and chat answer reads from here
   (through store.ts). All customers, orders, invoices, staff and numbers are FICTIONAL / ILLUSTRATIVE.
   Product names and list prices follow public muzikkon.com listings. */
import type {
  Activity, AgentDef, AgentRun, Approval, Conversation, Customer, Invoice, Issue, Order, Product,
  PurchaseOrder, Staff, StockEvent, Supplier, Task, Workflow, ImportRecord, QcItem,
} from "./types";

/* ── Scenario clock: everything date-sensitive is tied to this snapshot ─────── */
export const SNAPSHOT_DATE = "2026-11-06"; // Friday
export const SNAPSHOT_LABEL = "Friday 6 November 2026";
export const SNAPSHOT_NOW = "2026-11-06T10:30:00";

export const COMPANY = {
  name: "Muzikkon Ltd",
  trading: "Muzikkon",
  address: "Unit 10, Robinhood Business Park, Dublin 22, D22 P7E5",
  email: "info@muzikkon.com",
  website: "https://www.muzikkon.com",
  industry: "Musical instrument manufacturing, distribution and retail",
  distribution: "Ireland and international markets",
  showroom: "Dublin showroom and instrument setup",
};

/* ── Staff ──────────────────────────────────────────────────────────────────── */
export const STAFF: Staff[] = [
  { id: "umer", name: "Umer Farooq", role: "Primary contact (sales call participant)", dept: "Management", email: "Not set in demo", demo: false, known: true, initials: "UF", tint: "var(--accent)" },
  { id: "sal", name: "Salahuddin Tarif", role: "Sales call participant", dept: "Management", email: "Not set in demo", demo: false, known: true, initials: "ST", tint: "#d8b98a" },
  { id: "roisin", name: "Róisín Keane", role: "Sales and wholesale accounts (demo)", dept: "Sales", email: "roisin.keane@pulse-demo.invalid", demo: true, initials: "RK", tint: "#9fd6f0" },
  { id: "aoife", name: "Aoife Brennan", role: "Customer support (demo)", dept: "Customer Support", email: "aoife.brennan@pulse-demo.invalid", demo: true, initials: "AB", tint: "#e6c78a" },
  { id: "cathal", name: "Cathal Doyle", role: "Warehouse and dispatch (demo)", dept: "Warehouse", email: "cathal.doyle@pulse-demo.invalid", demo: true, initials: "CD", tint: "#c8b4f0" },
  { id: "sean", name: "Seán Fitzpatrick", role: "Procurement (demo)", dept: "Procurement", email: "sean.fitzpatrick@pulse-demo.invalid", demo: true, initials: "SF", tint: "#8fd6c0" },
  { id: "niamh", name: "Niamh Gallagher", role: "Finance and credit control (demo)", dept: "Finance", email: "niamh.gallagher@pulse-demo.invalid", demo: true, initials: "NG", tint: "#f0b49c" },
  { id: "dara", name: "Dara McCarthy", role: "Marketing (demo)", dept: "Marketing", email: "dara.mccarthy@pulse-demo.invalid", demo: true, initials: "DM", tint: "#b8c8f0" },
];
export const DEPARTMENTS = ["Management", "Sales", "Customer Support", "Warehouse", "Procurement", "Finance", "Marketing"];

/* ── Suppliers (mock; not real suppliers) ───────────────────────────────────── */
export const SUPPLIERS: Supplier[] = [
  { id: "sup-a", name: "Workshop Partner A (demo)", speciality: "Celtic and lever harps", leadTimeDays: 21 },
  { id: "sup-b", name: "Workshop Partner B (demo)", speciality: "Bouzoukis, lutes and mandolins", leadTimeDays: 28 },
  { id: "sup-c", name: "Workshop Partner C (demo)", speciality: "Kalimbas, percussion and stands", leadTimeDays: 14 },
];

/* ── Products ───────────────────────────────────────────────────────────────── */
export const PRODUCTS: Product[] = [
  { sku: "MZ-HRP-029", name: "29 String Trinity Harp (Celtic Lever Harp)", short: "29 String Trinity Harp", category: "Irish & Celtic Harps", family: "harp", price: 845.0, cost: 520, reorderPoint: 2, image: "/muz/trinity29.jpg", supplierId: "sup-a", location: "A-02-1" },
  { sku: "MZ-LUT-006", name: "Renaissance Lute 6 Course (after Hieber, right-handed)", short: "Renaissance Lute 6 Course", category: "Lutes & Historical Instruments", family: "lute", price: 899.99, cost: 560, reorderPoint: 1, image: "/muz/lute6.jpg", supplierId: "sup-b", location: "B-01-3" },
  { sku: "MZ-HRP-022", name: "22 String Boru Harp", short: "22 String Boru Harp", category: "Irish & Celtic Harps", family: "harp", price: 620.0, cost: 385, reorderPoint: 2, image: "/muz/boru22.jpg", supplierId: "sup-a", location: "A-01-2" },
  { sku: "MZ-BZK-008", name: "Traditional Irish Bouzouki (8 String, Mahogany)", short: "Traditional Irish Bouzouki", category: "Bouzoukis & Mandolins", family: "bouzouki", price: 459.99, cost: 290, reorderPoint: 3, image: "/muz/bouzouki.jpg", supplierId: "sup-b", location: "B-02-1" },
  { sku: "MZ-HRP-015", name: "15 String Trinity Cèilidh Harp (Mahogany)", short: "15 String Trinity Cèilidh Harp", category: "Irish & Celtic Harps", family: "harp", price: 384.99, cost: 235, reorderPoint: 3, image: "/muz/ceilidh15.jpg", supplierId: "sup-a", location: "A-03-1" },
  { sku: "MZ-KAL-001", name: "Muzikkon Thumb Piano (African Kalimba, Red Cedar)", short: "Muzikkon Thumb Piano", category: "World Percussion & Kalimbas", family: "percussion", price: 59.99, cost: 24, reorderPoint: 4, image: "/muz/kalimba.jpg", supplierId: "sup-c", location: "C-01-4" },
  { sku: "MZ-HRP-036", name: "36 String Trinity Harp", short: "36 String Trinity Harp", category: "Irish & Celtic Harps", family: "harp", price: 1749.99, cost: 1080, reorderPoint: 2, image: "/muz/trinity36.jpg", supplierId: "sup-a", location: "A-04-1" },
  { sku: "MZ-LUT-107", name: "Renaissance Lute Deluxe 7 Course (after Hieber, left-handed)", short: "Renaissance Lute Deluxe 7 Course", category: "Lutes & Historical Instruments", family: "lute", price: 1179.99, cost: 740, reorderPoint: 1, supplierId: "sup-b", location: "B-01-4" },
  { sku: "MZ-LUT-108", name: "Renaissance Lute Deluxe 8 Course (after Hieber, right-handed)", short: "Renaissance Lute Deluxe 8 Course", category: "Lutes & Historical Instruments", family: "lute", price: 1199.99, cost: 760, reorderPoint: 1, supplierId: "sup-b", location: "B-01-5" },
  { sku: "MZ-KAL-002", name: "Heartland Mulberry Round Back Thumb Piano (Rosewood Top)", short: "Heartland Mulberry Thumb Piano", category: "World Percussion & Kalimbas", family: "percussion", price: 59.99, cost: 26, reorderPoint: 3, supplierId: "sup-c", location: "C-01-5" },
  { sku: "MZ-STD-GEO", name: "Muzikkon Single Tray Georgian Music Stand", short: "Georgian Music Stand", category: "Music Stands & Accessories", family: "accessory", price: 174.99, cost: 88, reorderPoint: 3, supplierId: "sup-c", location: "D-01-1" },
  { sku: "MZ-STD-REG", name: "Single Regency Music Stand", short: "Regency Music Stand", category: "Music Stands & Accessories", family: "accessory", price: 174.99, cost: 88, reorderPoint: 3, supplierId: "sup-c", location: "D-01-2" },
];
export const PRODUCT_BY_SKU: Record<string, Product> = Object.fromEntries(PRODUCTS.map((p) => [p.sku, p]));
export const SKU = {
  trinity29: "MZ-HRP-029", lute6: "MZ-LUT-006", boru22: "MZ-HRP-022", bouzouki: "MZ-BZK-008",
  ceilidh15: "MZ-HRP-015", thumb: "MZ-KAL-001", trinity36: "MZ-HRP-036",
};

/** Stock on hand at the snapshot. Allocated and available are derived from orders (see selectors). */
export const SEED_ON_HAND: Record<string, number> = {
  "MZ-HRP-029": 4, "MZ-LUT-006": 2, "MZ-HRP-022": 4, "MZ-BZK-008": 7, "MZ-HRP-015": 5,
  "MZ-KAL-001": 12, "MZ-HRP-036": 0, "MZ-LUT-107": 2, "MZ-LUT-108": 2, "MZ-KAL-002": 9,
  "MZ-STD-GEO": 8, "MZ-STD-REG": 6,
};

/* ── Customers (all fictional) ──────────────────────────────────────────────── */
const em = (s: string) => `${s}@customers.pulse-demo.invalid`;
export const CUSTOMERS: Customer[] = [
  { id: "c-wilson", name: "Ava Wilson", type: "retail", country: "United States", email: em("ava.wilson"), since: "2025-03" },
  { id: "c-byrne", name: "Eimear Byrne", type: "retail", country: "Ireland", email: em("eimear.byrne"), since: "2026-11" },
  { id: "c-rossi", name: "Luca Rossi", type: "retail", country: "Italy", email: em("luca.rossi"), since: "2024-09" },
  { id: "c-kelly", name: "Liam Kelly", type: "retail", country: "Ireland", email: em("liam.kelly"), since: "2023-06" },
  { id: "c-patel", name: "Maya Patel", type: "retail", country: "United Kingdom", email: em("maya.patel"), since: "2026-02" },
  { id: "c-oshea", name: "James O'Shea", type: "retail", country: "Ireland", email: em("james.oshea"), since: "2025-12" },
  { id: "c-martin", name: "Olivia Martin", type: "retail", country: "France", email: em("olivia.martin"), since: "2026-05" },
  { id: "c-harper", name: "Noah Harper", type: "retail", country: "Australia", email: em("noah.harper"), since: "2026-08" },
  { id: "c-evans", name: "Charlotte Evans", type: "retail", country: "United Kingdom", email: em("charlotte.evans"), since: "2025-10" },
  { id: "c-silva", name: "Rosa Silva", type: "retail", country: "Portugal", email: em("rosa.silva"), since: "2026-07" },
  { id: "c-larsen", name: "Henrik Larsen", type: "retail", country: "Denmark", email: em("henrik.larsen"), since: "2025-05" },
  { id: "c-doyle", name: "Sinéad Doyle", type: "retail", country: "Ireland", email: em("sinead.doyle"), since: "2024-02" },
  { id: "c-nair", name: "Priya Nair", type: "retail", country: "United Kingdom", email: em("priya.nair"), since: "2025-08" },
  { id: "c-moloney", name: "Cian Moloney", type: "retail", country: "Ireland", email: em("cian.moloney"), since: "2026-11" },
  { id: "c-brigid", name: "St Brigid's Music School", type: "school", country: "Ireland", email: em("accounts.stbrigids"), accountManager: "roisin", terms: "Net 14 days", creditLimit: 4000, contact: "School office (demo)", since: "2024-09" },
  { id: "c-galway", name: "Galway Folk Music", type: "reseller", country: "Ireland", email: em("orders.galwayfolk"), accountManager: "roisin", terms: "Net 14 days", creditLimit: 6000, contact: "Shop manager (demo)", since: "2023-11" },
  { id: "c-lough", name: "Lough Derg Music Shop", type: "reseller", country: "Ireland", email: em("trade.loughderg"), accountManager: "roisin", terms: "Net 30 days", creditLimit: 5000, contact: "Owner (demo)", since: "2025-04" },
  { id: "c-ashbourne", name: "Ashbourne Strings Academy", type: "school", country: "Ireland", email: em("bursar.ashbourne"), accountManager: "roisin", terms: "Net 30 days", creditLimit: 3500, contact: "Bursar (demo)", since: "2025-09" },
];
export const CUSTOMER_BY_ID: Record<string, Customer> = Object.fromEntries(CUSTOMERS.map((c) => [c.id, c]));

/** Delivered historical orders: context for customer profiles and illustrative spend. */
export const HISTORY: { id: string; customerId: string; date: string; item: string; value: number }[] = [
  { id: "MZ-1002", customerId: "c-wilson", date: "2025-03-14", item: "Muzikkon Thumb Piano", value: 59.99 },
  { id: "MZ-1019", customerId: "c-rossi", date: "2024-09-22", item: "Single Regency Music Stand", value: 174.99 },
  { id: "MZ-1024", customerId: "c-kelly", date: "2023-06-09", item: "Muzikkon Thumb Piano", value: 59.99 },
  { id: "MZ-1027", customerId: "c-kelly", date: "2025-02-18", item: "22 String Boru Harp", value: 620.0 },
  { id: "MZ-1029", customerId: "c-evans", date: "2025-10-30", item: "Georgian Music Stand", value: 174.99 },
  { id: "MZ-1031", customerId: "c-oshea", date: "2025-12-12", item: "Heartland Mulberry Thumb Piano", value: 59.99 },
  { id: "MZ-1033", customerId: "c-patel", date: "2026-02-20", item: "15 String Trinity Cèilidh Harp", value: 384.99 },
  { id: "MZ-1036", customerId: "c-larsen", date: "2025-05-27", item: "29 String Trinity Harp + case", value: 870.0 },
  { id: "MZ-1037", customerId: "c-doyle", date: "2024-02-05", item: "Renaissance Lute 6 Course", value: 899.99 },
  { id: "MZ-1038", customerId: "c-nair", date: "2025-08-19", item: "Traditional Irish Bouzouki", value: 459.99 },
  { id: "MZ-1039", customerId: "c-silva", date: "2026-07-03", item: "Muzikkon Thumb Piano", value: 59.99 },
  { id: "B2B-244", customerId: "c-brigid", date: "2025-09-08", item: "15 String Trinity Harp ×3", value: 1154.97 },
  { id: "B2B-261", customerId: "c-galway", date: "2026-03-16", item: "Traditional Irish Bouzouki ×2", value: 919.98 },
  { id: "B2B-273", customerId: "c-lough", date: "2026-05-11", item: "Muzikkon Thumb Piano ×6", value: 359.94 },
  { id: "B2B-279", customerId: "c-ashbourne", date: "2025-09-22", item: "22 String Boru Harp ×2", value: 1240.0 },
];

/* ── Orders: the 12 in flight ───────────────────────────────────────────────── */
const L = (sku: string, qty: number): { sku: string; qty: number; unitPrice: number }[] => [
  { sku, qty, unitPrice: PRODUCT_BY_SKU[sku].price },
];
export const SEED_ORDERS: Order[] = [
  {
    id: "MZ-1041", shopifyRef: "#1041", customerId: "c-wilson", channel: "online", lines: L(SKU.boru22, 1), placedAt: "2026-11-02",
    payment: "paid", erp: "in_erp", stage: "dispatched", destination: "Austin, United States", assignee: "cathal", dispatchBy: "2026-11-04", priority: "high",
    tracking: { ref: "DEMO-TRK-1041", carrier: "Carrier TBC", status: "no_update", lastUpdate: "Wed 4 Nov, 16:40 (no scan since)", note: "International parcel, no scan for 41 hours" },
    invoiceId: "INV-199",
  },
  {
    id: "MZ-1042", shopifyRef: "#1042", customerId: "c-byrne", channel: "online", lines: L(SKU.trinity29, 1), placedAt: "2026-11-06",
    payment: "paid", erp: "not_in_erp", stage: "new", destination: "Cork, Ireland", assignee: "roisin", dispatchBy: "2026-11-09", priority: "high",
    note: "Shopify order awaiting manual transfer into the ERP",
  },
  {
    id: "MZ-1044", shopifyRef: "#1044", customerId: "c-rossi", channel: "online", lines: L(SKU.lute6, 1), placedAt: "2026-11-04",
    payment: "paid", erp: "in_erp", stage: "qc", destination: "Bologna, Italy", assignee: "cathal", dispatchBy: "2026-11-06", priority: "high", invoiceId: "INV-200",
  },
  {
    id: "MZ-1045", shopifyRef: "#1045", customerId: "c-kelly", channel: "online", lines: L(SKU.bouzouki, 1), placedAt: "2026-11-04",
    payment: "paid", erp: "in_erp", stage: "packed", packStatus: "ready", destination: "Galway, Ireland", assignee: "cathal", dispatchBy: "2026-11-06", priority: "normal", invoiceId: "INV-201",
  },
  {
    id: "MZ-1046", shopifyRef: "#1046", customerId: "c-patel", channel: "online", lines: L(SKU.ceilidh15, 1), placedAt: "2026-11-05",
    payment: "paid", erp: "in_erp", stage: "picking", pickStarted: true, destination: "Leicester, United Kingdom", assignee: "cathal", dispatchBy: "2026-11-09", priority: "normal", invoiceId: "INV-202",
  },
  {
    id: "MZ-1047", shopifyRef: "#1047", customerId: "c-oshea", channel: "online", lines: L(SKU.thumb, 1), placedAt: "2026-11-03",
    payment: "paid", erp: "in_erp", stage: "dispatched", destination: "Dublin, Ireland", assignee: "cathal", dispatchBy: "2026-11-05", priority: "normal",
    tracking: { ref: "DEMO-TRK-1047", carrier: "Carrier TBC", status: "in_transit", lastUpdate: "Fri 6 Nov, 07:55 (out for delivery)" }, invoiceId: "INV-203",
  },
  {
    id: "MZ-1048", shopifyRef: "#1048", customerId: "c-martin", channel: "online", lines: L(SKU.trinity29, 1), placedAt: "2026-11-04",
    payment: "paid", erp: "in_erp", stage: "qc", destination: "Lyon, France", assignee: "cathal", dispatchBy: "2026-11-09", priority: "normal", invoiceId: "INV-204",
  },
  {
    id: "MZ-1049", shopifyRef: "#1049", customerId: "c-harper", channel: "online", lines: L(SKU.bouzouki, 1), placedAt: "2026-11-05",
    payment: "paid", erp: "in_erp", stage: "packed", packStatus: "ready", destination: "Melbourne, Australia", assignee: "cathal", dispatchBy: "2026-11-09", priority: "normal", invoiceId: "INV-205",
  },
  {
    id: "MZ-1050", shopifyRef: "#1050", customerId: "c-evans", channel: "online", lines: L(SKU.boru22, 1), placedAt: "2026-11-06",
    payment: "paid", erp: "in_erp", stage: "erp", destination: "Cardiff, United Kingdom", assignee: "cathal", dispatchBy: "2026-11-09", priority: "normal", invoiceId: "INV-206",
  },
  {
    id: "MZ-1051", shopifyRef: "#1051", customerId: "c-silva", channel: "online", lines: L(SKU.thumb, 1), placedAt: "2026-11-05",
    payment: "paid", erp: "in_erp", stage: "packed", packStatus: "packed", destination: "Porto, Portugal", assignee: "cathal", dispatchBy: "2026-11-09", priority: "normal", invoiceId: "INV-207",
  },
  {
    id: "B2B-301", customerId: "c-brigid", channel: "wholesale", lines: L(SKU.ceilidh15, 4), placedAt: "2026-10-14",
    payment: "on_account", erp: "in_erp", stage: "erp", creditHold: true, destination: "Dublin, Ireland", assignee: "niamh", dispatchBy: "2026-11-13", priority: "high", invoiceId: "INV-208",
    note: "On credit hold since 29 Oct: INV-208 unpaid past its due date",
  },
  {
    id: "B2B-302", customerId: "c-galway", channel: "wholesale", lines: L(SKU.bouzouki, 3), placedAt: "2026-10-30",
    payment: "on_account", erp: "in_erp", stage: "picking", pickStarted: true, destination: "Galway, Ireland", assignee: "cathal", dispatchBy: "2026-11-10", priority: "normal", invoiceId: "INV-209",
  },
];

export const SEED_ISSUES: Issue[] = [
  { id: "ISS-1", orderId: "MZ-1041", kind: "tracking_exception", title: "Shipment tracking update needed", detail: "International parcel to the United States has no carrier scan for 41 hours. Customer has asked for an update.", resolved: false },
  { id: "ISS-2", orderId: "MZ-1042", kind: "erp_missing", title: "Shopify order missing from ERP", detail: "Paid on Shopify this morning. The ERP has no matching order, so it cannot be allocated or picked until someone keys it in.", resolved: false },
  { id: "ISS-3", orderId: "MZ-1044", kind: "qc_pending", title: "Quality check pending, dispatch due today", detail: "Renaissance lute is waiting for its inspection checklist. Dispatch target is today.", resolved: false },
  { id: "ISS-4", orderId: "B2B-301", kind: "credit_hold", title: "Wholesale credit hold", detail: "St Brigid's has INV-208 (€1,539.96) 8 days overdue. New order is held for credit review; stock stays allocated.", resolved: false },
];

/* ── Invoices ──────────────────────────────────────────────────────────────── */
export const SEED_INVOICES: Invoice[] = [
  { id: "INV-199", customerId: "c-wilson", orderId: "MZ-1041", amount: 620.0, issued: "2026-11-02", due: "2026-11-02", status: "paid", reminder: "none", note: "Paid at checkout on Shopify" },
  { id: "INV-200", customerId: "c-rossi", orderId: "MZ-1044", amount: 899.99, issued: "2026-11-04", due: "2026-11-04", status: "paid", reminder: "none", note: "Paid at checkout on Shopify" },
  { id: "INV-201", customerId: "c-kelly", orderId: "MZ-1045", amount: 459.99, issued: "2026-11-04", due: "2026-11-04", status: "paid", reminder: "none", note: "Paid at checkout on Shopify" },
  { id: "INV-202", customerId: "c-patel", orderId: "MZ-1046", amount: 384.99, issued: "2026-11-05", due: "2026-11-05", status: "paid", reminder: "none", note: "Paid at checkout on Shopify" },
  { id: "INV-203", customerId: "c-oshea", orderId: "MZ-1047", amount: 59.99, issued: "2026-11-03", due: "2026-11-03", status: "paid", reminder: "none", note: "Paid at checkout on Shopify" },
  { id: "INV-204", customerId: "c-martin", orderId: "MZ-1048", amount: 845.0, issued: "2026-11-04", due: "2026-11-04", status: "paid", reminder: "none", note: "Paid at checkout on Shopify" },
  { id: "INV-205", customerId: "c-harper", orderId: "MZ-1049", amount: 459.99, issued: "2026-11-05", due: "2026-11-05", status: "paid", reminder: "none", note: "Paid at checkout on Shopify" },
  { id: "INV-206", customerId: "c-evans", orderId: "MZ-1050", amount: 620.0, issued: "2026-11-06", due: "2026-11-06", status: "paid", reminder: "none", note: "Paid at checkout on Shopify" },
  { id: "INV-207", customerId: "c-silva", orderId: "MZ-1051", amount: 59.99, issued: "2026-11-05", due: "2026-11-05", status: "paid", reminder: "none", note: "Paid at checkout on Shopify" },
  { id: "INV-208", customerId: "c-brigid", orderId: "B2B-301", amount: 1539.96, issued: "2026-10-15", due: "2026-10-29", status: "outstanding", reminder: "none", note: "15 String Trinity Harp ×4 on 14-day account terms" },
  { id: "INV-209", customerId: "c-galway", orderId: "B2B-302", amount: 1379.97, issued: "2026-10-31", due: "2026-11-14", status: "outstanding", reminder: "none", note: "Traditional Irish Bouzouki ×3 on 14-day account terms" },
];

/* ── Purchase orders & stock history ──────────────────────────────────────── */
export const SEED_POS: PurchaseOrder[] = [
  { id: "PO-D-014", sku: "MZ-HRP-015", qty: 8, supplierId: "sup-a", unitCost: 235, status: "proposed", raisedBy: "Inventory Planner", createdAt: "2026-11-06T09:00:00", reason: "0 available (5 on hand, 5 allocated); reorder point 3" },
];
export const SEED_STOCK_EVENTS: StockEvent[] = [
  { id: "SE-1", at: "2026-11-02T09:05:00", sku: "MZ-HRP-022", kind: "dispatch", qty: -1, ref: "MZ-1041", note: "Shipped to United States", simulated: false },
  { id: "SE-2", at: "2026-11-04T14:20:00", sku: "MZ-KAL-001", kind: "dispatch", qty: -1, ref: "MZ-1047", note: "Shipped to Dublin", simulated: false },
  { id: "SE-3", at: "2026-11-05T11:10:00", sku: "MZ-HRP-015", kind: "allocation", qty: -1, ref: "MZ-1046", note: "Allocated to online order", simulated: false },
  { id: "SE-4", at: "2026-11-05T15:42:00", sku: "MZ-BZK-008", kind: "allocation", qty: -1, ref: "MZ-1049", note: "Allocated to online order", simulated: false },
  { id: "SE-5", at: "2026-11-06T08:30:00", sku: "MZ-HRP-029", kind: "allocation", qty: -1, ref: "MZ-1042", note: "Tentative hold: awaiting ERP entry (proposed Pulse visibility)", simulated: true },
  { id: "SE-6", at: "2026-11-06T09:00:00", sku: "MZ-HRP-015", kind: "allocation", qty: -4, ref: "B2B-301", note: "Remains allocated while order is on credit hold", simulated: true },
];

/* ── Conversations ─────────────────────────────────────────────────────────── */
export const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: "CV-01", customerId: "c-wilson", orderId: "MZ-1041", subject: "Tracking has not moved for my Boru harp", kind: "tracking", channel: "Website live chat", status: "open", receivedAt: "2026-11-06T08:12:00",
    messages: [
      { from: "customer", who: "Ava Wilson", at: "08:12", text: "Hi, my 22 string Boru harp shipped on Wednesday but the tracking page has not updated since yesterday afternoon. Should I be worried?" },
    ],
  },
  {
    id: "CV-02", customerId: "c-moloney", subject: "Is the 36 string Trinity harp available?", kind: "new_enquiry", channel: "Email", status: "open", receivedAt: "2026-11-05T17:48:00",
    messages: [
      { from: "customer", who: "Cian Moloney", at: "Yesterday 17:48", text: "Hello, I am looking at the 36 String Trinity Harp for my daughter. Do you have one in stock and could I try it at your Dublin showroom before buying?" },
    ],
  },
  {
    id: "CV-03", customerId: "c-larsen", orderId: "MZ-1036", subject: "Harp case arrived with a broken zip", kind: "delivery_issue", channel: "Email", status: "open", receivedAt: "2026-11-05T10:20:00",
    messages: [
      { from: "customer", who: "Henrik Larsen", at: "Yesterday 10:20", text: "The soft case that came with my harp last year has a broken zip. I would like a replacement or a partial refund for the case, please." },
    ],
  },
  {
    id: "CV-04", customerId: "c-evans", orderId: "MZ-1050", subject: "Lever set-up on the 22 string Boru harp", kind: "product_advice", channel: "Website live chat", status: "open", receivedAt: "2026-11-06T09:41:00",
    messages: [
      { from: "customer", who: "Charlotte Evans", at: "09:41", text: "I just ordered the 22 string Boru harp. Does it come tuned and set up, and which string set should I keep spare as a beginner?" },
    ],
  },
  {
    id: "CV-05", customerId: "c-lough", subject: "Quote for six Boru harps for the autumn term", kind: "wholesale", channel: "Email", status: "open", receivedAt: "2026-11-04T16:05:00",
    messages: [
      { from: "customer", who: "Lough Derg Music Shop", at: "Wed 16:05", text: "We have a community group asking for six 22 String Boru Harps. Could you quote trade pricing and lead time, delivered to Lough Derg?" },
    ],
  },
];

/* ── Tasks ─────────────────────────────────────────────────────────────────── */
export const SEED_TASKS: Task[] = [
  { id: "T-01", title: "Enter Shopify order MZ-1042 into the ERP", owner: "roisin", due: "2026-11-06", priority: "High", status: "open", dept: "Sales", ref: { type: "order", id: "MZ-1042" } },
  { id: "T-02", title: "Complete lute quality check for MZ-1044", owner: "cathal", due: "2026-11-06", priority: "High", status: "open", dept: "Warehouse", ref: { type: "order", id: "MZ-1044" } },
  { id: "T-03", title: "Finish harp inspection for MZ-1048", owner: "cathal", due: "2026-11-09", priority: "Medium", status: "in_progress", dept: "Warehouse", ref: { type: "order", id: "MZ-1048" } },
  { id: "T-04", title: "Review St Brigid's credit hold on B2B-301", owner: "umer", due: "2026-11-06", priority: "High", status: "open", dept: "Finance", ref: { type: "order", id: "B2B-301" } },
  { id: "T-05", title: "Request tracking update from carrier for MZ-1041", owner: "aoife", due: "2026-11-06", priority: "High", status: "open", dept: "Customer Support", ref: { type: "order", id: "MZ-1041" } },
  { id: "T-06", title: "Reply to Ava Wilson about her shipment", owner: "aoife", due: "2026-11-06", priority: "High", status: "open", dept: "Customer Support", ref: { type: "conversation", id: "CV-01" } },
  { id: "T-07", title: "Review replenishment for 15 String Trinity Cèilidh Harp", owner: "sean", due: "2026-11-09", priority: "High", status: "open", dept: "Procurement", ref: { type: "product", id: "MZ-HRP-015" } },
  { id: "T-08", title: "Review replenishment for Traditional Irish Bouzouki", owner: "sean", due: "2026-11-10", priority: "Medium", status: "open", dept: "Procurement", ref: { type: "product", id: "MZ-BZK-008" } },
  { id: "T-09", title: "Decide on 36 String Trinity Harp restock", owner: "umer", due: "2026-11-13", priority: "Low", status: "open", dept: "Management", ref: { type: "product", id: "MZ-HRP-036" } },
  { id: "T-10", title: "Approve and record overdue reminder for INV-208", owner: "niamh", due: "2026-11-06", priority: "High", status: "open", dept: "Finance", ref: { type: "invoice", id: "INV-208" } },
  { id: "T-11", title: "Check Galway Folk Music account before INV-209 falls due", owner: "niamh", due: "2026-11-12", priority: "Low", status: "open", dept: "Finance", ref: { type: "invoice", id: "INV-209" } },
  { id: "T-12", title: "Pick three bouzoukis for B2B-302", owner: "cathal", due: "2026-11-09", priority: "Medium", status: "in_progress", dept: "Warehouse", ref: { type: "order", id: "B2B-302" } },
  { id: "T-13", title: "Pack MZ-1045 and MZ-1049", owner: "cathal", due: "2026-11-06", priority: "Medium", status: "open", dept: "Warehouse", ref: { type: "order", id: "MZ-1045" } },
  { id: "T-14", title: "Review partial refund for Henrik Larsen's case", owner: "aoife", due: "2026-11-09", priority: "Low", status: "open", dept: "Customer Support", ref: { type: "conversation", id: "CV-03" } },
  { id: "T-15", title: "Prepare quote for Lough Derg Music Shop (6 × Boru harp)", owner: "roisin", due: "2026-11-10", priority: "Medium", status: "open", dept: "Sales", ref: { type: "conversation", id: "CV-05" } },
  { id: "T-16", title: "Weekly category sales and ad-channel summary", owner: "dara", due: "2026-11-13", priority: "Low", status: "open", dept: "Marketing", ref: { type: "agent", id: "marketing" } },
];

/* ── Agents ────────────────────────────────────────────────────────────────── */
export const AGENTS: AgentDef[] = [
  { id: "briefing", name: "Briefing", role: "Daily management summary", blurb: "Reads orders, stock, fulfilment, finance and support each morning and writes the two-minute briefing.", data: ["Order summary from the ERP", "Stock levels", "Open exceptions", "Invoice status"], tint: "#191c1f", shape: "crown-pebble" },
  { id: "watchdog", name: "Ops Watchdog", role: "Detect order, stock and dispatch exceptions", blurb: "Compares Shopify orders against the ERP, watches stock against reorder points and spots stalled dispatches.", data: ["Shopify order feed (proposed)", "ERP order and stock tables", "Carrier tracking events"], tint: "#2a2118", shape: "shield" },
  { id: "intake", name: "Order Intake", role: "Prepare Shopify orders for ERP matching and import", blurb: "Matches each online order to a customer, checks duplicates and stock, and prepares the ERP import for approval.", data: ["Shopify order payload", "ERP customer table", "ERP stock availability"], tint: "#1b2430", shape: "executive-capsule" },
  { id: "planner", name: "Inventory Planner", role: "Identify low stock and recommend replenishment", blurb: "Watches available stock against reorder points, reads demand and drafts purchase orders for review.", data: ["ERP stock ledger", "Open orders", "Supplier lead times"], tint: "#16241f", shape: "control-cube" },
  { id: "dispatch", name: "Dispatch Coordinator", role: "Track fulfilment milestones and delivery exceptions", blurb: "Follows each order through pick, quality check, pack and dispatch and flags stalled tracking.", data: ["Fulfilment status", "Carrier tracking references", "Dispatch targets (24 to 48 hours)"], tint: "#1b2430", shape: "tall-unit" },
  { id: "service", name: "Customer Service", role: "Prepare responses and proactive updates", blurb: "Drafts replies using real order data. Every message waits for a person before it would go anywhere.", data: ["Live chat and email threads", "Order and tracking status", "Product information"], tint: "#241b2e", shape: "wide-eyed" },
  { id: "finance", name: "Finance Assistant", role: "Prepare invoice reminders and reconciliation suggestions", blurb: "Monitors wholesale receivables, drafts reminders and proposes order, payment and invoice matches.", data: ["ERP invoices", "Account terms", "Order status"], tint: "#2b1b1e", shape: "precision-brow" },
  { id: "marketing", name: "Marketing Insights", role: "Summarise channel and product sales patterns", blurb: "Brings ad channels, search and sales together to show which products earn their spend.", data: ["Google Ads and Shopping exports (not connected)", "Meta Ads exports (not connected)", "Order history"], tint: "#2a2118", shape: "glass-visor" },
];

export const SEED_RUNS: AgentRun[] = [
  { id: "RUN-01", agentId: "watchdog", at: "2026-11-06T09:12:00", duration: "6s", outcome: "flagged", proposed: 4, summary: "Compared Shopify against the ERP. Shopify order #1042 has no ERP match. Also flagged lute QC, a stalled US shipment and a wholesale credit hold.", refs: [{ type: "order", id: "MZ-1042" }, { type: "order", id: "MZ-1044" }, { type: "order", id: "MZ-1041" }, { type: "order", id: "B2B-301" }], steps: ["Read Shopify orders placed since last run", "Matched against ERP orders by customer, line items and total", "1 unmatched, 11 matched", "Checked fulfilment and invoice status", "Raised 4 exceptions"], simulated: true },
  { id: "RUN-02", agentId: "intake", at: "2026-11-06T09:14:00", duration: "4s", outcome: "needs_approval", proposed: 1, summary: "Prepared ERP import for MZ-1042. Customer is new, no duplicate found, 29 String Trinity Harp has stock.", refs: [{ type: "order", id: "MZ-1042" }], steps: ["Parsed Shopify order #1042", "Customer match: new customer, create record", "Duplicate check: none", "Stock check: 2 available, 1 required", "Prepared import for approval"], simulated: true },
  { id: "RUN-03", agentId: "finance", at: "2026-11-06T08:50:00", duration: "5s", outcome: "needs_approval", proposed: 1, summary: "INV-208 for St Brigid's is 8 days overdue. Drafted a polite reminder for review. Nothing sent.", refs: [{ type: "invoice", id: "INV-208" }], steps: ["Scanned wholesale invoices against due dates", "INV-208 is 8 days past due", "Account is on 14-day terms with a €4,000 limit", "Drafted reminder"], simulated: true },
  { id: "RUN-04", agentId: "service", at: "2026-11-06T08:15:00", duration: "7s", outcome: "needs_approval", proposed: 1, summary: "Drafted a reply to Ava Wilson using the live tracking status for MZ-1041. Awaiting approval.", refs: [{ type: "conversation", id: "CV-01" }, { type: "order", id: "MZ-1041" }], steps: ["Read live chat message", "Linked to order MZ-1041", "Read tracking: last scan Wednesday 16:40", "Drafted update"], simulated: true },
  { id: "RUN-05", agentId: "planner", at: "2026-11-06T09:00:00", duration: "8s", outcome: "needs_approval", proposed: 2, summary: "15 String Trinity Cèilidh Harp has 0 available (5 on hand, 5 allocated). Bouzouki is below reorder point. Drafted purchase orders.", refs: [{ type: "product", id: "MZ-HRP-015" }, { type: "product", id: "MZ-BZK-008" }], steps: ["Computed available stock (on hand minus allocated)", "3 products below reorder point", "Read open orders and demand", "Drafted purchase orders for review"], simulated: true },
  { id: "RUN-06", agentId: "dispatch", at: "2026-11-06T09:20:00", duration: "5s", outcome: "flagged", proposed: 1, summary: "MZ-1041 has had no carrier scan for 41 hours. Raised a tracking investigation task.", refs: [{ type: "order", id: "MZ-1041" }], steps: ["Read tracking reference DEMO-TRK-1041", "No event since Wednesday 16:40", "Opened investigation task"], simulated: true },
  { id: "RUN-07", agentId: "briefing", at: "2026-11-06T07:30:00", duration: "12s", outcome: "completed", proposed: 0, summary: "Morning briefing written: 12 orders in flight, 4 need attention, 3 low-stock products and one overdue wholesale invoice.", refs: [], steps: ["Collected order, stock, finance and support status", "Ranked attention items", "Wrote briefing"], simulated: true },
  { id: "RUN-08", agentId: "marketing", at: "2026-11-05T17:00:00", duration: "9s", outcome: "completed", proposed: 0, summary: "Weekly summary from illustrative channel data. Harps lead online revenue; 36 String Trinity Harp interest is rising with no stock to sell.", refs: [{ type: "product", id: "MZ-HRP-036" }], steps: ["Read illustrative channel exports", "Joined with product sales", "Flagged stock constraint"], simulated: true },
  { id: "RUN-09", agentId: "watchdog", at: "2026-11-05T09:10:00", duration: "6s", outcome: "completed", proposed: 0, summary: "All 8 orders then in flight matched between Shopify and the ERP.", refs: [], steps: ["Read Shopify orders", "Matched against the ERP", "No exceptions"], simulated: true },
  { id: "RUN-10", agentId: "dispatch", at: "2026-11-05T14:00:00", duration: "4s", outcome: "completed", proposed: 0, summary: "MZ-1047 dispatched to Dublin and tracking recorded.", refs: [{ type: "order", id: "MZ-1047" }], steps: ["Recorded tracking reference", "Set expected delivery window"], simulated: true },
];

/* ── Approvals ─────────────────────────────────────────────────────────────── */
export const SEED_APPROVALS: Approval[] = [
  { id: "APR-01", kind: "erp_import", agentId: "intake", title: "Create ERP order for Shopify #1042 (MZ-1042)", detail: "Eimear Byrne, 29 String Trinity Harp ×1, €845.00, paid. New customer record, no duplicate, stock available.", impact: "Simulated import: order appears in the ERP, stock is allocated, task is closed. No real ERP call is made.", ref: { type: "order", id: "MZ-1042" }, status: "pending" },
  { id: "APR-02", kind: "overdue_reminder", agentId: "finance", title: "Send overdue reminder for INV-208", detail: "St Brigid's Music School, €1,539.96, 8 days overdue. Polite reminder referencing account terms.", impact: "Demo only: records the approval locally. No email is sent.", ref: { type: "invoice", id: "INV-208" }, status: "pending" },
  { id: "APR-03", kind: "credit_release", agentId: "finance", title: "Conditional release of B2B-301 credit hold", detail: "Release the held order for picking while INV-208 stays outstanding, if management accepts the risk.", impact: "Order moves to Picking. Invoice is NOT marked paid and stays overdue.", ref: { type: "order", id: "B2B-301" }, status: "pending" },
  { id: "APR-04", kind: "customer_reply", agentId: "service", title: "Send shipping update to Ava Wilson", detail: "Reply using live tracking for MZ-1041 and the carrier investigation.", impact: "Demo only: marks the reply as approved. No message is sent.", ref: { type: "conversation", id: "CV-01" }, status: "pending" },
  { id: "APR-05", kind: "purchase_order", agentId: "planner", title: "Approve draft purchase order: 15 String Trinity Cèilidh Harp", detail: "Order 8 units from Workshop Partner A (demo). Currently 0 available, 3-unit reorder point.", impact: "Procurement state only. Stock on hand is unchanged until a simulated goods receipt.", ref: { type: "product", id: "MZ-HRP-015" }, status: "pending" },
  { id: "APR-06", kind: "channel_stock", agentId: "planner", title: "Mark 15 String Trinity Cèilidh Harp as out of stock on Shopify", detail: "Available quantity is 0. Proposed channel update stops further online sales until restocked.", impact: "Demo only: proposed channel stock update recorded locally. Shopify is not called.", ref: { type: "product", id: "MZ-HRP-015" }, status: "pending" },
  { id: "APR-07", kind: "refund", agentId: "service", title: "Confirm €25.00 partial refund for a replacement case", detail: "Henrik Larsen reports a broken zip on the soft case from order MZ-1036.", impact: "Demo only: records the decision. No payment is issued.", ref: { type: "conversation", id: "CV-03" }, status: "pending" },
];

/* ── Activity seed ─────────────────────────────────────────────────────────── */
export const SEED_ACTIVITY: Activity[] = [
  { id: "A-01", at: "2026-11-06T09:14:00", source: "Pulse", actorType: "agent", actor: "Order Intake", text: "Prepared ERP import for Shopify #1042", ref: { type: "order", id: "MZ-1042" }, simulated: true },
  { id: "A-02", at: "2026-11-06T09:12:00", source: "Pulse", actorType: "agent", actor: "Ops Watchdog", text: "Flagged Shopify order #1042 as missing from the ERP", ref: { type: "order", id: "MZ-1042" }, simulated: true },
  { id: "A-03", at: "2026-11-06T09:20:00", source: "Pulse", actorType: "agent", actor: "Dispatch Coordinator", text: "Flagged no tracking scan on MZ-1041 for 41 hours", ref: { type: "order", id: "MZ-1041" }, simulated: true },
  { id: "A-04", at: "2026-11-06T09:00:00", source: "Pulse", actorType: "agent", actor: "Inventory Planner", text: "Low-stock threshold triggered for 15 String Trinity Cèilidh Harp (0 available)", ref: { type: "product", id: "MZ-HRP-015" }, simulated: true },
  { id: "A-05", at: "2026-11-06T08:50:00", source: "Pulse", actorType: "agent", actor: "Finance Assistant", text: "Drafted overdue reminder for INV-208", ref: { type: "invoice", id: "INV-208" }, simulated: true },
  { id: "A-06", at: "2026-11-06T08:15:00", source: "Pulse", actorType: "agent", actor: "Customer Service", text: "Customer update prepared for Ava Wilson", ref: { type: "conversation", id: "CV-01" }, simulated: true },
  { id: "A-07", at: "2026-11-06T08:12:00", source: "Website chat", actorType: "system", actor: "Website live chat", text: "New message from Ava Wilson about order MZ-1041", ref: { type: "conversation", id: "CV-01" }, simulated: false },
  { id: "A-08", at: "2026-11-06T08:02:00", source: "Shopify", actorType: "system", actor: "Shopify", text: "Order #1042 placed and paid (€845.00)", ref: { type: "order", id: "MZ-1042" }, simulated: false },
  { id: "A-09", at: "2026-11-06T08:30:00", source: "Pulse", actorType: "agent", actor: "Order Intake", text: "Shopify order identified for manual ERP transfer", ref: { type: "order", id: "MZ-1042" }, simulated: true },
  { id: "A-10", at: "2026-11-06T07:30:00", source: "Pulse", actorType: "agent", actor: "Briefing", text: "Morning briefing prepared for Umer", simulated: true },
  { id: "A-11", at: "2026-11-05T16:30:00", source: "Muzikkon ERP", actorType: "staff", actor: "Róisín Keane", text: "Keyed Shopify order #1049 into the ERP by hand (current process)", ref: { type: "order", id: "MZ-1049" }, simulated: false },
  { id: "A-12", at: "2026-11-05T15:42:00", source: "Muzikkon ERP", actorType: "system", actor: "Muzikkon ERP", text: "Order allocation confirmed for MZ-1049 (Traditional Irish Bouzouki)", ref: { type: "order", id: "MZ-1049" }, simulated: false },
  { id: "A-13", at: "2026-11-05T14:00:00", source: "Staff", actorType: "staff", actor: "Cathal Doyle", text: "Dispatched MZ-1047 to Dublin", ref: { type: "order", id: "MZ-1047" }, simulated: false },
  { id: "A-14", at: "2026-11-05T11:10:00", source: "Muzikkon ERP", actorType: "staff", actor: "Róisín Keane", text: "Keyed Shopify order #1046 into the ERP by hand (current process)", ref: { type: "order", id: "MZ-1046" }, simulated: false },
  { id: "A-15", at: "2026-11-05T10:00:00", source: "Staff", actorType: "staff", actor: "Niamh Gallagher", text: "Reviewed wholesale account aging", ref: { type: "customer", id: "c-brigid" }, simulated: false },
  { id: "A-16", at: "2026-11-04T16:40:00", source: "Carrier", actorType: "system", actor: "Carrier TBC", text: "MZ-1041 departed origin facility (last tracking event)", ref: { type: "order", id: "MZ-1041" }, simulated: false },
  { id: "A-17", at: "2026-11-03T15:00:00", source: "Staff", actorType: "staff", actor: "Cathal Doyle", text: "Dispatched MZ-1041 to the United States", ref: { type: "order", id: "MZ-1041" }, simulated: false },
  { id: "A-18", at: "2026-10-29T09:00:00", source: "Muzikkon ERP", actorType: "system", actor: "Muzikkon ERP", text: "INV-208 passed its due date", ref: { type: "invoice", id: "INV-208" }, simulated: false },
];

/* ── Workflows (proposed) ──────────────────────────────────────────────────── */
export const WORKFLOWS: Workflow[] = [
  { id: "wf-1", name: "Shopify to ERP order intake", trigger: "New Shopify order paid", agentId: "intake", status: "proposed", note: "Sits alongside the existing ERP. Pulse prepares; a person approves; the ERP stays the ledger.", steps: [{ label: "Receive Shopify order" }, { label: "Match customer and check duplicates" }, { label: "Check stock in the ERP" }, { label: "Manager approves import", gate: true }, { label: "Create ERP order" }, { label: "Confirm allocation" }] },
  { id: "wf-2", name: "Instrument quality gate", trigger: "Order reaches Quality Check", agentId: "dispatch", status: "active_demo", note: "Harps and lutes follow their own checklist before packing.", steps: [{ label: "Open instrument checklist" }, { label: "Inspect frame, strings, tuning, finish" }, { label: "Staff submits checklist", gate: true }, { label: "Release to packing" }] },
  { id: "wf-3", name: "Wholesale credit review", trigger: "Account has overdue invoice and new order", agentId: "finance", status: "active_demo", note: "Credit decisions are always human.", steps: [{ label: "Detect overdue invoice" }, { label: "Hold new order, keep stock allocated" }, { label: "Draft reminder" }, { label: "Management decision", gate: true }] },
  { id: "wf-4", name: "Shipping delay update", trigger: "No tracking event for 36 hours", agentId: "service", status: "active_demo", note: "Proactive customer updates drafted from the real tracking record.", steps: [{ label: "Detect tracking gap" }, { label: "Open carrier investigation task" }, { label: "Draft customer update" }, { label: "Support approves reply", gate: true }] },
  { id: "wf-5", name: "Low-stock replenishment", trigger: "Available stock below reorder point", agentId: "planner", status: "active_demo", note: "Draft purchase orders only. Stock changes on goods receipt.", steps: [{ label: "Detect low stock" }, { label: "Draft purchase order" }, { label: "Procurement approves", gate: true }, { label: "Record goods receipt" }] },
];

export const SEED_IMPORTS: ImportRecord[] = [
  { id: "IMP-1", orderId: "MZ-1049", at: "2026-11-05T16:30:00", result: "imported", note: "Keyed by hand into the ERP (current process)", simulated: false },
  { id: "IMP-2", orderId: "MZ-1046", at: "2026-11-05T11:10:00", result: "imported", note: "Keyed by hand into the ERP (current process)", simulated: false },
  { id: "IMP-3", orderId: "MZ-1045", at: "2026-11-04T15:05:00", result: "imported", note: "Keyed by hand into the ERP (current process)", simulated: false },
];

/* ── Quality control checklists ───────────────────────────────────────────── */
export const QC_CHECKLISTS: Record<string, { title: string; items: QcItem[] }> = {
  harp: {
    title: "Harp inspection",
    items: [
      { key: "frame", label: "Frame inspection (soundbox, neck, pillar)" },
      { key: "strings", label: "Strings and levers checked" },
      { key: "tuning", label: "Tuning inspected" },
      { key: "finish", label: "Finish inspected" },
      { key: "packaging", label: "Packaging approved" },
    ],
  },
  lute: {
    title: "Lute inspection",
    items: [
      { key: "body", label: "Body inspection (ribs, soundboard, rose)" },
      { key: "pegs", label: "Tuning pegs fit and turn" },
      { key: "bridge", label: "Strings and bridge check" },
      { key: "finish", label: "Finish inspection" },
      { key: "packaging", label: "Protective packaging" },
    ],
  },
  bouzouki: {
    title: "Bouzouki inspection",
    items: [
      { key: "body", label: "Body and top inspection" },
      { key: "neck", label: "Neck, frets and action" },
      { key: "tuning", label: "Machine heads and tuning" },
      { key: "finish", label: "Finish inspected" },
      { key: "packaging", label: "Packaging approved" },
    ],
  },
  general: {
    title: "General inspection",
    items: [
      { key: "visual", label: "Visual inspection" },
      { key: "function", label: "Function check" },
      { key: "packaging", label: "Packaging approved" },
    ],
  },
};
export const QC_SEED_STATE: Record<string, Record<string, boolean>> = {
  "MZ-1048": { frame: true, strings: true, tuning: false, finish: false, packaging: false },
};

/* ── Illustrative marketing / sales context (DEMO ONLY, not verified) ───────── */
export const MARKETING = {
  note: "Illustrative figures for the demo. Muzikkon's ad and search accounts are not connected to Pulse.",
  weeks: ["14 Sep", "21 Sep", "28 Sep", "5 Oct", "12 Oct", "19 Oct", "26 Oct", "2 Nov"],
  ordersPerWeek: [9, 11, 10, 12, 10, 14, 11, 12],
  channels: [
    { id: "shopping", name: "Google Shopping", spend: 640, clicks: 2140, orders: 9, revenue: 4180, series: [3, 4, 4, 5, 4, 6, 5, 6] },
    { id: "ads", name: "Google Ads", spend: 520, clicks: 1380, orders: 6, revenue: 2740, series: [2, 3, 2, 3, 3, 4, 3, 3] },
    { id: "meta", name: "Meta Ads", spend: 310, clicks: 960, orders: 3, revenue: 1260, series: [1, 1, 2, 2, 1, 2, 2, 2] },
    { id: "organic", name: "Organic search", spend: 0, clicks: 3120, orders: 12, revenue: 5420, series: [3, 3, 2, 2, 2, 2, 1, 1] },
  ],
  categoryMix: [
    { label: "Irish & Celtic Harps", share: 46 },
    { label: "Lutes & Historical", share: 19 },
    { label: "Bouzoukis & Mandolins", share: 17 },
    { label: "World Percussion", share: 9 },
    { label: "Stands & Accessories", share: 9 },
  ],
};

/* ── Integrations: four honest states ──────────────────────────────────────── */
export const INTEGRATIONS: {
  id: string; name: string; used: string; pulse: "not_connected" | "simulated"; proposed: string; note: string;
}[] = [
  { id: "shopify", name: "Shopify", used: "Used by Muzikkon (website)", pulse: "simulated", proposed: "Order feed into Pulse for ERP matching", note: "Currently NOT integrated with the ERP. Online orders are transferred by hand. Pulse shows a simulated feed." },
  { id: "erp", name: "Muzikkon custom ERP", used: "Used by Muzikkon (invoicing, stock, orders, customers)", pulse: "simulated", proposed: "Read and write orders, stock and invoices via API", note: "API availability and capabilities have not been technically verified. Muzikkon also plans to upgrade the ERP." },
  { id: "gads", name: "Google Ads", used: "Used by Muzikkon", pulse: "not_connected", proposed: "Spend and conversion import", note: "Pulse connection not verified. Demo figures are illustrative." },
  { id: "gshop", name: "Google Shopping", used: "Used by Muzikkon", pulse: "not_connected", proposed: "Product feed performance import", note: "Pulse connection not verified. Demo figures are illustrative." },
  { id: "meta", name: "Meta Ads", used: "Used by Muzikkon", pulse: "not_connected", proposed: "Campaign performance import", note: "Pulse connection not verified. Demo figures are illustrative." },
  { id: "chat", name: "Website live chat", used: "Exists on the website", pulse: "simulated", proposed: "Read conversations next to order data", note: "Integration not verified. Conversations in this demo are fictional." },
  { id: "email", name: "Customer email", used: "Used by Muzikkon", pulse: "not_connected", proposed: "Draft replies for human approval", note: "Provider and integration not verified. Pulse never sends email in this demo." },
  { id: "carrier", name: "Shipping carrier", used: "Not specified", pulse: "not_connected", proposed: "Tracking events feed", note: "Carriers are unconfirmed. Tracking references in the demo are placeholders." },
  { id: "bank", name: "Banking and accounting", used: "Not confirmed", pulse: "not_connected", proposed: "Payment reconciliation suggestions", note: "No banking or accounting platform is assumed or connected." },
];

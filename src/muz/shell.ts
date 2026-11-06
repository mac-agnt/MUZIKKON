/* Shell helpers: command palette content and notification feed, built from the store. */
import { actions as muz, getState } from "./store";
import { MODULE_TABS } from "./tabs";
import { AGENTS, CUSTOMERS, PRODUCTS, STAFF } from "./dataset";
import { attention, customerOf, orderValue, pendingApprovals, productLabel, staffName } from "./selectors";
import { eur, whenLabel } from "./format";

type Item = { title: string; meta: string; hint: string; glyph: string; go: () => void };
type Group = { group: string; scope: string; items: Item[] };

const PAGE_LABEL: Record<string, string> = {
  Home: "Home", Agents: "Agents", Dashboard: "Dashboard", Orders: "Orders", Inventory: "Inventory", Fulfilment: "Fulfilment",
  Customers: "Customers", Finance: "Finance", Work: "Work", Records: "Records", Activity: "Activity", Settings: "Settings",
};

export function buildPalette(ctx: {
  ICONS: Record<string, string>; themeAction: string; recents: string[];
  newChat: () => void; toggleTheme: () => void; againQuery: (r: string) => void;
}) {
  const s = getState();
  const { ICONS } = ctx;
  const SEARCH: Group[] = [
    ctx.recents.length ? { group: "Recent", scope: "All", items: ctx.recents.slice(0, 3).map((r) => ({ title: r, meta: "Recent search", hint: "AGAIN", glyph: "recent", go: () => ctx.againQuery(r) })) } : null,
    {
      group: "Actions", scope: "Actions", items: [
        { title: "Start a new Pulse AI conversation", meta: "Clears the current thread", hint: "ACTION", glyph: "action", go: ctx.newChat },
        { title: "Review proposals waiting on you", meta: "Agents · approvals", hint: "ACTION", glyph: "action", go: () => muz.nav("Agents", "approvals") },
        { title: "Open Shopify to ERP import", meta: "Orders · channel imports", hint: "ACTION", glyph: "action", go: () => muz.nav("Orders", "imports") },
        { title: "Open the quality-control checklist", meta: "Fulfilment · quality control", hint: "ACTION", glyph: "action", go: () => muz.nav("Fulfilment", "qc") },
        { title: ctx.themeAction, meta: "Appearance", hint: "ACTION", glyph: "action", go: ctx.toggleTheme },
        { title: "Reset the demo", meta: "Back to Friday 6 November 2026", hint: "ACTION", glyph: "action", go: () => muz.reset() },
      ],
    },
    { group: "Agents", scope: "Agents", items: AGENTS.map((a) => ({ title: a.name, meta: a.role, hint: "AGENT", glyph: "agent", go: () => muz.open({ type: "agent", id: a.id }) })) },
    { group: "Work", scope: "Work", items: s.tasks.filter((t) => t.status !== "done").slice(0, 8).map((t) => ({ title: t.title, meta: `${staffName(t.owner)} · due ${t.due}`, hint: "TASK", glyph: "task", go: () => muz.open({ type: "task", id: t.id }) })) },
    {
      group: "Records", scope: "Records", items: [
        ...s.orders.map((o) => ({ title: `${o.id} · ${customerOf(o).name}`, meta: `${productLabel(o)} · ${eur(orderValue(o))}`, hint: "ORDER", glyph: "org", go: () => muz.open({ type: "order", id: o.id }) })),
        ...CUSTOMERS.map((c) => ({ title: c.name, meta: `${c.type === "retail" ? "Retail" : c.type === "school" ? "School" : "Reseller"} · ${c.country}`, hint: "CUSTOMER", glyph: "person", go: () => muz.open({ type: "customer", id: c.id }) })),
        ...PRODUCTS.map((p) => ({ title: p.name, meta: `${p.sku} · ${eur(p.price)}`, hint: "PRODUCT", glyph: "page", go: () => muz.open({ type: "product", id: p.sku }) })),
        ...s.invoices.filter((i) => i.status === "outstanding").map((i) => ({ title: i.id, meta: `${eur(i.amount)} · outstanding`, hint: "INVOICE", glyph: "page", go: () => muz.open({ type: "invoice", id: i.id }) })),
      ],
    },
    {
      group: "Pages", scope: "Pages", items: Object.keys(MODULE_TABS).flatMap((page) =>
        MODULE_TABS[page].map((t) => ({ title: `${PAGE_LABEL[page]} · ${t.label}`, meta: "Go to", hint: "PAGE", glyph: "page", go: () => muz.nav(page, t.id) }))),
    },
  ].filter(Boolean) as Group[];

  const tile = (title: string, meta: string, icon: string, go: () => void) => ({ title, meta, icon, go });
  const KITS: Record<string, ReturnType<typeof tile>[]> = {
    Home: [
      tile("Which orders need my attention?", "Ask Pulse AI", ICONS.helios, () => muz.nav("Home")),
      tile("Orders", "Overview and pipeline", ICONS.mzOrders, () => muz.nav("Orders", "overview")),
      tile("Approvals", "Agent proposals", ICONS.approvals, () => muz.nav("Agents", "approvals")),
      tile("Inventory", "Low stock and reorders", ICONS.mzInventory, () => muz.nav("Inventory", "overview")),
    ],
    Orders: [
      tile("All orders", "Search, filter, sort", ICONS.mzOrders, () => muz.nav("Orders", "all")),
      tile("Exceptions", "Four flagged orders", ICONS.health, () => muz.nav("Orders", "exceptions")),
      tile("Channel imports", "Shopify to ERP", ICONS.autos, () => muz.nav("Orders", "imports")),
      tile("Order insights", "Mix and dispatch targets", ICONS.insights, () => muz.nav("Orders", "insights")),
    ],
    Inventory: [
      tile("Replenishment", "Draft purchase orders", ICONS.mzInventory, () => muz.nav("Inventory", "replenishment")),
      tile("Stock levels", "Available vs allocated", ICONS.insights, () => muz.nav("Inventory", "levels")),
      tile("Product catalogue", "Muzikkon range", ICONS.records, () => muz.nav("Inventory", "catalogue")),
      tile("Stock history", "Allocations and receipts", ICONS.pulseLine, () => muz.nav("Inventory", "history")),
    ],
    Fulfilment: [
      tile("Quality control", "Instrument checklists", ICONS.approvals, () => muz.nav("Fulfilment", "qc")),
      tile("Pick and pack", "Warehouse queue", ICONS.mzFulfil, () => muz.nav("Fulfilment", "pickpack")),
      tile("Shipments", "Dispatch and tracking", ICONS.mzFulfil, () => muz.nav("Fulfilment", "shipments")),
      tile("Tracking exceptions", "Carrier gaps", ICONS.health, () => muz.nav("Fulfilment", "tracking")),
    ],
    Customers: [
      tile("Conversations", "Inbox with order context", ICONS.helios, () => muz.nav("Customers", "conversations")),
      tile("Schools and resellers", "Wholesale accounts", ICONS.orgs, () => muz.nav("Customers", "b2b")),
      tile("Retail customers", "Online buyers", ICONS.people, () => muz.nav("Customers", "retail")),
      tile("Portal preview", "What a customer sees", ICONS.dash, () => muz.nav("Customers", "portal")),
    ],
    Finance: [
      tile("Receivables", "Wholesale debtors", ICONS.mzFinance, () => muz.nav("Finance", "receivables")),
      tile("Invoices", "ERP invoice list", ICONS.records, () => muz.nav("Finance", "invoices")),
      tile("Reconciliation", "Shopify, ERP, invoice", ICONS.autos, () => muz.nav("Finance", "reconciliation")),
      tile("Cash outlook", "Illustrative estimate", ICONS.insights, () => muz.nav("Finance", "cash")),
    ],
    Agents: [
      tile("Approvals", "Human approval queue", ICONS.approvals, () => muz.nav("Agents", "approvals")),
      tile("Agent runs", "Execution history", ICONS.agents, () => muz.nav("Agents", "runs")),
      tile("Playbooks", "Workflows and story threads", ICONS.autos, () => muz.nav("Agents", "playbooks")),
      tile("Overview", "Eight agents", ICONS.navAgents, () => muz.nav("Agents", "overview")),
    ],
    Records: [
      tile("Ontology", "How records connect", ICONS.navRecords, () => muz.nav("Records", "ontology")),
      tile("Records explorer", "Search every record", ICONS.records, () => muz.nav("Records", "explorer")),
      tile("Relationships", "Follow the links", ICONS.graph, () => muz.nav("Records", "relationships")),
      tile("Audit history", "Who did what", ICONS.pulseLine, () => muz.nav("Records", "audit")),
    ],
  };

  const FREQ = [
    { title: "MZ-1042", count: "9×", icon: ICONS.mzOrders, go: () => muz.open({ type: "order", id: "MZ-1042" }) },
    { title: "Approvals", count: "7×", icon: ICONS.approvals, go: () => muz.nav("Agents", "approvals") },
    { title: "INV-208", count: "5×", icon: ICONS.mzFinance, go: () => muz.open({ type: "invoice", id: "INV-208" }) },
    { title: "Replenishment", count: "4×", icon: ICONS.mzInventory, go: () => muz.nav("Inventory", "replenishment") },
    { title: "MZ-1044 QC", count: "3×", icon: ICONS.approvals, go: () => muz.nav("Fulfilment", "qc") },
    { title: "Conversations", count: "3×", icon: ICONS.helios, go: () => muz.nav("Customers", "conversations") },
  ];
  const JUMPS = [
    ["Home", "navHome"], ["Orders", "mzOrders"], ["Inventory", "mzInventory"], ["Fulfilment", "mzFulfil"], ["Customers", "mzCustomers"], ["Finance", "mzFinance"],
    ["Agents", "navAgents"], ["Dashboard", "navDash"], ["Work", "navWork"], ["Records", "navRecords"], ["Activity", "navActivity"], ["Settings", "navAdmin"],
  ].map(([title, icon]) => ({ title, icon: ICONS[icon], go: () => muz.nav(title) }));
  return { SEARCH, KITS, FREQ, JUMPS };
}

export function muzNotifications(LIME: string, RED: string, AMBER: string, NEUTRAL: string) {
  const s = getState();
  const att = attention(s).map((i) => ({
    dot: i.kind === "credit_hold" || i.kind === "tracking_exception" ? RED : AMBER,
    text: `${i.orderId}: ${i.title}`, event: `orders.${i.kind}`, channel: "Inbox", meta: "Today",
  }));
  const pend = pendingApprovals(s).slice(0, 3).map((a) => ({ dot: LIME, text: a.title, event: `agents.${a.kind}`, channel: "Approvals", meta: whenLabel("2026-11-06T09:00:00").replace("Today ", "") }));
  const done = s.activity.filter((e) => e.approval).slice(0, 2).map((e) => ({ dot: NEUTRAL, text: e.text, event: "approvals.decided", channel: "Audit", meta: whenLabel(e.at).replace("Today ", "") }));
  return [...att, ...pend, ...done].slice(0, 7);
}

/** Honest ontology counts from the demo dataset (the canvas graph itself is a visual stand-in). */
export function muzGraphStats() {
  const s = getState();
  const lines = s.orders.reduce((a, o) => a + o.lines.length, 0);
  const shipments = s.orders.filter((o) => o.stage === "packed" || o.stage === "dispatched" || o.stage === "delivered").length;
  const agentActions = s.approvals.length + s.runs.length;
  const byCluster = [CUSTOMERS.length, PRODUCTS.length, s.orders.length, PRODUCTS.length, s.invoices.length, shipments, s.conversations.length, agentActions];
  const records = byCluster.reduce((a, n) => a + n, 0) + lines + 3 + STAFF.length + s.pos.length;
  const relationships = s.orders.length * 2 + lines * 2 + s.invoices.length + shipments + s.conversations.length * 2 + s.approvals.length + s.pos.length * 2 + PRODUCTS.length * 2 + CUSTOMERS.filter((c) => c.type !== "retail").length;
  return { records, relationships, byCluster };
}

/* Top-bar tabs for every module. Shared by the shell (PulseLogic) and the pages. */
export const MODULE_TABS: Record<string, { id: string; label: string }[]> = {
  Agents: [
    { id: "overview", label: "Overview" },
    { id: "runs", label: "Agent Runs" },
    { id: "playbooks", label: "Playbooks" },
    { id: "approvals", label: "Approvals" },
  ],
  Dashboard: [
    { id: "executive", label: "Executive" },
    { id: "sales", label: "Sales & Channels" },
    { id: "operations", label: "Operations" },
    { id: "cx", label: "Customer Experience" },
    { id: "finance", label: "Finance" },
  ],
  Orders: [
    { id: "overview", label: "Overview" },
    { id: "all", label: "All Orders" },
    { id: "exceptions", label: "Exceptions" },
    { id: "imports", label: "Channel Imports" },
    { id: "insights", label: "Order Insights" },
  ],
  Inventory: [
    { id: "overview", label: "Overview" },
    { id: "catalogue", label: "Product Catalogue" },
    { id: "levels", label: "Stock Levels" },
    { id: "replenishment", label: "Replenishment" },
    { id: "history", label: "Stock History" },
  ],
  Fulfilment: [
    { id: "overview", label: "Overview" },
    { id: "pickpack", label: "Pick & Pack" },
    { id: "qc", label: "Quality Control" },
    { id: "shipments", label: "Shipments" },
    { id: "tracking", label: "Tracking & Exceptions" },
  ],
  Customers: [
    { id: "overview", label: "Overview" },
    { id: "retail", label: "Retail Customers" },
    { id: "b2b", label: "Schools & Resellers" },
    { id: "conversations", label: "Conversations" },
    { id: "portal", label: "Customer Portal Preview" },
  ],
  Finance: [
    { id: "overview", label: "Overview" },
    { id: "invoices", label: "Invoices" },
    { id: "receivables", label: "Receivables" },
    { id: "reconciliation", label: "Reconciliation" },
    { id: "cash", label: "Cash Outlook" },
  ],
  Work: [
    { id: "tasks", label: "Tasks" },
    { id: "approvals", label: "Approvals" },
    { id: "workflows", label: "Workflows" },
    { id: "calendar", label: "Calendar" },
  ],
  Records: [
    { id: "ontology", label: "Ontology" },
    { id: "explorer", label: "Records Explorer" },
    { id: "relationships", label: "Relationships" },
    { id: "audit", label: "Audit History" },
  ],
  Activity: [
    { id: "all", label: "All Activity" },
    { id: "staff", label: "Staff" },
    { id: "agents", label: "Agents" },
    { id: "systems", label: "Systems" },
    { id: "approvals", label: "Approvals" },
  ],
  Settings: [
    { id: "organisation", label: "Organisation" },
    { id: "teams", label: "Teams & Permissions" },
    { id: "systems", label: "Systems & Integrations" },
    { id: "ai", label: "AI Controls" },
    { id: "experience", label: "Experience" },
  ],
};

export const SIDEBAR: { label: string; page: string; icon: string; dot?: boolean }[] = [
  { label: "Home", page: "Home", icon: "helios" },
  { label: "Agents", page: "Agents", icon: "navAgents" },
  { label: "Dashboard", page: "Dashboard", icon: "navDash" },
  { label: "Orders", page: "Orders", icon: "mzOrders", dot: true },
  { label: "Inventory", page: "Inventory", icon: "mzInventory" },
  { label: "Fulfilment", page: "Fulfilment", icon: "mzFulfil" },
  { label: "Customers", page: "Customers", icon: "mzCustomers" },
  { label: "Finance", page: "Finance", icon: "mzFinance" },
  { label: "Work", page: "Work", icon: "navWork" },
  { label: "Records", page: "Records", icon: "navRecords" },
  { label: "Activity", page: "Activity", icon: "pulseLine" },
];

export const MUZ_PAGES = ["Agents", "Dashboard", "Orders", "Inventory", "Fulfilment", "Customers", "Finance", "Work", "Activity", "Settings"];
export const defaultTab = (page: string) => MODULE_TABS[page]?.[0]?.id ?? "";

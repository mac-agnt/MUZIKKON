/* Routes a sidebar page id to its Muzikkon page component. */
import type { ReactNode } from "react";
import OrdersPage from "./pages/OrdersPage";
import FulfilmentPage from "./pages/FulfilmentPage";
import InventoryPage from "./pages/InventoryPage";
import CustomersPage from "./pages/CustomersPage";
import FinancePage from "./pages/FinancePage";
import AgentsPage from "./pages/AgentsPage";
import DashboardPage from "./pages/DashboardPage";
import WorkPage from "./pages/WorkPage";
import ActivityPage from "./pages/ActivityPage";
import SettingsPage from "./pages/SettingsPage";

export function DemoStrip() {
  return (
    <div style={{ margin: "10px 24px 0", display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", borderRadius: "var(--r-md,14px)", background: "var(--accent-faint)", border: "1px solid var(--accent-line)", fontSize: 11.5, color: "var(--dim)" }}>
      <span style={{ width: 6, height: 6, borderRadius: 2, background: "var(--accent)", flex: "none" }} />
      <span><b style={{ color: "var(--ink)", fontWeight: 600 }}>Demo.</b> Muzikkon Ltd operating view with illustrative data. Nothing here is sent, imported or paid, and no external system is called.</span>
    </div>
  );
}

export default function MuzPage({ page, tab, v }: { page: string; tab: string; v: any }) {
  let body: ReactNode = null;
  switch (page) {
    case "Orders": body = <OrdersPage tab={tab} />; break;
    case "Fulfilment": body = <FulfilmentPage tab={tab} />; break;
    case "Inventory": body = <InventoryPage tab={tab} />; break;
    case "Customers": body = <CustomersPage tab={tab} />; break;
    case "Finance": body = <FinancePage tab={tab} />; break;
    case "Agents": body = <AgentsPage tab={tab} />; break;
    case "Dashboard": body = <DashboardPage tab={tab} />; break;
    case "Work": body = <WorkPage tab={tab} />; break;
    case "Activity": body = <ActivityPage tab={tab} />; break;
    case "Settings": body = <SettingsPage tab={tab} v={v} />; break;
  }
  return (
    <div key={page + ":" + tab}>
      <DemoStrip />
      {body}
    </div>
  );
}

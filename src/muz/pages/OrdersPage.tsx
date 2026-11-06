import AllOrdersTab from "./orders/AllOrdersTab";
import ExceptionsTab from "./orders/ExceptionsTab";
import ImportsTab from "./orders/ImportsTab";
import InsightsTab from "./orders/InsightsTab";
import OverviewTab from "./orders/OverviewTab";

export default function OrdersPage({ tab }: { tab: string }) {
  switch (tab) {
    case "all": return <AllOrdersTab />;
    case "exceptions": return <ExceptionsTab />;
    case "imports": return <ImportsTab />;
    case "insights": return <InsightsTab />;
    case "overview":
    default: return <OverviewTab />;
  }
}

import Overview from "./inventory/Overview";
import Catalogue from "./inventory/Catalogue";
import Levels from "./inventory/Levels";
import Replenishment from "./inventory/Replenishment";
import History from "./inventory/History";

export default function InventoryPage({ tab }: { tab: string }) {
  switch (tab) {
    case "catalogue": return <Catalogue />;
    case "levels": return <Levels />;
    case "replenishment": return <Replenishment />;
    case "history": return <History />;
    default: return <Overview />;
  }
}

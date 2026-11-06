import OverviewTab from "./fulfilment/OverviewTab";
import PickPackTab from "./fulfilment/PickPackTab";
import QcTab from "./fulfilment/QcTab";
import ShipmentsTab from "./fulfilment/ShipmentsTab";
import TrackingTab from "./fulfilment/TrackingTab";

export default function FulfilmentPage({ tab }: { tab: string }) {
  switch (tab) {
    case "pickpack": return <PickPackTab />;
    case "qc": return <QcTab />;
    case "shipments": return <ShipmentsTab />;
    case "tracking": return <TrackingTab />;
    case "overview":
    default: return <OverviewTab />;
  }
}

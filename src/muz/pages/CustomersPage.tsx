import Overview from "./customers/Overview";
import Retail from "./customers/Retail";
import B2B from "./customers/B2B";
import Conversations from "./customers/Conversations";
import Portal from "./customers/Portal";

export default function CustomersPage({ tab }: { tab: string }) {
  switch (tab) {
    case "retail": return <Retail />;
    case "b2b": return <B2B />;
    case "conversations": return <Conversations />;
    case "portal": return <Portal />;
    default: return <Overview />;
  }
}

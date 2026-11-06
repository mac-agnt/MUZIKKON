import Overview from "./finance/Overview";
import Invoices from "./finance/Invoices";
import Receivables from "./finance/Receivables";
import Reconciliation from "./finance/Reconciliation";
import Cash from "./finance/Cash";

export default function FinancePage({ tab }: { tab: string }) {
  switch (tab) {
    case "invoices": return <Invoices />;
    case "receivables": return <Receivables />;
    case "reconciliation": return <Reconciliation />;
    case "cash": return <Cash />;
    default: return <Overview />;
  }
}

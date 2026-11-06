/* Content below the original KPI band, which the shell renders on top of every Dashboard tab. */
import Cx from "./dashboard/Cx";
import Executive from "./dashboard/Executive";
import FinanceTab from "./dashboard/FinanceTab";
import Operations from "./dashboard/Operations";
import Sales from "./dashboard/Sales";

export default function DashboardPage({ tab }: { tab: string }) {
  return (
    <div className="mz-page" style={{ padding: "6px 24px 56px", display: "flex", flexDirection: "column", gap: 16 }}>
      {tab === "sales" ? <Sales /> : tab === "operations" ? <Operations /> : tab === "cx" ? <Cx /> : tab === "finance" ? <FinanceTab /> : <Executive />}
    </div>
  );
}

/* Home right rail: business snapshot, morning briefing, attention queue, pipeline, AI actions. All from the store. */
import type { CSSProperties, ReactNode } from "react";
import { actions, useMuz } from "./store";
import {
  attention, lowStock, pendingApprovals, pipelineCounts, receivables, totals, orderValue, stockOf,
} from "./selectors";
import { CUSTOMER_BY_ID, SNAPSHOT_LABEL, AGENTS } from "./dataset";
import { eur, hhmm, plural, whenLabel } from "./format";
import { Badge, Btn, TONE } from "./ui";

const mono: CSSProperties = { fontFamily: "var(--mono)" };

function Glass({ title, tag, children, onMore, more }: { title: string; tag?: ReactNode; children: ReactNode; onMore?: () => void; more?: string }) {
  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-r,18px)", backdropFilter: "blur(16px)", padding: "15px 16px 14px", minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 11 }}>
        <span style={{ flex: 1, ...mono, fontSize: 9.5, letterSpacing: ".13em", color: "var(--faint)" }}>{title.toUpperCase()}</span>
        {tag}
        {onMore && <button onClick={onMore} className="mz-reclink" style={{ border: 0, background: "none", color: "var(--accent)", fontSize: 11.5, cursor: "pointer", padding: 0 }}>{more || "Open"}</button>}
      </div>
      {children}
    </section>
  );
}

export default function MuzHomeWidgets() {
  const s = useMuz();
  const t = totals(s);
  const att = attention(s);
  const low = lowStock(s);
  const rec = receivables(s);
  const pend = pendingApprovals(s);
  const pipe = pipelineCounts(s);
  const flightTotal = pipe.filter((p) => p.id !== "delivered").reduce((a, p) => a + p.count, 0) || 1;
  const agentEvents = s.activity.filter((e) => e.actorType === "agent").slice(0, 5);
  const awaitingErp = s.orders.filter((o) => o.erp === "not_in_erp").length;
  const dueToday = s.orders.filter((o) => o.stage !== "dispatched" && o.stage !== "delivered" && o.dispatchBy <= "2026-11-06");
  const hasConv = s.conversations.filter((c) => c.status === "open" || c.status === "draft_ready").length;

  const tiles: { label: string; value: string; tone?: "bad" | "warn" | "ok"; go: () => void }[] = [
    { label: "Orders in flight", value: String(t.count), go: () => actions.nav("Orders", "all") },
    { label: "Order value in flight", value: eur(t.totalValue), go: () => actions.nav("Orders", "overview") },
    { label: "Need attention", value: String(att.length), tone: att.length ? "bad" : "ok", go: () => actions.nav("Orders", "exceptions") },
    { label: "Low-stock warnings", value: String(low.length), tone: low.length ? "warn" : "ok", go: () => actions.nav("Inventory", "replenishment") },
    { label: "Wholesale receivables", value: eur(rec.outstanding), go: () => actions.nav("Finance", "receivables") },
    { label: "Overdue wholesale invoices", value: String(rec.overdueCount), tone: rec.overdueCount ? "bad" : "ok", go: () => actions.nav("Finance", "receivables") },
  ];

  const briefing: { text: string; go: () => void }[] = [
    awaitingErp
      ? { text: `${plural(awaitingErp, "Shopify order")} still ${awaitingErp === 1 ? "needs" : "need"} entering in the ERP by hand: MZ-1042, ${eur(orderValue(s.orders.find((o) => o.id === "MZ-1042")!))}. Import is prepared for your approval.`, go: () => actions.nav("Orders", "imports") }
      : { text: "Every Shopify order in flight is matched to the ERP.", go: () => actions.nav("Orders", "imports") },
    { text: `Fulfilment: ${plural(dueToday.length, "order")} due to leave today. The Renaissance lute (MZ-1044) ${att.some((i) => i.kind === "qc_pending") ? "is waiting on its quality check" : "has passed quality check"}.`, go: () => actions.nav("Fulfilment", "qc") },
    { text: `Inventory: ${plural(low.length, "product")} below reorder point. 15 String Trinity Cèilidh Harp has ${stockOf(s, "MZ-HRP-015").available} available.`, go: () => actions.nav("Inventory", "replenishment") },
    { text: `Wholesale: ${eur(rec.overdueAmount)} overdue from St Brigid's Music School; their new order ${att.some((i) => i.kind === "credit_hold") ? "is on credit hold" : "is released"}.`, go: () => actions.nav("Finance", "receivables") },
    { text: `Customers: ${plural(hasConv, "conversation")} open. MZ-1041 to the United States has no tracking update for 41 hours.`, go: () => actions.nav("Customers", "conversations") },
  ];

  return (
    <>
      <Glass title="Business snapshot" tag={<Badge tone="neutral">Demo data</Badge>}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {tiles.map((x) => (
            <button key={x.label} onClick={x.go} className="mz-kpi mz-click" style={{ textAlign: "left", padding: "11px 12px", background: "var(--surface-2)", border: `1px solid ${x.tone && x.tone !== "ok" ? TONE[x.tone].line : "var(--border)"}`, borderRadius: "var(--r-md,13px)", cursor: "pointer", minWidth: 0 }}>
              <div style={{ fontSize: 10.5, color: "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{x.label}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.6px", marginTop: 5, color: x.tone && x.tone !== "ok" ? TONE[x.tone].fg : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{x.value}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 10, lineHeight: 1.5 }}>Order value in flight is not revenue. Receivables are not extra sales.</div>
      </Glass>

      <Glass title="Morning briefing" tag={<Badge tone="accent">Briefing agent · 07:30</Badge>}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {briefing.map((b, i) => (
            <button key={i} onClick={b.go} className="mz-row mz-click" style={{ display: "flex", gap: 10, textAlign: "left", padding: "9px 4px", background: "none", border: 0, borderTop: i ? "1px solid var(--border)" : 0, cursor: "pointer", color: "var(--body)", fontSize: 12.5, lineHeight: 1.5 }}>
              <span style={{ flex: "none", width: 5, height: 5, marginTop: 7, borderRadius: 2, background: "var(--accent)" }} />
              <span>{b.text}</span>
            </button>
          ))}
        </div>
      </Glass>

      <Glass title="Needs your attention" tag={<Badge tone={att.length ? "bad" : "ok"} dot>{att.length}</Badge>} onMore={() => actions.nav("Orders", "exceptions")} more="All exceptions">
        {att.length === 0 && <div style={{ fontSize: 12.5, color: "var(--dim)", padding: "6px 2px" }}>Nothing needs you right now. Every flagged order has been resolved.</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {att.map((i) => {
            const o = s.orders.find((x) => x.id === i.orderId)!;
            return (
              <button key={i.id} onClick={() => actions.open({ type: "order", id: o.id })} className="mz-click mz-row" style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left", padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,13px)", cursor: "pointer", color: "var(--ink)" }}>
                <span style={{ flex: "none", width: 6, height: 6, borderRadius: 2, background: i.kind === "credit_hold" || i.kind === "tracking_exception" ? "var(--bad)" : "var(--warn)" }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.id} · {CUSTOMER_BY_ID[o.customerId].name}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "var(--dim)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{i.title}</span>
                </span>
                <span style={{ ...mono, fontSize: 11, color: "var(--dim)" }}>{eur(orderValue(o))}</span>
              </button>
            );
          })}
        </div>
        {pend.length > 0 && <div style={{ marginTop: 10 }}><Btn size="sm" kind="soft" onClick={() => actions.nav("Agents", "approvals")}>{plural(pend.length, "agent proposal")} to review</Btn></div>}
      </Glass>

      <Glass title="Order pipeline" onMore={() => actions.nav("Fulfilment", "overview")} more="Fulfilment">
        <div style={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", background: "var(--track)", gap: 2 }}>
          {pipe.filter((p) => p.id !== "delivered").map((p, i) => <span key={p.id} title={`${p.label}: ${p.count}`} style={{ flex: p.count || 0.0001, background: `color-mix(in srgb,var(--accent) ${30 + i * 11}%,var(--track))` }} />)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginTop: 11 }}>
          {pipe.map((p) => (
            <button key={p.id} onClick={() => actions.nav("Orders", "all")} title={`${p.label}: ${p.count}`} className="mz-click" style={{ textAlign: "center", padding: "6px 0", background: "none", border: 0, cursor: "pointer", minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 600, color: p.count ? "var(--ink)" : "var(--faint)" }}>{p.count}</div>
              <div style={{ fontSize: 9.5, color: "var(--dim)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.short}</div>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 8 }}>New, ERP Checked, Picking, Quality Check, Packed, Dispatched, Delivered. {flightTotal} orders not yet delivered.</div>
      </Glass>

      <Glass title="AI actions" tag={<Badge tone="neutral">Simulated</Badge>} onMore={() => actions.nav("Agents", "runs")} more="All runs">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {agentEvents.map((e, i) => (
            <button key={e.id} onClick={() => (e.ref ? actions.open(e.ref) : actions.nav("Agents", "runs"))} className="mz-row mz-click" style={{ display: "flex", gap: 10, textAlign: "left", padding: "9px 2px", background: "none", border: 0, borderTop: i ? "1px solid var(--border)" : 0, cursor: "pointer", color: "var(--body)" }}>
              <span style={{ flex: "none", ...mono, fontSize: 10, color: "var(--faint)", width: 40, paddingTop: 2 }}>{e.at.slice(0, 10) === "2026-11-06" ? hhmm(e.at) : whenLabel(e.at).replace(/\s?\d\d:\d\d/, "")}</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.45 }}><b style={{ color: "var(--ink)", fontWeight: 500 }}>{e.actor}:</b> {e.text}</span>
            </button>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 9 }}>{AGENTS.length} agents. Nothing is sent or changed outside this demo.</div>
      </Glass>

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 4px 6px", fontSize: 11, color: "var(--faint)" }}>
        <span style={{ flex: 1, lineHeight: 1.5 }}>Demo with illustrative data. Not connected to Shopify or the ERP.</span>
        <Btn size="sm" onClick={() => actions.reset()}>Reset demo</Btn>
      </div>
    </>
  );
}

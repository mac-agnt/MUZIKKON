import { useMemo, useState } from "react";
import { actions, useMuz } from "../../store";
import { Badge, Btn, Card, Chips, DataTable, Page, PageHead, Row, SearchBox, type Col } from "../../ui";
import { customerOf, orderQty, orderStatusText, orderValue, productLabel, staffName, stageIndex, issueFor } from "../../selectors";
import { eur } from "../../format";
import { STAGES, type Order } from "../../types";
import { ChannelBadge, FlagIcon, StageBadge, erpLabel, handoff, nextStep, paymentLabel } from "./shared";

type Ch = "all" | "online" | "wholesale";
type Pay = "all" | "paid" | "on_account";

export default function AllOrdersTab() {
  const s = useMuz();
  const [q, setQ] = useState("");
  const [ch, setCh] = useState<Ch>("all");
  const [pay, setPay] = useState<Pay>("all");
  const [stage, setStage] = useState<string>(() => {
    const v = handoff.stage;
    handoff.stage = null;
    return v || "all";
  });
  const [flagged, setFlagged] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return s.orders.filter((o) => {
      if (ch !== "all" && o.channel !== ch) return false;
      if (pay !== "all" && o.payment !== pay) return false;
      if (stage !== "all" && o.stage !== stage) return false;
      if (flagged && !issueFor(s, o.id)) return false;
      if (needle) {
        const hay = `${o.id} ${o.shopifyRef || ""} ${customerOf(o).name} ${productLabel(o)} ${o.destination} ${staffName(o.assignee)}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [s, q, ch, pay, stage, flagged]);

  const count = (f: (o: Order) => boolean) => s.orders.filter(f).length;
  const selected = rows.filter((o) => sel.has(o.id));
  const movable = selected.filter((o) => !o.creditHold && o.stage !== "delivered");
  const held = selected.length - movable.length;

  const advanceSelected = () => {
    movable.forEach((o) => actions.advanceOrder(o.id));
    if (held) actions.toast(`${held} selected order${held === 1 ? " was" : "s were"} skipped (credit hold or delivered)`, "warn");
    setSel(new Set());
  };

  const clearFilters = () => { setQ(""); setCh("all"); setPay("all"); setStage("all"); setFlagged(false); };
  const filtered = q || ch !== "all" || pay !== "all" || stage !== "all" || flagged;

  const cols: Col<Order>[] = [
    {
      key: "id", label: "Order", w: "112px", sort: (a, b) => a.id.localeCompare(b.id),
      render: (o) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink)", fontWeight: 600 }}>
          {o.id}
          {issueFor(s, o.id) && <span title={issueFor(s, o.id)!.title}><FlagIcon /></span>}
        </span>
      ),
    },
    { key: "cust", label: "Customer", w: "minmax(150px,1.2fr)", sort: (a, b) => customerOf(a).name.localeCompare(customerOf(b).name), render: (o) => customerOf(o).name },
    { key: "ch", label: "Channel", w: "96px", sort: (a, b) => a.channel.localeCompare(b.channel), render: (o) => <ChannelBadge o={o} /> },
    { key: "prod", label: "Product", w: "minmax(170px,1.4fr)", render: (o) => productLabel(o) },
    { key: "qty", label: "Qty", w: "52px", align: "right", sort: (a, b) => orderQty(a) - orderQty(b), render: (o) => orderQty(o) },
    { key: "val", label: "Value", w: "96px", align: "right", sort: (a, b) => orderValue(a) - orderValue(b), render: (o) => <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(orderValue(o))}</span> },
    { key: "pay", label: "Payment", w: "118px", render: (o) => paymentLabel(o) },
    { key: "erp", label: "ERP status", w: "104px", sort: (a, b) => a.erp.localeCompare(b.erp), render: (o) => <Badge tone={o.erp === "in_erp" ? "ok" : "warn"}>{erpLabel(o)}</Badge> },
    {
      key: "stage", label: "Fulfilment status", w: "minmax(190px,1.2fr)", sort: (a, b) => stageIndex(a.stage) - stageIndex(b.stage),
      render: (o) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <StageBadge o={o} />
          <span style={{ color: "var(--dim)", fontSize: 12 }}>{orderStatusText(s, o)}</span>
        </span>
      ),
    },
    { key: "dest", label: "Destination", w: "minmax(150px,1fr)", render: (o) => o.destination },
    { key: "who", label: "Assigned", w: "126px", render: (o) => staffName(o.assignee) },
    {
      key: "act", label: "Next step", w: "152px",
      render: (o) => {
        const n = nextStep(o);
        if (!n) return <span style={{ color: "var(--faint)" }}>Done</span>;
        return (
          <Btn size="sm" kind={n.disabled ? "ghost" : "soft"} disabled={n.disabled} title={n.reason} onClick={(e) => { e.stopPropagation(); actions.advanceOrder(o.id); }}>
            {n.label}
          </Btn>
        );
      },
    },
  ];

  return (
    <Page>
      <PageHead
        eyebrow="Orders"
        title="All orders"
        sub="Every order in flight, online and wholesale. Click a row for the full order record. Moving an order here changes the same state the Fulfilment and Finance pages read."
        right={<Badge tone="neutral">{rows.length} of {s.orders.length} shown</Badge>}
      />

      <Card pad={16}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Row gap={12}>
            <SearchBox value={q} onChange={setQ} placeholder="Search order, customer, product, destination" width={340} />
            <Chips<Ch> value={ch} onChange={setCh} options={[
              { id: "all", label: "All channels", count: s.orders.length },
              { id: "online", label: "Online", count: count((o) => o.channel === "online") },
              { id: "wholesale", label: "Wholesale", count: count((o) => o.channel === "wholesale") },
            ]} />
            <Chips<Pay> value={pay} onChange={setPay} options={[
              { id: "all", label: "Any payment" },
              { id: "paid", label: "Paid" },
              { id: "on_account", label: "On account" },
            ]} />
            <button className="mz-chip" onClick={() => setFlagged(!flagged)} style={{ height: 30, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 7, borderRadius: "var(--r-ctl,999px)", fontSize: 12, cursor: "pointer", background: flagged ? "var(--bad-soft)" : "var(--surface-2)", border: `1px solid ${flagged ? "rgba(239,75,82,.34)" : "var(--border)"}`, color: flagged ? "var(--bad)" : "var(--dim)", fontWeight: flagged ? 600 : 500 }}>
              <FlagIcon size={11} color={flagged ? "var(--bad)" : "var(--faint)"} />
              Flagged only
            </button>
            {filtered && <Btn size="sm" kind="ghost" onClick={clearFilters}>Reset filters</Btn>}
          </Row>
          <Chips<string> value={stage} onChange={setStage} options={[
            { id: "all", label: "All stages" },
            ...STAGES.map((st) => ({ id: st.id as string, label: st.label, count: count((o) => o.stage === st.id) })),
          ]} />
        </div>
      </Card>

      {selected.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "10px 16px", borderRadius: "var(--r-md,14px)", background: "var(--accent-soft)", border: "1px solid var(--accent-line)" }}>
          <span style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>{selected.length} selected</span>
          <span style={{ fontSize: 12, color: "var(--dim)", flex: 1 }}>
            {movable.length} can move to their next step{held ? `, ${held} will be skipped` : ""}.
          </span>
          <Btn size="sm" kind="primary" disabled={movable.length === 0} title={movable.length === 0 ? "Selected orders are on hold or delivered" : undefined} onClick={advanceSelected}>Advance selected</Btn>
          <Btn size="sm" kind="ghost" onClick={() => setSel(new Set())}>Clear</Btn>
        </div>
      )}

      <Card flush pad={0}>
        <DataTable
          cols={cols}
          rows={rows}
          rowKey={(o) => o.id}
          onRow={(o) => actions.open({ type: "order", id: o.id })}
          selectable
          selected={sel}
          onSelect={setSel}
          empty="No orders match these filters."
        />
      </Card>
    </Page>
  );
}

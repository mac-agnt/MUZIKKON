import { actions, useMuz } from "../../store";
import { Badge, Btn, Card, Grid, Kpi, Page, PageHead, Thumb } from "../../ui";
import { customerOf, orderValue, productLabel, issueFor } from "../../selectors";
import { eur } from "../../format";
import { SNAPSHOT_DATE } from "../../dataset";
import { DueBadge, FlagIcon, StageBadge, handoff, nextStep, thumbOf } from "../orders/shared";
import type { Order, StageId } from "../../types";

const COLUMNS: { id: string; label: string; stages: StageId[]; hint: string }[] = [
  { id: "intake", label: "New and ERP checked", stages: ["new", "erp"], hint: "Waiting to be picked" },
  { id: "picking", label: "Picking", stages: ["picking"], hint: "On the shelf" },
  { id: "qc", label: "Quality check", stages: ["qc"], hint: "Instrument inspection" },
  { id: "packed", label: "Packed", stages: ["packed"], hint: "Ready to go" },
  { id: "dispatched", label: "Dispatched", stages: ["dispatched"], hint: "With the carrier" },
];

function OrderCard({ o }: { o: Order }) {
  const s = useMuz();
  const issue = issueFor(s, o.id);
  const n = nextStep(o);
  const trackingEx = o.stage === "dispatched" && o.tracking?.status === "no_update";

  let btn: { label: string; run: () => void; disabled?: boolean; reason?: string } | null = null;
  if (trackingEx) btn = { label: "Open tracking", run: () => actions.setTab("Fulfilment", "tracking") };
  else if (o.stage === "qc" && !o.creditHold) btn = { label: "Open checklist", run: () => { handoff.qcOrder = o.id; actions.setTab("Fulfilment", "qc"); } };
  else if (n) btn = { label: n.label, run: () => actions.advanceOrder(o.id), disabled: n.disabled, reason: n.reason };

  return (
    <div onClick={() => actions.open({ type: "order", id: o.id })} className="mz-click" style={{ cursor: "pointer", padding: 12, borderRadius: "var(--r-md,14px)", background: "var(--surface-2)", border: `1px solid ${issue ? "rgba(239,75,82,.34)" : "var(--border)"}`, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Thumb src={thumbOf(o)} size={42} label={productLabel(o)} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
            {o.id}
            {issue && <span title={issue.title}><FlagIcon /></span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customerOf(o).name}</div>
        </div>
        <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{eur(orderValue(o))}</span>
      </div>
      <div style={{ fontSize: 12, color: "var(--dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{productLabel(o)}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <DueBadge o={o} />
        {o.stage === "new" || o.stage === "erp" ? <StageBadge o={o} /> : null}
        {o.erp === "not_in_erp" && <Badge tone="warn">Not in ERP</Badge>}
        {o.creditHold && <Badge tone="bad">Credit hold</Badge>}
        {trackingEx && <Badge tone="bad">No tracking update</Badge>}
      </div>
      {btn && (
        <Btn size="sm" kind={btn.disabled ? "ghost" : "soft"} disabled={btn.disabled} title={btn.reason} style={{ width: "100%" }} onClick={(e) => { e.stopPropagation(); btn!.run(); }}>
          {btn.label}
        </Btn>
      )}
    </div>
  );
}

export default function OverviewTab() {
  const s = useMuz();
  const awaitingPick = s.orders.filter((o) => o.stage === "erp" && !o.creditHold);
  const held = s.orders.filter((o) => o.stage === "erp" && o.creditHold).length;
  const inQc = s.orders.filter((o) => o.stage === "qc");
  const packed = s.orders.filter((o) => o.stage === "packed");
  const trackEx = s.orders.filter((o) => o.stage === "dispatched" && o.tracking?.status === "no_update");
  const dueToday = s.orders.filter((o) => o.dispatchBy <= SNAPSHOT_DATE && ["new", "erp", "picking", "qc", "packed"].includes(o.stage));
  const delivered = s.orders.filter((o) => o.stage === "delivered").length;

  return (
    <Page>
      <PageHead
        eyebrow="Fulfilment"
        title="From ERP-checked to dispatched"
        sub="Where every order sits between the ERP and the carrier. Each card has the one next step; click a card for the full order."
        right={<Badge tone="neutral">{delivered} delivered this session</Badge>}
      />

      <Grid min={170}>
        <Kpi label="Awaiting pick" value={awaitingPick.length} sub={held ? `${held} more on credit hold` : "In the ERP, not started"} tone="accent" onClick={() => actions.setTab("Fulfilment", "pickpack")} />
        <Kpi label="In quality check" value={inQc.length} sub="Instrument inspection" tone={inQc.length ? "warn" : "neutral"} onClick={() => actions.setTab("Fulfilment", "qc")} />
        <Kpi label="Packed, awaiting dispatch" value={packed.length} sub={`${packed.filter((o) => o.packStatus === "packed").length} sealed, ${packed.filter((o) => o.packStatus !== "packed").length} to pack`} onClick={() => actions.setTab("Fulfilment", "shipments")} />
        <Kpi label="Tracking exceptions" value={trackEx.length} tone={trackEx.length ? "bad" : "ok"} sub={trackEx.length ? "No carrier scan" : "All shipments moving"} onClick={() => actions.setTab("Fulfilment", "tracking")} />
        <Kpi label="Due to dispatch today" value={dueToday.length} tone={dueToday.length ? "warn" : "ok"} sub={dueToday.length ? dueToday.map((o) => o.id).join(", ") : "Nothing due"} />
      </Grid>

      <div style={{ overflowX: "auto", paddingBottom: 6 }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLUMNS.length},minmax(190px,1fr))`, gap: 10, minWidth: COLUMNS.length * 198 }}>
          {COLUMNS.map((c) => {
            const list = s.orders.filter((o) => c.stages.includes(o.stage));
            return (
              <Card key={c.id} pad={14} title={<span>{c.label}</span>} hint={c.hint} right={<Badge tone={list.length ? "accent" : "neutral"}>{list.length}</Badge>} style={{ background: "var(--surface-faint)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {list.map((o) => <OrderCard key={o.id} o={o} />)}
                  {list.length === 0 && <div style={{ padding: "18px 6px", textAlign: "center", fontSize: 12, color: "var(--faint)" }}>Nothing here</div>}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Card pad={14}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Badge tone={delivered ? "ok" : "neutral"} dot>Delivered: {delivered}</Badge>
          <span style={{ fontSize: 12.5, color: "var(--dim)", flex: 1, minWidth: 220 }}>
            Delivered orders leave the in-flight totals. Mark a dispatched order delivered (demo) to see it drop out of Orders.
          </span>
          <Btn size="sm" kind="ghost" onClick={() => actions.setTab("Fulfilment", "shipments")}>Open shipments</Btn>
        </div>
      </Card>
    </Page>
  );
}

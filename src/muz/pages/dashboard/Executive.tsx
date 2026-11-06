import { eur, plural, whenLabel } from "../../format";
import { SNAPSHOT_DATE } from "../../dataset";
import { attention, inFlight, lowStock, orderValue, pendingApprovals, pipelineCounts, receivables, round2, totals } from "../../selectors";
import { actions, useMuz } from "../../store";
import type { IssueKind, Tone } from "../../types";
import { Badge, Btn, Card, DemoTag, Empty, Grid, Kpi, PipelineBar, RecLink } from "../../ui";
import { KIND_LABEL, ListItem, RefLink, agentName, mono } from "../common";

const ISSUE_LABEL: Record<IssueKind, { label: string; tone: Tone }> = {
  erp_missing: { label: "Missing from ERP", tone: "bad" },
  qc_pending: { label: "Quality check", tone: "warn" },
  tracking_exception: { label: "Tracking", tone: "warn" },
  credit_hold: { label: "Credit hold", tone: "bad" },
};

export default function Executive() {
  const s = useMuz();
  const t = totals(s);
  const att = attention(s);
  const rec = receivables(s);
  const low = lowStock(s);
  const pend = pendingApprovals(s);
  const flaggedIds = new Set(att.map((i) => i.orderId));
  const awaitingValue = round2(inFlight(s).filter((o) => flaggedIds.has(o.id)).reduce((a, o) => a + orderValue(o), 0));
  const recent = [...s.activity].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);

  return (
    <>
      <Grid min={220}>
        <Kpi label="Value awaiting action" value={eur(awaitingValue)} tone={awaitingValue ? "warn" : "ok"} sub="Order value with an open exception" onClick={() => actions.nav("Orders", "exceptions")} />
        <Kpi label="Proposals awaiting you" value={pend.length} tone={pend.length ? "accent" : "ok"} sub="Agent actions needing approval" onClick={() => actions.nav("Agents", "approvals")} />
        <Kpi label="Due to leave today" value={inFlight(s).filter((o) => o.stage !== "dispatched" && o.stage !== "delivered" && o.dispatchBy <= SNAPSHOT_DATE).length} sub="Against the 24 to 48 hour dispatch goal" onClick={() => actions.nav("Fulfilment", "overview")} />
        <Kpi label="Products to replenish" value={low.length} tone={low.length ? "warn" : "ok"} sub={low.length ? "Below reorder point" : "Stock healthy"} onClick={() => actions.nav("Inventory", "replenishment")} />
      </Grid>

      <Card title="Fulfilment pipeline" hint="Orders by stage. Select a stage to see the order list." right={<span style={{ ...mono, fontSize: 10, color: "var(--faint)" }}>{plural(t.count, "order").toUpperCase()} IN FLIGHT</span>}>
        <PipelineBar stages={pipelineCounts(s)} onPick={() => actions.nav("Orders", "all")} />
      </Card>

      <Grid min={380}>
        <Card title="Priority issues" hint="Open exceptions across orders, dispatch and credit." right={<Btn size="sm" onClick={() => actions.nav("Orders", "exceptions")}>All exceptions</Btn>}>
          {att.length === 0 ? <Empty>No open exceptions.</Empty> : att.map((i) => {
            const k = ISSUE_LABEL[i.kind];
            return (
              <ListItem key={i.id} right={<Btn size="sm" onClick={() => actions.open({ type: "order", id: i.orderId })}>Open</Btn>}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <Badge tone={k.tone}>{k.label}</Badge>
                  <RecLink r={{ type: "order", id: i.orderId }} style={{ fontSize: 12.5 }}>{i.orderId}</RecLink>
                </div>
                <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, marginTop: 6 }}>{i.title}</div>
                <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3, lineHeight: 1.5 }}>{i.detail}</div>
              </ListItem>
            );
          })}
        </Card>

        <Card title="AI-prepared actions" hint="Proposed by agents, waiting for a person. Nothing happens outside this demo." right={<Btn size="sm" onClick={() => actions.nav("Agents", "approvals")}>Review all</Btn>}>
          {pend.length === 0 ? <Empty>All caught up.</Empty> : pend.slice(0, 5).map((a) => (
            <ListItem key={a.id} right={<Btn kind="primary" size="sm" onClick={() => actions.approve(a.id)}>Approve</Btn>}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", lineHeight: 1.4 }}>{a.title}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 5, flexWrap: "wrap" }}>
                <Badge tone="neutral">{KIND_LABEL[a.kind]}</Badge>
                <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{agentName(a.agentId)}</span>
                <span style={{ fontSize: 12 }}><RefLink r={a.ref} /></span>
              </div>
            </ListItem>
          ))}
          {pend.length > 5 && <div style={{ fontSize: 12, color: "var(--faint)", paddingTop: 10 }}>{pend.length - 5} more in Agents, Approvals.</div>}
        </Card>
      </Grid>

      <Grid min={380}>
        <Card title="Inventory alerts" hint="Available stock (on hand minus allocated) against reorder point." right={<Btn size="sm" onClick={() => actions.nav("Inventory", "replenishment")}>Replenishment</Btn>}>
          {low.length === 0 ? <Empty>No low-stock products.</Empty> : low.map((r) => (
            <ListItem key={r.product.sku} right={<Badge tone={r.out ? "bad" : "warn"} dot>{r.out ? "Out of stock" : "Low"}</Badge>}>
              <RecLink r={{ type: "product", id: r.product.sku }} style={{ fontSize: 13 }}>{r.product.short}</RecLink>
              <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{r.available} available, reorder point {r.reorderPoint} ({r.onHand} on hand, {r.allocated} allocated)</div>
            </ListItem>
          ))}
        </Card>

        <Card title="What changed since this morning" right={<Btn size="sm" onClick={() => actions.nav("Activity", "all")}>All activity</Btn>}>
          {recent.map((e) => (
            <ListItem key={e.id} onClick={e.ref ? () => actions.open(e.ref!) : undefined}>
              <div style={{ display: "flex", gap: 9, alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ ...mono, fontSize: 10, color: "var(--faint)" }}>{whenLabel(e.at)}</span>
                <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{e.actor}</span>
                {e.simulated && <DemoTag>Simulated</DemoTag>}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 3, lineHeight: 1.45 }}>{e.text}</div>
            </ListItem>
          ))}
        </Card>
      </Grid>
    </>
  );
}

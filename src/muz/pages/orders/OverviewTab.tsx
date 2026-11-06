import { actions, useMuz } from "../../store";
import { Badge, Btn, Callout, Card, Grid, Kpi, Label, Page, PageHead, PipelineBar, Progress, RecLink, Row, Thumb } from "../../ui";
import { attention, customerOf, orderValue, pipelineCounts, totals } from "../../selectors";
import { eur } from "../../format";
import { SNAPSHOT_DATE } from "../../dataset";
import { DueBadge, FlagIcon, handoff, thumbOf } from "./shared";
import type { IssueKind, Tone } from "../../types";

const KIND: Record<IssueKind, { label: string; tone: Tone }> = {
  erp_missing: { label: "Missing from ERP", tone: "warn" },
  qc_pending: { label: "QC pending", tone: "warn" },
  tracking_exception: { label: "Tracking", tone: "bad" },
  credit_hold: { label: "Credit hold", tone: "bad" },
};

export default function OverviewTab() {
  const s = useMuz();
  const t = totals(s);
  const pipe = pipelineCounts(s);
  const issues = attention(s);
  const awaitingErp = s.orders.filter((o) => o.erp === "not_in_erp").length;
  const dueToday = s.orders.filter((o) => o.dispatchBy <= SNAPSHOT_DATE && ["new", "erp", "picking", "qc", "packed"].includes(o.stage));
  const onlinePct = t.totalValue ? t.onlineValue / t.totalValue : 0;

  const pick = (stage: string) => {
    handoff.stage = stage;
    actions.setTab("Orders", "all");
  };

  return (
    <Page>
      <PageHead
        eyebrow="Orders"
        title="Online and wholesale orders in one place"
        sub="Shopify orders and wholesale account orders side by side, with where each one is right now. Demo data: nothing here is read from Shopify or the ERP."
        right={
          <>
            <Btn kind="ghost" onClick={() => actions.setTab("Orders", "all")}>All orders</Btn>
            <Btn kind="primary" onClick={() => actions.setTab("Orders", "imports")}>
              Channel imports{awaitingErp ? ` (${awaitingErp})` : ""}
            </Btn>
          </>
        }
      />

      <Grid min={170}>
        <Kpi label="Orders in flight" value={t.count} sub="Not yet delivered" tone="accent" onClick={() => actions.setTab("Orders", "all")} hint="Open all orders" />
        <Kpi label="Online (Shopify)" value={t.onlineCount} sub={eur(t.onlineValue)} />
        <Kpi label="Wholesale" value={t.wholesaleCount} sub={eur(t.wholesaleValue)} />
        <Kpi label="Order value in flight" value={eur(t.totalValue)} sub="Not recognised revenue" hint="Value of open orders. Revenue is recognised on the ERP invoice, not here." />
        <Kpi label="Flagged orders" value={t.flagged} tone={t.flagged ? "bad" : "ok"} sub={t.flagged ? "Open exceptions" : "Nothing needs attention"} onClick={() => actions.setTab("Orders", "exceptions")} hint="Open exceptions" />
      </Grid>

      <Card title="Order pipeline" hint="Click a stage to see those orders in All Orders." right={<Badge tone="neutral">{t.count} in flight</Badge>}>
        <PipelineBar stages={pipe} onPick={pick} />
        <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {pipe.map((p) => (
            <span key={p.id} style={{ fontSize: 11.5, color: "var(--dim)" }}>
              {p.label}: <span style={{ color: "var(--ink)" }}>{eur(p.value)}</span>
            </span>
          ))}
        </div>
      </Card>

      <Grid min={360}>
        <Card title="Needs attention" hint="Unresolved issues across orders. Click one to open the order." right={issues.length ? <Badge tone="bad">{issues.length} open</Badge> : <Badge tone="ok">All clear</Badge>} pad={18}>
          {issues.length === 0 ? (
            <div style={{ padding: "22px 6px", fontSize: 13, color: "var(--dim)", lineHeight: 1.6 }}>No open exceptions. Every order in flight is moving as expected.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {issues.map((i) => {
                const o = s.orders.find((x) => x.id === i.orderId)!;
                return (
                  <div key={i.id} onClick={() => actions.open({ type: "order", id: o.id })} className="mz-row mz-click" style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 4px", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
                    <Thumb src={thumbOf(o)} size={38} label={customerOf(o).name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <FlagIcon />
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{i.title}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>
                        <RecLink r={{ type: "order", id: o.id }}>{o.id}</RecLink> · {customerOf(o).name} · {eur(orderValue(o))}
                      </div>
                    </div>
                    <Badge tone={KIND[i.kind].tone}>{KIND[i.kind].label}</Badge>
                  </div>
                );
              })}
              <Row style={{ marginTop: 12 }}>
                <Btn size="sm" kind="soft" onClick={() => actions.setTab("Orders", "exceptions")}>Review all exceptions</Btn>
              </Row>
            </div>
          )}
        </Card>

        <Card title="Value split" hint="Order value in flight by channel. This is open order value, not recognised revenue.">
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Row style={{ justifyContent: "space-between", fontSize: 13 }}>
                <span>Online (Shopify), {t.onlineCount} orders</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(t.onlineValue)}</span>
              </Row>
              <div style={{ marginTop: 8 }}><Progress value={onlinePct} tone="info" height={8} /></div>
            </div>
            <div>
              <Row style={{ justifyContent: "space-between", fontSize: 13 }}>
                <span>Wholesale, {t.wholesaleCount} orders</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{eur(t.wholesaleValue)}</span>
              </Row>
              <div style={{ marginTop: 8 }}><Progress value={t.totalValue ? t.wholesaleValue / t.totalValue : 0} tone="accent" height={8} /></div>
            </div>
            <Grid min={120} gap={10}>
              <div style={{ padding: "11px 13px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm)" }}>
                <Label>Avg online order</Label>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 5 }}>{eur(t.avgOnline)}</div>
              </div>
              <div style={{ padding: "11px 13px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm)" }}>
                <Label>Avg wholesale order</Label>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 5 }}>{eur(t.avgWholesale)}</div>
              </div>
            </Grid>
            <Callout tone="info">
              Wholesale orders are on account and invoiced separately; online orders are already paid on Shopify. Neither is revenue until the ERP invoice is raised and settled.
            </Callout>
          </div>
        </Card>
      </Grid>

      <Grid min={360}>
        <Card title="Shopify to ERP" hint="Online orders are still moved into the ERP by hand. Pulse prepares the match for approval.">
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-1px", color: awaitingErp ? "var(--warn)" : "var(--ok)" }}>{awaitingErp}</div>
            <div style={{ flex: 1, minWidth: 180, fontSize: 13, color: "var(--body)", lineHeight: 1.5 }}>
              {awaitingErp === 0 ? "0 awaiting ERP entry. Every online order has a matching ERP order." : `${awaitingErp === 1 ? "Online order" : "Online orders"} awaiting ERP entry. Stock is not allocated until the order exists in the ERP.`}
            </div>
            <Btn kind={awaitingErp ? "primary" : "ghost"} size="sm" onClick={() => actions.setTab("Orders", "imports")}>{awaitingErp ? "Review and import" : "View import history"}</Btn>
          </div>
        </Card>

        <Card title="Dispatch due today or earlier" hint="Orders not yet dispatched whose dispatch-by date has arrived.">
          {dueToday.length === 0 ? (
            <div style={{ padding: "10px 4px", fontSize: 13, color: "var(--dim)" }}>Nothing is due today.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {dueToday.map((o) => (
                <div key={o.id} onClick={() => actions.open({ type: "order", id: o.id })} className="mz-click" style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13 }}>
                  <RecLink r={{ type: "order", id: o.id }}>{o.id}</RecLink>
                  <span style={{ flex: 1, minWidth: 0, color: "var(--dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customerOf(o).name}</span>
                  <DueBadge o={o} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </Grid>
    </Page>
  );
}

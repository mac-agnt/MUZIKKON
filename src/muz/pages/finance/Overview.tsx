import { actions, useMuz } from "../../store";
import { CUSTOMER_BY_ID } from "../../dataset";
import { daysOverdue, onlinePaid, receivables, reconciliation, totals } from "../../selectors";
import { dmy, dueLabel, eur } from "../../format";
import { Badge, Btn, Callout, Card, DemoTag, Empty, Grid, Kpi, Label, Page, PageHead, RecLink, Row } from "../../ui";
import { InvStatusBadge, mono, ReminderFlow } from "./shared";

export default function Overview() {
  const s = useMuz();
  const online = onlinePaid(s);
  const rec = receivables(s);
  const t = totals(s);
  const recon = reconciliation(s);
  const exceptions = recon.filter((r) => r.state !== "matched");
  const upcoming = rec.open.filter((i) => daysOverdue(i) === 0);

  return (
    <Page>
      <PageHead
        eyebrow="Finance"
        title="Finance at a glance"
        sub="Pulse reads ERP invoices and prepares reminders and matches. The ERP stays the ledger, and nothing here is sent or posted."
        right={<Badge tone="neutral">ERP invoices, read-only view</Badge>}
      />

      <Grid min={200}>
        <Kpi label="Online paid" value={eur(online.value)} sub={`${online.count} paid Shopify orders in flight`} tone="accent" onClick={() => actions.setTab("Finance", "invoices")} hint="Open invoices" />
        <Kpi label="Wholesale receivables" value={eur(rec.outstanding)} sub={`${rec.openCount} open ERP invoices`} onClick={() => actions.setTab("Finance", "receivables")} hint="Open receivables" />
        <Kpi label="Overdue" value={eur(rec.overdueAmount)} sub={`${rec.overdueCount} invoice${rec.overdueCount === 1 ? "" : "s"} past due`} tone={rec.overdueAmount ? "bad" : "ok"} />
        <Kpi label="Reminders awaiting approval" value={rec.remindersAwaiting} sub="drafted, not sent" tone={rec.remindersAwaiting ? "warn" : "neutral"} />
        <Kpi label="Finance exceptions" value={exceptions.length} sub="unmatched or on credit hold" tone={exceptions.length ? "warn" : "ok"} onClick={() => actions.setTab("Finance", "reconciliation")} hint="Open reconciliation" />
      </Grid>

      <Grid cols="repeat(auto-fit,minmax(min(100%,520px),1fr))">
        <Card title="Finance Assistant" hint="Overdue wholesale invoices, with a reminder a person can review and approve." right={<DemoTag>Reminders are never sent</DemoTag>}>
          {rec.overdue.length === 0 && <Empty>No invoice is overdue.</Empty>}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {rec.overdue.map((inv) => {
              const c = CUSTOMER_BY_ID[inv.customerId];
              const held = s.orders.find((o) => o.id === inv.orderId && o.creditHold);
              return (
                <div key={inv.id} style={{ padding: 16, background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-md,14px)" }}>
                  <Row gap={10} style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        <RecLink r={{ type: "invoice", id: inv.id }}>{inv.id}</RecLink>, <RecLink r={{ type: "customer", id: c.id }} style={{ color: "var(--ink)" }}>{c.name}</RecLink>
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 5, lineHeight: 1.55 }}>
                        {eur(inv.amount)} was due {dmy(inv.due)} and is {daysOverdue(inv)} days overdue. Account terms: {c.terms}.
                        {held && <> The linked order <RecLink r={{ type: "order", id: held.id }}>{held.id}</RecLink> is on credit hold.</>}
                      </div>
                    </div>
                    <InvStatusBadge inv={inv} />
                  </Row>
                  <div style={{ marginTop: 14 }}><ReminderFlow inv={inv} /></div>
                </div>
              );
            })}
          </div>
          {upcoming.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Label style={{ marginBottom: 8 }}>Coming due</Label>
              {upcoming.map((inv) => (
                <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 12.5, flexWrap: "wrap" }}>
                  <RecLink r={{ type: "invoice", id: inv.id }}>{inv.id}</RecLink>
                  <span style={{ flex: 1, color: "var(--dim)" }}>{CUSTOMER_BY_ID[inv.customerId].name}, due {dueLabel(inv.due)}. No reminder needed yet.</span>
                  <span style={mono}>{eur(inv.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card title="How these numbers fit together" hint="Orders, invoices and cash are three views of the same sales. Count each once.">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Line k="Online orders in flight" v={eur(t.onlineValue)} note="Paid at checkout on Shopify" />
              <Line k="Wholesale orders in flight" v={eur(t.wholesaleValue)} note="On account, invoiced by the ERP" />
              <Line k="Wholesale receivables" v={eur(rec.outstanding)} note="The invoices for those same wholesale orders" tone="neutral" />
              <Line k="Order value in flight" v={eur(t.totalValue)} note="Online plus wholesale orders" strong />
            </div>
            <div style={{ marginTop: 14 }}>
              <Callout tone="info" title="No double counting">
                Receivables are not additional sales: an open invoice is the same money as its wholesale order. Order value in flight is not revenue recognised either. Revenue and cash stay in the ERP.
              </Callout>
            </div>
          </Card>

          <Card title="Needs a finance decision" right={<Btn size="sm" onClick={() => actions.setTab("Finance", "reconciliation")}>Open reconciliation</Btn>}>
            {exceptions.length === 0 && <Empty>Every order matches its ERP order and invoice.</Empty>}
            {exceptions.map((r) => (
              <div key={r.order.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 13 }}><RecLink r={{ type: "order", id: r.order.id }}>{r.order.id}</RecLink> <span style={{ color: "var(--dim)" }}>{CUSTOMER_BY_ID[r.order.customerId].name}</span></div>
                  <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{r.note}</div>
                </div>
                <Badge tone={r.state === "unmatched" ? "warn" : "bad"} dot>{r.state === "unmatched" ? "Unmatched" : "Approval required"}</Badge>
              </div>
            ))}
          </Card>
        </div>
      </Grid>
    </Page>
  );
}

function Line({ k, v, note, strong, tone }: { k: string; v: string; note: string; strong?: boolean; tone?: "neutral" }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "10px 0", borderTop: strong ? "1px solid var(--border-strong)" : "1px solid var(--border)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: strong ? 600 : 500, color: tone === "neutral" ? "var(--dim)" : "var(--ink)" }}>{k}{tone === "neutral" && <span style={{ color: "var(--faint)", fontWeight: 400 }}> (same money, not added)</span>}</div>
        <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>{note}</div>
      </div>
      <div style={{ ...mono, fontSize: strong ? 15 : 13, fontWeight: strong ? 600 : 400, color: tone === "neutral" ? "var(--dim)" : "var(--ink)" }}>{v}</div>
    </div>
  );
}

import { actions, useMuz } from "../../store";
import type { MuzState } from "../../store";
import { CUSTOMER_BY_ID } from "../../dataset";
import { balanceOf, daysOverdue, orderStatusText, receivables } from "../../selectors";
import { dmy, dueLabel, eur, eur0 } from "../../format";
import { Badge, Btn, Callout, Card, ColumnChart, Grid, Kpi, Label, Page, PageHead, Progress, RecLink, Row } from "../../ui";
import type { Invoice } from "../../types";
import { InvStatusBadge, mono, reminderBadge, ReminderFlow } from "./shared";

const BUCKETS = [
  { id: "current", label: "Current", color: "var(--ok)", test: (d: number) => d === 0 },
  { id: "1-7", label: "1-7 days", color: "var(--warn)", test: (d: number) => d >= 1 && d <= 7 },
  { id: "8-30", label: "8-30 days", color: "var(--bad)", test: (d: number) => d >= 8 && d <= 30 },
  { id: "30+", label: "30+ days", color: "var(--bad)", test: (d: number) => d > 30 },
];

export default function Receivables() {
  const s = useMuz();
  const rec = receivables(s);
  const debtors = Array.from(new Set(rec.open.map((i) => i.customerId)));
  const buckets = BUCKETS.map((b) => {
    const items = rec.open.filter((i) => b.test(daysOverdue(i)));
    return { ...b, items, value: Math.round(items.reduce((a, i) => a + i.amount, 0) * 100) / 100 };
  });

  return (
    <Page>
      <PageHead
        eyebrow="Finance"
        title="Receivables"
        sub="Wholesale accounts with open ERP invoices. Pulse prepares reminders and credit decisions; payment is only ever recorded in the ERP."
        right={<Badge tone="neutral">Invoices are never marked paid here</Badge>}
      />

      <Grid min={190}>
        <Kpi label="Outstanding" value={eur(rec.outstanding)} sub={`${rec.openCount} invoices, ${debtors.length} accounts`} />
        <Kpi label="Overdue" value={eur(rec.overdueAmount)} sub={`${rec.overdueCount} invoice${rec.overdueCount === 1 ? "" : "s"}`} tone={rec.overdueAmount ? "bad" : "ok"} />
        <Kpi label="Not yet due" value={eur(Math.round((rec.outstanding - rec.overdueAmount) * 100) / 100)} sub="inside account terms" tone="ok" />
        <Kpi label="Reminders awaiting approval" value={rec.remindersAwaiting} sub="drafted, not sent" tone={rec.remindersAwaiting ? "warn" : "neutral"} />
      </Grid>

      <Card title="Ageing" hint="Open wholesale invoices by days past their due date, measured from Friday 6 November 2026.">
        <Grid cols="repeat(auto-fit,minmax(min(100%,420px),1fr))" gap={24}>
          <ColumnChart height={190} fmt={eur0} data={buckets.map((b) => ({ label: b.label, value: b.value, color: b.color }))} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
            {buckets.map((b) => (
              <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: b.color, flex: "none" }} />
                <span style={{ width: 74, color: "var(--dim)" }}>{b.label}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  {b.items.length === 0 ? <span style={{ color: "var(--faint)" }}>No invoices</span> : b.items.map((i, n) => <span key={i.id}>{n > 0 && ", "}<RecLink r={{ type: "invoice", id: i.id }}>{i.id}</RecLink></span>)}
                </span>
                <span style={mono}>{eur(b.value)}</span>
              </div>
            ))}
          </div>
        </Grid>
      </Card>

      <Grid min={520}>
        {debtors.map((id) => <Debtor key={id} s={s} id={id} />)}
      </Grid>
      {debtors.length === 0 && <Callout tone="ok" title="No open wholesale invoices">Every wholesale invoice is paid in the ERP.</Callout>}
    </Page>
  );
}

function Debtor({ s, id }: { s: MuzState; id: string }) {
  const c = CUSTOMER_BY_ID[id];
  const invs = s.invoices.filter((i) => i.customerId === id && i.status === "outstanding");
  const overdue = invs.filter((i) => daysOverdue(i) > 0);
  const bal = balanceOf(s, id);
  const limit = c.creditLimit ?? 0;
  const used = limit ? bal / limit : 0;
  const orders = s.orders.filter((o) => o.customerId === id);
  const releases = s.approvals.filter((a) => a.kind === "credit_release" && orders.some((o) => o.id === a.ref.id));
  const held = orders.filter((o) => o.creditHold);

  return (
    <Card pad={18} style={{ borderColor: held.length ? "rgba(239,75,82,.34)" : undefined }}>
      <Row gap={10} style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "nowrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.3px" }}><RecLink r={{ type: "customer", id }} style={{ color: "var(--ink)" }}>{c.name}</RecLink></div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>{c.terms}, credit limit {eur0(limit)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.7px", fontVariantNumeric: "tabular-nums" }}>{eur(bal)}</div>
          <div style={{ fontSize: 11, color: overdue.length ? "var(--bad)" : "var(--dim)", marginTop: 2 }}>{overdue.length ? `${eur(overdue.reduce((a, i) => a + i.amount, 0))} overdue` : "Not yet due"}</div>
        </div>
      </Row>

      <div style={{ marginTop: 14 }}>
        <Row gap={8} style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
          <Label>Balance against credit limit</Label>
          <span style={{ ...mono, fontSize: 11.5, color: "var(--dim)" }}>{Math.round(used * 100)}% used</span>
        </Row>
        <div style={{ marginTop: 7 }}><Progress value={used} tone={used > 0.85 ? "bad" : used > 0.6 ? "warn" : "ok"} /></div>
      </div>

      <div style={{ marginTop: 16 }}>
        <Label style={{ marginBottom: 6 }}>Open invoices</Label>
        {invs.map((i) => <InvoiceLine key={i.id} inv={i} />)}
      </div>

      {orders.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Label style={{ marginBottom: 6 }}>Linked orders</Label>
          {orders.map((o) => (
            <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, padding: "6px 0", borderTop: "1px solid var(--border)" }}>
              <RecLink r={{ type: "order", id: o.id }}>{o.id}</RecLink>
              <span style={{ flex: 1, color: "var(--dim)" }}>{orderStatusText(s, o)}</span>
              {o.creditHold && <Badge tone="bad" dot>Order on hold</Badge>}
            </div>
          ))}
        </div>
      )}

      {overdue.map((inv) => (
        <div key={inv.id} style={{ marginTop: 16, padding: 14, background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-md,14px)" }}>
          <Label style={{ marginBottom: 10 }}>Reminder for {inv.id}</Label>
          <ReminderFlow inv={inv} compact />
        </div>
      ))}

      {releases.map((a) => (
        <div key={a.id} style={{ marginTop: 14, padding: 14, background: a.status === "pending" ? "var(--warn-soft)" : "var(--chip)", border: `1px solid ${a.status === "pending" ? "rgba(240,136,62,.34)" : "var(--chip-border)"}`, borderRadius: "var(--r-md,14px)" }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{a.id}: {a.title}</div>
          <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 6, lineHeight: 1.6 }}>
            Conditional credit release lets <RecLink r={{ type: "order", id: a.ref.id }}>{a.ref.id}</RecLink> go to picking while {overdue[0]?.id ?? "the overdue invoice"} stays outstanding. The invoice is not marked paid and remains overdue until the customer pays.
          </div>
          <Row gap={8} style={{ marginTop: 12 }}>
            {a.status === "pending" ? (
              <>
                <Btn size="sm" kind="primary" onClick={() => actions.approve(a.id)}>Conditional credit release</Btn>
                <Btn size="sm" kind="danger" onClick={() => actions.reject(a.id)}>Reject</Btn>
              </>
            ) : a.status === "approved" ? (
              <Badge tone="ok" dot>Released to picking. {overdue[0]?.id ?? "Invoice"} still outstanding</Badge>
            ) : (
              <Badge tone="neutral" dot>Release rejected. Order stays on hold</Badge>
            )}
          </Row>
        </div>
      ))}
    </Card>
  );
}

function InvoiceLine({ inv }: { inv: Invoice }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderTop: "1px solid var(--border)", fontSize: 12.5, flexWrap: "wrap" }}>
      <RecLink r={{ type: "invoice", id: inv.id }} style={{ width: 70 }}>{inv.id}</RecLink>
      <span style={{ flex: 1, minWidth: 130, color: "var(--dim)" }}>Due {dmy(inv.due)}, {daysOverdue(inv) ? `${daysOverdue(inv)} days overdue` : dueLabel(inv.due)}</span>
      <span style={mono}>{eur(inv.amount)}</span>
      <InvStatusBadge inv={inv} />
      <span style={{ minWidth: 70 }}>{reminderBadge(inv)}</span>
    </div>
  );
}

import { CUSTOMER_BY_ID, SNAPSHOT_DATE } from "../../dataset";
import { addDays, dmy, eur, eur0, daysBetween } from "../../format";
import { daysOverdue, onlinePaid, receivables, round2 } from "../../selectors";
import { actions, useMuz } from "../../store";
import type { Invoice } from "../../types";
import { Badge, BarList, Btn, Callout, Card, ColumnChart, DataTable, DemoTag, Grid, Kpi, RecLink } from "../../ui";
import { weekStartOf } from "../common";

function reminderCell(i: Invoice, hasPending: boolean) {
  if (i.reminder === "approved") return <Badge tone="ok" dot>Reminder approved</Badge>;
  if (i.reminder === "drafted" || hasPending) return <Btn size="sm" kind="primary" onClick={(e) => { e.stopPropagation(); actions.approveReminder(i.id); }}>Approve reminder</Btn>;
  return <Btn size="sm" kind="soft" onClick={(e) => { e.stopPropagation(); actions.prepareReminder(i.id); }}>Prepare reminder</Btn>;
}

export default function FinanceTab() {
  const s = useMuz();
  const paid = onlinePaid(s);
  const rec = receivables(s);

  const byAcct = new Map<string, number>();
  rec.open.forEach((i) => byAcct.set(i.customerId, round2((byAcct.get(i.customerId) ?? 0) + i.amount)));
  const accounts = [...byAcct.entries()].sort((a, b) => b[1] - a[1]).map(([id, value]) => ({ label: CUSTOMER_BY_ID[id].name, value, onClick: () => actions.open({ type: "customer", id }) }));

  /* Illustrative cash outlook: expected collections by invoice due week. Overdue invoices sit in their own bar. */
  const thisWeek = weekStartOf(SNAPSHOT_DATE);
  const buckets = [{ label: "Overdue", value: 0 }, ...[0, 1, 2, 3, 4].map((n) => ({ label: dmy(addDays(thisWeek, n * 7)), value: 0 }))];
  rec.open.forEach((i) => {
    if (daysOverdue(i) > 0) { buckets[0].value = round2(buckets[0].value + i.amount); return; }
    const w = Math.floor(daysBetween(thisWeek, weekStartOf(i.due)) / 7);
    if (w >= 0 && w < 5) buckets[w + 1].value = round2(buckets[w + 1].value + i.amount);
  });

  return (
    <>
      <Grid min={190}>
        <Kpi label="Paid online orders" value={eur(paid.value)} sub={`${paid.count} orders in flight, paid on Shopify`} onClick={() => actions.nav("Finance", "reconciliation")} />
        <Kpi label="Outstanding wholesale" value={eur(rec.outstanding)} sub={`${rec.openCount} open invoices`} onClick={() => actions.nav("Finance", "invoices")} />
        <Kpi label="Overdue invoices" value={eur(rec.overdueAmount)} tone={rec.overdueCount ? "bad" : "ok"} sub={rec.overdueCount ? `${rec.overdueCount} overdue` : "Nothing overdue"} onClick={() => actions.nav("Finance", "receivables")} />
        <Kpi label="Reminders awaiting approval" value={rec.remindersAwaiting} tone={rec.remindersAwaiting ? "accent" : "ok"} sub="Drafts, never sent from the demo" onClick={() => actions.nav("Agents", "approvals")} />
      </Grid>

      <Callout tone="info" title="Avoid double counting">
        Outstanding order value is not revenue already recognised, and invoices are not additional sales. A wholesale order and its invoice are the same money seen at two stages.
      </Callout>

      <Grid min={380}>
        <Card title="Receivables by account" hint="Open wholesale invoices by customer. Select an account for its record.">
          {accounts.length === 0 ? <div style={{ fontSize: 13, color: "var(--dim)" }}>No open invoices.</div> : <BarList items={accounts} fmt={(n) => eur(n)} />}
        </Card>
        <Card title="Expected collections" hint="By invoice due week, assuming each customer pays on its terms. Real payment timing will differ." right={<DemoTag />}>
          <ColumnChart data={buckets} height={170} fmt={(n) => (n ? eur0(n) : "0")} />
        </Card>
      </Grid>

      <Card flush title="Open wholesale invoices" hint="Reminders are drafted for review and approved locally. Invoices are never marked paid automatically.">
        <DataTable
          dense
          rows={rec.open}
          rowKey={(i) => i.id}
          onRow={(i) => actions.open({ type: "invoice", id: i.id })}
          empty="No open invoices."
          cols={[
            { key: "id", label: "Invoice", w: "90px", render: (i) => <RecLink r={{ type: "invoice", id: i.id }}>{i.id}</RecLink>, sort: (a, b) => a.id.localeCompare(b.id) },
            { key: "cust", label: "Account", w: "minmax(150px,1.4fr)", render: (i) => CUSTOMER_BY_ID[i.customerId].name },
            { key: "amt", label: "Amount", w: "110px", align: "right", render: (i) => eur(i.amount), sort: (a, b) => a.amount - b.amount },
            { key: "due", label: "Due", w: "90px", render: (i) => dmy(i.due), sort: (a, b) => a.due.localeCompare(b.due) },
            { key: "late", label: "Status", w: "120px", render: (i) => (daysOverdue(i) > 0 ? <Badge tone="bad" dot>{daysOverdue(i)} days overdue</Badge> : <Badge tone="neutral">Not yet due</Badge>), sort: (a, b) => daysOverdue(a) - daysOverdue(b) },
            { key: "rem", label: "Reminder", w: "170px", render: (i) => reminderCell(i, s.approvals.some((a) => a.kind === "overdue_reminder" && a.ref.id === i.id && a.status === "pending")) },
          ]}
        />
      </Card>
    </>
  );
}

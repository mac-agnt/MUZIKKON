import { useState } from "react";
import { actions, useMuz } from "../../store";
import { CUSTOMER_BY_ID, SNAPSHOT_DATE } from "../../dataset";
import { daysOverdue, receivables, round2 } from "../../selectors";
import { addDays, daysBetween, dayDmy, dmy, eur, eur0 } from "../../format";
import { Badge, Callout, Card, Chips, Col, ColumnChart, DataTable, DemoTag, Grid, Kpi, Page, PageHead, RecLink } from "../../ui";
import type { Invoice } from "../../types";
import { InvStatusBadge, mono, ReminderFlow } from "./shared";

type Scen = "optimistic" | "expected" | "cautious";
/* Assumed days: `over` counts from today for invoices already overdue; `due` counts after the due date for the rest. */
const SCEN: Record<Scen, { label: string; over: number; due: number; text: string }> = {
  optimistic: { label: "Optimistic", over: 3, due: 0, text: "Overdue invoices are paid 3 days from today. Others are paid on their due date." },
  expected: { label: "Expected", over: 6, due: 4, text: "Overdue invoices are paid 6 days from today. Others are paid 4 days after their due date." },
  cautious: { label: "Cautious", over: 20, due: 14, text: "Overdue invoices are paid 20 days from today. Others are paid 14 days after their due date." },
};
const REMINDER_DAYS_SAVED = 2;
const WEEK0 = "2026-11-02";
const WEEKS = ["w/c 2 Nov", "w/c 9 Nov", "w/c 16 Nov", "w/c 23 Nov", "Later"];

function expectedDate(inv: Invoice, sc: Scen, withReminder: boolean): string {
  const a = SCEN[sc];
  if (daysOverdue(inv) > 0) return addDays(SNAPSHOT_DATE, Math.max(1, a.over - (withReminder && inv.reminder === "approved" ? REMINDER_DAYS_SAVED : 0)));
  return addDays(inv.due, a.due);
}
const weekOf = (date: string) => Math.max(0, Math.min(4, Math.floor(daysBetween(WEEK0, date) / 7)));

export default function Cash() {
  const s = useMuz();
  const [sc, setSc] = useState<Scen>("expected");
  const rec = receivables(s);
  const rows = rec.open.map((inv) => ({ inv, date: expectedDate(inv, sc, true), base: expectedDate(inv, sc, false) }));

  const byWeek = WEEKS.map((label, i) => ({ label, value: round2(rows.filter((r) => weekOf(r.date) === i).reduce((a, r) => a + r.inv.amount, 0)) }));
  const chart = byWeek.filter((w, i) => i < 4 || w.value > 0);
  const next2 = round2(byWeek[0].value + byWeek[1].value);
  const last = rows.reduce((m, r) => (r.date > m ? r.date : m), SNAPSHOT_DATE);
  const overdue = rec.overdue;
  const saved = rows.filter((r) => r.date !== r.base);

  const cols: Col<(typeof rows)[number]>[] = [
    { key: "id", label: "Invoice", w: "92px", render: (r) => <RecLink r={{ type: "invoice", id: r.inv.id }}>{r.inv.id}</RecLink> },
    { key: "cust", label: "Customer", w: "minmax(170px,1.4fr)", render: (r) => CUSTOMER_BY_ID[r.inv.customerId].name },
    { key: "amt", label: "Amount", w: "100px", align: "right", render: (r) => <span style={mono}>{eur(r.inv.amount)}</span>, sort: (a, b) => a.inv.amount - b.inv.amount },
    { key: "due", label: "Due", w: "76px", render: (r) => dmy(r.inv.due) },
    { key: "st", label: "Status", w: "minmax(150px,1.1fr)", render: (r) => <InvStatusBadge inv={r.inv} /> },
    { key: "when", label: "Assumed payment", w: "130px", render: (r) => <span style={{ color: "var(--ink)" }}>{dayDmy(r.date)}</span>, sort: (a, b) => (a.date < b.date ? -1 : 1) },
    { key: "week", label: "Week", w: "100px", render: (r) => <Badge tone={weekOf(r.date) < 2 ? "ok" : "neutral"}>{WEEKS[weekOf(r.date)]}</Badge> },
    {
      key: "late", label: "Versus due date", w: "minmax(150px,1.2fr)",
      render: (r) => {
        const d = daysBetween(r.inv.due, r.date);
        const txt = d === 0 ? "On the due date" : d > 0 ? `${d} days after due` : `${-d} days early`;
        return <span>{txt}{r.date !== r.base && <span style={{ color: "var(--ok)" }}>, {daysBetween(r.date, r.base)} days earlier with reminder</span>}</span>;
      },
    },
  ];

  return (
    <Page>
      <PageHead
        eyebrow="Finance"
        title="Cash outlook"
        sub="When open wholesale invoices might be paid, based on their due dates and a payment-delay assumption you can change. Online orders are paid at checkout and are not part of this curve."
        right={<DemoTag>Estimate, illustrative</DemoTag>}
      />

      <Grid min={200}>
        <Kpi label="Expected within two weeks" value={eur(next2)} sub={`${SCEN[sc].label.toLowerCase()} scenario`} tone="accent" />
        <Kpi label="Open wholesale invoices" value={eur(rec.outstanding)} sub={`${rec.openCount} invoices in the ERP`} />
        <Kpi label="Last expected payment" value={dayDmy(last)} sub="latest assumed date" />
      </Grid>

      <Card
        title="Expected collections by week"
        hint="Open wholesale invoices placed in the week they are assumed to be paid."
        right={<DemoTag>Estimate, illustrative</DemoTag>}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Chips<Scen> value={sc} onChange={setSc} options={(Object.keys(SCEN) as Scen[]).map((k) => ({ id: k, label: SCEN[k].label }))} />
          <div style={{ fontSize: 12, color: "var(--dim)" }}>{SCEN[sc].text}</div>
          <ColumnChart data={chart.map((w) => ({ label: w.label, value: w.value, color: w.value ? undefined : "var(--track)" }))} fmt={eur0} height={200} />
        </div>
      </Card>

      <Grid cols="repeat(auto-fit,minmax(min(100%,420px),1fr))">
        <Card title="Effect of an approved reminder" hint="An approved reminder is assumed to bring an overdue payment forward by two days. Illustrative only.">
          {overdue.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--dim)" }}>No invoice is overdue, so there is nothing to bring forward.</div>
          ) : (
            overdue.map((inv) => (
              <div key={inv.id} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.55 }}>
                  <RecLink r={{ type: "invoice", id: inv.id }}>{inv.id}</RecLink>, {CUSTOMER_BY_ID[inv.customerId].name}, {eur(inv.amount)}:{" "}
                  {inv.reminder === "approved"
                    ? <b style={{ color: "var(--ok)" }}>reminder approved, payment assumed {REMINDER_DAYS_SAVED} days earlier ({dayDmy(expectedDate(inv, sc, true))} instead of {dayDmy(expectedDate(inv, sc, false))}).</b>
                    : <span style={{ color: "var(--dim)" }}>no approved reminder yet. Approving one moves the assumed date from {dayDmy(expectedDate(inv, sc, false))} to {dayDmy(addDays(SNAPSHOT_DATE, Math.max(1, SCEN[sc].over - REMINDER_DAYS_SAVED)))}.</span>}
                </div>
                <ReminderFlow inv={inv} compact />
              </div>
            ))
          )}
          {saved.length > 0 && <Callout tone="ok" title="Chart updated">The bars above already include the approved reminder.</Callout>}
        </Card>

        <Card title="What this is, and is not" hint="Read before quoting any number from this tab.">
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.75, color: "var(--body)" }}>
            <li>It uses ERP invoice due dates only. No bank feed or accounting system is connected.</li>
            <li>Payment dates are assumptions, not customer commitments.</li>
            <li>Order value in flight and receivables are not added together here, to avoid counting the same sale twice.</li>
            <li>Actual cash is whatever the ERP and bank record. <button className="mz-reclink" onClick={() => actions.setTab("Finance", "receivables")} style={{ border: 0, background: "none", padding: 0, color: "var(--accent)", cursor: "pointer", fontSize: "inherit" }}>Open receivables</button> to act on an account.</li>
          </ul>
        </Card>
      </Grid>

      <Card title="Invoices behind the bars" hint="Assumed payment dates for the selected scenario." flush>
        <DataTable cols={cols} rows={rows} rowKey={(r) => r.inv.id} onRow={(r) => actions.open({ type: "invoice", id: r.inv.id })} empty="No open wholesale invoices." />
      </Card>
    </Page>
  );
}

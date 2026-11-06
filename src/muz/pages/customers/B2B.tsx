import { actions, useMuz } from "../../store";
import type { MuzState } from "../../store";
import { CUSTOMER_BY_ID, SNAPSHOT_DATE } from "../../dataset";
import { balanceOf, customerSpend, daysOverdue, historyOfCustomer, orderStatusText, orderValue, ordersOfCustomer, staffName } from "../../selectors";
import { dmy, dueLabel, eur, eur0, daysBetween, initials } from "../../format";
import { Avatar, Badge, Btn, Card, DemoTag, Empty, Grid, KV, Kpi, Label, Page, PageHead, Progress, RecLink, Row } from "../../ui";
import { accountStatus, monthsSince, mono, overdueInvoices } from "./shared";

const ACCOUNTS = ["c-brigid", "c-galway", "c-lough", "c-ashbourne"];

export default function B2B() {
  const s = useMuz();
  const withHold = ACCOUNTS.filter((id) => accountStatus(s, id).tone === "bad").length;
  const balance = ACCOUNTS.reduce((a, id) => a + balanceOf(s, id), 0);
  const active = ACCOUNTS.reduce((a, id) => a + ordersOfCustomer(s, id).filter((o) => o.stage !== "delivered").length, 0);

  return (
    <Page>
      <PageHead
        eyebrow="Customers"
        title="Schools and resellers"
        sub="Trade accounts on payment terms. Balances and invoices are read from the ERP; Pulse prepares actions and a person decides."
        right={<DemoTag>Fictional accounts</DemoTag>}
      />

      <Grid min={190}>
        <Kpi label="Trade accounts" value={ACCOUNTS.length} sub="schools and resellers" />
        <Kpi label="Orders in flight" value={active} sub="on account" tone="accent" />
        <Kpi label="Outstanding" value={eur(balance)} sub="open ERP invoices" tone={balance ? "warn" : "ok"} />
        <Kpi label="On credit hold" value={withHold} sub="orders held for review" tone={withHold ? "bad" : "ok"} />
      </Grid>

      <Grid min={520}>
        {ACCOUNTS.map((id) => <Account key={id} s={s} id={id} />)}
      </Grid>

      <Repeat s={s} />
    </Page>
  );
}

function Account({ s, id }: { s: MuzState; id: string }) {
  const c = CUSTOMER_BY_ID[id];
  const st = accountStatus(s, id);
  const orders = ordersOfCustomer(s, id);
  const hist = [...historyOfCustomer(id)].sort((a, b) => (a.date < b.date ? 1 : -1));
  const invs = s.invoices.filter((i) => i.customerId === id && i.status === "outstanding");
  const bal = balanceOf(s, id);
  const limit = c.creditLimit ?? 0;
  const used = limit ? bal / limit : 0;
  const quote = s.conversations.find((cv) => cv.customerId === id && cv.kind === "wholesale");
  const overdue = overdueInvoices(s, id);
  const inv = overdue[0];
  const held = orders.find((o) => o.creditHold);

  return (
    <Card pad={18} style={{ borderColor: st.tone === "bad" ? "rgba(239,75,82,.34)" : undefined }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Avatar initials={initials(c.name)} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-.3px" }}><RecLink r={{ type: "customer", id }} style={{ color: "var(--ink)" }}>{c.name}</RecLink></div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>{c.type === "school" ? "School" : "Reseller"}, customer since {c.since}</div>
        </div>
        <Badge tone={st.tone} dot>{st.label}</Badge>
      </div>

      <div style={{ marginTop: 14 }}>
        <KV cols={3} rows={[["Account manager", staffName(c.accountManager || "")], ["Payment terms", c.terms || "None"], ["Contact", c.contact || "None"]]} />
      </div>

      <div style={{ marginTop: 14 }}>
        <Row gap={8} style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
          <Label>Credit used</Label>
          <span style={{ ...mono, fontSize: 11.5, color: "var(--dim)" }}>{eur0(bal)} of {eur0(limit)} limit ({Math.round(used * 100)}%)</span>
        </Row>
        <div style={{ marginTop: 7 }}><Progress value={used} tone={used > 0.85 ? "bad" : used > 0.6 ? "warn" : "ok"} /></div>
      </div>

      {held && (
        <div style={{ marginTop: 14, padding: "11px 13px", background: "var(--bad-soft)", border: "1px solid rgba(239,75,82,.34)", borderRadius: "var(--r-md,14px)", fontSize: 12.5, lineHeight: 1.55 }}>
          <b style={{ color: "var(--bad)" }}>Credit hold.</b> <RecLink r={{ type: "order", id: held.id }}>{held.id}</RecLink> is held because {inv ? <><RecLink r={{ type: "invoice", id: inv.id }}>{inv.id}</RecLink> ({eur(inv.amount)}) is {daysOverdue(inv)} days overdue</> : "of an overdue invoice"}. Stock stays allocated while the hold is reviewed.
        </div>
      )}
      {!held && inv && (
        <div style={{ marginTop: 14, padding: "11px 13px", background: "var(--warn-soft)", border: "1px solid rgba(240,136,62,.34)", borderRadius: "var(--r-md,14px)", fontSize: 12.5, lineHeight: 1.55 }}>
          <b style={{ color: "var(--warn)" }}>Watch.</b> <RecLink r={{ type: "invoice", id: inv.id }}>{inv.id}</RecLink> is {daysOverdue(inv)} days overdue. The order is no longer held, the invoice is still open.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginTop: 16 }}>
        <div>
          <Label style={{ marginBottom: 8 }}>Bulk and current orders</Label>
          {orders.length === 0 && <div style={{ fontSize: 12.5, color: "var(--faint)" }}>None in flight</div>}
          {orders.map((o) => (
            <div key={o.id} style={{ fontSize: 12.5, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <RecLink r={{ type: "order", id: o.id }}>{o.id}</RecLink> <span style={{ color: "var(--dim)" }}>{o.lines.reduce((a, l) => a + l.qty, 0)} units</span>
              <span style={{ float: "right", ...mono, fontSize: 11.5 }}>{eur(orderValue(o))}</span>
              <div style={{ fontSize: 11.5, color: o.creditHold ? "var(--bad)" : "var(--dim)", marginTop: 2 }}>{orderStatusText(s, o)}</div>
            </div>
          ))}
        </div>
        <div>
          <Label style={{ marginBottom: 8 }}>Outstanding invoices</Label>
          {invs.length === 0 && <div style={{ fontSize: 12.5, color: "var(--faint)" }}>Nothing outstanding</div>}
          {invs.map((i) => (
            <div key={i.id} style={{ fontSize: 12.5, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
              <RecLink r={{ type: "invoice", id: i.id }}>{i.id}</RecLink> <span style={{ float: "right", ...mono, fontSize: 11.5 }}>{eur(i.amount)}</span>
              <div style={{ fontSize: 11.5, color: daysOverdue(i) ? "var(--bad)" : "var(--dim)", marginTop: 2 }}>
                Due {dmy(i.due)}, {daysOverdue(i) ? `${daysOverdue(i)} days overdue` : dueLabel(i.due)}
                {i.reminder !== "none" && `, reminder ${i.reminder}`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, marginTop: 16 }}>
        <div>
          <Label style={{ marginBottom: 8 }}>Quotes</Label>
          {quote ? (
            <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>
              Open quote request <RecLink r={{ type: "conversation", id: quote.id }}>{quote.id}</RecLink>
              <div style={{ color: "var(--dim)", fontSize: 11.5, marginTop: 2 }}>{quote.subject}</div>
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: "var(--faint)" }}>No open quotes</div>
          )}
        </div>
        <div>
          <Label style={{ marginBottom: 8 }}>Purchase history</Label>
          {hist.length === 0 && <div style={{ fontSize: 12.5, color: "var(--faint)" }}>No history</div>}
          {hist.slice(0, 3).map((h) => (
            <div key={h.id} style={{ fontSize: 12, padding: "3px 0", color: "var(--dim)" }}>
              <span style={{ color: "var(--body)" }}>{h.item}</span> <span style={{ float: "right", ...mono, fontSize: 11 }}>{dmy(h.date)}</span>
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 4 }}>Lifetime {eur0(customerSpend(s, id))} (illustrative)</div>
        </div>
      </div>

      <Row gap={8} style={{ marginTop: 18 }}>
        {inv && (
          <Btn
            size="sm"
            kind="primary"
            disabled={inv.reminder !== "none"}
            title={inv.reminder !== "none" ? `Reminder already ${inv.reminder}` : undefined}
            onClick={() => actions.prepareReminder(inv.id)}
          >
            {inv.reminder === "none" ? "Prepare reminder" : inv.reminder === "drafted" ? "Reminder drafted" : "Reminder approved"}
          </Btn>
        )}
        {inv && <Btn size="sm" onClick={() => actions.nav("Finance", "receivables")}>Open receivables</Btn>}
        {quote && <Btn size="sm" kind="soft" onClick={() => actions.open({ type: "conversation", id: quote.id })}>Open quote request</Btn>}
        <Btn size="sm" onClick={() => actions.open({ type: "customer", id })}>Open account</Btn>
      </Row>
    </Card>
  );
}

/* Rule-based repeat purchase suggestions from delivered history. Illustrative only. */
function Repeat({ s }: { s: MuzState }) {
  const items = ACCOUNTS.map((id) => {
    const c = CUSTOMER_BY_ID[id];
    const hist = historyOfCustomer(id).sort((a, b) => (a.date < b.date ? 1 : -1));
    const last = hist[0];
    const inflight = ordersOfCustomer(s, id).filter((o) => o.stage !== "delivered");
    if (!last) return { id, c, title: "No purchase history", detail: "Nothing to base a suggestion on.", tone: "neutral" as const };
    const m = monthsSince(last.date);
    const lastTxt = `Last delivered order ${last.id}: ${last.item} on ${dmy(last.date)} (${m} months ago).`;
    if (c.type === "school") {
      const jan = daysBetween(SNAPSHOT_DATE, "2027-01-04");
      return {
        id, c, tone: "accent" as const,
        title: inflight.length ? "Term-start restock already in progress" : "Term-start restock window",
        detail: `${lastTxt} Schools in this demo order at term start. ${inflight.length ? `${inflight[0].id} is in flight.` : `The January term starts in about ${Math.round(jan / 7)} weeks; a quote offered now could land before then.`}`,
      };
    }
    return {
      id, c, tone: m >= 6 ? ("ok" as const) : ("neutral" as const),
      title: m >= 6 ? "Reorder window open" : `Reorder window opens in about ${Math.max(1, Math.round(6 - m))} months`,
      detail: `${lastTxt} Rule: resellers in this demo reorder about every six months.${inflight.length ? ` ${inflight[0].id} is already in flight.` : ""}`,
    };
  });

  return (
    <Card title="Repeat-purchase opportunities" hint="Simple rules over delivered history. These are suggestions for a person to act on, not forecasts." right={<DemoTag>Illustrative rules</DemoTag>}>
      <Grid min={300} gap={12}>
        {items.map((x) => (
          <div key={x.id} style={{ padding: 14, background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-md,14px)" }}>
            <Row gap={8} style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
              <RecLink r={{ type: "customer", id: x.id }} style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{x.c.name}</RecLink>
              <Badge tone={x.tone}>{x.title}</Badge>
            </Row>
            <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 8, lineHeight: 1.55 }}>{x.detail}</div>
          </div>
        ))}
      </Grid>
      {items.length === 0 && <Empty>No suggestions.</Empty>}
    </Card>
  );
}

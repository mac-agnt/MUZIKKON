import { useState } from "react";
import { actions, useMuz } from "../../store";
import { CUSTOMER_BY_ID } from "../../dataset";
import { daysOverdue, isOverdue, round2 } from "../../selectors";
import { dmy, eur } from "../../format";
import { Badge, Card, Chips, Col, DataTable, Page, PageHead, RecLink, SearchBox } from "../../ui";
import type { Invoice } from "../../types";
import { InvStatusBadge, isOnline, mono, reminderBadge } from "./shared";

type F = "all" | "online" | "wholesale" | "overdue";

export default function Invoices() {
  const s = useMuz();
  const [f, setF] = useState<F>("all");
  const [q, setQ] = useState("");

  const all = s.invoices;
  const match = (i: Invoice) => f === "all" || (f === "online" && isOnline(i)) || (f === "wholesale" && !isOnline(i)) || (f === "overdue" && i.status === "outstanding" && isOverdue(i));
  const rows = all.filter((i) => match(i) && (!q || `${i.id} ${CUSTOMER_BY_ID[i.customerId].name} ${i.orderId ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  const total = round2(rows.reduce((a, i) => a + i.amount, 0));
  const paid = round2(rows.filter((i) => i.status === "paid").reduce((a, i) => a + i.amount, 0));
  const open = round2(total - paid);

  const cols: Col<Invoice>[] = [
    { key: "id", label: "Invoice", w: "96px", render: (i) => <RecLink r={{ type: "invoice", id: i.id }}>{i.id}</RecLink>, sort: (a, b) => a.id.localeCompare(b.id) },
    { key: "cust", label: "Customer", w: "minmax(180px,1.5fr)", render: (i) => <RecLink r={{ type: "customer", id: i.customerId }} style={{ color: "var(--ink)" }}>{CUSTOMER_BY_ID[i.customerId].name}</RecLink>, sort: (a, b) => CUSTOMER_BY_ID[a.customerId].name.localeCompare(CUSTOMER_BY_ID[b.customerId].name) },
    { key: "chan", label: "Channel", w: "100px", render: (i) => <Badge tone={isOnline(i) ? "neutral" : "accent"}>{isOnline(i) ? "Online" : "Wholesale"}</Badge> },
    { key: "order", label: "Order", w: "92px", render: (i) => (i.orderId ? <RecLink r={{ type: "order", id: i.orderId }}>{i.orderId}</RecLink> : <span style={{ color: "var(--faint)" }}>None</span>) },
    { key: "amt", label: "Amount", w: "100px", align: "right", render: (i) => <span style={mono}>{eur(i.amount)}</span>, sort: (a, b) => a.amount - b.amount },
    { key: "issued", label: "Issued", w: "72px", render: (i) => dmy(i.issued), sort: (a, b) => (a.issued < b.issued ? -1 : 1) },
    { key: "due", label: "Due", w: "72px", render: (i) => dmy(i.due), sort: (a, b) => (a.due < b.due ? -1 : 1) },
    { key: "st", label: "Status", w: "minmax(150px,1.2fr)", render: (i) => <InvStatusBadge inv={i} />, sort: (a, b) => daysOverdue(b) - daysOverdue(a) || Number(a.status === "paid") - Number(b.status === "paid") },
    { key: "rem", label: "Reminder", w: "140px", render: (i) => reminderBadge(i) },
  ];

  const counts = {
    all: all.length,
    online: all.filter(isOnline).length,
    wholesale: all.filter((i) => !isOnline(i)).length,
    overdue: all.filter((i) => i.status === "outstanding" && isOverdue(i)).length,
  };

  return (
    <Page>
      <PageHead
        eyebrow="Finance"
        title="Invoices"
        sub="ERP invoices for online and wholesale orders. Online orders are paid at checkout; wholesale invoices follow account terms."
        right={<SearchBox value={q} onChange={setQ} placeholder="Search invoice, customer, order" width={270} />}
      />

      <Chips<F>
        value={f}
        onChange={setF}
        options={[
          { id: "all", label: "All", count: counts.all },
          { id: "online", label: "Online paid", count: counts.online },
          { id: "wholesale", label: "Wholesale", count: counts.wholesale },
          { id: "overdue", label: "Overdue", count: counts.overdue },
        ]}
      />

      <Card flush>
        <DataTable cols={cols} rows={rows} rowKey={(i) => i.id} onRow={(i) => actions.open({ type: "invoice", id: i.id })} empty="No invoices match these filters." />
        <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap", padding: "13px 18px", background: "var(--surface-faint)", borderTop: "1px solid var(--border-strong)", fontSize: 12.5 }}>
          <span style={{ color: "var(--dim)" }}>Showing {rows.length} invoice{rows.length === 1 ? "" : "s"}</span>
          <span style={{ marginLeft: "auto", color: "var(--dim)" }}>Paid <b style={{ ...mono, color: "var(--ink)", marginLeft: 6 }}>{eur(paid)}</b></span>
          <span style={{ color: "var(--dim)" }}>Outstanding <b style={{ ...mono, color: open ? "var(--warn)" : "var(--ink)", marginLeft: 6 }}>{eur(open)}</b></span>
          <span style={{ color: "var(--dim)" }}>Total <b style={{ ...mono, color: "var(--ink)", marginLeft: 6 }}>{eur(total)}</b></span>
        </div>
      </Card>
    </Page>
  );
}


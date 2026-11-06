/* Global record drawers: one place to open any record from anywhere in the demo. */
import { useEffect, useState } from "react";
import { actions, AGENT_BY_ID, draftFor, reminderText, useMuz, type MuzState } from "./store";
import { AGENTS, CUSTOMER_BY_ID, PRODUCT_BY_SKU, STAFF, SUPPLIERS } from "./dataset";
import {
  balanceOf, customerOf, customerSpend, daysOverdue, historyOfCustomer, issueFor, orderStatusText, orderValue, ordersOfCustomer,
  qcStatusOf, stageIndex, stockOf, staffName, productLabel,
} from "./selectors";
import { dayDmy, dmy, dmyFull, eur, whenLabel } from "./format";
import { Badge, Btn, Callout, Drawer, KV, Progress, RecLink, Row, Section, Thumb, Timeline } from "./ui";
import type { Invoice, Order, RecordRef, Tone } from "./types";
import { STAGES } from "./types";

const stageTone = (st: string): Tone => (st === "delivered" ? "ok" : st === "dispatched" ? "info" : st === "packed" ? "ok" : st === "qc" ? "warn" : st === "picking" ? "accent" : "neutral");

export function nextActionLabel(s: MuzState, o: Order): { label: string; disabled?: boolean; why?: string } {
  if (o.stage === "delivered") return { label: "Delivered", disabled: true, why: "Order is complete" };
  if (o.creditHold) return { label: "On credit hold", disabled: true, why: "Release it from Finance or Agents approvals" };
  if (o.erp === "not_in_erp") return { label: "Import to ERP (simulated)" };
  switch (o.stage) {
    case "new": return { label: "Mark ERP checked" };
    case "erp": return { label: "Start picking" };
    case "picking": return { label: "Send to quality check" };
    case "qc": return { label: "Complete QC and submit", disabled: qcStatusOf(s, o) === "pending" && false };
    case "packed": return o.packStatus === "packed" ? { label: "Dispatch (simulated)" } : { label: "Mark package ready" };
    case "dispatched": return { label: "Mark delivered (demo)" };
  }
  return { label: "Advance" };
}

export default function DrawerHost() {
  const s = useMuz();
  const d = s.drawer;
  const close = () => actions.open(null);
  useEffect(() => {
    if (!d) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") actions.open(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [d]);
  if (!d) return null;
  switch (d.type) {
    case "order":
    case "shipment": return <OrderDrawer s={s} id={d.id} onClose={close} />;
    case "product": return <ProductDrawer s={s} sku={d.id} onClose={close} />;
    case "customer": return <CustomerDrawer s={s} id={d.id} onClose={close} />;
    case "invoice": return <InvoiceDrawer s={s} id={d.id} onClose={close} />;
    case "conversation": return <ConversationDrawer s={s} id={d.id} onClose={close} />;
    case "po": return <PoDrawer s={s} id={d.id} onClose={close} />;
    case "task": return <TaskDrawer s={s} id={d.id} onClose={close} />;
    case "agent": return <AgentDrawer s={s} id={d.id} onClose={close} />;
    case "supplier": return <SupplierDrawer id={d.id} onClose={close} />;
    case "staff": return <StaffDrawer id={d.id} onClose={close} />;
  }
  return null;
}

function Rel({ r, label, sub }: { r: RecordRef; label: string; sub?: string }) {
  return (
    <button className="mz-click mz-row" onClick={() => actions.open(r)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 13px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)", cursor: "pointer", textAlign: "left", color: "var(--ink)", fontSize: 13 }}>
      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
      {sub && <span style={{ fontSize: 11.5, color: "var(--dim)", whiteSpace: "nowrap" }}>{sub}</span>}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="2.2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
    </button>
  );
}

/* ── Order ─────────────────────────────────────────────────────────────── */
function OrderDrawer({ s, id, onClose }: { s: MuzState; id: string; onClose: () => void }) {
  const o = s.orders.find((x) => x.id === id);
  if (!o) return <Drawer open onClose={onClose} title="Order not found">{null}</Drawer>;
  const c = customerOf(o);
  const issue = issueFor(s, o.id);
  const inv = s.invoices.find((i) => i.id === o.invoiceId);
  const convs = s.conversations.filter((x) => x.orderId === o.id);
  const events = s.activity.filter((e) => e.ref?.type === "order" && e.ref.id === o.id);
  const runs = s.runs.filter((r) => r.refs.some((x) => x.type === "order" && x.id === o.id));
  const aprs = s.approvals.filter((a) => a.ref.type === "order" && a.ref.id === o.id);
  const tasks = s.tasks.filter((t) => t.ref.type === "order" && t.ref.id === o.id);
  const next = nextActionLabel(s, o);
  const idx = stageIndex(o.stage);
  const qc = qcStatusOf(s, o);
  const timeline = [
    ...events.slice().reverse().map((e) => ({ title: e.text, sub: `${e.actor} · ${e.simulated ? "Pulse demo (simulated)" : "Current process"}`, when: whenLabel(e.at), tone: (e.simulated ? "accent" : "neutral") as Tone })),
  ];
  timeline.unshift({ title: o.channel === "online" ? `Order ${o.shopifyRef} placed on Shopify and paid` : `Wholesale order ${o.id} placed on account`, sub: c.name, when: dmy(o.placedAt), tone: "neutral" });
  return (
    <Drawer open onClose={onClose} width={680} eyebrow={`${o.channel === "online" ? `Shopify ${o.shopifyRef}` : "Wholesale"} · order`} status={<Badge tone={stageTone(o.stage)} dot>{STAGES[idx].label}</Badge>}
      title={<>{o.id} <span style={{ color: "var(--dim)", fontWeight: 400 }}>· {c.name}</span></>}
      footer={<>
        <Btn kind="primary" disabled={next.disabled} title={next.why} onClick={() => actions.advanceOrder(o.id)}>{next.label}</Btn>
        <Btn onClick={() => { onClose(); actions.nav("Orders", "all"); }}>Open in Orders</Btn>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "var(--faint)" }}>Demo state only. No external system is changed.</span>
      </>}>
      {issue && (
        <Callout tone={issue.kind === "credit_hold" || issue.kind === "tracking_exception" ? "bad" : "warn"} title={issue.title}>
          {issue.detail}
          <Row style={{ marginTop: 10 }} gap={8}>
            {issue.kind === "erp_missing" && <Btn kind="primary" size="sm" onClick={() => actions.importOrder(o.id)}>Simulate order import</Btn>}
            {issue.kind === "erp_missing" && <Btn size="sm" onClick={() => { onClose(); actions.nav("Orders", "imports"); }}>Review matching</Btn>}
            {issue.kind === "qc_pending" && <Btn kind="primary" size="sm" onClick={() => { onClose(); actions.nav("Fulfilment", "qc"); }}>Open QC checklist</Btn>}
            {issue.kind === "tracking_exception" && <Btn size="sm" onClick={() => actions.requestCarrierUpdate(o.id)}>Request carrier update</Btn>}
            {issue.kind === "tracking_exception" && <Btn kind="primary" size="sm" onClick={() => actions.open({ type: "conversation", id: "CV-01" })}>Open conversation</Btn>}
            {issue.kind === "credit_hold" && <Btn kind="primary" size="sm" onClick={() => { onClose(); actions.nav("Finance", "receivables"); }}>Review in Finance</Btn>}
            {issue.kind === "credit_hold" && <Btn size="sm" onClick={() => { onClose(); actions.nav("Agents", "approvals"); }}>Open approvals</Btn>}
          </Row>
        </Callout>
      )}
      <KV cols={4} rows={[["Value", eur(orderValue(o))], ["Payment", o.payment === "paid" ? "Paid (Shopify)" : "On account"], ["ERP", o.erp === "in_erp" ? "In ERP" : "Not in ERP"], ["Dispatch by", dayDmy(o.dispatchBy)]]} />
      <Section title="Customer">
        <div style={{ padding: "13px 15px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-md,13px)" }}>
          <Row gap={12}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>{c.type === "retail" ? "Retail customer" : c.type === "school" ? "School account" : "Reseller account"} · {c.country} · customer since {c.since}</div>
              <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 3 }}>{c.email} (synthetic)</div>
            </div>
            <Btn size="sm" onClick={() => actions.open({ type: "customer", id: c.id })}>View customer</Btn>
          </Row>
        </div>
      </Section>
      <Section title="Line items">
        {o.lines.map((l) => {
          const p = PRODUCT_BY_SKU[l.sku];
          return (
            <div key={l.sku} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <Thumb src={p.image} size={46} label={p.short} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <RecLink r={{ type: "product", id: p.sku }} style={{ fontSize: 13.5 }}>{p.name}</RecLink>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{p.sku} · {p.category} · pick location {p.location}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12.5 }}>
                <div>{l.qty} × {eur(l.unitPrice)}</div>
                <div style={{ color: "var(--ink)", fontWeight: 600, marginTop: 2 }}>{eur(l.qty * l.unitPrice)}</div>
              </div>
            </div>
          );
        })}
      </Section>
      <Section title="Payment and ERP matching">
        <KV rows={[
          ["Payment", o.payment === "paid" ? "Paid at Shopify checkout (illustrative)" : `On account, ${c.terms ?? "terms not set"}`],
          ["Invoice", inv ? <RecLink r={{ type: "invoice", id: inv.id }}>{inv.id} · {inv.status === "paid" ? "paid" : "outstanding"}</RecLink> : "None yet (not in ERP)"],
          ["Shopify reference", o.shopifyRef ?? "Wholesale order (ERP native)"],
          ["ERP match", o.erp === "in_erp" ? (o.note?.includes("simulated") ? "Matched via simulated Pulse import" : o.channel === "online" ? "Keyed into the ERP by hand (current process)" : "Native ERP order") : "No ERP order found. Needs manual entry or simulated import"],
        ]} />
      </Section>
      <Section title="Stock allocation">
        {o.lines.map((l) => {
          const r = stockOf(s, l.sku);
          const shipped = idx >= stageIndex("dispatched");
          return (
            <div key={l.sku} style={{ padding: "11px 13px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)", fontSize: 12.5 }}>
              <div style={{ display: "flex", gap: 10 }}><span style={{ flex: 1 }}>{PRODUCT_BY_SKU[l.sku].short}</span><Badge tone={shipped ? "neutral" : "accent"}>{shipped ? "Shipped, no longer reserved" : `${l.qty} reserved for this order`}</Badge></div>
              <div style={{ marginTop: 8, color: "var(--dim)" }}>On hand {r.onHand} · allocated {r.allocated} · available {r.available} · reorder point {r.reorderPoint}</div>
            </div>
          );
        })}
      </Section>
      <Section title="Fulfilment progress">
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${STAGES.length},1fr)`, gap: 4 }}>
          {STAGES.map((st, i) => (
            <div key={st.id} title={st.label}>
              <div style={{ height: 5, borderRadius: 3, background: i <= idx ? "var(--accent)" : "var(--track)", opacity: i === idx ? 1 : i < idx ? 0.55 : 1 }} />
              <div style={{ fontSize: 10, marginTop: 6, color: i === idx ? "var(--accent)" : "var(--faint)", fontWeight: i === idx ? 600 : 400 }}>{st.short}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <KV rows={[
            ["Status", orderStatusText(s, o)],
            ["Quality check", qc === "n/a" ? "Not reached" : qc === "passed" ? "Passed" : qc === "pending" ? "Pending" : qc === "in_progress" ? "In progress" : "Ready to submit"],
            ["Assigned", staffName(o.assignee)],
            ["Tracking", o.tracking ? `${o.tracking.ref} · ${o.tracking.carrier}` : "Not dispatched"],
          ]} />
          {o.tracking && <div style={{ marginTop: 8, fontSize: 12, color: o.tracking.status === "no_update" ? "var(--bad)" : "var(--dim)" }}>Last update: {o.tracking.lastUpdate}</div>}
        </div>
      </Section>
      <Section title="Order timeline"><Timeline items={timeline} /></Section>
      {convs.length > 0 && (
        <Section title="Customer communication">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {convs.map((cv) => <Rel key={cv.id} r={{ type: "conversation", id: cv.id }} label={cv.subject} sub={cv.status === "reply_approved" ? "Reply approved (demo)" : cv.status === "draft_ready" ? "Draft ready" : "Open"} />)}
          </div>
        </Section>
      )}
      {(runs.length > 0 || aprs.length > 0) && (
        <Section title="Agent actions">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {aprs.map((a) => (
              <div key={a.id} style={{ padding: "11px 13px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)" }}>
                <Row gap={8}><Badge tone={a.status === "pending" ? "warn" : a.status === "approved" ? "ok" : "neutral"}>{a.status === "pending" ? "Needs approval" : a.status}</Badge><span style={{ fontSize: 13 }}>{a.title}</span></Row>
                {a.status === "pending" && <Row style={{ marginTop: 10 }}><Btn kind="primary" size="sm" onClick={() => actions.approve(a.id)}>Approve (demo)</Btn><Btn size="sm" onClick={() => actions.reject(a.id)}>Reject</Btn></Row>}
              </div>
            ))}
            {runs.slice(0, 3).map((r) => <div key={r.id} style={{ fontSize: 12.5, color: "var(--dim)", lineHeight: 1.5 }}><b style={{ color: "var(--ink)", fontWeight: 500 }}>{AGENT_BY_ID[r.agentId].name}</b> · {whenLabel(r.at)}: {r.summary}</div>)}
          </div>
        </Section>
      )}
      <Section title="Related records">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {inv && <Rel r={{ type: "invoice", id: inv.id }} label={`Invoice ${inv.id}`} sub={eur(inv.amount)} />}
          {o.lines.map((l) => <Rel key={l.sku} r={{ type: "product", id: l.sku }} label={PRODUCT_BY_SKU[l.sku].name} sub="Product" />)}
          {tasks.map((t) => <Rel key={t.id} r={{ type: "task", id: t.id }} label={t.title} sub={t.status === "done" ? "Done" : "Task"} />)}
        </div>
      </Section>
    </Drawer>
  );
}

/* ── Product ───────────────────────────────────────────────────────────── */
function ProductDrawer({ s, sku, onClose }: { s: MuzState; sku: string; onClose: () => void }) {
  const p = PRODUCT_BY_SKU[sku];
  if (!p) return <Drawer open onClose={onClose} title="Product not found">{null}</Drawer>;
  const r = stockOf(s, sku);
  const holding = s.orders.filter((o) => stageIndex(o.stage) < stageIndex("dispatched") && o.lines.some((l) => l.sku === sku));
  const related = s.orders.filter((o) => o.lines.some((l) => l.sku === sku));
  const pos = s.pos.filter((x) => x.sku === sku);
  const events = s.stockEvents.filter((e) => e.sku === sku).slice(0, 6);
  const sup = SUPPLIERS.find((x) => x.id === p.supplierId)!;
  return (
    <Drawer open onClose={onClose} width={620} eyebrow={`${p.sku} · ${p.category}`} status={<Badge tone={r.out ? "bad" : r.low ? "warn" : "ok"} dot>{r.out ? "No available stock" : r.low ? "Below reorder point" : "Healthy"}</Badge>} title={p.name}
      footer={<>
        <Btn kind="primary" disabled={r.available >= p.reorderPoint && !pos.length} title="Only needed when stock is below the reorder point" onClick={() => actions.createReorderProposal(sku)}>Create reorder proposal</Btn>
        <Btn onClick={() => { onClose(); actions.nav("Inventory", "replenishment"); }}>Open replenishment</Btn>
      </>}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <Thumb src={p.image} size={110} label={p.short} />
        <div style={{ flex: 1 }}>
          <KV cols={2} rows={[["Website price", eur(p.price)], ["Demo cost estimate", eur(p.cost)], ["Pick location", p.location], ["Supplier (mock)", sup.name]]} />
        </div>
      </div>
      <Section title="Stock (illustrative, ERP stays the ledger)">
        <KV cols={4} rows={[["On hand", String(r.onHand)], ["Allocated", String(r.allocated)], ["Available", String(r.available)], ["Reorder point", String(p.reorderPoint)]]} />
        <div style={{ marginTop: 12 }}><Progress value={r.onHand ? r.allocated / r.onHand : 0} tone={r.out ? "bad" : r.low ? "warn" : "accent"} /><div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 7 }}>{r.allocated} of {r.onHand} units on hand are reserved for open orders. Shipped orders are not counted.</div></div>
        {s.channelStock[sku] && <div style={{ marginTop: 10 }}><Callout tone="info" title="Shopify channel update">Proposed out-of-stock flag {s.channelStock[sku] === "approved" ? "approved locally (demo, Shopify not called)" : "awaiting approval"}.</Callout></div>}
      </Section>
      <Section title={`Allocations (${holding.length})`}>
        {holding.length ? <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{holding.map((o) => <Rel key={o.id} r={{ type: "order", id: o.id }} label={`${o.id} · ${customerOf(o).name}`} sub={`${o.lines.find((l) => l.sku === sku)!.qty} reserved · ${orderStatusText(s, o)}`} />)}</div> : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No open orders hold this product.</div>}
      </Section>
      {pos.length > 0 && (
        <Section title="Purchase orders">
          {pos.map((po) => (
            <div key={po.id} style={{ padding: "11px 13px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)", marginBottom: 8 }}>
              <Row><RecLink r={{ type: "po", id: po.id }}>{po.id}</RecLink><span style={{ fontSize: 12.5 }}>{po.qty} units · {eur(po.qty * po.unitCost)} est.</span><Badge tone={po.status === "received" ? "ok" : po.status === "approved" ? "info" : "warn"}>{po.status}</Badge></Row>
            </div>
          ))}
        </Section>
      )}
      <Section title="All orders with this product">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{related.map((o) => <Rel key={o.id} r={{ type: "order", id: o.id }} label={`${o.id} · ${customerOf(o).name}`} sub={orderStatusText(s, o)} />)}{!related.length && <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No current orders.</div>}</div>
      </Section>
      <Section title="Recent stock events">
        <Timeline items={events.map((e) => ({ title: `${e.qty > 0 ? "+" : ""}${e.qty} · ${e.kind}`, sub: `${e.ref} · ${e.note}`, when: whenLabel(e.at), tone: e.simulated ? "accent" : "neutral" }))} />
      </Section>
    </Drawer>
  );
}

/* ── Customer ──────────────────────────────────────────────────────────── */
function CustomerDrawer({ s, id, onClose }: { s: MuzState; id: string; onClose: () => void }) {
  const c = CUSTOMER_BY_ID[id];
  if (!c) return <Drawer open onClose={onClose} title="Customer not found">{null}</Drawer>;
  const orders = ordersOfCustomer(s, id);
  const hist = historyOfCustomer(id);
  const invs = s.invoices.filter((i) => i.customerId === id);
  const convs = s.conversations.filter((x) => x.customerId === id);
  const hold = orders.some((o) => o.creditHold);
  const bal = balanceOf(s, id);
  return (
    <Drawer open onClose={onClose} width={620} eyebrow={c.type === "retail" ? "Retail customer" : c.type === "school" ? "School account" : "Reseller account"} status={hold ? <Badge tone="bad" dot>Credit hold</Badge> : c.type !== "retail" && bal > 0 ? <Badge tone="warn" dot>Open balance</Badge> : <Badge tone="ok" dot>In good standing</Badge>} title={c.name}
      footer={<Btn onClick={() => { onClose(); actions.nav("Customers", c.type === "retail" ? "retail" : "b2b"); }}>Open in Customers</Btn>}>
      <KV cols={3} rows={[["Country", c.country], ["Customer since", c.since], ["Illustrative spend", eur(customerSpend(s, id))], ["Email (synthetic)", c.email], ...(c.type !== "retail" ? [["Account manager", staffName(c.accountManager || "")], ["Terms", `${c.terms} · limit ${eur(c.creditLimit || 0)}`]] as [string, string][] : [["Current orders", String(orders.length)], ["Open cases", String(convs.filter((x) => x.status !== "reply_approved").length)]] as [string, string][])]} />
      {c.type !== "retail" && (
        <Section title="Account balance">
          <Progress value={(c.creditLimit ? bal / c.creditLimit : 0)} tone={hold ? "bad" : bal > 0 ? "warn" : "ok"} />
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 7 }}>{eur(bal)} outstanding against a {eur(c.creditLimit || 0)} limit</div>
        </Section>
      )}
      <Section title={`Current orders (${orders.length})`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{orders.map((o) => <Rel key={o.id} r={{ type: "order", id: o.id }} label={`${o.id} · ${productLabel(o)}`} sub={`${eur(orderValue(o))} · ${orderStatusText(s, o)}`} />)}{!orders.length && <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No orders in flight.</div>}</div>
      </Section>
      {invs.length > 0 && (
        <Section title="Invoices">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{invs.map((i) => <Rel key={i.id} r={{ type: "invoice", id: i.id }} label={`${i.id} · ${eur(i.amount)}`} sub={i.status === "paid" ? "Paid" : daysOverdue(i) > 0 ? `${daysOverdue(i)} days overdue` : `Due ${dmy(i.due)}`} />)}</div>
        </Section>
      )}
      <Section title={`Order history (${hist.length})`}>
        {hist.length ? hist.map((h) => <div key={h.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }}><span style={{ color: "var(--faint)", width: 74 }}>{dmy(h.date)}</span><span style={{ flex: 1 }}>{h.item}</span><span style={{ color: "var(--dim)" }}>{eur(h.value)}</span></div>) : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No earlier orders on file.</div>}
      </Section>
      {convs.length > 0 && (
        <Section title="Support and enquiries">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{convs.map((cv) => <Rel key={cv.id} r={{ type: "conversation", id: cv.id }} label={cv.subject} sub={cv.status === "reply_approved" ? "Reply approved (demo)" : cv.status === "draft_ready" ? "Draft ready" : "Open"} />)}</div>
        </Section>
      )}
    </Drawer>
  );
}

/* ── Invoice ───────────────────────────────────────────────────────────── */
function InvoiceDrawer({ s, id, onClose }: { s: MuzState; id: string; onClose: () => void }) {
  const inv = s.invoices.find((x) => x.id === id) as Invoice | undefined;
  const [show, setShow] = useState(false);
  if (!inv) return <Drawer open onClose={onClose} title="Invoice not found">{null}</Drawer>;
  const c = CUSTOMER_BY_ID[inv.customerId];
  const od = daysOverdue(inv);
  const wholesale = c.type !== "retail";
  const o = inv.orderId ? s.orders.find((x) => x.id === inv.orderId) : undefined;
  return (
    <Drawer open onClose={onClose} width={600} eyebrow="ERP invoice (illustrative)" status={<Badge tone={inv.status === "paid" ? "ok" : od > 0 ? "bad" : "info"} dot>{inv.status === "paid" ? "Paid" : od > 0 ? `${od} days overdue` : "Outstanding, not due"}</Badge>} title={`${inv.id} · ${eur(inv.amount)}`}
      footer={wholesale && inv.status === "outstanding" ? <>
        {inv.reminder === "none" && <Btn kind="primary" onClick={() => actions.prepareReminder(inv.id)}>Prepare reminder</Btn>}
        {inv.reminder === "drafted" && <Btn kind="primary" onClick={() => actions.approveReminder(inv.id)}>Approve reminder (demo, not sent)</Btn>}
        {inv.reminder === "approved" && <Badge tone="ok" dot>Reminder approved locally. No email was sent.</Badge>}
        <Btn onClick={() => setShow(!show)}>{show ? "Hide preview" : "Preview reminder"}</Btn>
      </> : <Btn onClick={() => { onClose(); actions.nav("Finance", "invoices"); }}>Open in Finance</Btn>}>
      <KV cols={3} rows={[["Customer", <RecLink r={{ type: "customer", id: c.id }}>{c.name}</RecLink>], ["Order", inv.orderId ? <RecLink r={{ type: "order", id: inv.orderId }}>{inv.orderId}</RecLink> : "None"], ["Terms", c.terms ?? "Paid at checkout"], ["Issued", dmyFull(inv.issued)], ["Due", dmyFull(inv.due)], ["Reminder", inv.reminder === "none" ? "None" : inv.reminder === "drafted" ? "Drafted, awaiting approval" : "Approved (demo, not sent)"]]} />
      {inv.note && <div style={{ fontSize: 12.5, color: "var(--dim)" }}>{inv.note}</div>}
      {wholesale && inv.status === "outstanding" && o?.creditHold && <Callout tone="bad" title="Linked order is on credit hold">{o.id} stays allocated and unshipped while this invoice is overdue. Marking it paid is a finance action and is never automatic.</Callout>}
      {(show || inv.reminder === "drafted") && (
        <Section title="Reminder draft (not sent)"><pre style={{ margin: 0, padding: "14px 16px", whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 12.5, lineHeight: 1.6, color: "var(--body)", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-md,13px)" }}>{reminderText(s, inv)}</pre></Section>
      )}
      <Callout tone="neutral" title="Not additional sales">Invoices are shown for receivables visibility. They are the same value as the linked order and are never counted twice.</Callout>
    </Drawer>
  );
}

/* ── Conversation ──────────────────────────────────────────────────────── */
function ConversationDrawer({ s, id, onClose }: { s: MuzState; id: string; onClose: () => void }) {
  const c = s.conversations.find((x) => x.id === id);
  if (!c) return <Drawer open onClose={onClose} title="Conversation not found">{null}</Drawer>;
  const cust = CUSTOMER_BY_ID[c.customerId];
  const o = c.orderId ? s.orders.find((x) => x.id === c.orderId) : undefined;
  const statusTone: Tone = c.status === "reply_approved" ? "ok" : c.status === "draft_ready" ? "accent" : "warn";
  return (
    <Drawer open onClose={onClose} width={620} eyebrow={`${c.channel} · ${c.kind.replace("_", " ")}`} status={<Badge tone={statusTone} dot>{c.status === "reply_approved" ? "Reply approved (demo)" : c.status === "draft_ready" ? "Draft ready" : "Open"}</Badge>} title={c.subject}
      footer={<>
        {c.status !== "reply_approved" && !c.draft && <Btn kind="primary" onClick={() => actions.generateDraft(c.id)}>Generate AI draft</Btn>}
        {c.status !== "reply_approved" && c.draft && <Btn kind="primary" onClick={() => actions.approveReply(c.id)}>Approve reply (demo, not sent)</Btn>}
        <Btn onClick={() => { onClose(); actions.nav("Customers", "conversations"); }}>Open inbox</Btn>
      </>}>
      <KV cols={3} rows={[["Customer", <RecLink r={{ type: "customer", id: cust.id }}>{cust.name}</RecLink>], ["Order", o ? <RecLink r={{ type: "order", id: o.id }}>{o.id} · {orderStatusText(s, o)}</RecLink> : "No linked order"], ["Received", whenLabel(c.receivedAt)]]} />
      <Section title="Thread">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {c.messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.from === "customer" ? "flex-start" : "flex-end", maxWidth: "88%", padding: "11px 14px", borderRadius: "var(--r-md,14px)", background: m.from === "customer" ? "var(--chip)" : "var(--accent-faint)", border: `1px solid ${m.from === "customer" ? "var(--chip-border)" : "var(--accent-line)"}` }}>
              <div style={{ fontSize: 11, color: "var(--faint)", marginBottom: 5 }}>{m.who} · {m.at}</div>
              <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{m.text}</div>
            </div>
          ))}
        </div>
      </Section>
      {c.status !== "reply_approved" && (
        <Section title="AI draft (human approval required, nothing is sent)" right={c.draft ? <Btn size="sm" onClick={() => actions.setDraft(c.id, draftFor(s, c))}>Regenerate</Btn> : undefined}>
          {c.draft ? <textarea value={c.draft} onChange={(e) => actions.setDraft(c.id, e.target.value)} rows={10} style={{ width: "100%", padding: "13px 15px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-md,13px)", fontSize: 13, lineHeight: 1.6, color: "var(--ink)" }} /> : <div style={{ fontSize: 12.5, color: "var(--dim)" }}>Generate a draft and Pulse will use the linked order and tracking data. A person reviews it before anything could go out.</div>}
        </Section>
      )}
    </Drawer>
  );
}

/* ── PO ────────────────────────────────────────────────────────────────── */
function PoDrawer({ s, id, onClose }: { s: MuzState; id: string; onClose: () => void }) {
  const po = s.pos.find((x) => x.id === id);
  if (!po) return <Drawer open onClose={onClose} title="Purchase order not found">{null}</Drawer>;
  const p = PRODUCT_BY_SKU[po.sku];
  const sup = SUPPLIERS.find((x) => x.id === po.supplierId)!;
  const steps = ["proposed", "approved", "received"];
  const idx = steps.indexOf(po.status);
  return (
    <Drawer open onClose={onClose} width={560} eyebrow="Purchase order (draft, demo)" status={<Badge tone={po.status === "received" ? "ok" : po.status === "approved" ? "info" : "warn"} dot>{po.status}</Badge>} title={`${po.id} · ${po.qty} × ${p.short}`}
      footer={<>
        {po.status === "proposed" && <Btn kind="primary" onClick={() => actions.approvePO(po.id)}>Approve purchase order</Btn>}
        {po.status === "approved" && <Btn kind="primary" onClick={() => actions.receiveGoods(po.id)}>Record simulated goods receipt</Btn>}
        <Btn onClick={() => actions.open({ type: "product", id: po.sku })}>View product</Btn>
      </>}>
      <KV cols={2} rows={[["Supplier (mock)", <RecLink r={{ type: "supplier", id: sup.id }}>{sup.name}</RecLink>], ["Estimated cost", eur(po.qty * po.unitCost)], ["Lead time", `${sup.leadTimeDays} days`], ["Raised by", po.raisedBy], ["Reason", po.reason], ["Created", whenLabel(po.createdAt)]]} />
      <Section title="Progress">
        <Timeline items={[{ title: "Drafted", done: idx >= 0 }, { title: "Approved by management", sub: "Procurement state only", done: idx >= 1 }, { title: "Goods received", sub: "Stock on hand changes only now (simulated)", done: idx >= 2 }]} />
      </Section>
      <Callout tone="info">Approving this order does not change stock. On hand for {p.short} is {s.onHand[po.sku]} until a goods receipt is recorded.</Callout>
    </Drawer>
  );
}

/* ── Task ──────────────────────────────────────────────────────────────── */
function TaskDrawer({ s, id, onClose }: { s: MuzState; id: string; onClose: () => void }) {
  const t = s.tasks.find((x) => x.id === id);
  if (!t) return <Drawer open onClose={onClose} title="Task not found">{null}</Drawer>;
  return (
    <Drawer open onClose={onClose} width={520} eyebrow={`${t.dept} task`} status={<Badge tone={t.status === "done" ? "ok" : t.priority === "High" ? "bad" : "neutral"} dot>{t.status === "done" ? "Done" : t.priority}</Badge>} title={t.title}
      footer={<><Btn kind="primary" onClick={() => actions.toggleTask(t.id)}>{t.status === "done" ? "Reopen" : "Mark done"}</Btn>{t.status === "open" && <Btn onClick={() => actions.startTask(t.id)}>Start</Btn>}</>}>
      <KV rows={[["Owner", staffName(t.owner)], ["Due", dayDmy(t.due)], ["Department", t.dept], ["Status", t.status.replace("_", " ")]]} />
      <Section title="Related record"><Rel r={t.ref} label={`${t.ref.type} ${t.ref.id}`} sub="Open" /></Section>
    </Drawer>
  );
}

/* ── Agent ─────────────────────────────────────────────────────────────── */
function AgentDrawer({ s, id, onClose }: { s: MuzState; id: string; onClose: () => void }) {
  const a = AGENTS.find((x) => x.id === id);
  if (!a) return <Drawer open onClose={onClose} title="Agent not found">{null}</Drawer>;
  const runs = s.runs.filter((r) => r.agentId === id).slice(0, 5);
  const aprs = s.approvals.filter((x) => x.agentId === id && x.status === "pending");
  return (
    <Drawer open onClose={onClose} width={560} eyebrow="Pulse agent (simulated)" title={a.name} status={<Badge tone={aprs.length ? "warn" : "ok"} dot>{aprs.length ? `${aprs.length} awaiting approval` : "Idle"}</Badge>}
      footer={<><Btn kind="primary" onClick={() => actions.runAgent(a.id)}>Run now (simulated)</Btn><Btn onClick={() => { onClose(); actions.nav("Agents", "overview"); }}>Open Agents</Btn></>}>
      <div style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--body)" }}>{a.blurb}</div>
      <Section title="Data this agent would need">{a.data.map((d) => <div key={d} style={{ fontSize: 12.5, color: "var(--dim)", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>{d}</div>)}</Section>
      {aprs.length > 0 && <Section title="Awaiting approval">{aprs.map((x) => <div key={x.id} style={{ padding: "11px 13px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)", marginBottom: 8 }}><div style={{ fontSize: 13 }}>{x.title}</div><Row style={{ marginTop: 9 }}><Btn kind="primary" size="sm" onClick={() => actions.approve(x.id)}>Approve</Btn><Btn size="sm" onClick={() => actions.reject(x.id)}>Reject</Btn></Row></div>)}</Section>}
      <Section title="Recent runs"><Timeline items={runs.map((r) => ({ title: r.summary, sub: r.steps.join(" > "), when: whenLabel(r.at), tone: r.outcome === "flagged" ? "warn" : "accent" }))} /></Section>
    </Drawer>
  );
}

function SupplierDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const sp = SUPPLIERS.find((x) => x.id === id);
  if (!sp) return null;
  return (
    <Drawer open onClose={onClose} width={480} eyebrow="Mock supplier" title={sp.name}>
      <KV rows={[["Speciality", sp.speciality], ["Lead time", `${sp.leadTimeDays} days`]]} />
      <Callout tone="neutral">Supplier records are illustrative placeholders. No real supplier is named or contacted.</Callout>
    </Drawer>
  );
}
function StaffDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const st = STAFF.find((x) => x.id === id);
  if (!st) return null;
  return (
    <Drawer open onClose={onClose} width={480} eyebrow={st.dept} title={st.name}>
      <KV rows={[["Role", st.role], ["Email", st.email]]} />
      <Callout tone="neutral">{st.demo ? "Fictional demo profile. The email address is synthetic and can never receive or send mail." : "Participant in the sales call. No job title is asserted in this demo."}</Callout>
    </Drawer>
  );
}


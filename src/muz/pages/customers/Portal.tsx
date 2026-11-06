import { useState } from "react";
import { actions, useMuz } from "../../store";
import type { MuzState } from "../../store";
import { CUSTOMER_BY_ID, PRODUCT_BY_SKU } from "../../dataset";
import { daysOverdue, historyOfCustomer, orderStatusText, orderValue, ordersOfCustomer, stageIndex } from "../../selectors";
import { dmy, dueLabel, eur, initials } from "../../format";
import { Badge, Callout, Chips, DemoTag, Empty, Page, PageHead, Row, Timeline } from "../../ui";
import type { Order, Tone } from "../../types";
import { CONV_STATUS, mono } from "./shared";

const PEOPLE = ["c-wilson", "c-byrne", "c-kelly", "c-brigid", "c-galway"];
type Sub = "orders" | "tracking" | "history" | "support" | "invoices";
type Dev = "desktop" | "phone";

export default function Portal() {
  const s = useMuz();
  const [id, setId] = useState("c-wilson");
  const [sub, setSub] = useState<Sub>("orders");
  const [dev, setDev] = useState<Dev>("desktop");
  const c = CUSTOMER_BY_ID[id];
  const first = c.name.split(" ")[0];
  const wholesale = c.type !== "retail";

  return (
    <Page>
      <PageHead
        eyebrow="Customers"
        title="Customer portal preview"
        sub="What a customer could see about their orders, built from the same records staff use. Preview only, not a public portal."
        right={<><Badge tone="accent">Preview only, not a public portal</Badge><DemoTag>Fictional customers</DemoTag></>}
      />

      <Row gap={14} style={{ justifyContent: "space-between" }}>
        <Chips value={id} onChange={(v) => { setId(v); setSub("orders"); }} options={PEOPLE.map((p) => ({ id: p, label: CUSTOMER_BY_ID[p].name, count: ordersOfCustomer(s, p).filter((o) => o.stage !== "delivered").length }))} />
        <Chips<Dev> value={dev} onChange={setDev} options={[{ id: "desktop", label: "Desktop" }, { id: "phone", label: "Phone" }]} />
      </Row>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: dev === "phone" ? 390 : "100%", maxWidth: "100%", transition: "width .3s var(--ease)", background: "var(--overlay)", border: "1px solid var(--border-strong)", borderRadius: dev === "phone" ? 28 : "var(--card-r,18px)", overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,.35)" }}>
          {/* window chrome */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: "1px solid var(--border)", background: "var(--surface-faint)" }}>
            <span style={{ display: "inline-flex", gap: 6 }}>
              {[0, 1, 2].map((i) => <span key={i} style={{ width: 9, height: 9, borderRadius: 99, background: "var(--track)" }} />)}
            </span>
            <span style={{ flex: 1, textAlign: "center", ...mono, fontSize: 10.5, color: "var(--faint)", letterSpacing: ".06em" }}>MY ORDERS (PREVIEW, NOT LIVE)</span>
          </div>

          <div style={{ padding: dev === "phone" ? "18px 16px 22px" : "26px 30px 32px", display: "flex", flexDirection: "column", gap: 18, minHeight: 460 }}>
            <Row gap={12} style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-.5px" }}>{wholesale ? c.name : `Hello ${first}`}</div>
                <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 4 }}>{wholesale ? `Trade account, ${c.terms}` : `${c.country}, customer since ${c.since}`}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: "var(--accent-soft)", border: "1px solid var(--accent-line)", color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600 }}>{initials(c.name)}</div>
            </Row>

            <Chips<Sub>
              value={sub}
              onChange={setSub}
              options={[{ id: "orders", label: "Orders" }, { id: "tracking", label: "Tracking" }, { id: "history", label: "History" }, { id: "support", label: "Support" }, { id: "invoices", label: "Invoices" }]}
            />

            {sub === "orders" && <Orders s={s} id={id} />}
            {sub === "tracking" && <Tracking s={s} id={id} />}
            {sub === "history" && <History s={s} id={id} />}
            {sub === "support" && <Support s={s} id={id} />}
            {sub === "invoices" && <Invoices s={s} id={id} />}
          </div>
        </div>
      </div>
    </Page>
  );
}

const Block = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 16, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)" }}>{children}</div>
);

function statusTone(s: MuzState, o: Order): Tone {
  if (o.creditHold) return "bad";
  if (o.tracking?.status === "no_update") return "warn";
  if (o.stage === "dispatched") return "info";
  return "accent";
}

function Orders({ s, id }: { s: MuzState; id: string }) {
  const orders = ordersOfCustomer(s, id).filter((o) => o.stage !== "delivered");
  if (!orders.length) return <Empty>No orders in progress.</Empty>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {orders.map((o) => (
        <Block key={o.id}>
          <Row gap={10} style={{ justifyContent: "space-between" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Order {o.shopifyRef ?? o.id} <span style={{ ...mono, fontSize: 11, color: "var(--faint)", fontWeight: 400 }}>{o.id}</span></div>
            <Badge tone={statusTone(s, o)} dot>{orderStatusText(s, o)}</Badge>
          </Row>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>Placed {dmy(o.placedAt)}, delivering to {o.destination}</div>
          <div style={{ marginTop: 12 }}>
            {o.lines.map((l) => (
              <div key={l.sku} style={{ display: "flex", gap: 10, fontSize: 13, padding: "7px 0", borderTop: "1px solid var(--border)" }}>
                <span style={{ flex: 1 }}>{PRODUCT_BY_SKU[l.sku].name}</span>
                <span style={{ color: "var(--dim)" }}>×{l.qty}</span>
                <span style={{ ...mono, width: 90, textAlign: "right" }}>{eur(l.qty * l.unitPrice)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, paddingTop: 9, borderTop: "1px solid var(--border)" }}>
              <span>Total</span><span style={mono}>{eur(orderValue(o))}</span>
            </div>
          </div>
          {o.creditHold && <div style={{ marginTop: 10, fontSize: 12, color: "var(--dim)" }}>This order is with our accounts team before it can be prepared. They will be in touch.</div>}
        </Block>
      ))}
    </div>
  );
}

function trackingSteps(o: Order) {
  const i = stageIndex(o.stage);
  const prepared = i >= stageIndex("packed");
  const dispatched = i >= stageIndex("dispatched");
  const t = o.tracking?.status;
  const inTransitDone = dispatched && (t === "in_transit" || t === "delivered");
  const noUpdate = dispatched && t === "no_update";
  return [
    { title: "Order received", when: dmy(o.placedAt), done: true, tone: "ok" as Tone, sub: o.erp === "not_in_erp" ? "Being entered into our system" : undefined },
    { title: "Prepared and checked", done: prepared, tone: (prepared ? "ok" : o.creditHold ? "bad" : "accent") as Tone, sub: prepared ? "Inspected and packed" : o.creditHold ? "Waiting on our accounts team" : "In progress" },
    { title: "Dispatched", done: dispatched, tone: "ok" as Tone, sub: dispatched ? `${o.tracking?.carrier}, reference ${o.tracking?.ref}` : undefined, when: dispatched ? undefined : `Planned ${dmy(o.dispatchBy)}` },
    { title: noUpdate ? "No tracking update" : "In transit", done: inTransitDone || noUpdate, tone: (noUpdate ? "warn" : "ok") as Tone, sub: dispatched ? o.tracking?.lastUpdate : undefined },
    { title: "Delivered", done: t === "delivered", tone: "ok" as Tone },
  ];
}

function Tracking({ s, id }: { s: MuzState; id: string }) {
  const orders = ordersOfCustomer(s, id).filter((o) => o.stage !== "delivered");
  if (!orders.length) return <Empty>Nothing to track right now.</Empty>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {orders.map((o) => {
        const conv = s.conversations.find((c) => c.orderId === o.id);
        const gap = o.tracking?.status === "no_update";
        return (
          <Block key={o.id}>
            <Row gap={10} style={{ justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{o.shopifyRef ?? o.id}, {PRODUCT_BY_SKU[o.lines[0].sku].short}</div>
              <Badge tone={statusTone(s, o)} dot>{orderStatusText(s, o)}</Badge>
            </Row>
            <Timeline items={trackingSteps(o)} />
            {gap && (
              <Callout tone="warn" title="We are looking into your parcel">
                {o.tracking?.note ? `${o.tracking.note}. ` : ""}
                {conv?.status === "reply_approved"
                  ? "Our team has written to you with an update (approved in demo, not sent)."
                  : conv?.status === "draft_ready"
                  ? "An update is drafted and waiting for a member of our team to approve it. Nothing has been sent yet."
                  : "Our team has not replied yet. In Pulse, a draft can be generated from this tracking record."}
              </Callout>
            )}
            {gap && conv && (
              <Row gap={8} style={{ marginTop: 10 }}>
                <button className="mz-btn" onClick={() => { actions.setTab("Customers", "conversations"); actions.toast("Opened the Conversations tab. Select " + conv.id + " to draft the update.", "info"); }} style={{ border: 0, background: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer", padding: 0 }}>Open the support thread ({conv.id})</button>
              </Row>
            )}
          </Block>
        );
      })}
    </div>
  );
}

function History({ s, id }: { s: MuzState; id: string }) {
  const past = [
    ...ordersOfCustomer(s, id).filter((o) => o.stage === "delivered").map((o) => ({ id: o.id, date: o.placedAt, item: PRODUCT_BY_SKU[o.lines[0].sku].short, value: orderValue(o) })),
    ...historyOfCustomer(id),
  ].sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!past.length) return <Empty>No past orders yet.</Empty>;
  return (
    <Block>
      {past.map((h, i) => (
        <div key={h.id} style={{ display: "flex", gap: 12, fontSize: 13, padding: "10px 0", borderTop: i ? "1px solid var(--border)" : "none", alignItems: "baseline" }}>
          <span style={{ ...mono, fontSize: 11, color: "var(--faint)", width: 70 }}>{dmy(h.date)}</span>
          <span style={{ flex: 1 }}>{h.item}</span>
          <span style={{ ...mono, fontSize: 11, color: "var(--dim)" }}>{h.id}</span>
          <span style={{ ...mono, width: 84, textAlign: "right" }}>{eur(h.value)}</span>
        </div>
      ))}
    </Block>
  );
}

function Support({ s, id }: { s: MuzState; id: string }) {
  const convs = s.conversations.filter((c) => c.customerId === id);
  if (!convs.length) return <Empty>No support requests. Questions would appear here.</Empty>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {convs.map((c) => {
        const last = c.messages[c.messages.length - 1];
        const st = CONV_STATUS[c.status];
        return (
          <Block key={c.id}>
            <Row gap={10} style={{ justifyContent: "space-between" }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.subject}</div>
              <Badge tone={st.tone} dot>{c.status === "reply_approved" ? "Answered" : c.status === "draft_ready" ? "With our team" : "Received"}</Badge>
            </Row>
            <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 8, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{last.who}: {last.text.length > 260 ? last.text.slice(0, 260) + "..." : last.text}</div>
          </Block>
        );
      })}
    </div>
  );
}

function Invoices({ s, id }: { s: MuzState; id: string }) {
  const invs = s.invoices.filter((i) => i.customerId === id);
  if (!invs.length) return <Empty>No invoices on this account.</Empty>;
  return (
    <Block>
      {invs.map((i, n) => (
        <div key={i.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 0", borderTop: n ? "1px solid var(--border)" : "none", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{i.id}</div>
            <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 2 }}>{i.status === "paid" ? `Issued ${dmy(i.issued)}, paid` : `Issued ${dmy(i.issued)}, due ${dmy(i.due)} (${daysOverdue(i) ? `${daysOverdue(i)} days overdue` : dueLabel(i.due)})`}</div>
          </div>
          <span style={{ ...mono, fontSize: 12.5 }}>{eur(i.amount)}</span>
          <Badge tone={i.status === "paid" ? "ok" : daysOverdue(i) ? "bad" : "warn"} dot>{i.status === "paid" ? "Paid" : daysOverdue(i) ? "Overdue" : "Due"}</Badge>
        </div>
      ))}
    </Block>
  );
}


import { useState } from "react";
import { actions, useMuz } from "../../store";
import type { MuzState } from "../../store";
import { CUSTOMER_BY_ID, HISTORY } from "../../dataset";
import { orderStatusText, orderValue, productLabel } from "../../selectors";
import { dmy, eur, initials, whenLabel } from "../../format";
import { Avatar, Badge, Btn, Callout, Card, Grid, Kpi, Label, Page, PageHead, RecLink, Row } from "../../ui";
import type { Conversation } from "../../types";
import { CONV_STATUS, KIND_LABEL, mono } from "./shared";

export default function Conversations() {
  const s = useMuz();
  const [sel, setSel] = useState("CV-01");
  const conv = s.conversations.find((c) => c.id === sel) ?? s.conversations[0];
  const needing = s.conversations.filter((c) => c.status === "open").length;
  const drafted = s.conversations.filter((c) => c.status === "draft_ready").length;
  const done = s.conversations.filter((c) => c.status === "reply_approved").length;

  return (
    <Page>
      <PageHead
        eyebrow="Customers"
        title="Conversations"
        sub="Muzikkon's website already has live chat and order tracking. Pulse reads those threads and puts the order beside them, so a reply is drafted from real order data."
        right={<Badge tone="accent">Draft, human approval required, nothing is sent</Badge>}
      />

      <Grid min={190}>
        <Kpi label="Conversations" value={s.conversations.length} sub="live chat and email" />
        <Kpi label="Need a reply" value={needing} sub="no draft yet" tone={needing ? "warn" : "ok"} />
        <Kpi label="Drafts to approve" value={drafted} sub="waiting for a person" tone={drafted ? "accent" : "neutral"} />
        <Kpi label="Approved in demo" value={done} sub="logged, not sent" tone={done ? "ok" : "neutral"} />
      </Grid>

      <Grid cols="minmax(280px,360px) minmax(0,1fr)" style={{ alignItems: "start" }}>
        <Card flush pad={0}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {s.conversations.map((c) => {
              const cust = CUSTOMER_BY_ID[c.customerId];
              const st = CONV_STATUS[c.status];
              const on = c.id === conv.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSel(c.id)}
                  className="mz-row mz-click"
                  style={{ textAlign: "left", border: 0, borderBottom: "1px solid var(--border)", background: on ? "var(--accent-faint)" : "transparent", boxShadow: on ? "inset 2px 0 0 var(--accent)" : "none", padding: "14px 16px", cursor: "pointer", color: "inherit" }}
                >
                  <Row gap={8} style={{ justifyContent: "space-between", flexWrap: "nowrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cust.name}</span>
                    <span style={{ ...mono, fontSize: 10, color: "var(--faint)", whiteSpace: "nowrap" }}>{whenLabel(c.receivedAt)}</span>
                  </Row>
                  <div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 4, lineHeight: 1.4 }}>{c.subject}</div>
                  <Row gap={6} style={{ marginTop: 8 }}>
                    <Badge tone={st.tone} dot>{st.label}</Badge>
                    <Badge>{c.channel}</Badge>
                    {c.orderId && <Badge tone="info">{c.orderId}</Badge>}
                  </Row>
                </button>
              );
            })}
          </div>
        </Card>

        <Thread key={conv.id} s={s} c={conv} />
      </Grid>
    </Page>
  );
}

function Thread({ s, c }: { s: MuzState; c: Conversation }) {
  const cust = CUSTOMER_BY_ID[c.customerId];
  const order = c.orderId ? s.orders.find((o) => o.id === c.orderId) : undefined;
  const past = c.orderId && !order ? HISTORY.find((h) => h.id === c.orderId) : undefined;
  const st = CONV_STATUS[c.status];
  const approvals = s.approvals.filter((a) => (a.kind === "refund" || a.kind === "customer_reply") && a.ref.id === c.id);
  const refund = approvals.find((a) => a.kind === "refund");
  const approved = c.status === "reply_approved";
  const hasDraft = !!c.draft;

  return (
    <Card pad={0} flush>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "18px 20px 14px", borderBottom: "1px solid var(--border)" }}>
        <Avatar initials={initials(cust.name)} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 600, letterSpacing: "-.3px" }}>{c.subject}</div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4 }}>
            <RecLink r={{ type: "customer", id: c.customerId }}>{cust.name}</RecLink>, {cust.country}, received {whenLabel(c.receivedAt)}
          </div>
          <Row gap={6} style={{ marginTop: 9 }}>
            <Badge tone={st.tone} dot>{st.label}</Badge>
            <Badge tone="accent">{KIND_LABEL[c.kind]}</Badge>
            <Badge>{c.channel}</Badge>
          </Row>
        </div>
        <Btn size="sm" onClick={() => actions.open({ type: "conversation", id: c.id })}>Open record</Btn>
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {c.messages.map((m, i) => {
            const mine = m.from !== "customer";
            return (
              <div key={i} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "82%", padding: "11px 14px", borderRadius: "var(--r-md,14px)", background: mine ? "var(--accent-soft)" : "var(--surface-2)", border: `1px solid ${mine ? "var(--accent-line)" : "var(--border)"}` }}>
                  <Row gap={8} style={{ marginBottom: 5 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: mine ? "var(--accent)" : "var(--ink)" }}>{m.who}</span>
                    <span style={{ ...mono, fontSize: 10, color: "var(--faint)" }}>{m.at}</span>
                    {mine && <Badge tone="accent">Approved in demo, not sent</Badge>}
                  </Row>
                  <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "var(--body)" }}>{m.text}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* linked order */}
        {order && (
          <div style={{ padding: 15, background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-md,14px)" }}>
            <Row gap={8} style={{ justifyContent: "space-between" }}>
              <Label>Linked order</Label>
              <Badge tone={order.creditHold ? "bad" : order.tracking?.status === "no_update" ? "warn" : "info"} dot>{orderStatusText(s, order)}</Badge>
            </Row>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 10, fontSize: 12.5 }}>
              <Fact k="Order"><RecLink r={{ type: "order", id: order.id }}>{order.id}</RecLink></Fact>
              <Fact k="Items">{productLabel(order)}</Fact>
              <Fact k="Value">{eur(orderValue(order))}</Fact>
              <Fact k="Destination">{order.destination}</Fact>
              {order.tracking && <Fact k="Tracking">{order.tracking.ref}</Fact>}
              {order.tracking && <Fact k="Carrier">{order.tracking.carrier}</Fact>}
              {order.tracking && <Fact k="Last update">{order.tracking.lastUpdate}</Fact>}
            </div>
            {order.tracking?.note && <div style={{ fontSize: 12, color: "var(--warn)", marginTop: 10 }}>{order.tracking.note}</div>}
            <Row gap={8} style={{ marginTop: 12 }}>
              <Btn size="sm" onClick={() => actions.open({ type: "order", id: order.id })}>Open order</Btn>
              {order.tracking?.status === "no_update" && <Btn size="sm" kind="soft" onClick={() => actions.requestCarrierUpdate(order.id)}>Request carrier update (demo)</Btn>}
              {order.tracking?.status === "no_update" && <Btn size="sm" onClick={() => actions.resolveTracking(order.id)} title="Simulates a new carrier scan arriving">Simulate carrier scan</Btn>}
            </Row>
          </div>
        )}
        {past && (
          <div style={{ padding: 15, background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-md,14px)" }}>
            <Label>Linked order (delivered)</Label>
            <div style={{ fontSize: 12.5, marginTop: 9, lineHeight: 1.6 }}>
              <b style={{ color: "var(--ink)" }}>{past.id}</b>, {past.item}, delivered {dmy(past.date)}, {eur(past.value)}
            </div>
          </div>
        )}
        {!order && !past && <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No order linked yet. This is {c.kind === "wholesale" ? "a trade quote request" : "a pre-sale enquiry"}.</div>}

        {/* approvals */}
        {refund && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", padding: "12px 14px", borderRadius: "var(--r-md,14px)", background: refund.status === "pending" ? "var(--warn-soft)" : "var(--surface-2)", border: `1px solid ${refund.status === "pending" ? "rgba(240,136,62,.34)" : "var(--border)"}` }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{refund.id}: {refund.title}</div>
              <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>{refund.impact}</div>
            </div>
            {refund.status === "pending" ? (
              <Row gap={8}>
                <Btn size="sm" kind="primary" onClick={() => actions.approve(refund.id)}>Approve refund (demo)</Btn>
                <Btn size="sm" kind="danger" onClick={() => actions.reject(refund.id)}>Reject</Btn>
              </Row>
            ) : (
              <Badge tone={refund.status === "approved" ? "ok" : "neutral"}>{refund.status === "approved" ? "Refund approved, no payment issued" : "Refund rejected"}</Badge>
            )}
          </div>
        )}

        {/* AI draft */}
        <div style={{ padding: 16, borderRadius: "var(--r-md,14px)", background: "var(--surface-2)", border: "1px solid var(--accent-line)" }}>
          <Row gap={10} style={{ justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <Label style={{ color: "var(--accent)" }}>AI draft reply</Label>
              <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4 }}>Draft, human approval required, nothing is sent. Built from the order data above.</div>
            </div>
            {!approved && (
              <Btn size="sm" kind={hasDraft ? "ghost" : "primary"} onClick={() => actions.generateDraft(c.id)}>{hasDraft ? "Regenerate draft" : "Generate AI draft"}</Btn>
            )}
          </Row>

          {approved ? (
            <Callout tone="ok" title="Reply approved in demo">
              The reply is logged in the thread above. Nothing was emailed or posted to live chat.
            </Callout>
          ) : hasDraft ? (
            <>
              <textarea
                value={c.draft}
                onChange={(e) => actions.setDraft(c.id, e.target.value)}
                rows={11}
                style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "12px 14px", background: "var(--chip)", border: "1px solid var(--border)", borderRadius: "var(--r-sm,10px)", color: "var(--ink)", fontSize: 13, lineHeight: 1.6, fontFamily: "inherit", outline: 0 }}
              />
              <Row gap={8} style={{ marginTop: 10 }}>
                <Btn kind="primary" onClick={() => actions.approveReply(c.id)} title={refund && refund.status === "pending" ? "Approving also records the refund decision" : undefined}>Approve reply (demo)</Btn>
                <span style={{ fontSize: 12, color: "var(--dim)" }}>Edit the text first if you like. Approving only logs it.</span>
              </Row>
            </>
          ) : (
            <div style={{ padding: "22px 16px", textAlign: "center", fontSize: 12.5, color: "var(--dim)", border: "1px dashed var(--border-strong)", borderRadius: "var(--r-sm,10px)" }}>
              No draft yet. Generate one and Pulse will write it from {order ? `${order.id} and its tracking` : "the product and stock data"}.
            </div>
          )}
          {!approved && !hasDraft && (
            <Row style={{ marginTop: 10 }}>
              <Btn disabled title="Generate a draft first">Approve reply (demo)</Btn>
            </Row>
          )}
        </div>
      </div>
    </Card>
  );
}

function Fact({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ ...mono, fontSize: 8.5, letterSpacing: ".12em", color: "var(--faint)" }}>{k.toUpperCase()}</div>
      <div style={{ marginTop: 4, color: "var(--ink)", lineHeight: 1.4, overflowWrap: "anywhere" }}>{children}</div>
    </div>
  );
}


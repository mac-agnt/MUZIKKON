import { CUSTOMER_BY_ID } from "../../dataset";
import { whenLabel } from "../../format";
import { actions, useMuz } from "../../store";
import type { Conversation, Tone } from "../../types";
import { Badge, Btn, Callout, Card, DemoTag, Donut, Empty, Grid, Kpi, RecLink } from "../../ui";
import { ListItem, mono } from "../common";

const KIND: Record<Conversation["kind"], string> = {
  new_enquiry: "New enquiry",
  tracking: "Tracking",
  delivery_issue: "Delivery issue",
  product_advice: "Product advice",
  wholesale: "Wholesale quote",
};
const STATUS: Record<Conversation["status"], { label: string; tone: Tone }> = {
  open: { label: "Open", tone: "warn" },
  draft_ready: { label: "Draft ready", tone: "accent" },
  reply_approved: { label: "Reply approved", tone: "ok" },
  waiting: { label: "Waiting on customer", tone: "neutral" },
};

/* Illustrative response-time table (demo figures, not measured). */
const RESPONSE = [
  { channel: "Website live chat", median: "6 min", slowest: "38 min", target: "under 15 min" },
  { channel: "Email", median: "3 h 10 min", slowest: "1 day 2 h", target: "under 4 h" },
];

export default function Cx() {
  const s = useMuz();
  const convs = s.conversations;
  const open = convs.filter((c) => c.status === "open" || c.status === "draft_ready");
  const drafts = convs.filter((c) => c.status === "draft_ready");
  const shipping = convs.filter((c) => c.kind === "tracking" || c.kind === "delivery_issue");
  const awaitingReply = s.approvals.filter((a) => (a.kind === "customer_reply" || a.kind === "refund") && a.status === "pending").length;
  const kinds = (Object.keys(KIND) as Conversation["kind"][]).map((k) => ({ label: KIND[k], value: convs.filter((c) => c.kind === k).length })).filter((x) => x.value > 0);
  const who = (c: Conversation) => CUSTOMER_BY_ID[c.customerId]?.name ?? c.customerId;

  return (
    <>
      <Grid min={190}>
        <Kpi label="Open enquiries" value={open.length} tone={open.length ? "warn" : "ok"} sub={`${convs.length} conversations in total`} onClick={() => actions.nav("Customers", "conversations")} />
        <Kpi label="Pending agent drafts" value={drafts.length} tone={drafts.length ? "accent" : undefined} sub="Waiting for a person to review" onClick={() => actions.nav("Customers", "conversations")} />
        <Kpi label="Shipping-related" value={shipping.length} sub="Tracking and delivery issues" onClick={() => actions.nav("Customers", "conversations")} />
        <Kpi label="Replies awaiting approval" value={awaitingReply} tone={awaitingReply ? "accent" : "ok"} sub="Nothing is sent without a decision" onClick={() => actions.nav("Agents", "approvals")} />
      </Grid>

      <Grid min={380}>
        <Card title="Issue categories" hint="Conversations by type." right={<Btn size="sm" onClick={() => actions.nav("Customers", "conversations")}>Conversations</Btn>}>
          <Donut size={150} slices={kinds} center={<div><div style={{ fontSize: 20, fontWeight: 600, color: "var(--ink)" }}>{convs.length}</div><div style={{ fontSize: 10.5 }}>conversations</div></div>} />
        </Card>
        <Card title="First-response times" hint="Illustrative figures. Muzikkon's chat and email response times are not measured in this demo." right={<DemoTag />}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1.2fr", gap: 8, ...mono, fontSize: 9.5, letterSpacing: ".12em", color: "var(--faint)", paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
            <span>CHANNEL</span><span>MEDIAN</span><span>SLOWEST</span><span>TARGET</span>
          </div>
          {RESPONSE.map((r) => (
            <div key={r.channel} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1.2fr", gap: 8, padding: "12px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }}>
              <span style={{ color: "var(--ink)", fontWeight: 500 }}>{r.channel}</span><span>{r.median}</span><span>{r.slowest}</span><span style={{ color: "var(--dim)" }}>{r.target}</span>
            </div>
          ))}
          <div style={{ fontSize: 11.5, color: "var(--faint)", paddingTop: 10, lineHeight: 1.5 }}>With drafts prepared by Customer Service, the first reply can wait only for a quick review.</div>
        </Card>
      </Grid>

      <Grid min={380}>
        <Card title="Shipping-related enquiries" hint="Tracking questions and delivery issues, linked to their orders.">
          {shipping.length === 0 ? <Empty>No shipping enquiries.</Empty> : shipping.map((c) => {
            const st = STATUS[c.status];
            return (
              <ListItem key={c.id} onClick={() => actions.open({ type: "conversation", id: c.id })} right={<Badge tone={st.tone} dot>{st.label}</Badge>}>
                <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, lineHeight: 1.4 }}>{c.subject}</div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <span>{who(c)}</span>
                  {c.orderId && <RecLink r={{ type: "order", id: c.orderId }}>{c.orderId}</RecLink>}
                  <span style={{ color: "var(--faint)" }}>{whenLabel(c.receivedAt)}</span>
                </div>
              </ListItem>
            );
          })}
        </Card>

        <Card title="Open conversations" hint="Generate a draft, review it, then approve. Approving only records the decision; nothing is sent.">
          {open.length === 0 ? <Empty>All conversations are answered.</Empty> : open.map((c) => (
            <ListItem key={c.id} onClick={() => actions.open({ type: "conversation", id: c.id })} right={
              c.status === "draft_ready"
                ? <Btn kind="primary" size="sm" onClick={(e) => { e.stopPropagation(); actions.approveReply(c.id); }}>Approve reply</Btn>
                : <Btn size="sm" kind="soft" onClick={(e) => { e.stopPropagation(); actions.generateDraft(c.id); }}>Generate draft</Btn>
            }>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <Badge tone={STATUS[c.status].tone}>{STATUS[c.status].label}</Badge>
                <Badge tone="neutral">{KIND[c.kind]}</Badge>
              </div>
              <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 6, lineHeight: 1.4 }}>{c.subject}</div>
              <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{who(c)}, {c.channel}</div>
            </ListItem>
          ))}
        </Card>
      </Grid>
      <Callout tone="info">Customer replies are always drafts for a person to approve. No message is sent from this demo.</Callout>
    </>
  );
}

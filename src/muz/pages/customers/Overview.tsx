import { actions, useMuz } from "../../store";
import { CUSTOMERS } from "../../dataset";
import { balanceOf } from "../../selectors";
import { eur, eur0, initials } from "../../format";
import { Avatar, Badge, BarList, Card, Col, DataTable, DemoTag, Donut, Empty, Grid, Kpi, Page, PageHead, Row } from "../../ui";
import { activeOrders, attentionReasons, attentionScore, mono, segmentOf, SEGMENT_LABEL, segments } from "./shared";

export default function Overview() {
  const s = useMuz();
  const segs = segments(s);
  const wholesale = CUSTOMERS.filter((c) => c.type !== "retail");
  const outstanding = wholesale.reduce((a, c) => a + balanceOf(s, c.id), 0);
  const enquiries = s.conversations.filter((c) => c.status !== "reply_approved");
  const totalActive = CUSTOMERS.reduce((a, c) => a + activeOrders(s, c.id).length, 0);

  const needing = CUSTOMERS.map((c) => ({ c, reasons: attentionReasons(s, c) }))
    .filter((x) => x.reasons.length > 0)
    .sort((a, b) => attentionScore(b.reasons) - attentionScore(a.reasons));

  const segCols: Col<(typeof segs)[number]>[] = [
    { key: "seg", label: "Segment", w: "minmax(150px,1.4fr)", render: (x) => <span style={{ color: "var(--ink)", fontWeight: 500 }}>{x.label}</span> },
    { key: "n", label: "Customers", w: "92px", align: "right", render: (x) => <span style={mono}>{x.members.length}</span>, sort: (a, b) => a.members.length - b.members.length },
    { key: "spend", label: "Lifetime spend", w: "130px", align: "right", render: (x) => <span style={mono}>{eur0(x.spend)}</span>, sort: (a, b) => a.spend - b.spend },
    { key: "act", label: "Active orders", w: "104px", align: "right", render: (x) => <span style={mono}>{x.active}</span>, sort: (a, b) => a.active - b.active },
    { key: "bal", label: "Outstanding", w: "112px", align: "right", render: (x) => <span style={{ ...mono, color: x.balance > 0 ? "var(--warn)" : "var(--faint)" }}>{x.balance > 0 ? eur(x.balance) : "None"}</span>, sort: (a, b) => a.balance - b.balance },
    { key: "enq", label: "Open enquiries", w: "116px", align: "right", render: (x) => <span style={mono}>{x.enquiries}</span>, sort: (a, b) => a.enquiries - b.enquiries },
  ];

  const attCols: Col<(typeof needing)[number]>[] = [
    {
      key: "c", label: "Customer", w: "minmax(190px,1.4fr)",
      render: ({ c }) => (
        <Row gap={10} style={{ flexWrap: "nowrap" }}>
          <Avatar initials={initials(c.name)} size={26} tint="var(--accent)" />
          <span style={{ color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
        </Row>
      ),
    },
    { key: "seg", label: "Segment", w: "130px", render: ({ c }) => <Badge>{SEGMENT_LABEL[segmentOf(c)]}</Badge> },
    {
      key: "why", label: "Why", w: "minmax(280px,3fr)",
      render: ({ reasons }) => (
        <Row gap={6} style={{ flexWrap: "nowrap", overflow: "hidden" }}>
          {reasons.slice(0, 3).map((r) => <Badge key={r.text} tone={r.tone}>{r.text}</Badge>)}
          {reasons.length > 3 && <span style={{ fontSize: 11, color: "var(--faint)" }}>+{reasons.length - 3}</span>}
        </Row>
      ),
    },
    { key: "bal", label: "Balance", w: "104px", align: "right", render: ({ c }) => <span style={mono}>{balanceOf(s, c.id) ? eur(balanceOf(s, c.id)) : "None"}</span>, sort: (a, b) => balanceOf(s, a.c.id) - balanceOf(s, b.c.id) },
  ];

  return (
    <Page>
      <PageHead
        eyebrow="Customers"
        title="Customer overview"
        sub="Who is buying, who is waiting and who needs a call. Spend figures are illustrative and built from demo orders."
        right={<DemoTag>Illustrative spend</DemoTag>}
      />

      <Grid min={190}>
        <Kpi label="Customers" value={CUSTOMERS.length} sub="retail, international, schools, resellers" />
        <Kpi label="Active orders" value={totalActive} sub="in flight, all segments" tone="accent" />
        <Kpi label="Outstanding balances" value={eur(outstanding)} sub="wholesale invoices, from the ERP" tone={outstanding ? "warn" : "ok"} onClick={() => actions.nav("Finance", "receivables")} hint="Open receivables" />
        <Kpi label="Active enquiries" value={enquiries.length} sub="not yet replied" tone={enquiries.length ? "warn" : "ok"} onClick={() => actions.setTab("Customers", "conversations")} hint="Open conversations" />
        <Kpi label="Need attention" value={needing.length} sub="flagged order, case or overdue balance" tone={needing.length ? "bad" : "ok"} />
      </Grid>

      <Grid cols="repeat(auto-fit,minmax(min(100%,420px),1fr))">
        <Card title="Customers by segment" hint="International means any retail customer outside Ireland.">
          <Donut size={160} slices={segs.map((x) => ({ label: x.label, value: x.members.length }))} center={<span><span style={{ display: "block", fontSize: 24, fontWeight: 600, color: "var(--ink)", letterSpacing: "-.8px" }}>{CUSTOMERS.length}</span>customers</span>} />
        </Card>
        <Card title="Lifetime spend by segment" hint="Delivered history plus orders in flight." right={<DemoTag />}>
          <BarList fmt={eur0} items={[...segs].sort((a, b) => b.spend - a.spend).map((x) => ({ label: x.label, value: x.spend, sub: `${x.members.length} customers` }))} />
        </Card>
      </Grid>

      <Card title="Segments" hint="Click a segment to open its customers." flush>
        <DataTable cols={segCols} rows={segs} rowKey={(x) => x.id} onRow={(x) => actions.setTab("Customers", x.tab)} dense />
      </Card>

      <Card title="Customers needing attention" hint="A flagged order, an open case or an overdue balance. Click a row to open the customer." flush>
        {needing.length === 0 ? (
          <Empty>No customer needs attention right now.</Empty>
        ) : (
          <DataTable cols={attCols} rows={needing} rowKey={(x) => x.c.id} onRow={(x) => actions.open({ type: "customer", id: x.c.id })} dense />
        )}
      </Card>
    </Page>
  );
}


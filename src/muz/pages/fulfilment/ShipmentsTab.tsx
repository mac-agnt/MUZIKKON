import { actions, useMuz } from "../../store";
import { Badge, Btn, Callout, Card, DataTable, Grid, Kpi, Page, PageHead, Progress, RecLink, type Col } from "../../ui";
import { customerOf, shipments } from "../../selectors";
import type { Order, Tone } from "../../types";

type Row = ReturnType<typeof shipments>[number];

const toneOf = (o: Order): Tone =>
  o.stage === "delivered" ? "ok" : o.stage === "dispatched" ? (o.tracking?.status === "no_update" ? "bad" : "info") : o.packStatus === "packed" ? "accent" : "warn";

export default function ShipmentsTab() {
  const s = useMuz();
  const rows = shipments(s);
  const ready = rows.filter((r) => r.order.stage === "packed" && r.order.packStatus === "packed");
  const transit = rows.filter((r) => r.order.stage === "dispatched");
  const delivered = rows.filter((r) => r.order.stage === "delivered");

  const dispatchAll = () => ready.forEach((r) => actions.dispatch(r.order.id));

  const cols: Col<Row>[] = [
    { key: "id", label: "Order", w: "104px", sort: (a, b) => a.order.id.localeCompare(b.order.id), render: (r) => <RecLink r={{ type: "order", id: r.order.id }}>{r.order.id}</RecLink> },
    { key: "cust", label: "Customer", w: "minmax(130px,1fr)", render: (r) => customerOf(r.order).name },
    { key: "dest", label: "Destination", w: "minmax(150px,1fr)", render: (r) => r.order.destination },
    { key: "status", label: "Dispatch status", w: "minmax(190px,1fr)", sort: (a, b) => a.progress - b.progress, render: (r) => <Badge tone={toneOf(r.order)} dot>{r.status}</Badge> },
    { key: "carrier", label: "Carrier", w: "100px", render: (r) => r.order.tracking?.carrier || "Carrier TBC" },
    { key: "ref", label: "Tracking reference", w: "minmax(140px,1fr)", render: (r) => r.order.tracking ? <span style={{ fontFamily: "var(--mono)", fontSize: 11.5 }}>{r.order.tracking.ref}</span> : <span style={{ color: "var(--faint)" }}>Created on dispatch</span> },
    { key: "prog", label: "Progress", w: "120px", render: (r) => <div style={{ width: 96 }}><Progress value={r.progress} tone={toneOf(r.order)} /></div> },
    { key: "last", label: "Last update", w: "minmax(180px,1.2fr)", render: (r) => <span style={{ color: "var(--dim)" }}>{r.order.tracking?.lastUpdate || "Not dispatched yet"}</span> },
    { key: "act", label: "Action", w: "168px", render: (r) => <Action o={r.order} /> },
  ];

  return (
    <Page>
      <PageHead
        eyebrow="Fulfilment"
        title="Shipments"
        sub="Everything packed, on its way or delivered. Dispatching reduces stock on hand in the ERP ledger; delivering takes the order out of the in-flight totals."
        right={<Btn kind="primary" disabled={ready.length === 0} title={ready.length === 0 ? "No sealed packages are waiting to be dispatched" : undefined} onClick={dispatchAll}>Dispatch packed orders ({ready.length})</Btn>}
      />

      <Grid min={190}>
        <Kpi label="Ready to dispatch" value={ready.length} tone={ready.length ? "accent" : "neutral"} sub="Packed and sealed" />
        <Kpi label="In transit" value={transit.length} tone="accent" sub={transit.some((r) => r.order.tracking?.status === "no_update") ? "Includes a tracking exception" : "All moving"} onClick={() => actions.setTab("Fulfilment", "tracking")} />
        <Kpi label="Delivered today" value={delivered.length} tone={delivered.length ? "ok" : "neutral"} sub="Marked delivered in this demo" />
      </Grid>

      <Callout tone="info" title="Dispatch commitment">
        Muzikkon advertises international shipping and generally aims to dispatch within 24 to 48 hours. That is a published commitment used here as operational context, not a guaranteed delivery performance. The carrier is not confirmed, so tracking references are placeholders.
      </Callout>

      <Card flush pad={18} title="All shipments" hint="Click a row for the order record." right={<Badge tone="neutral">{rows.length}</Badge>}>
        <DataTable cols={cols} rows={rows} rowKey={(r) => r.order.id} onRow={(r) => actions.open({ type: "order", id: r.order.id })} dense empty="No shipments yet." />
      </Card>
    </Page>
  );
}

function Action({ o }: { o: Order }) {
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
  if (o.stage === "packed") {
    return o.packStatus === "packed"
      ? <Btn size="sm" kind="primary" onClick={stop(() => actions.dispatch(o.id))}>Dispatch</Btn>
      : <Btn size="sm" kind="soft" onClick={stop(() => actions.markPacked(o.id))}>Mark package ready</Btn>;
  }
  if (o.stage === "dispatched") return <Btn size="sm" kind="soft" onClick={stop(() => actions.markDelivered(o.id))}>Mark delivered (demo)</Btn>;
  return <span style={{ color: "var(--faint)", fontSize: 12 }}>Complete</span>;
}

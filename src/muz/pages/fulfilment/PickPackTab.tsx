import { actions, useMuz } from "../../store";
import { Badge, Btn, Callout, Card, DataTable, Page, PageHead, RecLink, type Col } from "../../ui";
import { customerOf, issueFor, orderQty, staffName } from "../../selectors";
import { PRODUCT_BY_SKU } from "../../dataset";
import { DueBadge, FlagIcon } from "../orders/shared";
import type { Order, StageId, Tone } from "../../types";

const locations = (o: Order) => [...new Set(o.lines.map((l) => PRODUCT_BY_SKU[l.sku].location))].join(", ");
const items = (o: Order) => o.lines.map((l) => `${l.qty} x ${PRODUCT_BY_SKU[l.sku].short}`).join(", ");

function packLabel(o: Order): { text: string; tone: Tone } {
  if (o.stage === "packed") return o.packStatus === "packed" ? { text: "Packed", tone: "ok" } : { text: "Awaiting packing", tone: "warn" };
  if (o.stage === "picking") return { text: "Picking in progress", tone: "accent" };
  return { text: "Not started", tone: "neutral" };
}

const SECTIONS: { stage: StageId; title: string; hint: string }[] = [
  { stage: "erp", title: "Ready to pick", hint: "In the ERP with stock allocated. Start picking to claim the order." },
  { stage: "picking", title: "Being picked", hint: "Finish picking to send the instrument to quality control." },
  { stage: "packed", title: "Packing", hint: "Passed quality control. Mark the package ready, then dispatch." },
];

export default function PickPackTab() {
  const s = useMuz();
  const notInErp = s.orders.filter((o) => o.stage === "new").length;

  const cols: Col<Order>[] = [
    {
      key: "id", label: "Order", w: "112px", sort: (a, b) => a.id.localeCompare(b.id),
      render: (o) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <RecLink r={{ type: "order", id: o.id }}>{o.id}</RecLink>
          {issueFor(s, o.id) && <FlagIcon />}
        </span>
      ),
    },
    { key: "loc", label: "Pick location", w: "104px", render: (o) => <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{locations(o)}</span> },
    { key: "items", label: "Products and quantities", w: "minmax(220px,1.6fr)", render: (o) => items(o) },
    { key: "qty", label: "Units", w: "56px", align: "right", sort: (a, b) => orderQty(a) - orderQty(b), render: (o) => orderQty(o) },
    { key: "cust", label: "Customer", w: "minmax(130px,1fr)", render: (o) => customerOf(o).name },
    { key: "who", label: "Staff", w: "110px", render: (o) => staffName(o.assignee) },
    { key: "pack", label: "Packing status", w: "150px", render: (o) => { const p = packLabel(o); return <Badge tone={p.tone}>{p.text}</Badge>; } },
    { key: "prio", label: "Priority", w: "84px", sort: (a, b) => a.priority.localeCompare(b.priority), render: (o) => <Badge tone={o.priority === "high" ? "warn" : "neutral"}>{o.priority === "high" ? "High" : "Normal"}</Badge> },
    { key: "due", label: "Dispatch by", w: "120px", sort: (a, b) => a.dispatchBy.localeCompare(b.dispatchBy), render: (o) => <DueBadge o={o} /> },
    { key: "act", label: "Action", w: "168px", render: (o) => <RowAction o={o} /> },
  ];

  return (
    <Page>
      <PageHead
        eyebrow="Fulfilment"
        title="Pick and pack"
        sub="The warehouse worklist: what to pick, where it lives, who has it and what is ready to leave. Actions here move the same orders you see in Orders and Shipments."
        right={notInErp ? <Badge tone="warn">{notInErp} order{notInErp === 1 ? "" : "s"} not yet in the ERP</Badge> : undefined}
      />
      {notInErp > 0 && (
        <Callout tone="warn" title="Some orders cannot be picked yet">
          {notInErp} online order{notInErp === 1 ? " is" : "s are"} paid on Shopify but missing from the ERP, so they are not on this worklist.{" "}
          <button onClick={() => actions.setTab("Orders", "imports")} style={{ border: 0, background: "none", padding: 0, color: "var(--accent)", cursor: "pointer", fontSize: "inherit", fontWeight: 500 }}>Review in Channel Imports</button>
        </Callout>
      )}

      {SECTIONS.map((sec) => {
        const list = s.orders.filter((o) => o.stage === sec.stage);
        return (
          <Card key={sec.stage} flush pad={18} title={sec.title} hint={sec.hint} right={<Badge tone={list.length ? "accent" : "neutral"}>{list.length}</Badge>}>
            <DataTable cols={cols} rows={list} rowKey={(o) => o.id} onRow={(o) => actions.open({ type: "order", id: o.id })} dense empty="Nothing in this stage." />
          </Card>
        );
      })}

      <div style={{ fontSize: 11.5, color: "var(--faint)" }}>Pick locations come from the product record in this demo and are illustrative.</div>
    </Page>
  );
}

function RowAction({ o }: { o: Order }) {
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };
  if (o.stage === "erp") {
    const blocked = o.creditHold ? "Credit hold: this order cannot be picked until finance releases it" : o.erp === "not_in_erp" ? "Import this order into the ERP first" : undefined;
    return <Btn size="sm" kind={blocked ? "ghost" : "soft"} disabled={!!blocked} title={blocked} onClick={stop(() => actions.startPicking(o.id))}>{blocked && o.creditHold ? "On hold" : "Start picking"}</Btn>;
  }
  if (o.stage === "picking") return <Btn size="sm" kind="soft" onClick={stop(() => actions.completePicking(o.id))}>Finish picking</Btn>;
  if (o.stage === "packed") {
    return o.packStatus === "packed"
      ? <Btn size="sm" kind="primary" onClick={stop(() => actions.dispatch(o.id))}>Dispatch</Btn>
      : <Btn size="sm" kind="soft" onClick={stop(() => actions.markPacked(o.id))}>Mark package ready</Btn>;
  }
  return null;
}

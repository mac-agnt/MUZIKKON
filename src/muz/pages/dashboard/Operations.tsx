import { SNAPSHOT_DATE } from "../../dataset";
import { daysBetween, dueLabel, plural } from "../../format";
import { customerOf, exceptionsByCause, orderStatusText, pipelineCounts, productLabel, qcItemsFor, qcFamily, qcStatusOf, stageIndex } from "../../selectors";
import { actions, useMuz } from "../../store";
import type { Order } from "../../types";
import { Badge, BarList, Btn, Card, ColumnChart, Empty, Grid, Kpi, Progress, RecLink } from "../../ui";
import { ListItem } from "../common";

function nextStep(o: Order): string {
  if (o.erp === "not_in_erp") return "Import to ERP";
  if (o.stage === "erp") return "Start picking";
  if (o.stage === "picking") return "Complete picking";
  if (o.stage === "packed") return o.packStatus === "packed" ? "Dispatch" : "Mark packed";
  return "Advance";
}

export default function Operations() {
  const s = useMuz();
  const stages = pipelineCounts(s);
  const pickPack = s.orders.filter((o) => ["erp", "picking", "packed"].includes(o.stage));
  const qcQueue = s.orders.filter((o) => o.stage === "qc");
  const packed = s.orders.filter((o) => o.stage === "packed");
  const exc = exceptionsByCause(s);
  const open = s.orders.filter((o) => stageIndex(o.stage) < stageIndex("dispatched"));
  const days = (o: Order) => daysBetween(SNAPSHOT_DATE, o.dispatchBy);
  const overdue = open.filter((o) => days(o) < 0);
  const today = open.filter((o) => days(o) === 0);
  const soon = open.filter((o) => days(o) > 0 && days(o) <= 3);
  const later = open.filter((o) => days(o) > 3);
  const targetList = [...overdue, ...today, ...soon].sort((a, b) => a.dispatchBy.localeCompare(b.dispatchBy));

  return (
    <>
      <Grid min={190}>
        <Kpi label="Pick & pack queue" value={pickPack.length} sub="ERP checked, picking or packed" onClick={() => actions.nav("Fulfilment", "pickpack")} />
        <Kpi label="Quality control queue" value={qcQueue.length} tone={qcQueue.length ? "warn" : "ok"} sub={qcQueue.length ? "Checklist needed before packing" : "Nothing waiting"} onClick={() => actions.nav("Fulfilment", "qc")} />
        <Kpi label="Awaiting dispatch" value={packed.length} sub="Packed or ready to pack" onClick={() => actions.nav("Fulfilment", "shipments")} />
        <Kpi label="Dispatch due today" value={today.length + overdue.length} tone={today.length + overdue.length ? "warn" : "ok"} sub={overdue.length ? `${overdue.length} already past target` : "Target is today"} />
      </Grid>

      <Grid min={380}>
        <Card title="Order stage distribution" hint="Orders in each fulfilment stage.">
          <ColumnChart data={stages.map((x) => ({ label: x.short, value: x.count }))} height={180} accentLast />
        </Card>
        <Card title="Exceptions by cause" hint="Open exceptions. Select one to see the list." right={<Btn size="sm" onClick={() => actions.nav("Orders", "exceptions")}>Exceptions</Btn>}>
          <BarList items={exc.map((x, i) => ({ label: x.label, value: x.count, color: x.count ? undefined : "var(--track)", onClick: () => actions.nav("Orders", "exceptions") }))} />
        </Card>
      </Grid>

      <Grid min={380}>
        <Card title="Pick & pack queue" hint="Next step per order. Advancing here updates Orders, Fulfilment and Activity." right={<Btn size="sm" onClick={() => actions.nav("Fulfilment", "pickpack")}>Pick & Pack</Btn>}>
          {pickPack.length === 0 ? <Empty>Nothing to pick or pack.</Empty> : pickPack.map((o) => (
            <ListItem key={o.id} right={<Btn size="sm" kind={o.creditHold ? "ghost" : "soft"} onClick={() => actions.advanceOrder(o.id)} title={o.creditHold ? "On credit hold: a decision is needed first" : undefined}>{o.creditHold ? "Credit hold" : nextStep(o)}</Btn>}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <RecLink r={{ type: "order", id: o.id }} style={{ fontSize: 13 }}>{o.id}</RecLink>
                <Badge tone="neutral">{orderStatusText(s, o)}</Badge>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4 }}>{productLabel(o)}, {customerOf(o).name}</div>
            </ListItem>
          ))}
        </Card>

        <Card title="Quality control queue" hint="Instrument checklists waiting to be completed." right={<Btn size="sm" onClick={() => actions.nav("Fulfilment", "qc")}>Quality Control</Btn>}>
          {qcQueue.length === 0 ? <Empty>No orders waiting for a quality check.</Empty> : qcQueue.map((o) => {
            const st = qcStatusOf(s, o);
            const items = qcItemsFor(qcFamily(o));
            const done = items.filter((i) => s.qc[o.id]?.[i.key]).length;
            return (
              <ListItem key={o.id} right={<Btn size="sm" kind="soft" onClick={() => actions.nav("Fulfilment", "qc")}>Open checklist</Btn>}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <RecLink r={{ type: "order", id: o.id }} style={{ fontSize: 13 }}>{o.id}</RecLink>
                  <Badge tone={st === "ready" ? "ok" : st === "in_progress" ? "info" : "warn"}>{st === "ready" ? "Ready to submit" : st === "in_progress" ? "In progress" : "Pending"}</Badge>
                  <span style={{ fontSize: 11.5, color: "var(--dim)" }}>Due {dueLabel(o.dispatchBy).toLowerCase()}</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--dim)", margin: "4px 0 7px" }}>{productLabel(o)}</div>
                <Progress value={items.length ? done / items.length : 0} tone={st === "ready" ? "ok" : "accent"} />
                <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 4 }}>{done} of {items.length} checks done</div>
              </ListItem>
            );
          })}
        </Card>
      </Grid>

      <Grid min={380}>
        <Card title="Orders awaiting dispatch" hint="Packed orders. Mark packed, then dispatch." right={<Btn size="sm" onClick={() => actions.nav("Fulfilment", "shipments")}>Shipments</Btn>}>
          {packed.length === 0 ? <Empty>No packed orders waiting.</Empty> : packed.map((o) => (
            <ListItem key={o.id} right={<Btn size="sm" kind="soft" onClick={() => actions.advanceOrder(o.id)}>{o.packStatus === "packed" ? "Dispatch" : "Mark packed"}</Btn>}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <RecLink r={{ type: "order", id: o.id }} style={{ fontSize: 13 }}>{o.id}</RecLink>
                <Badge tone={o.packStatus === "packed" ? "ok" : "neutral"}>{o.packStatus === "packed" ? "Ready to dispatch" : "Ready to pack"}</Badge>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 4 }}>{productLabel(o)} to {o.destination}. Target {dueLabel(o.dispatchBy).toLowerCase()}.</div>
            </ListItem>
          ))}
        </Card>

        <Card title="Dispatch targets" hint="Orders not yet dispatched, by target date (24 to 48 hours).">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 8, marginBottom: 12 }}>
            {([["Past target", overdue.length, "bad"], ["Today", today.length, "warn"], ["Next 3 days", soon.length, "info"], ["Later", later.length, "neutral"]] as const).map(([k, v, tone]) => (
              <div key={k} style={{ padding: "9px 10px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)" }}>
                <div style={{ fontSize: 10.5, color: "var(--faint)" }}>{k}</div>
                <div style={{ fontSize: 20, fontWeight: 600, marginTop: 3, color: v && tone !== "neutral" ? `var(--${tone === "info" ? "ink" : tone})` : "var(--ink)" }}>{v}</div>
              </div>
            ))}
          </div>
          {targetList.length === 0 ? <Empty>Nothing due in the next three days.</Empty> : targetList.map((o) => (
            <ListItem key={o.id} right={<Badge tone={days(o) < 0 ? "bad" : days(o) === 0 ? "warn" : "neutral"}>{dueLabel(o.dispatchBy)}</Badge>}>
              <RecLink r={{ type: "order", id: o.id }} style={{ fontSize: 13 }}>{o.id}</RecLink>
              <span style={{ fontSize: 11.5, color: "var(--dim)", marginLeft: 8 }}>{orderStatusText(s, o)}</span>
            </ListItem>
          ))}
          <div style={{ fontSize: 11.5, color: "var(--faint)", paddingTop: 10 }}>{plural(open.length, "order")} not yet dispatched.</div>
        </Card>
      </Grid>
    </>
  );
}

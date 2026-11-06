import { useMemo, useState } from "react";
import { CUSTOMER_BY_ID, SNAPSHOT_DATE, SUPPLIERS } from "../../dataset";
import { addDays, dayDmy, dmy, eur } from "../../format";
import { productLabel, stageIndex, staffName } from "../../selectors";
import { actions, useMuz } from "../../store";
import type { RecordRef, Tone } from "../../types";
import { Badge, Btn, Card, Empty, Row, TONE } from "../../ui";
import { mono, weekStartOf } from "../common";
import { PRODUCT_BY_SKU } from "../../dataset";

type Kind = "task" | "dispatch" | "invoice" | "po";
interface Ev { id: string; date: string; kind: Kind; title: string; short: string; sub: string; ref: RecordRef; done?: boolean }

const KIND: Record<Kind, { label: string; tone: Tone }> = {
  task: { label: "Task due", tone: "accent" },
  dispatch: { label: "Dispatch target", tone: "info" },
  invoice: { label: "Invoice due", tone: "warn" },
  po: { label: "Expected receipt", tone: "ok" },
};
const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Calendar() {
  const s = useMuz();
  const [week, setWeek] = useState("2026-11-02");
  const [sel, setSel] = useState(SNAPSHOT_DATE);
  const [hide, setHide] = useState<Set<Kind>>(new Set());

  const events = useMemo<Ev[]>(() => {
    const out: Ev[] = [];
    s.tasks.forEach((t) => out.push({ id: `t-${t.id}`, date: t.due, kind: "task", title: t.title, short: t.title, sub: `${staffName(t.owner)}, ${t.priority} priority`, ref: { type: "task", id: t.id }, done: t.status === "done" }));
    s.orders.filter((o) => stageIndex(o.stage) < stageIndex("dispatched")).forEach((o) => out.push({ id: `o-${o.id}`, date: o.dispatchBy, kind: "dispatch", title: `Dispatch ${o.id}: ${productLabel(o)}`, short: `Dispatch ${o.id}`, sub: `${CUSTOMER_BY_ID[o.customerId].name}, to ${o.destination}`, ref: { type: "order", id: o.id } }));
    s.invoices.filter((i) => i.status === "outstanding").forEach((i) => out.push({ id: `i-${i.id}`, date: i.due, kind: "invoice", title: `${i.id} due: ${CUSTOMER_BY_ID[i.customerId].name}`, short: `${i.id} due`, sub: eur(i.amount), ref: { type: "invoice", id: i.id } }));
    s.pos.filter((p) => p.status === "approved").forEach((p) => {
      const lead = SUPPLIERS.find((x) => x.id === p.supplierId)?.leadTimeDays ?? 21;
      out.push({ id: `p-${p.id}`, date: addDays(p.createdAt.slice(0, 10), lead), kind: "po", title: `Expected receipt ${p.id}: ${p.qty} x ${PRODUCT_BY_SKU[p.sku].short}`, short: `Receipt ${p.id}`, sub: `Created ${dmy(p.createdAt)} plus ${lead} day lead time (estimate)`, ref: { type: "po", id: p.id } });
    });
    return out;
  }, [s.tasks, s.orders, s.invoices, s.pos]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(week, i));
  const visible = (e: Ev) => !hide.has(e.kind);
  const byDay = (d: string) => events.filter((e) => e.date === d && visible(e));
  const agenda = byDay(sel);
  const shift = (n: number) => { const w = addDays(week, n * 7); setWeek(w); setSel(w <= SNAPSHOT_DATE && SNAPSHOT_DATE < addDays(w, 7) ? SNAPSHOT_DATE : w); };
  const toggleKind = (k: Kind) => setHide((p) => { const n = new Set(p); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const total = days.reduce((a, d) => a + byDay(d).length, 0);
  const track = "repeat(5,minmax(0,1fr)) repeat(2,minmax(0,.7fr))";

  return (
    <>
      <Card pad={16}>
        <Row gap={12} style={{ justifyContent: "space-between" }}>
          <Row gap={8}>
            <Btn size="sm" onClick={() => shift(-1)} title="Previous week">Previous</Btn>
            <Btn size="sm" onClick={() => shift(1)} title="Next week">Next</Btn>
            <Btn size="sm" kind="soft" onClick={() => { setWeek("2026-11-02"); setSel(SNAPSHOT_DATE); }} title="Back to the week of the demo snapshot">Today</Btn>
            <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 6 }}>{dmy(week)} to {dayDmy(addDays(week, 6))}</span>
            <span style={{ fontSize: 12, color: "var(--faint)" }}>{total} {total === 1 ? "event" : "events"}</span>
          </Row>
          <Row gap={8}>
            {(Object.keys(KIND) as Kind[]).map((k) => {
              const off = hide.has(k);
              return (
                <button key={k} onClick={() => toggleKind(k)} title={off ? "Show" : "Hide"} className="mz-chip" style={{ height: 28, padding: "0 11px", display: "inline-flex", alignItems: "center", gap: 7, borderRadius: "var(--r-ctl,999px)", fontSize: 11.5, cursor: "pointer", background: off ? "transparent" : TONE[KIND[k].tone].bg, border: `1px solid ${off ? "var(--border)" : TONE[KIND[k].tone].line}`, color: off ? "var(--faint)" : TONE[KIND[k].tone].fg, textDecoration: off ? "line-through" : "none" }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: TONE[KIND[k].tone].fg }} />{KIND[k].label}
                </button>
              );
            })}
          </Row>
        </Row>
      </Card>

      <Card flush>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 760 }}>
            <div style={{ display: "grid", gridTemplateColumns: track }}>
              {days.map((d, i) => {
                const isToday = d === SNAPSHOT_DATE;
                const isSel = d === sel;
                const list = byDay(d);
                return (
                  <div key={d} onClick={() => setSel(d)} style={{ minHeight: 210, padding: "10px 8px 12px", cursor: "pointer", borderRight: i < 6 ? "1px solid var(--border)" : "none", background: isSel ? "var(--accent-faint)" : i > 4 ? "var(--surface-faint)" : undefined, boxShadow: isToday ? "inset 0 2px 0 var(--accent)" : "none" }}>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", padding: "0 3px 8px" }}>
                      <span style={{ ...mono, fontSize: 9.5, letterSpacing: ".13em", color: isToday ? "var(--accent)" : "var(--faint)" }}>{DAY[i].toUpperCase()}{isToday ? ", TODAY" : ""}</span>
                      <span style={{ fontSize: 15, fontWeight: 600, color: isToday ? "var(--accent)" : "var(--ink)" }}>{Number(d.slice(8))}</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {list.map((e) => {
                        const t = TONE[KIND[e.kind].tone];
                        return (
                          <button key={e.id} onClick={(ev) => { ev.stopPropagation(); setSel(d); actions.open(e.ref); }} title={e.title} className="mz-click" style={{ textAlign: "left", padding: "5px 7px", borderRadius: 7, border: `1px solid ${t.line}`, background: t.bg, color: "var(--ink)", fontSize: 11, lineHeight: 1.3, cursor: "pointer", opacity: e.done ? 0.5 : 1, textDecoration: e.done ? "line-through" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                            {e.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card title={`Agenda, ${dayDmy(sel)}`} hint={sel === SNAPSHOT_DATE ? "Today in the demo snapshot." : undefined}>
        {agenda.length === 0 ? <Empty>Nothing scheduled for this day.</Empty> : agenda.map((e) => (
          <div key={e.id} onClick={() => actions.open(e.ref)} className="mz-row mz-click" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid var(--border)", cursor: "pointer", opacity: e.done ? 0.55 : 1 }}>
            <Badge tone={KIND[e.kind].tone}>{KIND[e.kind].label}</Badge>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, textDecoration: e.done ? "line-through" : "none" }}>{e.title}</div>
              <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{e.sub}</div>
            </div>
            <span style={{ ...mono, fontSize: 10.5, color: "var(--accent)" }}>{e.ref.id}</span>
          </div>
        ))}
      </Card>
    </>
  );
}

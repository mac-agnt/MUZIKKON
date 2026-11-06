import { useState } from "react";
import { actions, useMuz, type MuzState } from "../../store";
import { Badge, Btn, Callout, Card, Grid, KV, Label, Page, PageHead, Progress, RecLink, Row, Thumb } from "../../ui";
import { customerOf, qcFamily, qcItemsFor, qcStatusOf, staffName } from "../../selectors";
import { PRODUCT_BY_SKU, QC_CHECKLISTS } from "../../dataset";
import { DueBadge, handoff, thumbOf } from "../orders/shared";
import type { Order, Tone } from "../../types";

const STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "warn" },
  ready: { label: "Ready to submit", tone: "ok" },
};

const doneCount = (s: MuzState, o: Order) => {
  const st = s.qc[o.id] || {};
  return qcItemsFor(qcFamily(o)).filter((i) => st[i.key]).length;
};

export default function QcTab() {
  const s = useMuz();
  const queue = s.orders.filter((o) => o.stage === "qc");
  const [selId, setSelId] = useState<string>(() => {
    const v = handoff.qcOrder;
    handoff.qcOrder = null;
    return v || "MZ-1044";
  });
  const [passed, setPassed] = useState<{ id: string; label: string } | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const sel = queue.find((o) => o.id === selId) || queue[0];
  const recent = s.orders.filter((o) => o.stage === "packed");

  const submit = (o: Order) => {
    const label = PRODUCT_BY_SKU[o.lines[0].sku].short;
    actions.submitQc(o.id);
    setPassed({ id: o.id, label });
  };

  return (
    <Page>
      <PageHead
        eyebrow="Fulfilment"
        title="Instrument quality control"
        sub="Muzikkon specialises in handcrafted and specialist instruments, so each harp, lute and bouzouki is inspected against its own checklist before it is packed. Nothing moves to packing until every check is ticked."
        right={<Badge tone={queue.length ? "warn" : "ok"} dot>{queue.length} in the QC queue</Badge>}
      />

      <Grid cols="minmax(260px,340px) minmax(0,1fr)" gap={14}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <Card title="QC queue" hint="Instruments picked and waiting for inspection." right={<Badge tone={queue.length ? "accent" : "neutral"}>{queue.length}</Badge>}>
            {queue.length === 0 ? (
              <div style={{ padding: "12px 2px", fontSize: 13, color: "var(--dim)", lineHeight: 1.6 }}>The queue is empty. Orders arrive here when picking is finished.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {queue.map((o) => {
                  const on = sel?.id === o.id;
                  const st = STATUS[qcStatusOf(s, o)] || STATUS.pending;
                  const total = qcItemsFor(qcFamily(o)).length;
                  return (
                    <button key={o.id} onClick={() => setSelId(o.id)} className="mz-click" style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "left", padding: "11px 12px", borderRadius: "var(--r-md,14px)", background: on ? "var(--accent-soft)" : "var(--surface-2)", border: `1px solid ${on ? "var(--accent-line)" : "var(--border)"}`, cursor: "pointer", color: "inherit" }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <Thumb src={thumbOf(o)} size={42} label={PRODUCT_BY_SKU[o.lines[0].sku].short} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{o.id}</div>
                          <div style={{ fontSize: 12, color: "var(--dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{PRODUCT_BY_SKU[o.lines[0].sku].short}</div>
                        </div>
                      </div>
                      <Row gap={6}>
                        <Badge tone={st.tone}>{st.label}</Badge>
                        <Badge tone="neutral">{doneCount(s, o)} of {total}</Badge>
                        <DueBadge o={o} />
                      </Row>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card title="Recently passed" hint="Through QC and now at packing.">
            {recent.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--dim)" }}>No instruments have passed yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {recent.map((o) => (
                  <div key={o.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 2px", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
                    <RecLink r={{ type: "order", id: o.id }}>{o.id}</RecLink>
                    <span style={{ flex: 1, minWidth: 0, color: "var(--dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{PRODUCT_BY_SKU[o.lines[0].sku].short}</span>
                    <Badge tone={o.packStatus === "packed" ? "ok" : "info"}>{o.packStatus === "packed" ? "Packed" : "To pack"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          {passed && (
            <Callout tone="ok" title={`${passed.id} passed quality control`}>
              <div>The {passed.label} is eligible for packing. Next step: mark the package ready, then dispatch.</div>
              <Row gap={8} style={{ marginTop: 10 }}>
                <Btn size="sm" kind="primary" onClick={() => actions.setTab("Fulfilment", "pickpack")}>Go to Pick and Pack</Btn>
                <Btn size="sm" kind="ghost" onClick={() => actions.open({ type: "order", id: passed.id })}>Open order</Btn>
                <Btn size="sm" kind="ghost" onClick={() => setPassed(null)}>Dismiss</Btn>
              </Row>
            </Callout>
          )}

          {sel ? <Checklist s={s} o={sel} note={notes[sel.id] || ""} onNote={(v) => setNotes((n) => ({ ...n, [sel.id]: v }))} onSubmit={() => submit(sel)} /> : (
            <Card>
              <div style={{ padding: "30px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Nothing waiting for inspection</div>
                <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 8, lineHeight: 1.6 }}>Every picked instrument has passed its checklist. New ones appear here when picking is finished.</div>
                <div style={{ marginTop: 16 }}><Btn kind="soft" onClick={() => actions.setTab("Fulfilment", "pickpack")}>Open Pick and Pack</Btn></div>
              </div>
            </Card>
          )}
        </div>
      </Grid>
    </Page>
  );
}

function Checklist({ s, o, note, onNote, onSubmit }: { s: MuzState; o: Order; note: string; onNote: (v: string) => void; onSubmit: () => void }) {
  const family = qcFamily(o);
  const items = qcItemsFor(family);
  const title = (QC_CHECKLISTS[family] || QC_CHECKLISTS.general).title;
  const st = s.qc[o.id] || {};
  const done = items.filter((i) => st[i.key]).length;
  const all = done === items.length;
  const p = PRODUCT_BY_SKU[o.lines[0].sku];

  return (
    <Card
      title={`${title}: ${o.id}`}
      hint={`${p.name}`}
      right={<Badge tone={all ? "ok" : done ? "warn" : "neutral"} dot>{all ? "All checks ticked" : `${done} of ${items.length} checks`}</Badge>}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <Thumb src={thumbOf(o)} size={64} label={p.short} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <KV cols={3} rows={[
              ["Customer", customerOf(o).name],
              ["Destination", o.destination],
              ["Dispatch by", <DueBadge o={o} />],
            ]} />
          </div>
        </div>

        <div>
          <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
            <Label>Progress</Label>
            <span style={{ fontSize: 12, color: "var(--dim)" }}>{done} of {items.length} complete</span>
          </Row>
          <Progress value={done / items.length} tone={all ? "ok" : "accent"} height={8} />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {items.map((i) => {
            const on = !!st[i.key];
            return (
              <label key={i.key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", borderTop: "1px solid var(--border)", cursor: "pointer" }}>
                <input type="checkbox" checked={on} onChange={(e) => actions.setQc(o.id, i.key, e.target.checked)} style={{ width: 17, height: 17, accentColor: "var(--accent)" }} />
                <span style={{ flex: 1, fontSize: 13.5, color: on ? "var(--ink)" : "var(--body)" }}>{i.label}</span>
                {on && <Badge tone="ok">Checked</Badge>}
              </label>
            );
          })}
        </div>

        <div>
          <Label style={{ marginBottom: 8 }}>Inspector notes (kept on this screen only)</Label>
          <textarea
            value={note}
            onChange={(e) => onNote(e.target.value)}
            rows={3}
            placeholder={`Anything to record about this ${family === "general" ? "item" : family}`}
            style={{ width: "100%", resize: "vertical", padding: "10px 13px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md,14px)", fontSize: 13, color: "var(--ink)", outline: 0, fontFamily: "inherit", lineHeight: 1.5 }}
          />
        </div>

        <Row gap={10}>
          <Btn kind="primary" disabled={!all} title={all ? undefined : "Tick every check before submitting"} onClick={onSubmit}>Submit quality check</Btn>
          <Btn kind="ghost" disabled={all} title={all ? "Every check is already ticked" : undefined} onClick={() => actions.qcAll(o.id)}>Tick all</Btn>
          <Btn kind="ghost" onClick={() => actions.open({ type: "order", id: o.id })}>Open order</Btn>
          <span style={{ fontSize: 11.5, color: "var(--faint)" }}>Assigned to {staffName(o.assignee)}</span>
        </Row>
      </div>
    </Card>
  );
}

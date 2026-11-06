import { useState, type ReactNode } from "react";
import { actions, useMuz, type MuzState } from "../../store";
import { Badge, Btn, Callout, Card, DataTable, Grid, Kpi, Page, PageHead, RecLink, Row, Thumb, TONE, type Col } from "../../ui";
import { customerOf, historyOfCustomer, orderValue, stockOf } from "../../selectors";
import { daysBetween, eur, whenLabel } from "../../format";
import { PRODUCT_BY_SKU } from "../../dataset";
import { thumbOf } from "./shared";
import type { ImportRecord, Order, Tone } from "../../types";

/* ── before / after flows ─────────────────────────────────────────────────── */
interface Step { title: string; sub: string; manual?: boolean; risk?: string; gate?: boolean; span: number }

const CURRENT: Step[] = [
  { title: "Shopify order arrives", sub: "Paid on Shopify. Not connected to the ERP.", span: 1 },
  { title: "Someone reads it", sub: "A person notices the new order and opens it.", manual: true, risk: "Depends on someone spotting it", span: 2 },
  { title: "Re-keys it into the ERP", sub: "Customer, product, quantity and address typed again.", manual: true, risk: "Typos, duplicates, delay", span: 2 },
  { title: "Allocation happens later", sub: "Stock is only reserved once the ERP order exists.", risk: "Stock looks free in the meantime", span: 2 },
];
const PROPOSED: Step[] = [
  { title: "Shopify order", sub: "Simulated feed into Pulse.", span: 1 },
  { title: "Matching checks", sub: "Customer, product SKU, payment.", span: 1 },
  { title: "Duplicate detection", sub: "Same customer and total, last 24h.", span: 1 },
  { title: "Stock check", sub: "Available vs required in the ERP.", span: 1 },
  { title: "Manager approval", sub: "A person approves every import.", gate: true, span: 1 },
  { title: "ERP import", sub: "Order created (simulated).", span: 1 },
  { title: "Confirmation", sub: "Allocation, invoice, audit trail.", span: 1 },
];

function Flow({ title, tone, steps }: { title: string; tone: Tone; steps: Step[] }) {
  const t = TONE[tone];
  return (
    <div>
      <Row style={{ marginBottom: 10 }}>
        <Badge tone={tone}>{title}</Badge>
      </Row>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 10 }}>
        {steps.map((st, i) => (
          <div key={i} style={{ gridColumn: `span ${st.span}`, position: "relative", padding: "12px 13px", borderRadius: "var(--r-md,14px)", background: st.manual ? TONE.warn.bg : "var(--surface-2)", border: `1px solid ${st.manual ? TONE.warn.line : st.gate ? TONE.accent.line : "var(--border)"}`, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 20, height: 20, borderRadius: 7, background: t.bg, color: t.fg, fontSize: 11, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{i + 1}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25 }}>{st.title}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 7, lineHeight: 1.45 }}>{st.sub}</div>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
              {st.manual && <Badge tone="warn" style={{ height: 19, fontSize: 10.5 }}>Manual</Badge>}
              {st.gate && <Badge tone="accent" style={{ height: 19, fontSize: 10.5 }}>Human gate</Badge>}
              {st.risk && <Badge tone="bad" style={{ height: 19, fontSize: 10.5, whiteSpace: "normal" }}>Risk: {st.risk}</Badge>}
            </div>
            {i < steps.length - 1 && <span style={{ position: "absolute", right: -8, top: 22, width: 7, height: 7, borderTop: "1.5px solid var(--faint)", borderRight: "1.5px solid var(--faint)", transform: "rotate(45deg)", zIndex: 1, opacity: 0.7 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── matching checks for one queue item ───────────────────────────────────── */
interface Check { label: string; detail: ReactNode; ok: boolean }

function checksFor(s: MuzState, o: Order): Check[] {
  const c = customerOf(o);
  const line = o.lines[0];
  const p = PRODUCT_BY_SKU[line.sku];
  const known = historyOfCustomer(c.id).length > 0 || s.orders.some((x) => x.customerId === c.id && x.id !== o.id);
  const total = orderValue(o);
  const dupes = s.orders.filter((x) => x.id !== o.id && x.customerId === o.customerId && Math.abs(orderValue(x) - total) < 0.005 && Math.abs(daysBetween(x.placedAt, o.placedAt)) <= 1);
  const st = stockOf(s, line.sku);
  const priceOk = Math.abs(line.unitPrice - p.price) < 0.005;
  return [
    { label: "ERP lookup", ok: true, detail: `No ERP order found for Shopify ${o.shopifyRef}. This is why it is in the queue.` },
    { label: "Customer match", ok: true, detail: known ? `Existing customer record found for ${c.name}.` : `New customer. A record for ${c.name} (${c.email}) will be created.` },
    { label: "Line items match SKU", ok: priceOk, detail: `${p.short} (${p.sku}) x${line.qty} at ${eur(line.unitPrice)}${priceOk ? " matches the catalogue price." : ` differs from catalogue price ${eur(p.price)}.`}` },
    { label: "Payment confirmed on Shopify", ok: o.payment === "paid", detail: o.payment === "paid" ? `${eur(total)} paid at checkout.` : "Payment is not confirmed." },
    { label: "Duplicate detection", ok: dupes.length === 0, detail: dupes.length === 0 ? "No other order with the same customer email and total in the last 24 hours." : `Possible duplicate: ${dupes.map((d) => d.id).join(", ")}.` },
    { label: "Stock check", ok: st.available >= line.qty, detail: `Available ${st.available}, required ${line.qty} (${st.onHand} on hand in the ERP ledger).` },
  ];
}

const RESULT: Record<ImportRecord["result"], { label: string; tone: Tone }> = {
  imported: { label: "Imported", tone: "ok" },
  duplicate_skipped: { label: "Duplicate skipped", tone: "info" },
  failed_retry: { label: "Failed, retry", tone: "bad" },
};

interface Failed { id: string; orderId: string; at: string }

export default function ImportsTab() {
  const s = useMuz();
  const queue = s.orders.filter((o) => o.channel === "online" && o.erp === "not_in_erp");
  const [selId, setSelId] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);
  const [failed, setFailed] = useState<Failed[]>([]);

  const sel = queue.find((o) => o.id === selId) || queue[0];
  const checks = sel ? checksFor(s, sel) : [];
  const allOk = checks.every((c) => c.ok);
  const pendingApproval = sel ? s.approvals.find((a) => a.kind === "erp_import" && a.ref.id === sel.id && a.status === "pending") : undefined;
  const doneOrder = justDone ? s.orders.find((o) => o.id === justDone) : undefined;
  const simulatedCount = s.imports.filter((i) => i.simulated).length;
  const manualCount = s.imports.length - simulatedCount;

  const runImport = (o: Order) => {
    actions.importOrder(o.id);
    setJustDone(o.id);
    setSelId(null);
  };
  const addFailed = () => {
    const target = sel?.id || justDone || s.imports[0]?.orderId || "MZ-1042";
    setFailed((f) => [...f, { id: `F-${f.length + 1}-${target}`, orderId: target, at: "Just now" }]);
    actions.toast("Failed import added to the retry queue (local demo row, nothing was called)", "warn");
  };
  const retry = (f: Failed) => {
    setFailed((x) => x.filter((y) => y.id !== f.id));
    actions.toast(`Retry for ${f.orderId} succeeded (simulated). Nothing external was called.`);
  };

  const importLog = s.activity.filter((a) => /import/i.test(a.text)).slice(0, 8);

  const histCols: Col<ImportRecord>[] = [
    { key: "at", label: "When", w: "130px", render: (r) => whenLabel(r.at) },
    { key: "order", label: "Order", w: "100px", render: (r) => <RecLink r={{ type: "order", id: r.orderId }}>{r.orderId}</RecLink> },
    { key: "cust", label: "Customer", w: "minmax(140px,1fr)", render: (r) => { const o = s.orders.find((x) => x.id === r.orderId); return o ? customerOf(o).name : "Unknown"; } },
    { key: "how", label: "Method", w: "minmax(190px,1fr)", render: (r) => <Badge tone={r.simulated ? "accent" : "neutral"}>{r.simulated ? "Simulated Pulse import" : "Manual (current process)"}</Badge> },
    { key: "res", label: "Result", w: "130px", render: (r) => <Badge tone={RESULT[r.result].tone} dot>{RESULT[r.result].label}</Badge> },
    { key: "note", label: "Note", w: "minmax(260px,2fr)", render: (r) => <span style={{ color: "var(--dim)" }}>{r.note}</span> },
  ];

  return (
    <Page>
      <PageHead
        eyebrow="Orders / Channel imports"
        title="Shopify to ERP, with a person in the loop"
        sub="Online orders are copied into the ERP by hand today. This is how Pulse would prepare each one for a one-click approval. Everything below is a simulation inside this demo."
        right={<Badge tone={queue.length ? "warn" : "ok"} dot>{queue.length} awaiting ERP entry</Badge>}
      />

      <Grid min={190}>
        <Kpi label="Awaiting ERP entry" value={queue.length} tone={queue.length ? "warn" : "ok"} sub={queue.length ? "Paid on Shopify, not in the ERP" : "0 awaiting ERP entry"} />
        <Kpi label="Simulated Pulse imports" value={simulatedCount} tone="accent" sub="This session" />
        <Kpi label="Manual entries (history)" value={manualCount} sub="Keyed by hand, current process" />
        <Kpi label="Retry queue" value={failed.length} tone={failed.length ? "bad" : "neutral"} sub={failed.length ? "Needs a retry" : "Empty"} />
      </Grid>

      <Card title="Current process vs proposed" hint="The two flows are aligned: where today needs a person to re-type, Pulse prepares and a person approves.">
        <div style={{ overflowX: "auto", paddingBottom: 4 }}>
          <div style={{ minWidth: 1040, display: "flex", flexDirection: "column", gap: 20 }}>
            <Flow title="Current state: manual order transfer" tone="warn" steps={CURRENT} />
            <Flow title="Proposed: Pulse-assisted matching and import" tone="accent" steps={PROPOSED} />
          </div>
        </div>
      </Card>

      <Grid cols="minmax(280px,360px) minmax(0,1fr)" gap={14}>
        <Card title="Import queue" hint="Online orders paid on Shopify but missing from the ERP." right={<Badge tone={queue.length ? "warn" : "ok"}>{queue.length}</Badge>}>
          {queue.length === 0 ? (
            <div style={{ padding: "16px 4px", fontSize: 13, color: "var(--dim)", lineHeight: 1.6 }}>
              0 awaiting ERP entry. New Shopify orders that are not in the ERP will appear here.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {queue.map((o) => {
                const on = sel?.id === o.id;
                return (
                  <button key={o.id} onClick={() => setSelId(o.id)} className="mz-click" style={{ display: "flex", gap: 11, alignItems: "center", textAlign: "left", padding: "11px 12px", borderRadius: "var(--r-md,14px)", background: on ? "var(--accent-soft)" : "var(--surface-2)", border: `1px solid ${on ? "var(--accent-line)" : "var(--border)"}`, cursor: "pointer", color: "inherit" }}>
                    <Thumb src={thumbOf(o)} size={42} label={customerOf(o).name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{o.id} <span style={{ color: "var(--faint)", fontWeight: 400 }}>Shopify {o.shopifyRef}</span></div>
                      <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{customerOf(o).name} · {PRODUCT_BY_SKU[o.lines[0].sku].short}</div>
                    </div>
                    <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{eur(orderValue(o))}</span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        <Card
          title={sel ? `Import proposal for ${sel.id}` : doneOrder ? "Import complete" : "Import proposal"}
          hint={sel ? "Pulse's matching checks, prepared for manager approval. Nothing is imported until you press the button." : undefined}
          right={sel ? <Badge tone={allOk ? "ok" : "warn"} dot>{allOk ? "All checks passed" : "Needs review"}</Badge> : doneOrder ? <Badge tone="ok" dot>Imported (simulated)</Badge> : undefined}
        >
          {sel ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {checks.map((c) => (
                  <div key={c.label} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 2px", borderTop: "1px solid var(--border)" }}>
                    <span style={{ flex: "none", width: 20, height: 20, borderRadius: 7, marginTop: 1, background: c.ok ? TONE.ok.bg : TONE.warn.bg, color: c.ok ? TONE.ok.fg : TONE.warn.fg, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{c.ok ? "✓" : "!"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.label}</div>
                      <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 2, lineHeight: 1.5 }}>{c.detail}</div>
                    </div>
                    <Badge tone={c.ok ? "ok" : "warn"}>{c.ok ? "OK" : "Review"}</Badge>
                  </div>
                ))}
              </div>
              {pendingApproval && (
                <Callout tone="accent" title={`Approval ${pendingApproval.id} is pending`}>
                  Importing here counts as the manager approval and closes {pendingApproval.id}. You can also decide it from Agents, Approvals.
                </Callout>
              )}
              <Row gap={10}>
                <Btn kind="primary" onClick={() => runImport(sel)}>Simulate order import</Btn>
                <Btn kind="ghost" onClick={() => actions.open({ type: "order", id: sel.id })}>Open order</Btn>
                <span style={{ fontSize: 11.5, color: "var(--faint)" }}>Simulated: creates the ERP order, allocation and invoice in demo state only.</span>
              </Row>
            </div>
          ) : doneOrder ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Callout tone="ok" title={`${doneOrder.id} imported into the ERP (simulated)`}>
                Customer matched, stock allocated and invoice {doneOrder.invoiceId} prepared. The order is now at ERP Checked and 0 are awaiting ERP entry.
              </Callout>
              <Row gap={10}>
                <Btn kind="primary" onClick={() => actions.nav("Fulfilment", "pickpack")}>Go to Pick and Pack</Btn>
                <Btn kind="ghost" onClick={() => actions.open({ type: "order", id: doneOrder.id })}>Open order</Btn>
                <Btn kind="ghost" onClick={() => setJustDone(null)}>Dismiss</Btn>
              </Row>
            </div>
          ) : (
            <div style={{ padding: "22px 4px", fontSize: 13, color: "var(--dim)", lineHeight: 1.6 }}>
              <div style={{ color: "var(--ink)", fontWeight: 600, marginBottom: 4 }}>0 awaiting ERP entry</div>
              Nothing to match right now. Check Import history below for what was processed.
            </div>
          )}
        </Card>
      </Grid>

      <Card flush pad={18} title="Import history" hint="Manual entries are the current process (read from the activity record). Simulated Pulse imports are created by this demo." right={<Badge tone="neutral">{s.imports.length} records</Badge>}>
        <DataTable cols={histCols} rows={s.imports} rowKey={(r) => r.id} onRow={(r) => actions.open({ type: "order", id: r.orderId })} dense empty="No imports yet." />
      </Card>

      <Grid min={380}>
        <Card title="Retry queue" hint="Imports that failed and need another attempt. Empty unless something goes wrong." right={<Btn size="sm" kind="ghost" onClick={addFailed}>Simulate a failed import</Btn>}>
          {failed.length === 0 ? (
            <div style={{ padding: "14px 2px", fontSize: 13, color: "var(--dim)", lineHeight: 1.6 }}>Retry queue is empty. Use the button to see how a failed import would be handled.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {failed.map((f) => (
                <div key={f.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 2px", borderTop: "1px solid var(--border)" }}>
                  <Badge tone="bad" dot>Failed, retry</Badge>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>
                    <RecLink r={{ type: "order", id: f.orderId }}>{f.orderId}</RecLink>
                    <div style={{ color: "var(--dim)", marginTop: 2 }}>Simulated failure: ERP did not accept the request. Local demo row only.</div>
                  </div>
                  <Btn size="sm" kind="primary" onClick={() => retry(f)}>Retry</Btn>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Audit trail" hint="Latest import-related activity, newest first." right={<Btn size="sm" kind="ghost" onClick={() => actions.nav("Activity")}>Open Activity</Btn>}>
          {importLog.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--dim)" }}>No import activity yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {importLog.map((a) => (
                <div key={a.id} style={{ display: "flex", gap: 10, alignItems: "baseline", padding: "8px 2px", borderTop: "1px solid var(--border)", fontSize: 12.5 }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--faint)", whiteSpace: "nowrap", minWidth: 96 }}>{whenLabel(a.at)}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>{a.text}</span>
                  <Badge tone={a.simulated ? "accent" : "neutral"} style={{ height: 19, fontSize: 10.5 }}>{a.source}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </Grid>

      <Callout tone="warn" title="Demo boundary">
        No Shopify or ERP API is called. ERP API availability has not been verified. Pulse would sit alongside the ERP as an oversight layer; the ERP stays the ledger for orders, stock and invoices.
      </Callout>
    </Page>
  );
}

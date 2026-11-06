/* Records: Explorer, Relationships and Audit History. The Ontology tab itself is the original Pulse graph. */
import { useMemo, useState } from "react";
import { actions, useMuz, type MuzState } from "../store";
import { AGENTS, CUSTOMER_BY_ID, CUSTOMERS, PRODUCT_BY_SKU, PRODUCTS, STAFF, SUPPLIERS } from "../dataset";
import { customerOf, orderStatusText, orderValue, productLabel, shipments, stockTable } from "../selectors";
import { dmy, eur, whenLabel } from "../format";
import { Badge, Btn, Card, Chips, DataTable, Grid, Page, PageHead, Row, SearchBox } from "../ui";
import { DemoStrip } from "../MuzPage";
import { ONTO_EDGES, ONTO_NODES } from "../../logic/data";
import type { RecordRef, Tone } from "../types";

type Rec = { key: string; type: string; id: string; title: string; detail: string; status: string; tone: Tone; ref?: RecordRef };

const TYPES = ["Orders", "Order Lines", "Customers", "Wholesale Accounts", "Contacts", "Products", "SKUs", "Inventory", "Invoices", "Shipments", "Support Cases", "Suppliers", "Purchase Orders", "Employees", "Agent Actions"];

function buildRecords(s: MuzState): Record<string, Rec[]> {
  const R: Record<string, Rec[]> = {};
  R["Orders"] = s.orders.map((o) => ({ key: o.id, type: "Orders", id: o.id, title: `${customerOf(o).name}`, detail: `${productLabel(o)} · ${eur(orderValue(o))}`, status: orderStatusText(s, o), tone: s.issues.some((i) => i.orderId === o.id && !i.resolved) ? "warn" : "neutral", ref: { type: "order", id: o.id } }));
  R["Order Lines"] = s.orders.flatMap((o) => o.lines.map((l, i) => ({ key: `${o.id}-${i}`, type: "Order Lines", id: `${o.id}-L${i + 1}`, title: PRODUCT_BY_SKU[l.sku].short, detail: `${l.qty} × ${eur(l.unitPrice)} on ${o.id}`, status: eur(l.qty * l.unitPrice), tone: "neutral" as Tone, ref: { type: "order" as const, id: o.id } })));
  R["Customers"] = CUSTOMERS.filter((c) => c.type === "retail").map((c) => ({ key: c.id, type: "Customers", id: c.id, title: c.name, detail: `${c.country} · since ${c.since}`, status: "Retail", tone: "neutral" as Tone, ref: { type: "customer" as const, id: c.id } }));
  R["Wholesale Accounts"] = CUSTOMERS.filter((c) => c.type !== "retail").map((c) => ({ key: c.id, type: "Wholesale Accounts", id: c.id, title: c.name, detail: `${c.terms} · limit ${eur(c.creditLimit || 0)}`, status: c.type === "school" ? "School" : "Reseller", tone: "neutral" as Tone, ref: { type: "customer" as const, id: c.id } }));
  R["Contacts"] = CUSTOMERS.filter((c) => c.contact).map((c) => ({ key: "ct-" + c.id, type: "Contacts", id: "CT-" + c.id.slice(2, 6).toUpperCase(), title: c.contact!, detail: `${c.name} · ${c.email}`, status: "Demo contact", tone: "neutral" as Tone, ref: { type: "customer" as const, id: c.id } }));
  R["Products"] = PRODUCTS.map((p) => ({ key: p.sku, type: "Products", id: p.sku, title: p.name, detail: `${p.category} · ${eur(p.price)}`, status: "Listed", tone: "neutral" as Tone, ref: { type: "product" as const, id: p.sku } }));
  R["SKUs"] = PRODUCTS.map((p) => ({ key: "sku-" + p.sku, type: "SKUs", id: p.sku, title: p.short, detail: `Pick location ${p.location}`, status: "Active", tone: "ok" as Tone, ref: { type: "product" as const, id: p.sku } }));
  R["Inventory"] = stockTable(s).map((r) => ({ key: "inv-" + r.product.sku, type: "Inventory", id: r.product.sku, title: r.product.short, detail: `On hand ${r.onHand} · allocated ${r.allocated} · available ${r.available}`, status: r.out ? "None available" : r.low ? "Low" : "Healthy", tone: (r.out ? "bad" : r.low ? "warn" : "ok") as Tone, ref: { type: "product" as const, id: r.product.sku } }));
  R["Invoices"] = s.invoices.map((i) => ({ key: i.id, type: "Invoices", id: i.id, title: CUSTOMER_BY_ID[i.customerId].name, detail: `${eur(i.amount)} · due ${dmy(i.due)}${i.orderId ? ` · ${i.orderId}` : ""}`, status: i.status === "paid" ? "Paid" : "Outstanding", tone: (i.status === "paid" ? "ok" : "warn") as Tone, ref: { type: "invoice" as const, id: i.id } }));
  R["Shipments"] = shipments(s).map((x) => ({ key: "sh-" + x.order.id, type: "Shipments", id: x.order.tracking?.ref || `PACK-${x.order.id}`, title: `${x.order.id} to ${x.order.destination}`, detail: x.order.tracking ? `${x.order.tracking.carrier} · ${x.order.tracking.lastUpdate}` : "Not yet dispatched", status: x.status, tone: (x.order.tracking?.status === "no_update" ? "bad" : "neutral") as Tone, ref: { type: "order" as const, id: x.order.id } }));
  R["Support Cases"] = s.conversations.map((c) => ({ key: c.id, type: "Support Cases", id: c.id, title: c.subject, detail: `${CUSTOMER_BY_ID[c.customerId].name} · ${c.channel}`, status: c.status === "reply_approved" ? "Reply approved (demo)" : c.status === "draft_ready" ? "Draft ready" : "Open", tone: (c.status === "reply_approved" ? "ok" : "warn") as Tone, ref: { type: "conversation" as const, id: c.id } }));
  R["Suppliers"] = SUPPLIERS.map((x) => ({ key: x.id, type: "Suppliers", id: x.id, title: x.name, detail: `${x.speciality} · ${x.leadTimeDays} day lead time`, status: "Mock", tone: "neutral" as Tone, ref: { type: "supplier" as const, id: x.id } }));
  R["Purchase Orders"] = s.pos.map((p) => ({ key: p.id, type: "Purchase Orders", id: p.id, title: `${p.qty} × ${PRODUCT_BY_SKU[p.sku].short}`, detail: `${SUPPLIERS.find((x) => x.id === p.supplierId)!.name} · ${eur(p.qty * p.unitCost)} est.`, status: p.status, tone: (p.status === "received" ? "ok" : p.status === "approved" ? "info" : "warn") as Tone, ref: { type: "po" as const, id: p.id } }));
  R["Employees"] = STAFF.map((p) => ({ key: p.id, type: "Employees", id: p.id.toUpperCase(), title: p.name, detail: `${p.dept} · ${p.role}`, status: p.demo ? "Fictional demo" : "Call participant", tone: "neutral" as Tone, ref: { type: "staff" as const, id: p.id } }));
  R["Agent Actions"] = [
    ...s.approvals.map((a) => ({ key: a.id, type: "Agent Actions", id: a.id, title: a.title, detail: `${AGENTS.find((x) => x.id === a.agentId)!.name} proposal`, status: a.status === "pending" ? "Needs approval" : a.status, tone: (a.status === "pending" ? "warn" : a.status === "approved" ? "ok" : "neutral") as Tone, ref: a.ref })),
    ...s.runs.slice(0, 10).map((r) => ({ key: r.id, type: "Agent Actions", id: r.id, title: r.summary.slice(0, 80), detail: `${AGENTS.find((x) => x.id === r.agentId)!.name} · ${whenLabel(r.at)}`, status: r.outcome.replace("_", " "), tone: "neutral" as Tone, ref: r.refs[0] })),
  ];
  return R;
}

/* ── relationships ─────────────────────────────────────────────────────── */
interface Rel { pred: string; ref: RecordRef; label: string; sub?: string }
function relationsOf(s: MuzState, ref: RecordRef): { title: string; sub: string; rels: Rel[] } {
  const rels: Rel[] = [];
  if (ref.type === "order") {
    const o = s.orders.find((x) => x.id === ref.id)!;
    const c = customerOf(o);
    rels.push({ pred: "placed by", ref: { type: "customer", id: c.id }, label: c.name, sub: c.country });
    o.lines.forEach((l) => rels.push({ pred: "contains", ref: { type: "product", id: l.sku }, label: PRODUCT_BY_SKU[l.sku].short, sub: `${l.qty} × ${eur(l.unitPrice)}` }));
    if (o.invoiceId) rels.push({ pred: "generates", ref: { type: "invoice", id: o.invoiceId }, label: o.invoiceId, sub: eur(s.invoices.find((i) => i.id === o.invoiceId)?.amount ?? 0) });
    if (o.tracking || o.stage === "packed") rels.push({ pred: "requires", ref: { type: "order", id: o.id }, label: o.tracking ? `Shipment ${o.tracking.ref}` : "Shipment (packing)", sub: o.destination });
    s.conversations.filter((x) => x.orderId === o.id).forEach((x) => rels.push({ pred: "has case", ref: { type: "conversation", id: x.id }, label: x.subject, sub: x.channel }));
    s.tasks.filter((t) => t.ref.type === "order" && t.ref.id === o.id).forEach((t) => rels.push({ pred: "has task", ref: { type: "task", id: t.id }, label: t.title }));
    s.approvals.filter((a) => a.ref.type === "order" && a.ref.id === o.id).forEach((a) => rels.push({ pred: "agent action", ref: { type: "order", id: o.id }, label: a.title, sub: a.status }));
    return { title: `${o.id} · ${c.name}`, sub: "Order", rels };
  }
  if (ref.type === "customer") {
    const c = CUSTOMER_BY_ID[ref.id];
    s.orders.filter((o) => o.customerId === c.id).forEach((o) => rels.push({ pred: "places", ref: { type: "order", id: o.id }, label: `${o.id} · ${productLabel(o)}`, sub: eur(orderValue(o)) }));
    s.invoices.filter((i) => i.customerId === c.id && i.status === "outstanding").forEach((i) => rels.push({ pred: "holds", ref: { type: "invoice", id: i.id }, label: `${i.id} outstanding`, sub: eur(i.amount) }));
    s.conversations.filter((x) => x.customerId === c.id).forEach((x) => rels.push({ pred: "has case", ref: { type: "conversation", id: x.id }, label: x.subject }));
    return { title: c.name, sub: c.type === "retail" ? "Customer" : "Wholesale account", rels };
  }
  if (ref.type === "product") {
    const p = PRODUCT_BY_SKU[ref.id];
    const st = stockTable(s).find((r) => r.product.sku === p.sku)!;
    rels.push({ pred: "has stock", ref, label: `Inventory: ${st.available} available`, sub: `${st.onHand} on hand, ${st.allocated} allocated` });
    s.orders.filter((o) => o.lines.some((l) => l.sku === p.sku)).forEach((o) => rels.push({ pred: "ordered in", ref: { type: "order", id: o.id }, label: `${o.id} · ${customerOf(o).name}`, sub: orderStatusText(s, o) }));
    s.pos.filter((x) => x.sku === p.sku).forEach((x) => rels.push({ pred: "replenished by", ref: { type: "po", id: x.id }, label: x.id, sub: x.status }));
    const sup = SUPPLIERS.find((x) => x.id === p.supplierId)!;
    rels.push({ pred: "supplied by", ref: { type: "supplier", id: sup.id }, label: sup.name, sub: "mock" });
    return { title: p.name, sub: "Product", rels };
  }
  if (ref.type === "invoice") {
    const i = s.invoices.find((x) => x.id === ref.id)!;
    rels.push({ pred: "billed to", ref: { type: "customer", id: i.customerId }, label: CUSTOMER_BY_ID[i.customerId].name });
    if (i.orderId) rels.push({ pred: "for order", ref: { type: "order", id: i.orderId }, label: i.orderId });
    return { title: `${i.id} · ${eur(i.amount)}`, sub: "Invoice", rels };
  }
  if (ref.type === "conversation") {
    const c = s.conversations.find((x) => x.id === ref.id)!;
    rels.push({ pred: "from", ref: { type: "customer", id: c.customerId }, label: CUSTOMER_BY_ID[c.customerId].name });
    if (c.orderId) rels.push({ pred: "relates to", ref: { type: "order", id: c.orderId }, label: c.orderId });
    return { title: c.subject, sub: "Support case", rels };
  }
  if (ref.type === "po") {
    const p = s.pos.find((x) => x.id === ref.id)!;
    rels.push({ pred: "replenishes", ref: { type: "product", id: p.sku }, label: PRODUCT_BY_SKU[p.sku].short });
    rels.push({ pred: "placed with", ref: { type: "supplier", id: p.supplierId }, label: SUPPLIERS.find((x) => x.id === p.supplierId)!.name });
    return { title: `${p.id} · ${p.qty} units`, sub: "Purchase order", rels };
  }
  return { title: `${ref.type} ${ref.id}`, sub: "Record", rels };
}

function RelGraph({ s, center, onPick }: { s: MuzState; center: RecordRef; onPick: (r: RecordRef) => void }) {
  const { title, sub, rels } = relationsOf(s, center);
  const shown = rels.slice(0, 10);
  const pts = shown.map((_, i) => {
    const a = (i / Math.max(1, shown.length)) * Math.PI * 2 - Math.PI / 2;
    return { x: 50 + 39 * Math.cos(a), y: 50 + 38 * Math.sin(a) };
  });
  return (
    <div style={{ position: "relative", height: 520, minWidth: 560 }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {pts.map((p, i) => <line key={i} x1="50" y1="50" x2={p.x} y2={p.y} stroke="var(--border-strong)" strokeWidth="0.35" vectorEffect="non-scaling-stroke" strokeDasharray="3 3" />)}
      </svg>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)", padding: "14px 18px", borderRadius: "var(--card-r,18px)", background: "var(--accent-soft)", border: "1px solid var(--accent)", textAlign: "center", maxWidth: 220, boxShadow: "0 10px 40px var(--accent-faint)" }}>
        <div style={{ fontSize: 10, letterSpacing: ".12em", color: "var(--accent)", fontFamily: "var(--mono)" }}>{sub.toUpperCase()}</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 5, lineHeight: 1.3 }}>{title}</div>
      </div>
      {shown.map((r, i) => (
        <button key={i} className="mz-click" onClick={() => onPick(r.ref)} style={{ position: "absolute", left: `${pts[i].x}%`, top: `${pts[i].y}%`, transform: "translate(-50%,-50%)", width: 168, textAlign: "left", padding: "9px 12px", borderRadius: "var(--r-md,13px)", background: "var(--overlay)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--ink)", backdropFilter: "blur(10px)" }}>
          <div style={{ fontSize: 9.5, letterSpacing: ".08em", color: "var(--accent)", fontFamily: "var(--mono)" }}>{r.pred.toUpperCase()}</div>
          <div style={{ fontSize: 12.5, fontWeight: 500, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
          {r.sub && <div style={{ fontSize: 11, color: "var(--dim)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.sub}</div>}
        </button>
      ))}
    </div>
  );
}


function Schema() {
  const [sel, setSel] = useState<string>("Orders");
  const nodes = (ONTO_NODES as [string, string, number, number, number, string][]);
  const selNode = nodes.find((n) => n[0] === sel) || nodes[0];
  const kindColor: Record<string, string> = { ledger: "var(--accent)", entity: "#8fb5a6", module: "#a99ac9" };
  const pos = (x: number, y: number) => ({ left: `${(x / 1000) * 100}%`, top: `${(y / 600) * 100}%` });
  return (
    <Card title="How Muzikkon's records relate" hint="Gold records are the kind the ERP already holds (orders, stock, invoices, customer accounts). Green are Pulse-side records. Click a record or a link for its meaning.">
      <div style={{ overflowX: "auto" }}>
        <div style={{ position: "relative", minWidth: 760, aspectRatio: "1000 / 600" }}>
          <svg viewBox="0 0 1000 600" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
            {(ONTO_EDGES as number[][]).map((e, i) => <line key={i} x1={e[0]} y1={e[1]} x2={e[2]} y2={e[3]} stroke="var(--border-strong)" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}
          </svg>
          {nodes.map((n) => {
            const pred = n[1] === "predicate";
            const on = sel === n[0];
            return (
              <button key={n[0]} onClick={() => setSel(n[0])} className="mz-click" style={{ position: "absolute", ...pos(n[2], n[3]), transform: "translate(-50%,-50%)", padding: pred ? "2px 9px" : "7px 13px", borderRadius: pred ? 99 : "var(--r-sm,10px)", whiteSpace: "nowrap", cursor: "pointer", fontSize: pred ? 10.5 : n[4] ? 13 : 12, fontWeight: pred ? 400 : 500, color: pred ? "var(--dim)" : "var(--ink)", background: pred ? "var(--surface-2)" : "var(--overlay)", border: pred ? `1px dashed ${on ? "var(--accent)" : "var(--border-strong)"}` : `1px solid ${on ? "var(--accent)" : "var(--border)"}`, boxShadow: on && !pred ? "0 6px 22px var(--accent-faint)" : undefined, display: "flex", alignItems: "center", gap: 7 }}>
                {!pred && <span style={{ width: 7, height: 7, borderRadius: 3, background: kindColor[n[1]] || "var(--accent)" }} />}
                {n[0]}
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ marginTop: 12, padding: "12px 15px", borderRadius: "var(--r-md,14px)", background: "var(--chip)", border: "1px solid var(--chip-border)", fontSize: 12.5, lineHeight: 1.55, color: "var(--body)" }}>
        <b style={{ color: "var(--ink)" }}>{selNode[0]}.</b> {selNode[5]}
      </div>
    </Card>
  );
}

export default function RecordsExtra({ tab }: { tab: string }) {
  const s = useMuz();
  const [type, setType] = useState("Orders");
  const [q, setQ] = useState("");
  const [center, setCenter] = useState<RecordRef>({ type: "order", id: "MZ-1042" });
  const [trail, setTrail] = useState<RecordRef[]>([]);
  const [auditKind, setAuditKind] = useState("all");
  const all = useMemo(() => buildRecords(s), [s]);

  if (tab === "explorer") {
    const rows = (all[type] || []).filter((r) => !q || `${r.id} ${r.title} ${r.detail} ${r.status}`.toLowerCase().includes(q.toLowerCase()));
    const total = Object.values(all).reduce((a, x) => a + x.length, 0);
    return (
      <div>
        <DemoStrip />
        <Page>
          <PageHead eyebrow="Records" title="Records Explorer" sub={`${total} records across ${TYPES.length} entity types, all from the one illustrative dataset. Click any row to open it.`} right={<SearchBox value={q} onChange={setQ} placeholder={`Search ${type.toLowerCase()}`} />} />
          <Chips options={TYPES.map((t) => ({ id: t, label: t, count: all[t].length }))} value={type} onChange={(t) => { setType(t); setQ(""); }} />
          <Card flush title={type} hint={`${rows.length} of ${all[type].length} records`}>
            <DataTable
              rows={rows}
              rowKey={(r) => r.key}
              onRow={(r) => r.ref && actions.open(r.ref)}
              empty="No record matches that search."
              cols={[
                { key: "id", label: "ID", w: "150px", sort: (a, b) => a.id.localeCompare(b.id), render: (r) => <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: 12 }}>{r.id}</span> },
                { key: "t", label: "Record", w: "1.5fr", sort: (a, b) => a.title.localeCompare(b.title), render: (r) => <span style={{ color: "var(--ink)", fontWeight: 500 }}>{r.title}</span> },
                { key: "d", label: "Detail", w: "2fr", render: (r) => <span style={{ color: "var(--dim)" }}>{r.detail}</span> },
                { key: "s", label: "Status", w: "180px", render: (r) => <Badge tone={r.tone}>{r.status}</Badge> },
              ]}
            />
          </Card>
        </Page>
      </div>
    );
  }

  if (tab === "relationships") {
    const go = (r: RecordRef) => { setTrail((t) => [...t, center].slice(-6)); setCenter(r); };
    const starts: RecordRef[] = [{ type: "order", id: "MZ-1042" }, { type: "order", id: "B2B-301" }, { type: "order", id: "MZ-1044" }, { type: "order", id: "MZ-1041" }, { type: "product", id: "MZ-HRP-015" }, { type: "customer", id: "c-brigid" }];
    const rel = relationsOf(s, center);
    return (
      <div>
        <DemoStrip />
        <Page>
          <PageHead eyebrow="Records" title="Relationships" sub="Pulse links every record to the records around it. Click a connected record to move to it." right={<Row>{trail.length > 0 && <Btn size="sm" onClick={() => { setCenter(trail[trail.length - 1]); setTrail(trail.slice(0, -1)); }}>Back</Btn>}<Btn size="sm" onClick={() => actions.open(center)}>Open record</Btn></Row>} />
          <Row gap={7}>
            <span style={{ fontSize: 11.5, color: "var(--faint)" }}>Start from</span>
            {starts.map((r) => <button key={r.id} className="mz-chip" onClick={() => { setTrail([]); setCenter(r); }} style={{ height: 28, padding: "0 11px", borderRadius: 99, fontSize: 12, cursor: "pointer", background: center.id === r.id ? "var(--accent-soft)" : "var(--surface-2)", border: `1px solid ${center.id === r.id ? "var(--accent-line)" : "var(--border)"}`, color: center.id === r.id ? "var(--accent)" : "var(--dim)" }}>{r.id}</button>)}
          </Row>
          <Schema />
          <Grid cols="minmax(0,2.2fr) minmax(280px,1fr)">
            <Card pad={10}><div style={{ overflowX: "auto" }}><RelGraph s={s} center={center} onPick={go} /></div></Card>
            <Card title={rel.title} hint={`${rel.sub} · ${rel.rels.length} connections`}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {rel.rels.map((r, i) => (
                  <button key={i} onClick={() => go(r.ref)} className="mz-row mz-click" style={{ display: "flex", gap: 10, alignItems: "baseline", textAlign: "left", padding: "9px 2px", background: "none", border: 0, borderTop: i ? "1px solid var(--border)" : 0, cursor: "pointer", color: "var(--ink)" }}>
                    <span style={{ width: 84, flex: "none", fontSize: 10, letterSpacing: ".06em", color: "var(--accent)", fontFamily: "var(--mono)" }}>{r.pred.toUpperCase()}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5 }}>{r.label}{r.sub && <span style={{ color: "var(--dim)" }}> · {r.sub}</span>}</span>
                  </button>
                ))}
                {rel.rels.length === 0 && <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No linked records.</div>}
              </div>
            </Card>
          </Grid>
        </Page>
      </div>
    );
  }

  /* audit */
  const kind = (e: MuzState["activity"][number]) => (e.approval ? "Approval" : e.actorType === "agent" ? "Agent proposal" : e.actorType === "staff" ? "Staff action" : "System change");
  const kinds = ["all", "Approval", "Staff action", "Agent proposal", "System change"];
  const events = [...s.activity].sort((a, b) => b.at.localeCompare(a.at)).filter((e) => auditKind === "all" || kind(e) === auditKind);
  return (
    <div>
      <DemoStrip />
      <Page>
        <PageHead eyebrow="Records" title="Audit History" sub="Staff actions, approvals and system changes in one trail. Entries marked simulated were produced by the demo, not by a real system." />
        <Chips options={kinds.map((k) => ({ id: k, label: k === "all" ? "Everything" : k, count: k === "all" ? s.activity.length : s.activity.filter((e) => kind(e) === k).length }))} value={auditKind} onChange={setAuditKind} />
        <Card flush>
          <DataTable
            rows={events}
            rowKey={(e) => e.id}
            onRow={(e) => e.ref && actions.open(e.ref)}
            cols={[
              { key: "at", label: "When", w: "130px", render: (e) => <span style={{ color: "var(--dim)" }}>{whenLabel(e.at)}</span> },
              { key: "k", label: "Type", w: "130px", render: (e) => <Badge tone={e.approval ? "accent" : "neutral"}>{kind(e)}</Badge> },
              { key: "a", label: "Actor", w: "1fr", render: (e) => <span style={{ color: "var(--ink)" }}>{e.actor}</span> },
              { key: "t", label: "What happened", w: "3fr", render: (e) => e.text },
              { key: "s", label: "Source", w: "120px", render: (e) => <span style={{ color: "var(--dim)" }}>{e.source}</span> },
              { key: "m", label: "Basis", w: "170px", render: (e) => <Badge tone={e.simulated ? "info" : "neutral"}>{e.simulated ? "Pulse demo (simulated)" : "Current process"}</Badge> },
            ]}
          />
        </Card>
        <div style={{ fontSize: 11.5, color: "var(--faint)" }}>Approvals decided here only change demo state. Nothing was sent to a real system.</div>
      </Page>
    </div>
  );
}

/* Settings: organisation, teams, systems, AI controls, experience. */
import { useState } from "react";
import { actions, useMuz } from "../store";
import { AGENTS, COMPANY, DEPARTMENTS, INTEGRATIONS, STAFF } from "../dataset";
import { pendingApprovals, totals } from "../selectors";
import { whenLabel } from "../format";
import { Avatar, Badge, Btn, Callout, Card, DataTable, DemoTag, Grid, KV, Label, Page, PageHead, Row, TONE } from "../ui";
import type { Tone } from "../types";

function Toggle({ on, onChange, locked, label }: { on: boolean; onChange?: (v: boolean) => void; locked?: boolean; label?: string }) {
  return (
    <button aria-label={label} title={locked ? "Fixed in this demo" : undefined} onClick={() => !locked && onChange?.(!on)} style={{ flex: "none", width: 38, height: 22, borderRadius: 99, border: 0, padding: 0, position: "relative", cursor: locked ? "not-allowed" : "pointer", background: on ? "var(--accent)" : "var(--track)", opacity: locked ? 0.6 : 1, transition: "background .2s var(--ease)" }}>
      <span style={{ position: "absolute", top: 3, left: on ? 19 : 3, width: 16, height: 16, borderRadius: 99, background: on ? "var(--on-accent)" : "var(--dim)", transition: "left .2s var(--ease)" }} />
    </button>
  );
}

const ROLES: { id: string; label: string; caps: Record<string, boolean | "draft"> }[] = [
  { id: "Management", label: "Management", caps: { view: true, orders: true, import: true, reply: true, refund: true, stock: true, po: true, finance: true, credit: true } },
  { id: "Sales", label: "Sales", caps: { view: true, orders: true, import: true, reply: "draft", refund: false, stock: false, po: false, finance: false, credit: false } },
  { id: "Customer Support", label: "Customer Support", caps: { view: true, orders: false, import: false, reply: true, refund: "draft", stock: false, po: false, finance: false, credit: false } },
  { id: "Warehouse", label: "Warehouse", caps: { view: true, orders: true, import: false, reply: false, refund: false, stock: "draft", po: false, finance: false, credit: false } },
  { id: "Procurement", label: "Procurement", caps: { view: true, orders: false, import: false, reply: false, refund: false, stock: "draft", po: true, finance: false, credit: false } },
  { id: "Finance", label: "Finance", caps: { view: true, orders: false, import: false, reply: false, refund: "draft", stock: false, po: false, finance: true, credit: "draft" } },
  { id: "Marketing", label: "Marketing", caps: { view: true, orders: false, import: false, reply: false, refund: false, stock: false, po: false, finance: false, credit: false } },
];
const CAPS: [string, string][] = [["view", "View records"], ["orders", "Update order status"], ["import", "Approve ERP import"], ["reply", "Approve customer replies"], ["refund", "Approve refunds"], ["stock", "Change inventory"], ["po", "Approve purchase orders"], ["finance", "Approve reminders"], ["credit", "Credit decisions"]];

export default function SettingsPage({ tab, v }: { tab: string; v: any }) {
  const s = useMuz();
  const t = totals(s);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean | "draft">>>(() => Object.fromEntries(ROLES.map((r) => [r.id, { ...r.caps }])));
  const [thr, setThr] = useState({ refund: true, reminder: true, po: true, import: true, reply: true, escalate: true });
  const [steps, setSteps] = useState<Record<number, boolean>>({});

  if (tab === "organisation") {
    return (
      <Page>
        <PageHead eyebrow="Settings" title="Organisation" sub="What is public, what came from the 4 November 2026 sales call, and what is still unverified." />
        <Grid min={340}>
          <Card title="Company details" hint="Public information from muzikkon.com">
            <KV cols={2} rows={[["Company", COMPANY.name], ["Trading name", COMPANY.trading], ["Industry", COMPANY.industry], ["Location", COMPANY.address], ["Website", COMPANY.website], ["Public contact", COMPANY.email], ["Distribution", COMPANY.distribution], ["Showroom", COMPANY.showroom]]} />
          </Card>
          <Card title="People in this demo" hint="Call participants carry no asserted job titles">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {STAFF.filter((x) => x.known).map((p) => (
                <Row key={p.id} gap={12}><Avatar initials={p.initials} tint={p.tint} size={34} /><div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div><div style={{ fontSize: 12, color: "var(--dim)" }}>{p.id === "umer" ? "Primary contact on the sales call" : "Additional participant on the sales call"}</div></div></Row>
              ))}
              <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.55 }}>Six further staff profiles are clearly fictional and exist only to make the demo realistic. See Teams &amp; Permissions.</div>
            </div>
          </Card>
        </Grid>
        <Grid min={340}>
          <Card title="Operating model (from the call)" right={<Badge tone="ok">Verified in the call</Badge>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "var(--body)", lineHeight: 1.55 }}>
              <div><b style={{ color: "var(--ink)" }}>Existing systems:</b> Shopify website, a custom-built ERP, Google Ads, Google Shopping, Meta Ads, SEO and social marketing, existing customer communications.</div>
              <div><b style={{ color: "var(--ink)" }}>The ERP already handles:</b> invoicing, stock management, order management, customer information, and shop and school customer accounts.</div>
              <div><b style={{ color: "var(--ink)" }}>Critical discovery:</b> Shopify is not integrated with the ERP. Online orders are transferred between systems by hand.</div>
              <div><b style={{ color: "var(--ink)" }}>Direction:</b> Muzikkon intends to upgrade the ERP. Pulse sits alongside it rather than replacing it.</div>
            </div>
          </Card>
          <Card title="Scale and limits" right={<Badge tone="warn">Not verified</Badge>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "var(--body)", lineHeight: 1.55 }}>
              <div><b style={{ color: "var(--ink)" }}>Order volume (indicated on the call):</b> about 10 orders a week in quiet periods, 10 to 15 a day when busy. The demo shows {t.count} orders in flight.</div>
              <div><b style={{ color: "var(--ink)" }}>ERP API:</b> Umer indicated one may be obtainable. Its availability and capabilities have not been technically verified.</div>
              <div><b style={{ color: "var(--ink)" }}>Data:</b> every customer, order, invoice, price-driven total and marketing figure in this demo is illustrative. Product names and list prices follow the public website.</div>
            </div>
          </Card>
        </Grid>
      </Page>
    );
  }

  if (tab === "teams") {
    return (
      <Page>
        <PageHead eyebrow="Settings" title="Teams &amp; Permissions" sub="Seven demo roles. Anything an agent proposes still needs a person with the right permission." right={<Badge tone="neutral">Demo roles, not Muzikkon's real structure</Badge>} />
        <Card title="Permission matrix" hint="Click a cell to change it. Draft means the person can prepare but not approve." flush>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, color: "var(--faint)", fontWeight: 500 }}>Capability</th>
                  {ROLES.map((r) => <th key={r.id} style={{ padding: "10px 8px", fontSize: 11, color: "var(--faint)", fontWeight: 500, whiteSpace: "nowrap" }}>{r.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {CAPS.map(([k, label]) => (
                  <tr key={k} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "11px 16px", fontSize: 12.5 }}>{label}</td>
                    {ROLES.map((r) => {
                      const val = matrix[r.id][k];
                      return (
                        <td key={r.id} style={{ textAlign: "center", padding: "6px 4px" }}>
                          <button onClick={() => { setMatrix((m) => ({ ...m, [r.id]: { ...m[r.id], [k]: val === true ? "draft" : val === "draft" ? false : true } })); actions.toast(`${r.label}: ${label} changed (demo only)`, "info"); }} style={{ minWidth: 54, height: 24, border: `1px solid ${val === true ? "var(--accent-line)" : "var(--border)"}`, borderRadius: 8, background: val === true ? "var(--accent-soft)" : "none", color: val === true ? "var(--accent)" : val === "draft" ? "var(--warn)" : "var(--faint)", fontSize: 11, cursor: "pointer" }}>
                            {val === true ? "Yes" : val === "draft" ? "Draft" : "No"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="People" hint="Two call participants plus six fictional demo profiles. Email addresses are synthetic and can never send or receive mail." flush>
          <DataTable
            rows={STAFF}
            rowKey={(r) => r.id}
            onRow={(r) => actions.open({ type: "staff", id: r.id })}
            cols={[
              { key: "n", label: "Name", w: "1.2fr", sort: (a, b) => a.name.localeCompare(b.name), render: (r) => <Row gap={9}><Avatar initials={r.initials} tint={r.tint} size={26} /><span style={{ color: "var(--ink)", fontWeight: 500 }}>{r.name}</span></Row> },
              { key: "d", label: "Department", w: "1fr", render: (r) => r.dept },
              { key: "r", label: "Role", w: "1.6fr", render: (r) => r.role },
              { key: "e", label: "Email", w: "1.6fr", render: (r) => <span style={{ color: "var(--dim)" }}>{r.email}</span> },
              { key: "t", label: "Profile", w: "120px", render: (r) => (r.demo ? <Badge tone="neutral">Fictional demo</Badge> : <Badge tone="accent">Call participant</Badge>) },
            ]}
          />
        </Card>
        <Card title="Departments"><Row gap={8}>{DEPARTMENTS.map((d) => <Badge key={d} tone="neutral">{d} · {STAFF.filter((x) => x.dept === d).length}</Badge>)}</Row></Card>
      </Page>
    );
  }

  if (tab === "systems") {
    const state = (i: (typeof INTEGRATIONS)[number]): { used: Tone; pulse: Tone; pulseLabel: string } => ({
      used: i.used.startsWith("Not") ? "neutral" : "ok",
      pulse: i.pulse === "simulated" ? "info" : "neutral",
      pulseLabel: i.pulse === "simulated" ? "Simulated in demo" : "Not connected",
    });
    return (
      <Page>
        <PageHead eyebrow="Settings" title="Systems &amp; Integrations" sub="Four different things are kept apart on this page. Nothing unverified is shown as connected." />
        <Grid min={220}>
          {[
            ["1. Used by Muzikkon", "Systems Muzikkon runs today, from the call and the public website.", "ok" as Tone],
            ["2. Connected to Pulse", "Live, working connections. There are none in this demo.", "neutral" as Tone],
            ["3. Proposed integration", "What Pulse would connect to, subject to technical validation.", "accent" as Tone],
            ["4. Simulated demonstration", "Data the demo fakes so you can see the workflow.", "info" as Tone],
          ].map(([t1, d, tone]) => (
            <div key={t1 as string} style={{ padding: "13px 15px", borderRadius: "var(--card-r,18px)", background: TONE[tone as Tone].bg, border: `1px solid ${TONE[tone as Tone].line}` }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: TONE[tone as Tone].fg }}>{t1 as string}</div>
              <div style={{ fontSize: 12, color: "var(--body)", marginTop: 5, lineHeight: 1.5 }}>{d as string}</div>
            </div>
          ))}
        </Grid>
        <Card title="Proposed architecture" hint="Pulse reads and prepares. The ERP stays the ledger and the source of truth for stock and invoices.">
          <div style={{ display: "flex", alignItems: "stretch", gap: 0, flexWrap: "wrap", justifyContent: "center" }}>
            {[["Shopify", "Website orders, live chat, tracking page", "ok"], ["Pulse", "Matching, oversight, approvals, audit", "accent"], ["Muzikkon ERP", "Invoicing, stock, orders, customer accounts", "ok"]].map(([name, sub, tone], i) => (
              <div key={name} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 112, gap: 4, color: "var(--faint)", fontSize: 10.5 }}><span style={{ borderTop: "2px dashed var(--border-strong)", width: "100%" }} />proposed, not verified</div>}
                <div style={{ width: 210, padding: "16px 16px", borderRadius: "var(--card-r,18px)", background: tone === "accent" ? "var(--accent-soft)" : "var(--surface-2)", border: `1px solid ${tone === "accent" ? "var(--accent-line)" : "var(--border)"}`, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: tone === "accent" ? "var(--accent)" : "var(--ink)" }}>{name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 5, lineHeight: 1.45 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Systems" flush>
          <DataTable
            rows={INTEGRATIONS}
            rowKey={(r) => r.id}
            cols={[
              { key: "n", label: "System", w: "1.1fr", render: (r) => <b style={{ color: "var(--ink)", fontWeight: 600 }}>{r.name}</b> },
              { key: "u", label: "1. Used by Muzikkon", w: "1.4fr", render: (r) => <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--body)" }}><span style={{ width: 6, height: 6, borderRadius: 2, flex: "none", background: state(r).used === "ok" ? "var(--ok)" : "var(--faint)" }} />{r.used}</span> },
              { key: "c", label: "2. Connected to Pulse", w: "150px", render: () => <Badge tone="neutral">Not connected</Badge> },
              { key: "p", label: "3. Proposed", w: "1.5fr", render: (r) => <span style={{ color: "var(--dim)" }}>{r.proposed}</span> },
              { key: "s", label: "4. Demo", w: "150px", render: (r) => <Badge tone={state(r).pulse}>{state(r).pulseLabel}</Badge> },
            ]}
          />
        </Card>
        <Card title="Notes per system">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {INTEGRATIONS.map((i) => <div key={i.id} style={{ display: "flex", gap: 14, padding: "10px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}><b style={{ width: 150, flex: "none", fontWeight: 500 }}>{i.name}</b><span style={{ color: "var(--dim)", lineHeight: 1.5 }}>{i.note}</span></div>)}
          </div>
        </Card>
      </Page>
    );
  }

  if (tab === "ai") {
    const rows: { k: keyof typeof thr; label: string; sub: string; locked?: boolean }[] = [
      { k: "import", label: "Creating ERP orders", sub: "Order Intake can prepare an import. A person approves it." },
      { k: "reply", label: "Sending customer emails and chat replies", sub: "Agents draft only. Nothing goes out without approval." },
      { k: "refund", label: "Confirming refunds", sub: "Every refund needs a person, whatever the amount." },
      { k: "reminder", label: "Sending overdue reminders", sub: "Finance Assistant drafts; Finance approves." },
      { k: "po", label: "Raising purchase orders and changing inventory quantities", sub: "Draft only. Stock changes on a recorded goods receipt." },
      { k: "escalate", label: "Escalate to a person when unsure", sub: "Agents hand over instead of guessing." },
    ];
    return (
      <Page>
        <PageHead eyebrow="Settings" title="AI Controls" sub="What agents may read, what they may propose, and what always needs a person." right={<Badge tone="ok" dot>Draft-only mode on</Badge>} />
        <Grid min={340}>
          <Card title="Approval thresholds" hint="Switch on to require a person. These are fixed on in this demo.">
            <div style={{ display: "flex", flexDirection: "column" }}>
              {rows.map((r) => (
                <div key={r.k} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 0", borderTop: "1px solid var(--border)" }}>
                  <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 500 }}>{r.label}</div><div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{r.sub}</div></div>
                  <Toggle on={thr[r.k]} locked label={r.label} />
                </div>
              ))}
            </div>
          </Card>
          <Card title="Draft-only communication" hint="Customer-facing text is always a draft.">
            <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 13, lineHeight: 1.55, color: "var(--body)" }}>
              <div style={{ padding: "12px 14px", borderRadius: "var(--r-md,14px)", background: "var(--chip)", border: "1px solid var(--chip-border)" }}>Customer Service writes replies from the real order and tracking record. A person edits and approves. Approval in this demo only marks the draft approved. No message is sent.</div>
              <div><b style={{ color: "var(--ink)" }}>Human escalation:</b> unsure or sensitive cases (refunds, credit holds, complaints) go to Management or the owner of the record, never auto-resolved.</div>
              <Row><Badge tone="neutral">Management</Badge><Badge tone="neutral">Customer Support</Badge><Badge tone="neutral">Finance</Badge></Row>
            </div>
          </Card>
        </Grid>
        <Card title="Agent permissions" hint="Read and propose only. No agent can act without a person." flush>
          <DataTable
            rows={AGENTS}
            rowKey={(r) => r.id}
            onRow={(r) => actions.open({ type: "agent", id: r.id })}
            cols={[
              { key: "n", label: "Agent", w: "1.2fr", render: (r) => <b style={{ color: "var(--ink)", fontWeight: 600 }}>{r.name}</b> },
              { key: "r", label: "May read", w: "2fr", render: (r) => <span style={{ color: "var(--dim)" }}>{r.data.join(", ")}</span> },
              { key: "p", label: "May propose", w: "90px", render: () => <Badge tone="ok">Yes</Badge> },
              { key: "e", label: "Act alone", w: "90px", render: () => <Badge tone="neutral">Never</Badge> },
              { key: "a", label: "Pending", w: "90px", render: (r) => String(pendingApprovals(s).filter((a) => a.agentId === r.id).length) },
            ]}
          />
        </Card>
        <Grid min={340}>
          <Card title="Data access boundaries">
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12.5, lineHeight: 1.5 }}>
              <div><Badge tone="ok">Can read</Badge> <span style={{ color: "var(--body)" }}>orders, stock levels, invoices and account terms, support threads, product information (demo data)</span></div>
              <div><Badge tone="bad">Cannot read</Badge> <span style={{ color: "var(--body)" }}>passwords, payment card or bank details, anything outside the demo dataset</span></div>
              <div><Badge tone="neutral">Not connected</Badge> <span style={{ color: "var(--body)" }}>Shopify, the ERP, email, carriers, banking and ad platforms</span></div>
            </div>
          </Card>
          <Card title="Run history" right={<Btn size="sm" onClick={() => actions.nav("Agents", "runs")}>All runs</Btn>}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {s.runs.slice(0, 5).map((r) => <div key={r.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: "1px solid var(--border)", fontSize: 12.5 }}><span style={{ width: 92, color: "var(--faint)", flex: "none" }}>{whenLabel(r.at)}</span><span style={{ color: "var(--body)" }}>{AGENTS.find((a) => a.id === r.agentId)!.name}: {r.summary.slice(0, 80)}{r.summary.length > 80 ? "…" : ""}</span></div>)}
            </div>
          </Card>
        </Grid>
      </Page>
    );
  }

  /* experience */
  const journey: [string, string, () => void][] = [
    ["Home: see the snapshot and the four issues", "Home", () => actions.nav("Home")],
    ["Orders: open MZ-1042 and simulate the Shopify to ERP import", "Orders · Channel Imports", () => actions.nav("Orders", "imports")],
    ["Inventory: review allocations and the 15 String harp shortage", "Inventory · Replenishment", () => actions.nav("Inventory", "replenishment")],
    ["Fulfilment: complete the lute quality check for MZ-1044", "Fulfilment · Quality Control", () => actions.nav("Fulfilment", "qc")],
    ["Customers: preview the AI shipping update for MZ-1041", "Customers · Conversations", () => actions.nav("Customers", "conversations")],
    ["Finance: prepare the INV-208 reminder for St Brigid's", "Finance · Receivables", () => actions.nav("Finance", "receivables")],
    ["Agents: see every proposal and approval in one place", "Agents · Approvals", () => actions.nav("Agents", "approvals")],
    ["Records: follow the ontology from order to customer to stock", "Records · Ontology", () => actions.nav("Records", "ontology")],
  ];
  return (
    <Page>
      <PageHead eyebrow="Settings" title="Experience" sub="Appearance and a suggested path through the demo." right={<Btn onClick={() => actions.reset()}>Reset demo</Btn>} />
      <Grid min={340}>
        <Card title="Appearance">
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn kind={v.theme !== "light" ? "soft" : "ghost"} onClick={() => v.theme === "light" && v.toggleTheme()}>Charcoal and gold (dark)</Btn>
            <Btn kind={v.theme === "light" ? "soft" : "ghost"} onClick={() => v.theme !== "light" && v.toggleTheme()}>Cream and gold (light)</Btn>
          </div>
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 12, lineHeight: 1.55 }}>Colours follow Muzikkon's public branding: charcoal type, antique gold accents and warm neutrals. Values are approximations from the website, not official brand specifications.</div>
          <div style={{ marginTop: 14 }}><Label>Shortcuts</Label><div style={{ fontSize: 12.5, color: "var(--body)", marginTop: 8, lineHeight: 1.7 }}>⌘K or Ctrl K opens search across orders, customers, products and pages.</div></div>
        </Card>
        <Card title="Demo state" right={<DemoTag>Local only</DemoTag>}>
          <KV cols={2} rows={[["Snapshot date", "Friday 6 November 2026"], ["Orders in flight", String(t.count)], ["Flagged", String(t.flagged)], ["Proposals pending", String(pendingApprovals(s).length)]]} />
          <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 12, lineHeight: 1.55 }}>Everything you change is stored in memory only and resets on reload or with Reset demo.</div>
        </Card>
      </Grid>
      <Card title="Suggested demo path" hint="Eight steps, about ten to twenty minutes. Tick them off as you go.">
        <div style={{ display: "flex", flexDirection: "column" }}>
          {journey.map(([label, where, go], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderTop: i ? "1px solid var(--border)" : 0 }}>
              <button onClick={() => setSteps((x) => ({ ...x, [i]: !x[i] }))} aria-label="Mark step" style={{ flex: "none", width: 20, height: 20, borderRadius: 7, border: `1.5px solid ${steps[i] ? "var(--accent)" : "var(--border-strong)"}`, background: steps[i] ? "var(--accent)" : "none", color: "var(--on-accent)", cursor: "pointer", fontSize: 11, padding: 0 }}>{steps[i] ? "✓" : ""}</button>
              <span style={{ fontSize: 11, color: "var(--faint)", width: 16 }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13, color: steps[i] ? "var(--dim)" : "var(--ink)", textDecoration: steps[i] ? "line-through" : "none" }}>{label}</div><div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 2 }}>{where}</div></div>
              <Btn size="sm" onClick={() => { go(); setSteps((x) => ({ ...x, [i]: true })); }}>Go</Btn>
            </div>
          ))}
        </div>
      </Card>
      <Callout tone="neutral" title="Honest limits">Pulse here is a frontend demonstration. It reads no live Shopify, ERP, email, banking or carrier data, and it sends, imports and pays nothing.</Callout>
    </Page>
  );
}

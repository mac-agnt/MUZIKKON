import { actions, useMuz, type MuzState } from "../../store";
import { Badge, Btn, Card, Grid, KV, Kpi, Page, PageHead, RecLink, Row, Thumb } from "../../ui";
import { attention, customerOf, exceptionsByCause, orderValue, productLabel, staffName } from "../../selectors";
import { dueLabel, eur } from "../../format";
import { FlagIcon, StageBadge, thumbOf } from "./shared";
import type { Issue, IssueKind, Order, Tone } from "../../types";

const KIND: Record<IssueKind, { label: string; tone: Tone; next: string }> = {
  erp_missing: { label: "Missing from ERP", tone: "warn", next: "Review the match in Channel Imports, then approve the simulated import." },
  qc_pending: { label: "Quality check pending", tone: "warn", next: "Finish the instrument checklist so the order can be packed before its dispatch date." },
  tracking_exception: { label: "Tracking exception", tone: "bad", next: "Ask the carrier for an update and prepare a customer message for approval." },
  credit_hold: { label: "Credit hold", tone: "bad", next: "A person decides: chase payment, or conditionally release. The invoice is never auto-marked paid." },
};

const RESOLVED_NOTE: Record<IssueKind, string> = {
  erp_missing: "Imported into the ERP (simulated). Stock allocated and invoice prepared.",
  qc_pending: "Quality check submitted. Order is eligible for packing.",
  tracking_exception: "Tracking exception cleared with a demo scan.",
  credit_hold: "Credit hold cleared.",
};

function Actions({ s, i, o }: { s: MuzState; i: Issue; o: Order }) {
  const conv = s.conversations.find((c) => c.orderId === o.id && c.kind === "tracking");
  const pendingApproval = s.approvals.find((a) => a.ref.type === "order" && a.ref.id === o.id && a.status === "pending");
  const open = <Btn size="sm" kind="ghost" onClick={() => actions.open({ type: "order", id: o.id })}>Open order</Btn>;
  switch (i.kind) {
    case "erp_missing":
      return <Row gap={8}><Btn size="sm" kind="primary" onClick={() => actions.setTab("Orders", "imports")}>Review and import</Btn>{open}</Row>;
    case "qc_pending":
      return <Row gap={8}><Btn size="sm" kind="primary" onClick={() => actions.nav("Fulfilment", "qc")}>Open quality check</Btn>{open}</Row>;
    case "tracking_exception":
      return (
        <Row gap={8}>
          <Btn size="sm" kind="primary" onClick={() => actions.requestCarrierUpdate(o.id)}>Request carrier update</Btn>
          <Btn size="sm" kind="soft" onClick={() => actions.open({ type: "conversation", id: conv?.id || "CV-01" })}>Open conversation</Btn>
          {open}
        </Row>
      );
    case "credit_hold":
      return (
        <Row gap={8}>
          <Btn size="sm" kind="primary" onClick={() => actions.nav("Finance", "receivables")}>Open receivables</Btn>
          <Btn size="sm" kind="soft" title={pendingApproval ? undefined : "No pending approval for this order"} onClick={() => actions.nav("Agents", "approvals")}>
            {pendingApproval ? "Review release approval" : "Open approvals"}
          </Btn>
          {open}
        </Row>
      );
  }
}

export default function ExceptionsTab() {
  const s = useMuz();
  const open = attention(s);
  const resolved = s.issues.filter((i) => i.resolved);
  const causes = exceptionsByCause(s);

  return (
    <Page>
      <PageHead
        eyebrow="Orders"
        title="Exceptions"
        sub="Orders that need a person. Each card shows what is wrong, the order it affects and the next sensible action. Resolving one here, in Fulfilment or in Agents clears it everywhere."
        right={open.length ? <Badge tone="bad">{open.length} open</Badge> : <Badge tone="ok">0 open</Badge>}
      />

      <Grid min={190}>
        {causes.map((c) => (
          <Kpi key={c.kind} label={c.label} value={c.count} tone={c.count ? KIND[c.kind as IssueKind].tone : "ok"} sub={c.count ? "Open" : "Clear"} />
        ))}
      </Grid>

      {open.length === 0 ? (
        <Card>
          <div style={{ padding: "34px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>No open exceptions</div>
            <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 8, lineHeight: 1.6 }}>
              Every order in flight is where it should be. New exceptions appear here as soon as an order stalls.
            </div>
            <div style={{ marginTop: 16 }}><Btn kind="soft" onClick={() => actions.setTab("Orders", "all")}>View all orders</Btn></div>
          </div>
        </Card>
      ) : (
        <Grid min={440} gap={14}>
          {open.map((i) => {
            const o = s.orders.find((x) => x.id === i.orderId)!;
            const k = KIND[i.kind];
            return (
              <Card key={i.id} style={{ borderColor: k.tone === "bad" ? "rgba(239,75,82,.34)" : "rgba(240,136,62,.34)" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <Thumb src={thumbOf(o)} size={52} label={productLabel(o)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Row gap={8}>
                      <Badge tone={k.tone}><FlagIcon size={11} color="currentColor" />{k.label}</Badge>
                      <StageBadge o={o} />
                    </Row>
                    <div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 9, letterSpacing: "-.2px" }}>{i.title}</div>
                    <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 5, lineHeight: 1.55 }}>{i.detail}</div>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <KV cols={3} rows={[
                    ["Order", <RecLink r={{ type: "order", id: o.id }}>{o.id}</RecLink>],
                    ["Customer", <RecLink r={{ type: "customer", id: o.customerId }}>{customerOf(o).name}</RecLink>],
                    ["Value", eur(orderValue(o))],
                    ["Dispatch by", dueLabel(o.dispatchBy)],
                    ["Destination", o.destination],
                    ["Assigned", staffName(o.assignee)],
                  ]} />
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: "var(--body)", lineHeight: 1.55 }}>
                  <span style={{ color: "var(--faint)" }}>Suggested next step: </span>{k.next}
                </div>
                <div style={{ marginTop: 14 }}><Actions s={s} i={i} o={o} /></div>
              </Card>
            );
          })}
        </Grid>
      )}

      <Card title="Recently resolved" hint="Exceptions cleared during this demo session." right={<Badge tone="neutral">{resolved.length}</Badge>}>
        {resolved.length === 0 ? (
          <div style={{ fontSize: 13, color: "var(--dim)", padding: "6px 2px" }}>Nothing resolved yet. Work an exception above and it will land here.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {resolved.map((i) => {
              const o = s.orders.find((x) => x.id === i.orderId)!;
              return (
                <div key={i.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 2px", borderTop: "1px solid var(--border)" }}>
                  <Badge tone="ok">Resolved</Badge>
                  <div style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>{i.title}</span>
                    <span style={{ color: "var(--dim)" }}> · <RecLink r={{ type: "order", id: o.id }}>{o.id}</RecLink> · {customerOf(o).name}</span>
                    <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3 }}>{RESOLVED_NOTE[i.kind]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </Page>
  );
}

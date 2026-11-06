import { actions, useMuz, type MuzState } from "../../store";
import { Badge, Btn, Callout, Card, Grid, KV, Kpi, Page, PageHead, RecLink, Row, Thumb } from "../../ui";
import { customerOf, productLabel, shipments } from "../../selectors";
import { dmy, whenLabel } from "../../format";
import { thumbOf } from "../orders/shared";
import type { Order, Tone } from "../../types";

const CONV_STATUS: Record<string, { label: string; tone: Tone }> = {
  open: { label: "Awaiting draft", tone: "warn" },
  draft_ready: { label: "Draft ready, not sent", tone: "accent" },
  reply_approved: { label: "Reply approved (not sent)", tone: "ok" },
  waiting: { label: "Waiting on customer", tone: "neutral" },
};

const hoursSince = (s: MuzState, o: Order) => {
  const m = /(\d+)\s*hours?/i.exec(`${o.tracking?.note || ""} ${s.issues.find((i) => i.orderId === o.id)?.detail || ""}`);
  return m ? `${m[1]} hours` : "Unknown";
};

export default function TrackingTab() {
  const s = useMuz();
  const exceptions = s.orders.filter((o) => o.stage === "dispatched" && o.tracking?.status === "no_update");
  const awaitingCarrier = shipments(s).filter((r) => r.order.stage === "dispatched" && r.order.tracking?.status === "label_created");
  const convs = s.conversations.filter((c) => c.kind === "tracking");
  const pendingNotes = convs.filter((c) => c.status !== "reply_approved");
  const orderOf = (id?: string) => s.orders.find((o) => o.id === id);
  const tasks = s.tasks.filter((t) => {
    if (t.ref.type === "order") return orderOf(t.ref.id)?.stage === "dispatched";
    if (t.ref.type === "conversation") return convs.some((c) => c.id === t.ref.id);
    return false;
  });
  const openTasks = tasks.filter((t) => t.status !== "done");
  const investigated = (id: string) => s.activity.some((a) => a.ref?.id === id && /carrier investigation opened/i.test(a.text));

  const prepare = (convId: string) => {
    actions.generateDraft(convId);
    actions.open({ type: "conversation", id: convId });
  };

  return (
    <Page>
      <PageHead
        eyebrow="Fulfilment"
        title="Tracking and exceptions"
        sub="Shipments that have gone quiet, the customer messages waiting on them, and the investigation tasks behind both."
        right={exceptions.length ? <Badge tone="bad" dot>{exceptions.length} tracking exception{exceptions.length === 1 ? "" : "s"}</Badge> : <Badge tone="ok" dot>No exceptions</Badge>}
      />

      <Grid min={190}>
        <Kpi label="Delayed tracking" value={exceptions.length} tone={exceptions.length ? "bad" : "ok"} sub={exceptions.length ? "No carrier scan" : "All shipments moving"} />
        <Kpi label="Awaiting carrier info" value={awaitingCarrier.length} sub="Label created, no scan yet" />
        <Kpi label="Customer updates pending" value={pendingNotes.length} tone={pendingNotes.length ? "warn" : "ok"} sub="Not yet approved" />
        <Kpi label="Investigation tasks" value={openTasks.length} tone={openTasks.length ? "warn" : "ok"} sub="Open" />
      </Grid>

      <Callout tone="warn" title="No live carrier connection">
        The carrier is not confirmed and Pulse has no live tracking feed. Carrier requests, customer updates and cleared scans on this page are demo actions that change local state only. Nothing is sent to a carrier or a customer.
      </Callout>

      {exceptions.length === 0 ? (
        <Card>
          <div style={{ padding: "32px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 600 }}>No tracking exceptions</div>
            <div style={{ fontSize: 13, color: "var(--dim)", marginTop: 8, lineHeight: 1.6 }}>Every dispatched parcel has a recent scan. A shipment appears here when it goes quiet.</div>
            <div style={{ marginTop: 16 }}><Btn kind="soft" onClick={() => actions.setTab("Fulfilment", "shipments")}>View shipments</Btn></div>
          </div>
        </Card>
      ) : (
        <Grid min={520}>
          {exceptions.map((o) => {
            const conv = convs.find((c) => c.orderId === o.id);
            const convId = conv?.id || "CV-01";
            const cs = conv ? CONV_STATUS[conv.status] : undefined;
            return (
              <Card key={o.id} style={{ borderColor: "rgba(239,75,82,.34)" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <Thumb src={thumbOf(o)} size={52} label={productLabel(o)} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Row gap={8}>
                      <Badge tone="bad" dot>Tracking exception</Badge>
                      {investigated(o.id) && <Badge tone="info">Carrier investigation recorded (demo)</Badge>}
                      {cs && <Badge tone={cs.tone}>{cs.label}</Badge>}
                    </Row>
                    <div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 9 }}>{o.id}: {productLabel(o)}</div>
                    <div style={{ fontSize: 12.5, color: "var(--dim)", marginTop: 4, lineHeight: 1.55 }}>{o.tracking?.note}</div>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <KV cols={3} rows={[
                    ["Customer", <RecLink r={{ type: "customer", id: o.customerId }}>{customerOf(o).name}</RecLink>],
                    ["Destination", o.destination],
                    ["Carrier", o.tracking?.carrier || "Carrier TBC"],
                    ["Tracking reference", <span style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{o.tracking?.ref}</span>],
                    ["Last update", o.tracking?.lastUpdate || "None"],
                    ["Since last scan", hoursSince(s, o)],
                  ]} />
                </div>
                <Row gap={8} style={{ marginTop: 14 }}>
                  <Btn size="sm" kind="primary" onClick={() => actions.requestCarrierUpdate(o.id)}>Request carrier update (demo)</Btn>
                  <Btn size="sm" kind="soft" onClick={() => prepare(convId)}>Prepare customer update</Btn>
                  <Btn size="sm" kind="ghost" onClick={() => actions.open({ type: "conversation", id: convId })}>Open conversation {convId}</Btn>
                  <Btn size="sm" kind="ghost" onClick={() => actions.resolveTracking(o.id)}>Mark exception cleared (demo scan)</Btn>
                </Row>
              </Card>
            );
          })}
        </Grid>
      )}

      <Grid min={400}>
        <Card title="Customer notifications" hint="Tracking conversations and their drafted replies. Drafts are never sent in this demo." right={<Badge tone={pendingNotes.length ? "warn" : "ok"}>{pendingNotes.length} pending</Badge>}>
          {convs.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--dim)" }}>No tracking conversations.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {convs.map((c) => {
                const st = CONV_STATUS[c.status] || CONV_STATUS.open;
                return (
                  <div key={c.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 2px", borderTop: "1px solid var(--border)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.subject}</div>
                      <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>
                        {c.id} · {orderOf(c.orderId) ? customerOf(orderOf(c.orderId)!).name : "Customer"} · {c.channel} · {whenLabel(c.receivedAt)}
                      </div>
                    </div>
                    <Badge tone={st.tone}>{st.label}</Badge>
                    <Btn size="sm" kind="soft" onClick={() => actions.open({ type: "conversation", id: c.id })}>Open</Btn>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Investigation tasks" hint="Tasks linked to dispatched orders and their customer conversations." right={<Badge tone={openTasks.length ? "warn" : "ok"}>{openTasks.length} open</Badge>}>
          {tasks.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--dim)" }}>No investigation tasks.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {tasks.map((t) => (
                <div key={t.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "11px 2px", borderTop: "1px solid var(--border)" }}>
                  <input type="checkbox" checked={t.status === "done"} onChange={() => actions.toggleTask(t.id)} style={{ accentColor: "var(--accent)", width: 16, height: 16 }} title={t.status === "done" ? "Reopen task" : "Mark done"} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, textDecoration: t.status === "done" ? "line-through" : "none", color: t.status === "done" ? "var(--dim)" : "var(--ink)" }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 2 }}>{t.id} · {t.dept} · Due {dmy(t.due)}</div>
                  </div>
                  <Badge tone={t.priority === "High" ? "warn" : "neutral"}>{t.priority}</Badge>
                  {t.status === "open" && <Btn size="sm" kind="ghost" onClick={() => actions.startTask(t.id)}>Start</Btn>}
                  {t.status === "in_progress" && <Badge tone="accent">In progress</Badge>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </Grid>
    </Page>
  );
}

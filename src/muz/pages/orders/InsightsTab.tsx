import { useState } from "react";
import { useMuz } from "../../store";
import { Badge, BarList, Callout, Card, Chips, ColumnChart, DemoTag, Donut, Grid, Kpi, LineChart, Page, PageHead, Progress, RecLink, Row, CHART } from "../../ui";
import { inFlight, orderValue, pipelineCounts, stageIndex, totals } from "../../selectors";
import { eur, eur0 } from "../../format";
import { MARKETING, PRODUCT_BY_SKU, SNAPSHOT_DATE } from "../../dataset";
import { daysBetween } from "../../format";
import { countryOf } from "./shared";

type Metric = "value" | "qty";

export default function InsightsTab() {
  const s = useMuz();
  const t = totals(s);
  const pipe = pipelineCounts(s);
  const flight = inFlight(s);
  const [metric, setMetric] = useState<Metric>("value");

  /* top products in flight */
  const byProduct = new Map<string, { qty: number; value: number }>();
  flight.forEach((o) => o.lines.forEach((l) => {
    const r = byProduct.get(l.sku) || { qty: 0, value: 0 };
    r.qty += l.qty; r.value += l.qty * l.unitPrice;
    byProduct.set(l.sku, r);
  }));
  const products = [...byProduct.entries()]
    .map(([sku, r]) => ({ sku, ...r }))
    .sort((a, b) => (metric === "value" ? b.value - a.value : b.qty - a.qty || b.value - a.value));

  /* destinations */
  const byCountry = new Map<string, { n: number; value: number }>();
  flight.forEach((o) => {
    const c = countryOf(o.destination);
    const r = byCountry.get(c) || { n: 0, value: 0 };
    r.n += 1; r.value += orderValue(o);
    byCountry.set(c, r);
  });
  const countries = [...byCountry.entries()].map(([country, r]) => ({ country, ...r })).sort((a, b) => b.n - a.n || b.value - a.value);
  const intl = flight.filter((o) => countryOf(o.destination) !== "Ireland").length;

  /* dispatch performance vs dispatch-by targets (orders not yet dispatched) */
  const pending = s.orders.filter((o) => stageIndex(o.stage) < stageIndex("dispatched"));
  const diff = (iso: string) => daysBetween(SNAPSHOT_DATE, iso);
  const overdue = pending.filter((o) => diff(o.dispatchBy) < 0);
  const today = pending.filter((o) => diff(o.dispatchBy) === 0);
  const soon = pending.filter((o) => diff(o.dispatchBy) >= 1 && diff(o.dispatchBy) <= 3);
  const later = pending.filter((o) => diff(o.dispatchBy) > 3);
  const buckets = [
    { label: "Overdue", list: overdue, tone: "bad" as const },
    { label: "Due today", list: today, tone: "warn" as const },
    { label: "Due within 3 days", list: soon, tone: "info" as const },
    { label: "Later", list: later, tone: "neutral" as const },
  ];

  return (
    <Page>
      <PageHead
        eyebrow="Orders"
        title="Order insights"
        sub="Analytics for the open pipeline, all derived from the same demo state as the rest of the app. Values are open order value, not recognised revenue."
      />

      <Grid min={190}>
        <Kpi label="Orders in flight" value={t.count} sub={`${t.onlineCount} online, ${t.wholesaleCount} wholesale`} tone="accent" />
        <Kpi label="Avg online order" value={eur(t.avgOnline)} sub={`${t.onlineCount} orders`} />
        <Kpi label="Avg wholesale order" value={eur(t.avgWholesale)} sub={`${t.wholesaleCount} orders`} />
        <Kpi label="International orders" value={intl} sub={`of ${flight.length} in flight, outside Ireland`} />
      </Grid>

      <Grid min={400}>
        <Card title="Orders by stage" hint="Every order, including delivered.">
          <ColumnChart data={pipe.map((p) => ({ label: p.short, value: p.count }))} height={190} />
        </Card>
        <Card title="Orders by channel" hint="In flight only.">
          <Donut
            size={160}
            slices={[
              { label: `Online, ${eur0(t.onlineValue)}`, value: t.onlineCount, color: CHART[0] },
              { label: `Wholesale, ${eur0(t.wholesaleValue)}`, value: t.wholesaleCount, color: CHART[2] },
            ]}
            center={<div><div style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>{t.count}</div><div style={{ fontSize: 11 }}>in flight</div></div>}
          />
        </Card>
      </Grid>

      <Grid min={400}>
        <Card title="Top products in flight" hint="Ranked across open orders." right={<Chips<Metric> value={metric} onChange={setMetric} options={[{ id: "value", label: "By value" }, { id: "qty", label: "By quantity" }]} />}>
          <BarList
            fmt={metric === "value" ? eur0 : (n) => String(n)}
            items={products.map((p) => ({
              label: <RecLink r={{ type: "product", id: p.sku }}>{PRODUCT_BY_SKU[p.sku].short}</RecLink>,
              value: metric === "value" ? p.value : p.qty,
              sub: metric === "value" ? `${p.qty} unit${p.qty === 1 ? "" : "s"}` : eur0(p.value),
            }))}
          />
        </Card>
        <Card title="Orders by destination country" hint="Parsed from the delivery address on each open order.">
          <BarList
            items={countries.map((c, i) => ({ label: c.country, value: c.n, sub: eur0(c.value), color: i === 0 ? CHART[0] : CHART[(i % (CHART.length - 1)) + 1] }))}
          />
        </Card>
      </Grid>

      <Card title="Dispatch performance against targets" hint="Orders not yet dispatched, compared with their dispatch-by date. Muzikkon advertises dispatch within 24 to 48 hours; that is a published commitment used here as context, not measured performance.">
        <Grid min={220} gap={12}>
          {buckets.map((b) => (
            <div key={b.label} style={{ padding: "13px 14px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-md,14px)", minWidth: 0 }}>
              <Row style={{ justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "var(--dim)" }}>{b.label}</span>
                <Badge tone={b.list.length ? b.tone : "neutral"}>{b.list.length}</Badge>
              </Row>
              <div style={{ marginTop: 10 }}><Progress value={pending.length ? b.list.length / pending.length : 0} tone={b.list.length ? b.tone : "neutral"} /></div>
              <div style={{ marginTop: 10, fontSize: 12, lineHeight: 1.7, minHeight: 20 }}>
                {b.list.length === 0 ? <span style={{ color: "var(--faint)" }}>None</span> : b.list.map((o, i) => <span key={o.id}>{i > 0 && ", "}<RecLink r={{ type: "order", id: o.id }}>{o.id}</RecLink></span>)}
              </div>
            </div>
          ))}
        </Grid>
        {overdue.length === 0 && <div style={{ marginTop: 12 }}><Callout tone="ok">No undispatched order is past its dispatch-by date.</Callout></div>}
      </Card>

      <Card title="Orders per week" hint="Shopify order volume over the last eight weeks." right={<DemoTag />}>
        <LineChart labels={MARKETING.weeks} series={[{ name: "Orders per week", values: MARKETING.ordersPerWeek, color: CHART[0] }]} height={190} />
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--dim)", lineHeight: 1.55 }}>
          Illustrative series. Scale to keep in mind: about 10 orders a week in quiet periods, and 10 to 15 a day when busy.
        </div>
      </Card>
    </Page>
  );
}

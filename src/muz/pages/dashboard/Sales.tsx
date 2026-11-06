import { MARKETING, PRODUCT_BY_SKU } from "../../dataset";
import { eur, eur0 } from "../../format";
import { demandPerWeek, inFlight, outOfStock, round2, stockOf, totals } from "../../selectors";
import { actions, useMuz } from "../../store";
import { Badge, BarList, Btn, Callout, Card, DemoTag, Donut, Grid, Kpi, LineChart, RecLink, Spark } from "../../ui";
import { ListItem, mono } from "../common";

export default function Sales() {
  const s = useMuz();
  const t = totals(s);
  const byCat = new Map<string, number>();
  inFlight(s).forEach((o) => o.lines.forEach((l) => {
    const c = PRODUCT_BY_SKU[l.sku].category;
    byCat.set(c, round2((byCat.get(c) ?? 0) + l.qty * l.unitPrice));
  }));
  const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));
  const out = outOfStock(s);
  const h36 = stockOf(s, "MZ-HRP-036");
  const cv2 = s.conversations.find((c) => c.id === "CV-02");

  return (
    <>
      <Grid min={190}>
        <Kpi label="Online orders in flight" value={eur(t.onlineValue)} sub={`${t.onlineCount} orders, paid on Shopify`} />
        <Kpi label="Wholesale orders in flight" value={eur(t.wholesaleValue)} sub={`${t.wholesaleCount} orders on account terms`} />
        <Kpi label="Average online order" value={eur(t.avgOnline)} sub="Orders in flight" />
        <Kpi label="Average wholesale order" value={eur(t.avgWholesale)} sub="Orders in flight" />
      </Grid>

      <Grid min={380}>
        <Card title="Online vs wholesale" hint="Value of orders in flight, in euro.">
          <Donut size={150} slices={[{ label: "Online (EUR)", value: Math.round(t.onlineValue) }, { label: "Wholesale (EUR)", value: Math.round(t.wholesaleValue) }]} center={<div><div style={{ fontSize: 17, fontWeight: 600, color: "var(--ink)" }}>{eur0(t.totalValue)}</div><div style={{ fontSize: 10.5 }}>in flight</div></div>} />
        </Card>
        <Card title="Top product categories" hint="Derived from the orders in flight right now.">
          <BarList items={cats} fmt={(n) => eur(n)} />
        </Card>
      </Grid>

      <Callout tone="warn" title="Marketing figures are illustrative">
        Muzikkon's Google Shopping, Google Ads, Meta Ads and organic search accounts are not connected to Pulse. The numbers below are demo data to show how channel performance would sit next to orders and stock.
      </Callout>

      <Grid min={230}>
        {MARKETING.channels.map((c) => {
          const roas = c.spend > 0 ? c.revenue / c.spend : null;
          return (
            <Card key={c.id} title={c.name} right={<DemoTag />}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.7px" }}>{eur0(c.revenue)}</div>
                  <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>revenue, last 8 weeks</div>
                </div>
                <Spark values={c.series} w={84} h={30} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 14 }}>
                {([["Spend", c.spend > 0 ? eur0(c.spend) : "None"], ["Clicks", c.clicks.toLocaleString("en-IE")], ["Orders", String(c.orders)], ["ROAS", roas === null ? "n/a" : `${roas.toFixed(1)}x`]] as [string, string][]).map(([k, v]) => (
                  <div key={k} style={{ padding: "8px 10px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)" }}>
                    <div style={{ ...mono, fontSize: 8.5, letterSpacing: ".12em", color: "var(--faint)" }}>{k.toUpperCase()}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </Grid>

      <Grid min={380}>
        <Card title="Weekly orders" hint="Orders per week across all channels." right={<DemoTag />}>
          <LineChart labels={MARKETING.weeks} series={[{ name: "Orders", values: MARKETING.ordersPerWeek }]} height={180} />
        </Card>
        <Card title="Category mix" hint="Share of revenue by category." right={<DemoTag />}>
          <BarList items={MARKETING.categoryMix.map((m) => ({ label: m.label, value: m.share }))} fmt={(n) => `${n}%`} max={100} />
        </Card>
      </Grid>

      <Card title="Sales versus stock" hint="Demand that the shelf cannot serve. Computed from current stock; demand figures are planning estimates." right={<Btn size="sm" onClick={() => actions.nav("Inventory", "replenishment")}>Open replenishment</Btn>}>
        <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--body)", lineHeight: 1.6 }}>
          Interest in the <RecLink r={{ type: "product", id: "MZ-HRP-036" }}>36 String Trinity Harp</RecLink> is rising (illustrative), but it has {h36.available} available
          {cv2 && cv2.status !== "reply_approved" ? <>, and an open enquiry from {cv2.messages[0].who} (<RecLink r={{ type: "conversation", id: cv2.id }}>{cv2.id}</RecLink>) has no stock to point to</> : ""}.
          Marketing spend that lands on a product with nothing to sell is wasted until stock arrives.
        </p>
        {out.length === 0 ? <div style={{ fontSize: 12.5, color: "var(--dim)" }}>No product is out of stock.</div> : out.map((r) => (
          <ListItem key={r.product.sku} right={<Badge tone="bad" dot>Out of stock</Badge>}>
            <RecLink r={{ type: "product", id: r.product.sku }} style={{ fontSize: 13 }}>{r.product.short}</RecLink>
            <div style={{ fontSize: 11.5, color: "var(--dim)", marginTop: 3 }}>{r.available} available, {r.onHand} on hand, {r.allocated} allocated. Estimated demand about {demandPerWeek(r.product.sku)} per week (demo estimate).</div>
          </ListItem>
        ))}
      </Card>
    </>
  );
}

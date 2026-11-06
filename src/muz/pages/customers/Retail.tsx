import { useMemo, useState } from "react";
import { actions, useMuz } from "../../store";
import { CUSTOMERS } from "../../dataset";
import { customerSpend, ordersOfCustomer, openCases } from "../../selectors";
import { eur0, initials } from "../../format";
import { Avatar, Card, Chips, Col, DataTable, DemoTag, Kpi, Grid, Page, PageHead, RecLink, Row, SearchBox } from "../../ui";
import type { Customer } from "../../types";
import { mono, orderHistoryCount, recentProducts } from "./shared";

export default function Retail() {
  const s = useMuz();
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("all");

  const retail = useMemo(() => CUSTOMERS.filter((c) => c.type === "retail"), []);
  const countries = useMemo(() => Array.from(new Set(retail.map((c) => c.country))).sort(), [retail]);
  const rows = retail.filter((c) => (country === "all" || c.country === country) && (!q || `${c.name} ${c.country}`.toLowerCase().includes(q.toLowerCase())));

  const spend = rows.reduce((a, c) => a + customerSpend(s, c.id), 0);
  const withOrders = rows.filter((c) => ordersOfCustomer(s, c.id).length > 0).length;

  const cols: Col<Customer>[] = [
    {
      key: "name", label: "Customer", w: "minmax(190px,1.5fr)",
      render: (c) => (
        <Row gap={10} style={{ flexWrap: "nowrap" }}>
          <Avatar initials={initials(c.name)} size={26} />
          <span style={{ color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
        </Row>
      ),
      sort: (a, b) => a.name.localeCompare(b.name),
    },
    { key: "country", label: "Country", w: "130px", render: (c) => c.country, sort: (a, b) => a.country.localeCompare(b.country) },
    { key: "n", label: "Orders", w: "70px", align: "right", render: (c) => <span style={mono}>{orderHistoryCount(s, c.id)}</span>, sort: (a, b) => orderHistoryCount(s, a.id) - orderHistoryCount(s, b.id) },
    { key: "spend", label: "Total spend", w: "104px", align: "right", render: (c) => <span style={mono}>{eur0(customerSpend(s, c.id))}</span>, sort: (a, b) => customerSpend(s, a.id) - customerSpend(s, b.id) },
    { key: "recent", label: "Recent products", w: "minmax(220px,2fr)", render: (c) => recentProducts(s, c.id).join(", ") || <span style={{ color: "var(--faint)" }}>No orders yet</span> },
    {
      key: "cur", label: "Current orders", w: "minmax(130px,1fr)",
      render: (c) => {
        const o = ordersOfCustomer(s, c.id);
        if (!o.length) return <span style={{ color: "var(--faint)" }}>None</span>;
        return <span>{o.map((x, i) => <span key={x.id}>{i > 0 && ", "}<RecLink r={{ type: "order", id: x.id }}>{x.id}</RecLink></span>)}</span>;
      },
    },
    {
      key: "cases", label: "Open cases", w: "110px",
      render: (c) => {
        const k = openCases(s, c.id);
        if (!k.length) return <span style={{ color: "var(--faint)" }}>None</span>;
        return <span>{k.map((x, i) => <span key={x.id}>{i > 0 && ", "}<RecLink r={{ type: "conversation", id: x.id }}>{x.id}</RecLink></span>)}</span>;
      },
      sort: (a, b) => openCases(s, a.id).length - openCases(s, b.id).length,
    },
  ];

  return (
    <Page>
      <PageHead
        eyebrow="Customers"
        title="Retail customers"
        sub="Online buyers from the Shopify site. Order counts combine history with orders in flight."
        right={<><SearchBox value={q} onChange={setQ} placeholder="Search customers" width={230} /><DemoTag>Fictional customers</DemoTag></>}
      />
      <Grid min={190}>
        <Kpi label="Retail customers" value={rows.length} sub={country === "all" ? "all countries" : country} />
        <Kpi label="With an order in flight" value={withOrders} sub="right now" tone="accent" />
        <Kpi label="Lifetime spend" value={eur0(spend)} sub="illustrative, shown customers" />
        <Kpi label="Countries" value={countries.length} sub="where orders ship" />
      </Grid>
      <Chips
        value={country}
        onChange={setCountry}
        options={[{ id: "all", label: "All countries", count: retail.length }, ...countries.map((c) => ({ id: c, label: c, count: retail.filter((r) => r.country === c).length }))]}
      />
      <Card flush>
        <DataTable cols={cols} rows={rows} rowKey={(c) => c.id} onRow={(c) => actions.open({ type: "customer", id: c.id })} empty="No customers match these filters." />
      </Card>
    </Page>
  );
}

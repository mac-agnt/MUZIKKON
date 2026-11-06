import { Fragment, useMemo, useState } from "react";
import { SNAPSHOT_DATE } from "../dataset";
import { hhmm } from "../format";
import { actions, useMuz } from "../store";
import type { Activity, Tone } from "../types";
import { Badge, Callout, Card, Chips, DemoTag, Empty, Grid, Kpi, Page, PageHead, SearchBox } from "../ui";
import { DayHeader, RefLink, mono } from "./common";

const SRC_TONE: Record<Activity["source"], Tone> = {
  Shopify: "ok",
  "Muzikkon ERP": "info",
  Pulse: "accent",
  Staff: "neutral",
  Carrier: "warn",
  "Website chat": "info",
};
const SOURCES = Object.keys(SRC_TONE) as Activity["source"][];

const HEAD: Record<string, { title: string; sub: string }> = {
  all: { title: "Activity", sub: "Everything that happened across Shopify, the ERP, the team and the agents. Each event says whether it describes today's process or a simulated Pulse action." },
  staff: { title: "Staff activity", sub: "What people on the team did." },
  agents: { title: "Agent activity", sub: "What the agents noticed, prepared and proposed. Agents never act without approval." },
  systems: { title: "System activity", sub: "Events from Shopify, the ERP, the website chat and carriers." },
  approvals: { title: "Approval decisions", sub: "Every approve and reject decision, with who made it and when." },
};

export default function ActivityPage({ tab }: { tab: string }) {
  const s = useMuz();
  const [src, setSrc] = useState("all");
  const [q, setQ] = useState("");
  const h = HEAD[tab] ?? HEAD.all;

  const all = useMemo(() => [...s.activity].sort((a, b) => b.at.localeCompare(a.at)), [s.activity]);
  const inTab = (e: Activity) => (tab === "staff" ? e.actorType === "staff" : tab === "agents" ? e.actorType === "agent" : tab === "systems" ? e.actorType === "system" : tab === "approvals" ? !!e.approval : true);
  const tabRows = all.filter(inTab);
  const rows = tabRows.filter((e) => {
    if (src !== "all" && e.source !== src) return false;
    const t = q.trim().toLowerCase();
    return !t || `${e.text} ${e.actor} ${e.source} ${e.ref?.id ?? ""}`.toLowerCase().includes(t);
  });

  const today = all.filter((e) => e.at.slice(0, 10) === SNAPSHOT_DATE);
  const sim = all.filter((e) => e.simulated).length;
  const srcOpts = [{ id: "all", label: "All sources", count: tabRows.length }, ...SOURCES.map((x) => ({ id: x, label: x, count: tabRows.filter((e) => e.source === x).length })).filter((o) => o.count > 0)];
  const systemsToday = SOURCES.map((x) => ({ name: x, today: today.filter((e) => e.source === x).length, total: all.filter((e) => e.source === x).length })).filter((x) => x.total > 0);

  let lastDay = "";
  return (
    <Page>
      <PageHead eyebrow="Activity" title={h.title} sub={h.sub} />
      <Grid min={170}>
        <Kpi label="Events today" value={today.length} sub="Friday 6 November" />
        <Kpi label="Agent events" value={all.filter((e) => e.actorType === "agent").length} tone="accent" sub="Prepared or flagged by agents" onClick={() => actions.nav("Activity", "agents")} />
        <Kpi label="Approvals decided" value={all.filter((e) => e.approval).length} tone="ok" sub="Approve and reject decisions" onClick={() => actions.nav("Activity", "approvals")} />
        <Kpi label="Pulse demo (simulated)" value={sim} sub="Proposed or simulated by Pulse" />
        <Kpi label="Current process" value={all.length - sim} sub="Describes what happens today" />
      </Grid>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "3 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <Card pad={16}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <SearchBox value={q} onChange={setQ} placeholder="Search events, people, records" width={320} />
              <Chips options={srcOpts} value={src} onChange={setSrc} />
            </div>
          </Card>
          <Card flush title="Timeline" hint={`${rows.length} of ${tabRows.length} events, newest first.`}>
            {rows.length === 0 ? <Empty>No events match these filters.</Empty> : rows.map((e) => {
              const day = e.at.slice(0, 10);
              const head = day !== lastDay;
              lastDay = day;
              return (
                <Fragment key={e.id}>
                  {head && <DayHeader iso={e.at} />}
                  <div onClick={e.ref ? () => actions.open(e.ref!) : undefined} className={e.ref ? "mz-row mz-click" : "mz-row"} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 16px", borderBottom: "1px solid var(--border)", cursor: e.ref ? "pointer" : "default" }}>
                    <span style={{ ...mono, fontSize: 11, color: "var(--faint)", width: 44, flex: "none", paddingTop: 2 }}>{hhmm(e.at)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.45 }}>{e.text}</div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: 6 }}>
                        <Badge tone={SRC_TONE[e.source]}>{e.source}</Badge>
                        <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{e.actor}</span>
                        {e.approval && <Badge tone="ok" dot>Approval</Badge>}
                        {e.ref && <span style={{ fontSize: 12 }}><RefLink r={e.ref} /></span>}
                      </div>
                    </div>
                    <span style={{ flex: "none" }}>{e.simulated ? <Badge tone="accent">Pulse demo (simulated)</Badge> : <Badge tone="neutral">Current process</Badge>}</span>
                  </div>
                </Fragment>
              );
            })}
          </Card>
        </div>

        <div style={{ flex: "1 1 280px", minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <Card title="Systems today" hint="Where events come from.">
            {systemsToday.map((x) => (
              <div key={x.name} onClick={() => setSrc(src === x.name ? "all" : x.name)} className="mz-row mz-click" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border)", cursor: "pointer" }}>
                <Badge tone={SRC_TONE[x.name]}>{x.name}</Badge>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{x.today} today</span>
                <span style={{ ...mono, fontSize: 10.5, color: "var(--faint)" }}>{x.total}</span>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <Callout tone="warn">Shopify is not yet integrated with the ERP: online orders are moved by hand today.</Callout>
            </div>
          </Card>
          <Card title="Reading this feed">
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12, color: "var(--dim)", lineHeight: 1.55 }}>
              <div><Badge tone="neutral">Current process</Badge><div style={{ marginTop: 5 }}>Describes what happens at Muzikkon today.</div></div>
              <div><Badge tone="accent">Pulse demo (simulated)</Badge><div style={{ marginTop: 5 }}>Proposed or simulated by Pulse in this demo. Nothing external is called.</div></div>
              <DemoTag>Demo data</DemoTag>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  );
}

import { Fragment, useMemo, useState } from "react";
import { DEPARTMENTS, SNAPSHOT_DATE } from "../../dataset";
import { dueLabel, plural } from "../../format";
import { staffName } from "../../selectors";
import { actions, useMuz } from "../../store";
import type { Task, Tone } from "../../types";
import { Badge, Btn, Card, Chips, Empty, Grid, Kpi, Row, SearchBox } from "../../ui";
import { RefLink, mono } from "../common";

const PRI: Record<Task["priority"], { tone: Tone; rank: number }> = { High: { tone: "bad", rank: 0 }, Medium: { tone: "warn", rank: 1 }, Low: { tone: "neutral", rank: 2 } };
const STATUS: Record<Task["status"], { label: string; tone: Tone }> = { open: { label: "Open", tone: "neutral" }, in_progress: { label: "In progress", tone: "info" }, done: { label: "Done", tone: "ok" } };
const COLS = "30px minmax(220px,2.4fr) minmax(110px,1fr) 96px 76px 100px minmax(110px,1fr) 80px";

export default function Tasks() {
  const s = useMuz();
  const [scope, setScope] = useState("all");
  const [status, setStatus] = useState("all");
  const [dept, setDept] = useState("all");
  const [sort, setSort] = useState("due");
  const [group, setGroup] = useState("none");
  const [q, setQ] = useState("");

  const tasks = s.tasks;
  const open = tasks.filter((t) => t.status !== "done");
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = tasks.filter((x) => {
      if (scope === "mine" && x.owner !== "umer") return false;
      if (status !== "all" && x.status !== status) return false;
      if (dept !== "all" && x.dept !== dept) return false;
      if (t && !`${x.title} ${x.id} ${x.ref.id} ${staffName(x.owner)}`.toLowerCase().includes(t)) return false;
      return true;
    });
    const key = (x: Task) => (sort === "priority" ? String(PRI[x.priority].rank) + x.due : sort === "owner" ? staffName(x.owner) + x.due : x.due + String(PRI[x.priority].rank));
    return list.sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0) || key(a).localeCompare(key(b)));
  }, [tasks, scope, status, dept, sort, q]);

  const groupOf = (x: Task) => (group === "owner" ? staffName(x.owner) : group === "dept" ? x.dept : group === "due" ? (x.status === "done" ? "Done" : dueLabel(x.due) === "Today" ? "Due today" : x.due < SNAPSHOT_DATE ? "Overdue" : "Later") : "");
  const order = group === "due" ? ["Overdue", "Due today", "Later", "Done"] : null;
  const groups = useMemo(() => {
    const m = new Map<string, Task[]>();
    rows.forEach((r) => { const k = groupOf(r); m.set(k, [...(m.get(k) ?? []), r]); });
    const keys = [...m.keys()];
    if (order) keys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return keys.map((k) => ({ k, items: m.get(k)! }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, group]);

  const deptOpts = [{ id: "all", label: "All departments" }, ...DEPARTMENTS.map((d) => ({ id: d, label: d, count: tasks.filter((t) => t.dept === d).length })).filter((d) => d.count > 0)];

  return (
    <>
      <Grid min={170}>
        <Kpi label="Open tasks" value={open.length} sub={`${tasks.filter((t) => t.status === "in_progress").length} in progress`} />
        <Kpi label="Due today" value={open.filter((t) => t.due === SNAPSHOT_DATE).length} tone="warn" sub="Friday 6 November" />
        <Kpi label="High priority" value={open.filter((t) => t.priority === "High").length} tone="bad" sub="Still open" />
        <Kpi label="Done" value={tasks.filter((t) => t.status === "done").length} tone="ok" sub="Some close themselves when the work is done" />
      </Grid>

      <Card pad={16}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Row gap={12} style={{ justifyContent: "space-between" }}>
            <Row gap={14}>
              <Chips options={[{ id: "all", label: "Everyone" }, { id: "mine", label: "Mine", count: tasks.filter((t) => t.owner === "umer").length }]} value={scope} onChange={setScope} />
              <Chips options={[{ id: "all", label: "All" }, { id: "open", label: "Open" }, { id: "in_progress", label: "In progress" }, { id: "done", label: "Done" }]} value={status} onChange={setStatus} />
            </Row>
            <SearchBox value={q} onChange={setQ} placeholder="Search tasks, records, owners" width={280} />
          </Row>
          <Chips options={deptOpts} value={dept} onChange={setDept} />
          <Row gap={16}>
            <Row gap={8}><span style={{ ...mono, fontSize: 9.5, letterSpacing: ".13em", color: "var(--faint)" }}>SORT</span><Chips options={[{ id: "due", label: "Due date" }, { id: "priority", label: "Priority" }, { id: "owner", label: "Owner" }]} value={sort} onChange={setSort} /></Row>
            <Row gap={8}><span style={{ ...mono, fontSize: 9.5, letterSpacing: ".13em", color: "var(--faint)" }}>GROUP</span><Chips options={[{ id: "none", label: "None" }, { id: "due", label: "Due" }, { id: "owner", label: "Owner" }, { id: "dept", label: "Department" }]} value={group} onChange={setGroup} /></Row>
          </Row>
        </div>
      </Card>

      <Card flush title="Tasks" hint={`${plural(rows.length, "task")} shown. Tick a task to complete it, or start it to mark it in progress.`}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 900 }}>
            <div style={{ display: "grid", gridTemplateColumns: COLS, gap: 8, padding: "9px 14px", background: "var(--surface-faint)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", fontSize: 11, color: "var(--faint)", fontWeight: 500 }}>
              <span /><span>Task</span><span>Owner</span><span>Due</span><span>Priority</span><span>Status</span><span>Record</span><span />
            </div>
            {rows.length === 0 && <Empty>No tasks match these filters.</Empty>}
            {groups.map((g) => (
              <Fragment key={g.k}>
                {group !== "none" && <div style={{ ...mono, fontSize: 9.5, letterSpacing: ".13em", color: "var(--faint)", padding: "10px 14px 7px", background: "var(--surface-faint)", borderBottom: "1px solid var(--border)" }}>{g.k.toUpperCase()} ({g.items.length})</div>}
                {g.items.map((t) => {
                  const done = t.status === "done";
                  const late = !done && t.due < SNAPSHOT_DATE;
                  return (
                    <div key={t.id} className="mz-row" style={{ display: "grid", gridTemplateColumns: COLS, gap: 8, alignItems: "center", padding: "11px 14px", borderBottom: "1px solid var(--border)", opacity: done ? 0.62 : 1 }}>
                      <input type="checkbox" checked={done} onChange={() => actions.toggleTask(t.id)} aria-label={done ? "Reopen task" : "Complete task"} style={{ accentColor: "var(--accent)", width: 16, height: 16, cursor: "pointer" }} />
                      <div style={{ minWidth: 0 }}>
                        <div onClick={() => actions.open({ type: "task", id: t.id })} className="mz-click" style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, lineHeight: 1.4, cursor: "pointer", textDecoration: done ? "line-through" : "none" }}>{t.title}</div>
                        <div style={{ ...mono, fontSize: 10, color: "var(--faint)", marginTop: 3 }}>{t.id}, {t.dept}</div>
                      </div>
                      <span style={{ fontSize: 12.5 }}>{staffName(t.owner)}</span>
                      <span style={{ fontSize: 12.5, color: late ? "var(--bad)" : "var(--body)" }}>{dueLabel(t.due)}</span>
                      <Badge tone={PRI[t.priority].tone}>{t.priority}</Badge>
                      <Badge tone={STATUS[t.status].tone} dot>{STATUS[t.status].label}</Badge>
                      <span style={{ fontSize: 12.5, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><RefLink r={t.ref} /></span>
                      <span style={{ textAlign: "right" }}>{t.status === "open" && <Btn size="sm" onClick={() => actions.startTask(t.id)}>Start</Btn>}</span>
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

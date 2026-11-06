/* Small helpers shared by the Agents, Dashboard, Work and Activity pages (owned by those pages only). */
import { Fragment, type CSSProperties, type ReactNode } from "react";
import { AGENTS, CUSTOMER_BY_ID, PRODUCT_BY_SKU, SNAPSHOT_DATE, SUPPLIERS } from "../dataset";
import { actions, type MuzState } from "../store";
import { staffName } from "../selectors";
import { addDays, dayDmy, daysBetween, whenLabel } from "../format";
import type { AgentDef, AgentRun, Approval, ApprovalKind, RecordRef, Tone } from "../types";
import { Badge, Btn, RecLink, Row, TONE } from "../ui";

export const mono: CSSProperties = { fontFamily: "var(--mono)" };

/* ── agents ─────────────────────────────────────────────────────────────── */
export const AGENT_MAP: Record<string, AgentDef> = Object.fromEntries(AGENTS.map((a) => [a.id, a]));
export const agentName = (id: string) => AGENT_MAP[id]?.name ?? id;

export function AgentDot({ id, size = 24 }: { id: string; size?: number }) {
  const a = AGENT_MAP[id];
  const ini = a ? a.name.split(" ").map((w) => w[0]).join("").slice(0, 2) : "?";
  return (
    <span style={{ flex: "none", width: size, height: size, borderRadius: size / 3, background: a?.tint ?? "var(--surface-2)", border: "1px solid var(--border-strong)", color: "var(--ink)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 600 }}>
      {ini}
    </span>
  );
}

export const sortRuns = (rs: AgentRun[]) => [...rs].sort((a, b) => b.at.localeCompare(a.at));
export const agentRuns = (s: MuzState, id: string) => sortRuns(s.runs.filter((r) => r.agentId === id));
export const agentPending = (s: MuzState, id: string) => s.approvals.filter((a) => a.agentId === id && a.status === "pending");

export function agentStatus(s: MuzState, id: string): { state: string; label: string; tone: Tone; pending: number } {
  const pending = agentPending(s, id).length;
  if (pending) return { state: "waiting", label: "Needs approval", tone: "accent", pending };
  const latest = agentRuns(s, id)[0];
  if (latest?.outcome === "flagged") return { state: "attention", label: "Flagged", tone: "warn", pending };
  if (latest && latest.at.slice(0, 10) === SNAPSHOT_DATE) return { state: "complete", label: "Completed", tone: "ok", pending };
  return { state: "idle", label: "Idle", tone: "neutral", pending };
}

export const OUTCOME: Record<AgentRun["outcome"], { label: string; tone: Tone }> = {
  completed: { label: "Completed", tone: "ok" },
  proposed: { label: "Proposed", tone: "info" },
  needs_approval: { label: "Needs approval", tone: "accent" },
  flagged: { label: "Flagged", tone: "warn" },
};

/* ── approvals ──────────────────────────────────────────────────────────── */
export const KIND_LABEL: Record<ApprovalKind, string> = {
  erp_import: "ERP import",
  overdue_reminder: "Overdue reminder",
  credit_release: "Credit release",
  customer_reply: "Customer reply",
  purchase_order: "Purchase order",
  channel_stock: "Channel stock update",
  refund: "Refund",
  qc_release: "QC release",
};

export function ApprovalButtons({ a, size = "sm" }: { a: Approval; size?: "sm" | "md" }) {
  return (
    <Row gap={8}>
      <Btn kind="primary" size={size} onClick={(e) => { e.stopPropagation(); actions.approve(a.id); }}>Approve</Btn>
      <Btn kind="danger" size={size} onClick={(e) => { e.stopPropagation(); actions.reject(a.id); }}>Reject</Btn>
    </Row>
  );
}

export function DecidedInfo({ a }: { a: Approval }) {
  return (
    <Row gap={8}>
      <Badge tone={a.status === "approved" ? "ok" : "bad"} dot>{a.status === "approved" ? "Approved" : "Rejected"}</Badge>
      <span style={{ fontSize: 11.5, color: "var(--dim)" }}>{a.decidedBy ?? "Umer Farooq (demo)"}{a.decidedAt ? `, ${whenLabel(a.decidedAt)}` : ""}</span>
    </Row>
  );
}

/* ── records ────────────────────────────────────────────────────────────── */
export function refLabel(r: RecordRef): string {
  switch (r.type) {
    case "product": return PRODUCT_BY_SKU[r.id]?.short ?? r.id;
    case "customer": return CUSTOMER_BY_ID[r.id]?.name ?? r.id;
    case "agent": return agentName(r.id);
    case "supplier": return SUPPLIERS.find((x) => x.id === r.id)?.name ?? r.id;
    case "staff": return staffName(r.id);
    default: return r.id;
  }
}
export function RefLink({ r, style }: { r: RecordRef; style?: CSSProperties }) {
  return <RecLink r={r} style={style}>{refLabel(r)}</RecLink>;
}
export function RefLinks({ refs }: { refs: RecordRef[] }) {
  if (!refs.length) return <span style={{ color: "var(--faint)", fontSize: 12 }}>No linked records</span>;
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: "2px 12px", fontSize: 12.5 }}>
      {refs.map((r) => <RefLink key={`${r.type}-${r.id}`} r={r} />)}
    </span>
  );
}

/* ── layout bits ────────────────────────────────────────────────────────── */
export function ListItem({ children, right, onClick }: { children: ReactNode; right?: ReactNode; onClick?: () => void }) {
  return (
    <div onClick={onClick} className={onClick ? "mz-row mz-click" : "mz-row"} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)", cursor: onClick ? "pointer" : "default" }}>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      {right && <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8 }}>{right}</div>}
    </div>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} title={label} onClick={(e) => { e.stopPropagation(); onChange(!on); }} style={{ flex: "none", position: "relative", width: 38, height: 22, padding: 0, borderRadius: 99, cursor: "pointer", border: `1px solid ${on ? "var(--accent-line)" : "var(--border)"}`, background: on ? "var(--accent-soft)" : "var(--surface-2)" }}>
      <span style={{ position: "absolute", top: 2, left: 2, width: 16, height: 16, borderRadius: 99, background: on ? "var(--accent)" : "var(--faint)", transform: `translateX(${on ? 16 : 0}px)`, transition: "transform .2s var(--ease)" }} />
    </button>
  );
}

export function StepFlow({ steps }: { steps: { label: string; gate?: boolean }[] }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
      {steps.map((st, i) => (
        <Fragment key={i}>
          <div style={{ flex: "none", maxWidth: 170, padding: "8px 11px", borderRadius: "var(--r-sm,9px)", background: st.gate ? TONE.accent.bg : "var(--surface-2)", border: `1px solid ${st.gate ? TONE.accent.line : "var(--border)"}`, fontSize: 12, lineHeight: 1.35, color: st.gate ? "var(--ink)" : "var(--body)" }}>
            {st.gate && <div style={{ ...mono, fontSize: 8.5, letterSpacing: ".12em", color: "var(--accent)", marginBottom: 3 }}>HUMAN APPROVAL</div>}
            {i + 1}. {st.label}
          </div>
          {i < steps.length - 1 && <span style={{ alignSelf: "center", color: "var(--faint)", flex: "none", fontSize: 12 }}>→</span>}
        </Fragment>
      ))}
    </div>
  );
}

export function DayHeader({ iso }: { iso: string }) {
  return (
    <div style={{ ...mono, fontSize: 9.5, letterSpacing: ".13em", color: "var(--faint)", padding: "11px 16px 8px", background: "var(--surface-faint)", borderBottom: "1px solid var(--border)" }}>
      {dayHeading(iso).toUpperCase()}
    </div>
  );
}

/* ── dates ──────────────────────────────────────────────────────────────── */
export function dayHeading(iso: string): string {
  const day = iso.slice(0, 10);
  const d = daysBetween(day, SNAPSHOT_DATE);
  if (d === 0) return `Today, ${dayDmy(day)}`;
  if (d === 1) return `Yesterday, ${dayDmy(day)}`;
  return dayDmy(day);
}
export const dowOf = (iso: string) => new Date(iso.slice(0, 10) + "T00:00:00Z").getUTCDay();
export const weekStartOf = (iso: string) => addDays(iso.slice(0, 10), -((dowOf(iso) + 6) % 7));
export const isToday = (iso: string) => iso.slice(0, 10) === SNAPSHOT_DATE;
export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

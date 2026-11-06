/* Finance: shared helpers. Pulse reads ERP invoices and prepares actions; the ERP stays the ledger. */
import { useState, type CSSProperties } from "react";
import { actions, reminderText, useMuz } from "../../store";
import { CUSTOMER_BY_ID } from "../../dataset";
import { daysOverdue } from "../../selectors";
import { dueLabel } from "../../format";
import type { Invoice, Tone } from "../../types";
import { Badge, Btn, Row } from "../../ui";

export const mono: CSSProperties = { fontFamily: "var(--mono)" };

export const isOnline = (inv: Invoice) => CUSTOMER_BY_ID[inv.customerId].type === "retail";

export function invStatus(inv: Invoice): { tone: Tone; label: string } {
  if (inv.status === "paid") return { tone: "ok", label: "Paid" };
  const d = daysOverdue(inv);
  if (d > 0) return { tone: "bad", label: `Overdue ${d}d` };
  return { tone: "warn", label: `Outstanding, due ${dueLabel(inv.due)}` };
}
export const InvStatusBadge = ({ inv }: { inv: Invoice }) => {
  const st = invStatus(inv);
  return <Badge tone={st.tone} dot>{st.label}</Badge>;
};
export const reminderBadge = (inv: Invoice) =>
  inv.status === "paid" ? <span style={{ color: "var(--faint)" }}>Not needed</span>
  : inv.reminder === "none" ? <span style={{ color: "var(--faint)" }}>None</span>
  : inv.reminder === "drafted" ? <Badge tone="accent">Drafted</Badge>
  : <Badge tone="ok">Approved, not sent</Badge>;

/** Prepare, preview and approve a reminder. Nothing is ever sent. */
export function ReminderFlow({ inv, compact }: { inv: Invoice; compact?: boolean }) {
  const s = useMuz();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Row gap={8}>
        <Btn size="sm" kind="primary" disabled={inv.reminder !== "none"} title={inv.reminder !== "none" ? `Reminder already ${inv.reminder}` : undefined} onClick={() => actions.prepareReminder(inv.id)}>
          {inv.reminder === "none" ? "Prepare reminder" : "Reminder prepared"}
        </Btn>
        <Btn size="sm" onClick={() => setOpen(!open)}>{open ? "Hide reminder" : "Preview reminder"}</Btn>
        <Btn
          size="sm"
          kind="soft"
          disabled={inv.reminder !== "drafted"}
          title={inv.reminder === "none" ? "Prepare the reminder first" : inv.reminder === "approved" ? "Already approved" : undefined}
          onClick={() => actions.approveReminder(inv.id)}
        >
          {inv.reminder === "approved" ? "Approved, not sent" : "Approve reminder (demo, not sent)"}
        </Btn>
      </Row>
      {open && (
        <pre style={{ margin: "12px 0 0", padding: "14px 16px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)", fontFamily: "inherit", fontSize: compact ? 12 : 12.5, lineHeight: 1.65, color: "var(--body)", whiteSpace: "pre-wrap" }}>{reminderText(s, inv)}</pre>
      )}
    </div>
  );
}

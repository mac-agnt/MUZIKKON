/* Muzikkon UI kit: small glass components built on the existing Pulse tokens (CSS variables). */
import { Fragment, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import type { RecordRef, Tone } from "./types";
import { actions, useMuz, dismissToast } from "./store";

export const TONE: Record<Tone, { fg: string; bg: string; line: string }> = {
  ok: { fg: "var(--ok)", bg: "var(--ok-soft)", line: "rgba(94,231,154,.3)" },
  warn: { fg: "var(--warn)", bg: "var(--warn-soft)", line: "rgba(240,136,62,.34)" },
  bad: { fg: "var(--bad)", bg: "var(--bad-soft)", line: "rgba(239,75,82,.34)" },
  info: { fg: "var(--info,#8fc3e3)", bg: "color-mix(in srgb,var(--info,#8fc3e3) 14%,transparent)", line: "color-mix(in srgb,var(--info,#8fc3e3) 32%,transparent)" },
  neutral: { fg: "var(--dim)", bg: "var(--surface-2)", line: "var(--border)" },
  accent: { fg: "var(--accent)", bg: "var(--accent-soft)", line: "var(--accent-line)" },
};
export const CHART = ["#c9a650", "#b08a62", "#8fb5a6", "#8a9bb8", "#c4795f", "#a99ac9"];

const mono: CSSProperties = { fontFamily: "var(--mono)" };

/* ── layout ─────────────────────────────────────────────────────────────── */
export function Page({ children, gap = 16 }: { children: ReactNode; gap?: number }) {
  return (
    <div className="mz-page" style={{ padding: "6px 24px 56px", display: "flex", flexDirection: "column", gap, animation: "pageIn .6s var(--ease) both" }}>
      {children}
    </div>
  );
}
export function PageHead({ eyebrow, title, sub, right }: { eyebrow?: string; title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 16, padding: "14px 2px 2px", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 260 }}>
        {eyebrow && <div style={{ ...mono, fontSize: 9.5, letterSpacing: ".14em", color: "var(--faint)" }}>{eyebrow.toUpperCase()}</div>}
        <h1 style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 600, letterSpacing: "-.7px", lineHeight: 1.1 }}>{title}</h1>
        {sub && <div style={{ marginTop: 7, fontSize: 13.5, color: "var(--dim)", maxWidth: 760, lineHeight: 1.55, textWrap: "pretty" }}>{sub}</div>}
      </div>
      {right && <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>{right}</div>}
    </div>
  );
}
export function Grid({ min = 260, gap = 14, children, cols, style }: { min?: number; gap?: number; children: ReactNode; cols?: string; style?: CSSProperties }) {
  return <div style={{ display: "grid", gap, gridTemplateColumns: cols || `repeat(auto-fit,minmax(${min}px,1fr))`, alignItems: "stretch", ...style }}>{children}</div>;
}
export function Row({ children, gap = 10, style }: { children: ReactNode; gap?: number; style?: CSSProperties }) {
  return <div style={{ display: "flex", alignItems: "center", gap, flexWrap: "wrap", ...style }}>{children}</div>;
}

export function Card({ title, hint, right, children, pad = 18, style, flush, id }: { title?: ReactNode; hint?: ReactNode; right?: ReactNode; children?: ReactNode; pad?: number; style?: CSSProperties; flush?: boolean; id?: string }) {
  return (
    <section id={id} className="mz-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--card-r,18px)", boxShadow: "var(--card-shadow,none)", backdropFilter: "blur(14px)", minWidth: 0, display: "flex", flexDirection: "column", overflow: flush ? "hidden" : undefined, ...style }}>
      {(title || right) && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: `${pad}px ${pad}px ${flush ? 12 : 4}px` }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && <div style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: "-.2px" }}>{title}</div>}
            {hint && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 4, lineHeight: 1.5 }}>{hint}</div>}
          </div>
          {right}
        </div>
      )}
      <div style={{ padding: flush ? 0 : `${title || right ? 12 : pad}px ${pad}px ${pad}px`, flex: 1, minHeight: 0 }}>{children}</div>
    </section>
  );
}
export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...mono, fontSize: 9.5, letterSpacing: ".13em", color: "var(--faint)", ...style }}>{typeof children === "string" ? children.toUpperCase() : children}</div>;
}

export function Kpi({ label, value, sub, tone, onClick, hint, spark }: { label: string; value: ReactNode; sub?: ReactNode; tone?: Tone; onClick?: () => void; hint?: string; spark?: number[] }) {
  const t = tone ? TONE[tone] : null;
  return (
    <div className={onClick ? "mz-kpi mz-click" : "mz-kpi"} onClick={onClick} title={hint} style={{ position: "relative", padding: "16px 18px 15px", background: "var(--surface)", border: `1px solid ${t && tone !== "neutral" ? t.line : "var(--border)"}`, borderRadius: "var(--card-r,18px)", minWidth: 0, cursor: onClick ? "pointer" : "default", overflow: "hidden" }}>
      {t && tone !== "neutral" && <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "55%", pointerEvents: "none", background: `linear-gradient(90deg,${t.bg},transparent)`, opacity: 0.7 }} />}
      <div style={{ position: "relative", fontSize: 10.5, fontWeight: 500, letterSpacing: ".13em", textTransform: "uppercase", color: "var(--faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 10, marginTop: 9 }}>
        <div style={{ fontSize: 25, fontWeight: 600, letterSpacing: "-.9px", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: t && tone !== "neutral" && tone !== "accent" ? t.fg : "var(--ink)" }}>{value}</div>
        {spark && <Spark values={spark} color={t ? t.fg : "var(--accent)"} w={64} h={22} />}
      </div>
      {sub && <div style={{ position: "relative", fontSize: 11.5, color: "var(--dim)", marginTop: 7, lineHeight: 1.4 }}>{sub}</div>}
    </div>
  );
}

export function Badge({ tone = "neutral", children, dot, style }: { tone?: Tone; children: ReactNode; dot?: boolean; style?: CSSProperties }) {
  const t = TONE[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 22, padding: "0 9px", borderRadius: "var(--r-sm,9px)", background: t.bg, color: t.fg, fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap", border: `1px solid ${tone === "neutral" ? "var(--border)" : "transparent"}`, ...style }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: 2, background: t.fg }} />}
      {children}
    </span>
  );
}
export function DemoTag({ children = "Illustrative data" }: { children?: ReactNode }) {
  return <span style={{ ...mono, display: "inline-flex", alignItems: "center", height: 20, padding: "0 8px", borderRadius: 7, border: "1px dashed var(--border-strong)", fontSize: 9, letterSpacing: ".1em", color: "var(--dim)", whiteSpace: "nowrap" }}>{String(children).toUpperCase()}</span>;
}
export function Callout({ tone = "info", title, children }: { tone?: Tone; title?: ReactNode; children?: ReactNode }) {
  const t = TONE[tone];
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 15px", borderRadius: "var(--r-md,14px)", background: t.bg, border: `1px solid ${t.line}` }}>
      <span style={{ flex: "none", width: 6, height: 6, borderRadius: 2, background: t.fg, marginTop: 6 }} />
      <div style={{ minWidth: 0, fontSize: 12.5, lineHeight: 1.55, color: "var(--body)" }}>
        {title && <div style={{ fontWeight: 600, color: "var(--ink)", marginBottom: 2 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

export function Btn({ kind = "ghost", size = "md", onClick, disabled, children, title, style, icon }: { kind?: "primary" | "ghost" | "soft" | "danger"; size?: "sm" | "md"; onClick?: (e: React.MouseEvent) => void; disabled?: boolean; children: ReactNode; title?: string; style?: CSSProperties; icon?: string }) {
  const h = size === "sm" ? 28 : 36;
  const base: CSSProperties = { height: h, padding: size === "sm" ? "0 12px" : "0 16px", borderRadius: "var(--cta-r,999px)", fontSize: size === "sm" ? 12 : 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, whiteSpace: "nowrap", opacity: disabled ? 0.45 : 1, transition: "background .2s var(--ease),border-color .2s var(--ease),transform .15s var(--ease),color .2s var(--ease)" };
  const k: CSSProperties =
    kind === "primary" ? { border: 0, background: "var(--accent-fill,var(--accent))", color: "var(--on-accent)", boxShadow: "var(--accent-glow,none)" }
    : kind === "soft" ? { border: "1px solid var(--accent-line)", background: "var(--accent-faint)", color: "var(--accent)" }
    : kind === "danger" ? { border: "1px solid rgba(239,75,82,.34)", background: "var(--bad-soft)", color: "var(--bad)" }
    : { border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--ink)" };
  return (
    <button className={`mz-btn mz-btn-${kind}`} onClick={disabled ? undefined : onClick} disabled={disabled} title={title} style={{ ...base, ...k, ...style }}>
      {icon && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon} /></svg>}
      {children}
    </button>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search", width = 260 }: { value: string; onChange: (v: string) => void; placeholder?: string; width?: number }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 9, height: 36, width, maxWidth: "100%", padding: "0 13px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-ctl,999px)" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--faint)" strokeWidth="1.9" strokeLinecap="round"><path d="m21 21-4.3-4.3 M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, minWidth: 0, border: 0, outline: 0, background: "none", fontSize: 13 }} />
      {value && <button onClick={(e) => { e.preventDefault(); onChange(""); }} style={{ border: 0, background: "none", color: "var(--faint)", cursor: "pointer", fontSize: 14, padding: 0 }}>×</button>}
    </label>
  );
}
export function Chips<T extends string>({ options, value, onChange }: { options: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <button key={o.id} className="mz-chip" onClick={() => onChange(o.id)} style={{ height: 30, padding: "0 12px", display: "inline-flex", alignItems: "center", gap: 7, borderRadius: "var(--r-ctl,999px)", fontSize: 12, cursor: "pointer", background: on ? "var(--accent-soft)" : "var(--surface-2)", border: `1px solid ${on ? "var(--accent-line)" : "var(--border)"}`, color: on ? "var(--accent)" : "var(--dim)", fontWeight: on ? 600 : 500 }}>
            {o.label}
            {o.count !== undefined && <span style={{ ...mono, fontSize: 10, opacity: 0.8 }}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── table ──────────────────────────────────────────────────────────────── */
export interface Col<T> {
  key: string;
  label: string;
  w?: string; // grid track
  align?: "left" | "right";
  render: (r: T) => ReactNode;
  sort?: (a: T, b: T) => number;
}
export function DataTable<T>({ cols, rows, rowKey, onRow, selectable, selected, onSelect, empty = "Nothing matches.", dense, maxHeight }: {
  cols: Col<T>[]; rows: T[]; rowKey: (r: T) => string; onRow?: (r: T) => void; selectable?: boolean; selected?: Set<string>; onSelect?: (s: Set<string>) => void; empty?: string; dense?: boolean; maxHeight?: number;
}) {
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const c = cols.find((x) => x.key === sort.key);
    if (!c?.sort) return rows;
    return [...rows].sort((a, b) => c.sort!(a, b) * sort.dir);
  }, [rows, sort, cols]);
  const tracks = (selectable ? "34px " : "") + cols.map((c) => c.w || "minmax(0,1fr)").join(" ");
  const sel = selected || new Set<string>();
  const allOn = sorted.length > 0 && sorted.every((r) => sel.has(rowKey(r)));
  const pad = dense ? "9px 12px" : "13px 14px";
  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: cols.length * 96, maxHeight, overflowY: maxHeight ? "auto" : undefined }}>
        <div style={{ display: "grid", gridTemplateColumns: tracks, borderBottom: "1px solid var(--border)", background: "var(--surface-faint)", position: "sticky", top: 0, zIndex: 1 }}>
          {selectable && (
            <div style={{ padding: "10px 0 10px 14px", display: "flex", alignItems: "center" }}>
              <input type="checkbox" checked={allOn} onChange={() => onSelect?.(allOn ? new Set() : new Set(sorted.map(rowKey)))} style={{ accentColor: "var(--accent)" }} />
            </div>
          )}
          {cols.map((c) => {
            const on = sort?.key === c.key;
            return (
              <div key={c.key} onClick={c.sort ? () => setSort(on && sort!.dir === 1 ? { key: c.key, dir: -1 } : on ? null : { key: c.key, dir: 1 }) : undefined} style={{ padding: pad, fontSize: 11, fontWeight: 500, letterSpacing: ".03em", color: on ? "var(--accent)" : "var(--faint)", cursor: c.sort ? "pointer" : "default", textAlign: c.align || "left", userSelect: "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.label}
                {on && <span style={{ marginLeft: 4 }}>{sort!.dir === 1 ? "↑" : "↓"}</span>}
              </div>
            );
          })}
        </div>
        {sorted.map((r) => {
          const k = rowKey(r);
          const isSel = sel.has(k);
          return (
            <div key={k} className={onRow ? "mz-row mz-click" : "mz-row"} onClick={() => onRow?.(r)} style={{ display: "grid", gridTemplateColumns: tracks, borderBottom: "1px solid var(--border)", background: isSel ? "var(--accent-faint)" : undefined, cursor: onRow ? "pointer" : "default", alignItems: "center" }}>
              {selectable && (
                <div style={{ padding: "0 0 0 14px" }} onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={isSel} onChange={() => { const n = new Set(sel); if (isSel) n.delete(k); else n.add(k); onSelect?.(n); }} style={{ accentColor: "var(--accent)" }} />
                </div>
              )}
              {cols.map((c) => (
                <div key={c.key} style={{ padding: pad, fontSize: 12.5, minWidth: 0, textAlign: c.align || "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--body)" }}>{c.render(r)}</div>
              ))}
            </div>
          );
        })}
        {sorted.length === 0 && <div style={{ padding: "36px 20px", textAlign: "center", fontSize: 13, color: "var(--dim)" }}>{empty}</div>}
      </div>
    </div>
  );
}

/* ── records & drawers ──────────────────────────────────────────────────── */
export function RecLink({ r, children, style }: { r: RecordRef; children: ReactNode; style?: CSSProperties }) {
  return (
    <button className="mz-reclink" onClick={(e) => { e.stopPropagation(); actions.open(r); }} style={{ border: 0, background: "none", padding: 0, color: "var(--accent)", cursor: "pointer", fontSize: "inherit", fontWeight: 500, textAlign: "left", ...style }}>
      {children}
    </button>
  );
}
export function Drawer({ open, onClose, eyebrow, title, status, children, footer, width = 620 }: { open: boolean; onClose: () => void; eyebrow?: ReactNode; title: ReactNode; status?: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 80, background: "var(--scrim)", backdropFilter: "blur(6px)", display: "flex", justifyContent: "flex-end", animation: "scrimIn .25s var(--ease) both" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: `min(${width}px,100%)`, height: "100%", display: "flex", flexDirection: "column", background: "var(--overlay)", borderLeft: "1px solid var(--border-strong)", backdropFilter: "blur(24px)", boxShadow: "-30px 0 80px rgba(0,0,0,.5)", animation: "slideInRight .34s var(--ease) both" }}>
        <div style={{ flex: "none", display: "flex", alignItems: "flex-start", gap: 12, padding: "22px 24px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              {eyebrow && <span style={{ ...mono, fontSize: 9.5, letterSpacing: ".13em", color: "var(--faint)" }}>{typeof eyebrow === "string" ? eyebrow.toUpperCase() : eyebrow}</span>}
              {status}
            </div>
            <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-.5px", marginTop: 8, lineHeight: 1.25 }}>{title}</div>
          </div>
          <button onClick={onClose} className="mz-btn" style={{ flex: "none", width: 30, height: 30, border: "1px solid var(--border)", borderRadius: "var(--r-ctl,11px)", background: "none", color: "var(--dim)", cursor: "pointer" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12 M18 6 6 18" /></svg>
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "18px 24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
        {footer && <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "14px 24px", borderTop: "1px solid var(--border)", background: "var(--surface-faint)" }}>{footer}</div>}
      </div>
    </div>
  );
}
export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
        <Label style={{ flex: 1 }}>{title}</Label>
        {right}
      </div>
      {children}
    </div>
  );
}
export function KV({ rows, cols = 2 }: { rows: [string, ReactNode][]; cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},minmax(0,1fr))`, gap: 10 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ padding: "11px 13px", background: "var(--chip)", border: "1px solid var(--chip-border)", borderRadius: "var(--r-sm,10px)", minWidth: 0 }}>
          <div style={{ ...mono, fontSize: 8.5, letterSpacing: ".12em", color: "var(--faint)" }}>{k.toUpperCase()}</div>
          <div style={{ fontSize: 13, color: "var(--ink)", marginTop: 5, lineHeight: 1.4, overflowWrap: "anywhere" }}>{v}</div>
        </div>
      ))}
    </div>
  );
}
export function Timeline({ items }: { items: { title: ReactNode; sub?: ReactNode; when?: string; tone?: Tone; done?: boolean }[] }) {
  return (
    <div>
      {items.map((it, i) => {
        const t = TONE[it.tone || (it.done === false ? "neutral" : "accent")];
        return (
          <div key={i} style={{ display: "flex", gap: 13 }}>
            <div style={{ flex: "none", width: 14, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ width: 9, height: 9, marginTop: 4, borderRadius: 3, background: it.done === false ? "transparent" : t.fg, border: `1.5px solid ${t.fg}` }} />
              {i < items.length - 1 && <span style={{ flex: 1, width: 1, background: "var(--track)", margin: "3px 0" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <div style={{ flex: 1, fontSize: 13, color: it.done === false ? "var(--dim)" : "var(--ink)", fontWeight: 500 }}>{it.title}</div>
                {it.when && <div style={{ ...mono, fontSize: 10, color: "var(--faint)", whiteSpace: "nowrap" }}>{it.when}</div>}
              </div>
              {it.sub && <div style={{ fontSize: 12, color: "var(--dim)", marginTop: 3, lineHeight: 1.5 }}>{it.sub}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── media ──────────────────────────────────────────────────────────────── */
export function Thumb({ src, size = 40, label }: { src?: string; size?: number; label?: string }) {
  return (
    <span style={{ flex: "none", width: size, height: size, borderRadius: Math.min(12, size / 3), overflow: "hidden", background: "var(--surface-2)", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--faint)", fontSize: size / 3.2, fontWeight: 600 }}>
      {src ? <img src={src} alt={label || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (label || "").split(" ").map((w) => w[0]).slice(0, 2).join("")}
    </span>
  );
}
export function Avatar({ initials, tint = "var(--accent)", size = 26 }: { initials: string; tint?: string; size?: number }) {
  return <span style={{ flex: "none", width: size, height: size, borderRadius: 999, background: tint, color: "#0c0b0a", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 600 }}>{initials}</span>;
}

/* ── charts (pure SVG, no dependencies) ─────────────────────────────────── */
export function Spark({ values, color = "var(--accent)", w = 80, h = 26 }: { values: number[]; color?: string; w?: number; h?: number }) {
  const max = Math.max(...values, 1), min = Math.min(...values);
  const span = Math.max(1, max - min);
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * w},${h - 3 - ((v - min) / span) * (h - 6)}`).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ flex: "none" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function Progress({ value, tone = "accent", height = 6 }: { value: number; tone?: Tone; height?: number }) {
  return (
    <div style={{ height, borderRadius: 99, background: "var(--track)", overflow: "hidden" }}>
      <div style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: "100%", borderRadius: 99, background: TONE[tone].fg, transition: "width .5s var(--ease)" }} />
    </div>
  );
}
export function BarList({ items, fmt = (n: number) => String(n), max }: { items: { label: ReactNode; value: number; sub?: ReactNode; color?: string; onClick?: () => void }[]; fmt?: (n: number) => string; max?: number }) {
  const m = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {items.map((it, i) => (
        <div key={i} onClick={it.onClick} className={it.onClick ? "mz-click" : undefined} style={{ cursor: it.onClick ? "pointer" : "default" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, fontSize: 12.5 }}>
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.label}</span>
            {it.sub && <span style={{ fontSize: 11, color: "var(--faint)" }}>{it.sub}</span>}
            <span style={{ ...mono, fontSize: 12, color: "var(--ink)" }}>{fmt(it.value)}</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: "var(--track)", marginTop: 6, overflow: "hidden" }}>
            <div style={{ width: `${(it.value / m) * 100}%`, height: "100%", borderRadius: 99, background: it.color || CHART[i % CHART.length], transition: "width .5s var(--ease)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
export function ColumnChart({ data, height = 170, fmt = (n: number) => String(n), accentLast }: { data: { label: string; value: number; color?: string }[]; height?: number; fmt?: (n: number) => string; accentLast?: boolean }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height, paddingTop: 18 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
          <span style={{ ...mono, fontSize: 10, color: "var(--dim)" }}>{fmt(d.value)}</span>
          <div style={{ width: "100%", maxWidth: 46, height: `${Math.max(3, (d.value / max) * 100)}%`, minHeight: 3, borderRadius: "8px 8px 3px 3px", background: d.color || (accentLast && i === data.length - 1 ? "var(--accent)" : "color-mix(in srgb,var(--accent) 55%,var(--track))"), transformOrigin: "bottom", animation: `growBar .6s var(--ease) ${i * 40}ms both` }} />
          <span style={{ fontSize: 10.5, color: "var(--faint)", whiteSpace: "nowrap" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}
export function LineChart({ labels, series, height = 170 }: { labels: string[]; series: { name: string; values: number[]; color?: string }[]; height?: number }) {
  const W = 560, H = height, P = { l: 6, r: 6, t: 14, b: 22 };
  const max = Math.max(...series.flatMap((s) => s.values), 1);
  const x = (i: number) => P.l + (i / Math.max(1, labels.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
        {[0, 0.5, 1].map((g) => <line key={g} x1={P.l} x2={W - P.r} y1={y(max * g)} y2={y(max * g)} stroke="var(--track)" strokeDasharray="3 5" />)}
        {series.map((s, si) => (
          <Fragment key={s.name}>
            <polyline points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} fill="none" stroke={s.color || CHART[si]} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="2.6" fill={s.color || CHART[si]} />)}
          </Fragment>
        ))}
        {labels.map((l, i) => <text key={l} x={x(i)} y={H - 6} fontSize="10" fill="var(--faint)" textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}>{l}</text>)}
      </svg>
      {series.length > 1 && (
        <Row gap={14} style={{ marginTop: 6 }}>
          {series.map((s, si) => <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--dim)" }}><span style={{ width: 8, height: 8, borderRadius: 3, background: s.color || CHART[si] }} />{s.name}</span>)}
        </Row>
      )}
    </div>
  );
}
export function Donut({ slices, size = 150, center }: { slices: { label: string; value: number; color?: string }[]; size?: number; center?: ReactNode }) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = size / 2 - 12, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--track)" strokeWidth="14" />
          {slices.map((s, i) => {
            const len = (s.value / total) * c;
            const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color || CHART[i % CHART.length]} strokeWidth="14" strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`} strokeDashoffset={-acc} />;
            acc += len;
            return el;
          })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 12, color: "var(--dim)" }}>{center}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140, flex: 1 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 12.5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color || CHART[i % CHART.length] }} />
            <span style={{ flex: 1, color: "var(--body)" }}>{s.label}</span>
            <span style={{ ...mono, color: "var(--ink)" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Order pipeline: New → … → Delivered */
export function PipelineBar({ stages, active, onPick }: { stages: { id: string; label: string; count: number; value?: number }[]; active?: string; onPick?: (id: string) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${stages.length},minmax(0,1fr))`, gap: 6 }}>
      {stages.map((s, i) => {
        const on = active === s.id;
        return (
          <button key={s.id} onClick={() => onPick?.(s.id)} className={onPick ? "mz-click" : undefined} style={{ position: "relative", textAlign: "left", padding: "12px 12px 11px", background: on ? "var(--accent-soft)" : "var(--surface-2)", border: `1px solid ${on ? "var(--accent-line)" : "var(--border)"}`, borderRadius: "var(--r-md,14px)", cursor: onPick ? "pointer" : "default", minWidth: 0 }}>
            <div style={{ fontSize: 11, color: on ? "var(--accent)" : "var(--dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-.8px", marginTop: 6, color: s.count ? "var(--ink)" : "var(--faint)" }}>{s.count}</div>
            {i < stages.length - 1 && <span style={{ position: "absolute", right: -7, top: "50%", width: 8, height: 8, marginTop: -4, borderTop: "1.5px solid var(--faint)", borderRight: "1.5px solid var(--faint)", transform: "rotate(45deg)", zIndex: 1, opacity: 0.6 }} />}
          </button>
        );
      })}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div style={{ padding: "28px 16px", textAlign: "center", fontSize: 13, color: "var(--dim)" }}>{children}</div>;
}

/* Toast host: mounted once in the shell. */
export function Toasts() {
  const s = useMuz();
  if (!s.toasts.length) return null;
  return (
    <div style={{ position: "fixed", left: "50%", bottom: 26, transform: "translateX(-50%)", zIndex: 120, display: "flex", flexDirection: "column", gap: 8, alignItems: "center", pointerEvents: "none" }}>
      {s.toasts.map((t) => (
        <div key={t.id} onClick={() => dismissToast(t.id)} style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 11, maxWidth: "min(560px,92vw)", padding: "11px 16px", background: "var(--overlay)", border: `1px solid ${TONE[t.tone].line}`, borderRadius: "var(--r-md,14px)", boxShadow: "0 18px 50px rgba(0,0,0,.5)", backdropFilter: "blur(20px)", fontSize: 13, animation: "springIn .5s cubic-bezier(.16,1,.3,1) both", cursor: "pointer" }}>
          <span style={{ width: 7, height: 7, borderRadius: 3, background: TONE[t.tone].fg, flex: "none" }} />
          <span style={{ lineHeight: 1.45 }}>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/* Tone helpers shared by pages */
export const toneForStage = (stage: string): Tone => (stage === "delivered" ? "ok" : stage === "dispatched" ? "info" : stage === "packed" ? "ok" : stage === "qc" ? "warn" : stage === "picking" ? "accent" : "neutral");

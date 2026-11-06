import { SNAPSHOT_DATE } from "./dataset";

export function eur(n: number): string {
  const neg = n < 0;
  const s = Math.abs(n).toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (neg ? "-€" : "€") + s;
}
export function eur0(n: number): string {
  return (n < 0 ? "-€" : "€") + Math.abs(Math.round(n)).toLocaleString("en-IE");
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parts(iso: string) {
  const d = iso.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(d[0], d[1] - 1, d[2]));
  return { y: d[0], m: d[1] - 1, d: d[2], dow: dt.getUTCDay(), dt };
}
/** "6 Nov" */
export function dmy(iso: string): string {
  const p = parts(iso);
  return `${p.d} ${MONTHS[p.m]}`;
}
/** "Fri 6 Nov" */
export function dayDmy(iso: string): string {
  const p = parts(iso);
  return `${DAYS[p.dow]} ${p.d} ${MONTHS[p.m]}`;
}
export function dmyFull(iso: string): string {
  const p = parts(iso);
  return `${p.d} ${MONTHS[p.m]} ${p.y}`;
}
export function daysBetween(a: string, b: string): number {
  return Math.round((parts(b).dt.getTime() - parts(a).dt.getTime()) / 86400000);
}
export function addDays(iso: string, n: number): string {
  const p = parts(iso);
  const dt = new Date(p.dt.getTime() + n * 86400000);
  return dt.toISOString().slice(0, 10);
}
export function isoAddMinutes(iso: string, mins: number): string {
  const h = Number(iso.slice(11, 13)), m = Number(iso.slice(14, 16));
  const total = h * 60 + m + mins;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${iso.slice(0, 10)}T${hh}:${mm}:00`;
}
export function hhmm(iso: string): string {
  return iso.slice(11, 16);
}
/** Relative to the demo snapshot: "Today 09:14", "Yesterday 16:30", "Mon 2 Nov". */
export function whenLabel(iso: string): string {
  const day = iso.slice(0, 10);
  const diff = daysBetween(day, SNAPSHOT_DATE);
  if (diff === 0) return `Today ${hhmm(iso)}`;
  if (diff === 1) return `Yesterday ${hhmm(iso)}`;
  return `${dayDmy(day)}`;
}
export function dueLabel(iso: string): string {
  const diff = daysBetween(SNAPSHOT_DATE, iso);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${-diff}d overdue`;
  return dayDmy(iso);
}
export function plural(n: number, one: string, many?: string): string {
  return `${n} ${n === 1 ? one : many || one + "s"}`;
}
export const initials = (name: string) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

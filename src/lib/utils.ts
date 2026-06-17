import { format, formatDistanceToNow, differenceInCalendarDays, isValid, parseISO } from "date-fns";
import type { FileKind } from "./types";

/** Join truthy class names. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Whole-dollar currency, e.g. $124,500. */
export function money(n: number): string {
  if (!isFinite(n)) n = 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Currency with cents, e.g. $1,234.50 (line items / unit prices). */
export function moneyCents(n: number): string {
  if (!isFinite(n)) n = 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function toDate(iso?: string): Date | null {
  if (!iso) return null;
  const d = iso.includes("T") ? parseISO(iso) : parseISO(`${iso}T00:00:00`);
  return isValid(d) ? d : null;
}

export function formatDate(iso?: string, fallback = "—"): string {
  const d = toDate(iso);
  return d ? format(d, "MMM d, yyyy") : fallback;
}

export function formatDateTime(iso?: string, fallback = "—"): string {
  const d = toDate(iso);
  return d ? format(d, "MMM d, yyyy · h:mm a") : fallback;
}

export function formatTime(iso?: string, fallback = ""): string {
  const d = toDate(iso);
  return d ? format(d, "h:mm a") : fallback;
}

export function timeAgo(iso?: string): string {
  const d = toDate(iso);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "";
}

export function daysUntil(iso?: string): number | null {
  const d = toDate(iso);
  return d ? differenceInCalendarDays(d, new Date()) : null;
}

export function dueLabel(iso?: string): string {
  const days = daysUntil(iso);
  if (days === null) return "No date";
  if (days === 0) return "Due today";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

/** Percent of budget spent (0–100, but can exceed for over-budget UI). */
export function pct(spent: number, budget: number): number {
  if (budget <= 0) return spent > 0 ? 100 : 0;
  return (spent / budget) * 100;
}

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "heic", "avif", "svg"]);
const VIDEO_EXT = new Set(["mp4", "mov", "webm", "mkv", "avi", "m4v"]);
const DOC_EXT = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf", "pages", "numbers"]);

export function fileKindFromName(name: string): FileKind {
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  if (ext === "pdf") return "pdf";
  if (DOC_EXT.has(ext)) return "doc";
  return "other";
}

export function bytes(n: number): string {
  if (!n) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return `${(n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Deterministic accent color for an avatar from a name/id. */
export function avatarColor(seed: string): string {
  const colors = [
    "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a",
    "#0891b2", "#ca8a04", "#dc2626", "#4f46e5", "#0d9488",
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}

export function fullAddress(a: { street: string; city: string; state: string; zip: string }): string {
  return `${a.street}, ${a.city}, ${a.state} ${a.zip}`.replace(/^,\s*/, "").trim();
}

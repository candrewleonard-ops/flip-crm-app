import type {
  TaskStatus,
  TaskPriority,
  QualityCheck,
  InvoiceStatus,
  ProjectStatus,
} from "./types";

export interface Meta {
  label: string;
  /** pill classes (background + text + ring) */
  badge: string;
  /** solid dot / accent color */
  dot: string;
  /** left-border / accent class for cards */
  accent: string;
}

export const TASK_STATUS_META: Record<TaskStatus, Meta> = {
  completed: {
    label: "Completed",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    dot: "bg-emerald-500",
    accent: "border-l-emerald-400",
  },
  in_progress: {
    label: "In Progress",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
    dot: "bg-sky-500",
    accent: "border-l-sky-400",
  },
  scheduled: {
    label: "Scheduled",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    dot: "bg-amber-500",
    accent: "border-l-amber-400",
  },
  blocked: {
    label: "Blocked",
    badge: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    dot: "bg-red-500",
    accent: "border-l-red-400",
  },
  not_started: {
    label: "Not Started",
    badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/20",
    dot: "bg-slate-400",
    accent: "border-l-slate-300",
  },
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "not_started",
  "scheduled",
  "in_progress",
  "blocked",
  "completed",
];

export const PRIORITY_META: Record<TaskPriority, Meta> = {
  critical: {
    label: "Critical",
    badge: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    dot: "bg-red-500",
    accent: "border-l-red-500",
  },
  high: {
    label: "High",
    badge: "bg-orange-50 text-orange-700 ring-1 ring-orange-600/20",
    dot: "bg-orange-500",
    accent: "border-l-orange-400",
  },
  medium: {
    label: "Medium",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    dot: "bg-amber-500",
    accent: "border-l-amber-400",
  },
  low: {
    label: "Low",
    badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/20",
    dot: "bg-slate-400",
    accent: "border-l-slate-300",
  },
};

/** numeric rank for sorting (critical highest) */
export const PRIORITY_RANK: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const QUALITY_META: Record<QualityCheck, Meta> = {
  passed: {
    label: "QC Passed",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    dot: "bg-emerald-500",
    accent: "border-l-emerald-400",
  },
  failed: {
    label: "QC Failed",
    badge: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    dot: "bg-red-500",
    accent: "border-l-red-400",
  },
  pending: {
    label: "QC Pending",
    badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/20",
    dot: "bg-slate-400",
    accent: "border-l-slate-300",
  },
};

export const INVOICE_STATUS_META: Record<InvoiceStatus, Meta> = {
  draft: {
    label: "Draft",
    badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/20",
    dot: "bg-slate-400",
    accent: "border-l-slate-300",
  },
  sent: {
    label: "Sent",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
    dot: "bg-sky-500",
    accent: "border-l-sky-400",
  },
  approved: {
    label: "Approved",
    badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-600/20",
    dot: "bg-violet-500",
    accent: "border-l-violet-400",
  },
  paid: {
    label: "Paid",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    dot: "bg-emerald-500",
    accent: "border-l-emerald-400",
  },
  disputed: {
    label: "Disputed",
    badge: "bg-red-50 text-red-700 ring-1 ring-red-600/20",
    dot: "bg-red-500",
    accent: "border-l-red-400",
  },
};

export const PROJECT_STATUS_META: Record<ProjectStatus, Meta> = {
  active: {
    label: "Active",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-600/20",
    dot: "bg-sky-500",
    accent: "border-l-sky-400",
  },
  completed: {
    label: "Completed",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    dot: "bg-emerald-500",
    accent: "border-l-emerald-400",
  },
  on_hold: {
    label: "On Hold",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20",
    dot: "bg-amber-500",
    accent: "border-l-amber-400",
  },
  archived: {
    label: "Archived",
    badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-500/20",
    dot: "bg-slate-400",
    accent: "border-l-slate-300",
  },
};

export const TASK_CATEGORIES = [
  "Demolition", "Foundation", "Framing", "Roofing", "Exterior",
  "Plumbing", "Electrical", "HVAC", "General", "Drywall",
  "Flooring", "Kitchen", "Bathroom", "Painting",
];

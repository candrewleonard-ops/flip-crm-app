export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(dateStr);
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    completed: "bg-blue-100 text-blue-800",
    on_hold: "bg-amber-100 text-amber-800",
    archived: "bg-gray-100 text-gray-800",
    in_progress: "bg-sky-100 text-sky-800",
    scheduled: "bg-violet-100 text-violet-800",
    blocked: "bg-red-100 text-red-800",
    not_started: "bg-gray-100 text-gray-800",
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
    passed: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-red-800",
    pending: "bg-gray-100 text-gray-600",
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-blue-100 text-blue-800",
    approved: "bg-emerald-100 text-emerald-800",
    paid: "bg-green-100 text-green-800",
    disputed: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

export function progressPercent(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(Math.round((spent / budget) * 100), 100);
}

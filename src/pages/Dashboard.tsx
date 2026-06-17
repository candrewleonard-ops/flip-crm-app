import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Wallet,
  TrendingDown,
  AlertTriangle,
  Hammer,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { useStore } from "../lib/store";
import { StatCard } from "../components/ui/StatCard";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Badge } from "../components/ui/Badge";
import { CommunicationsHub } from "../components/CommunicationsHub";
import { WeeklyTodos } from "../components/WeeklyTodos";
import { money, pct, fullAddress } from "../lib/utils";

export function Dashboard() {
  const { db, getActiveProjects, getTopExpenses, getProject } = useStore();
  const active = getActiveProjects();

  const stats = useMemo(() => {
    const totalBudget = active.reduce((s, p) => s + p.totalBudget, 0);
    const totalSpent = active.reduce((s, p) => s + p.totalSpent, 0);
    const overBudget = active.filter((p) => p.totalSpent > p.totalBudget).length;
    const activeIds = new Set(active.map((p) => p.id));
    const workOrders = db.tasks.filter(
      (t) => activeIds.has(t.projectId) && (t.status === "in_progress" || t.status === "scheduled")
    ).length;
    return { totalBudget, totalSpent, overBudget, workOrders };
  }, [active, db.tasks]);

  const chartData = useMemo(
    () =>
      active.map((p) => ({
        name: p.name.replace(/ (Flip|Rehab)$/, ""),
        Budget: p.totalBudget,
        Spent: p.totalSpent,
        over: p.totalSpent > p.totalBudget,
      })),
    [active]
  );

  const topExpenses = getTopExpenses(6);

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back{db.settings.userName ? `, ${db.settings.userName}` : ""}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Here's what's happening across {active.length} active project{active.length === 1 ? "" : "s"}.
        </p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard label="Active Projects" value={active.length} icon={Building2} accent="text-blue-600" />
        <StatCard label="Total Budget" value={money(stats.totalBudget)} icon={Wallet} accent="text-emerald-600" />
        <StatCard label="Total Spent" value={money(stats.totalSpent)} icon={TrendingDown} accent="text-amber-600" />
        <StatCard
          label="Over Budget"
          value={stats.overBudget}
          icon={AlertTriangle}
          accent="text-red-600"
          pulse={stats.overBudget > 0}
          sub={stats.overBudget > 0 ? "Needs attention" : "All on track"}
        />
        <StatCard label="Active Work Orders" value={stats.workOrders} icon={Hammer} accent="text-sky-600" />
      </div>

      {/* Communications Hub — headline feature */}
      <div className="mb-6">
        <CommunicationsHub scope="all" embedded />
      </div>

      {/* Active projects */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Active Projects</h2>
          <Link to="/projects" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {active.map((p) => {
            const over = p.totalSpent > p.totalBudget;
            return (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="card p-4 hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{p.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{fullAddress(p.address)}</p>
                  </div>
                  {over && (
                    <Badge className="bg-red-50 text-red-700 ring-1 ring-red-600/20 heat-pulse">OVER BUDGET</Badge>
                  )}
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{money(p.totalSpent)} spent</span>
                    <span>{money(p.totalBudget)} budget</span>
                  </div>
                  <ProgressBar value={pct(p.totalSpent, p.totalBudget)} over={over} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Budget vs. Spent by Project</h2>
          {chartData.length === 0 ? (
            <p className="text-sm text-slate-400 py-12 text-center">No active projects yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} interval={0} angle={-12} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v: number) => money(v)}
                  contentStyle={{ borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="Budget" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" radius={[4, 4, 0, 0]}>
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.over ? "#ef4444" : "#2563eb"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Highest Expense Items</h2>
          {topExpenses.length === 0 ? (
            <p className="text-sm text-slate-400 py-12 text-center">No expenses logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {topExpenses.map((e) => {
                const proj = getProject(e.projectId);
                return (
                  <li key={e.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{e.description}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {e.category} · {proj?.name ?? "—"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 shrink-0">{money(e.total)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <WeeklyTodos />
    </div>
  );
}

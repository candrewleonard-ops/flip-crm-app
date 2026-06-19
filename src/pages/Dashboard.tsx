import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Building2, Wallet, TrendingDown, AlertTriangle, Hammer, ArrowRight } from "lucide-react";
import { useStore } from "../lib/store";
import { StatCard } from "../components/ui/StatCard";
import { ProgressBar } from "../components/ui/ProgressBar";
import { Badge } from "../components/ui/Badge";
import { CommunicationsHub } from "../components/CommunicationsHub";
import { money, pct, fullAddress } from "../lib/utils";

export function Dashboard() {
  const { db, getActiveProjects } = useStore();
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
      <div>
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
    </div>
  );
}

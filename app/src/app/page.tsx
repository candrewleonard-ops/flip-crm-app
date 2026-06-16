"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FolderKanban, TrendingUp, DollarSign, AlertTriangle,
  ArrowRight, MapPin, ListChecks,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatCurrency, cn } from "@/lib/utils";
import { BudgetChart } from "@/components/BudgetChart";
import { TaskItem } from "@/lib/types";

export default function Dashboard() {
  const store = useStore();
  const activeProjects = store.getActiveProjects();
  const topExpenses = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return [...store.expenses]
      .filter((e) => new Date(e.purchasedDate).getTime() >= thirtyDaysAgo)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [store.expenses]);
  const totalPortfolioValue = store.projects.reduce((s, p) => s + p.estimatedARV, 0);
  const totalSpent = store.projects.reduce((s, p) => s + p.totalSpent, 0);
  const totalBudget = store.projects.reduce((s, p) => s + p.totalBudget, 0);
  const hotTasks = store.tasks.filter((t) => t.priority === "critical" && (t.status === "in_progress" || t.status === "blocked"));
  const unreadComms = store.communications.filter((c) => !c.read).length;
  const completedTasks = store.tasks.filter((t) => t.status === "completed").length;
  const scheduledTasks = store.tasks.filter((t) => t.status === "scheduled").length;

  const today = new Date();
  const dateLabel = today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            {hotTasks.length} critical item{hotTasks.length === 1 ? "" : "s"} &middot; {unreadComms} unread message{unreadComms === 1 ? "" : "s"}
          </p>
        </div>
        <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">{dateLabel}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FolderKanban size={20} />} label="Active Projects" value={activeProjects.length.toString()} sub={`${store.projects.length} total`} color="blue" />
        <StatCard icon={<TrendingUp size={20} />} label="Portfolio ARV" value={formatCurrency(totalPortfolioValue)} sub="Estimated after repair" color="emerald" />
        <StatCard icon={<DollarSign size={20} />} label="Total Spent" value={formatCurrency(totalSpent)} sub={`of ${formatCurrency(totalBudget)} budget`} color="violet" />
        <StatCard icon={<AlertTriangle size={20} />} label="Hot Tasks Today" value={hotTasks.length.toString()} sub={`${completedTasks} completed, ${scheduledTasks} scheduled`} color="red" pulse={hotTasks.length > 0} />
      </div>

      {/* Active Project Bubbles */}
      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FolderKanban size={18} className="text-blue-500" /> Active Projects
          </h2>
          <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">View All <ArrowRight size={14} /></Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {activeProjects.map((project) => {
            const pTasks = store.getProjectTasks(project.id);
            const completed = pTasks.filter((t) => t.status === "completed").length;
            const overBudget = project.totalSpent > project.totalBudget && project.totalBudget > 0;
            const hasUnconfirmed = pTasks.some((t) => !t.orderConfirmed && t.status !== "completed");
            const hasBlocked = pTasks.some((t) => t.status === "blocked");
            const statusColor = overBudget ? "bg-red-500" : hasBlocked ? "bg-amber-500" : hasUnconfirmed ? "bg-amber-400" : "bg-emerald-500";

            return (
              <Link key={project.id} href={`/projects/${project.id}`}
                className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border bg-gradient-to-br from-white to-slate-50/30 transition-all duration-200 group hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-0.5",
                  overBudget ? "border-red-200 bg-red-50/50" : "border-slate-200"
                )}
              >
                <div className="relative">
                  <span className={cn("block w-3 h-3 rounded-full shadow-md", statusColor)}></span>
                  {overBudget && <span className="absolute inset-0 rounded-full bg-red-400 opacity-40 animate-ping"></span>}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition">{project.name}</p>
                  <p className="text-xs text-slate-400">{project.address.city}, {project.address.state} &middot; {completed}/{pTasks.length} tasks</p>
                </div>
                {overBudget && <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full ml-1">OVER BUDGET</span>}
              </Link>
            );
          })}
          {activeProjects.length === 0 && (
            <div className="w-full py-8 text-center">
              <p className="text-sm text-slate-400">No active projects.</p>
              <Link href="/projects" className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                Create one <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>
      </div>

      <ThisWeekDashboard />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="stat-card">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Budget vs. Spent by Project</h2>
          <BudgetChart projects={activeProjects} />
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Highest Expense Items</h2>
            <span className="text-xs text-slate-400">Last 30 days</span>
          </div>
          {topExpenses.length === 0 ? (
            <p className="text-sm text-slate-400 py-3">No expenses in the last 30 days.</p>
          ) : (
            <div className="space-y-3">
              {topExpenses.map((exp, i) => {
                const proj = store.getProject(exp.projectId);
                return (
                  <div key={exp.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-300 w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{exp.description}</p>
                      <p className="text-xs text-slate-400">{proj?.name} &middot; {exp.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(exp.total)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, pulse }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; pulse?: boolean;
}) {
  const iconBg: Record<string, string> = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
    violet: "bg-gradient-to-br from-violet-500 to-violet-600 text-white",
    red: "bg-gradient-to-br from-red-500 to-red-600 text-white",
  };
  const glowColor: Record<string, string> = {
    blue: "shadow-blue-500/20", emerald: "shadow-emerald-500/20",
    violet: "shadow-violet-500/20", red: "shadow-red-500/20",
  };
  return (
    <div className={cn("stat-card", pulse && "ring-2 ring-red-200 animate-pulse")}>
      <div className="flex items-center gap-3">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-lg", iconBg[color], glowColor[color])}>{icon}</div>
        <div>
          <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2">{sub}</p>
    </div>
  );
}

function ThisWeekDashboard() {
  const store = useStore();
  const activeProjects = store.getActiveProjects();

  const dueThisWeek = useMemo(() => {
    const now = new Date();
    const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return store.tasks.filter((t) => {
      if (t.status === "completed") return false;
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due <= sevenDaysOut;
    });
  }, [store.tasks]);

  const activeProjectIds = new Set(activeProjects.map((p) => p.id));
  const grouped = new Map<string, TaskItem[]>();
  for (const task of dueThisWeek) {
    if (!activeProjectIds.has(task.projectId)) continue;
    const existing = grouped.get(task.projectId) || [];
    existing.push(task);
    grouped.set(task.projectId, existing);
  }

  const totalItems = dueThisWeek.filter((t) => activeProjectIds.has(t.projectId)).length;

  const handleComplete = (taskId: string) => {
    store.updateTask(taskId, { status: "completed", completedDate: new Date().toISOString() });
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <ListChecks size={16} className="text-blue-600" /> This Week
        </h3>
        <span className="text-xs text-slate-400">{totalItems} item{totalItems === 1 ? "" : "s"}</span>
      </div>

      {grouped.size === 0 ? (
        <div className="py-6 text-center">
          <p className="text-sm text-slate-400">No tasks due this week.</p>
          <p className="text-xs text-slate-400 mt-1">Tasks with due dates within 7 days appear here automatically.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeProjects.map((project) => {
            const tasks = grouped.get(project.id);
            if (!tasks || tasks.length === 0) return null;
            return (
              <div key={project.id}>
                <Link href={`/projects/${project.id}`} className="block mb-2 group">
                  <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">{project.name}</span>
                  <span className="text-xs text-slate-400 ml-2">{project.address.city}, {project.address.state}</span>
                </Link>
                <div className="space-y-1.5">
                  {tasks.map((task) => {
                    const now = new Date();
                    const due = new Date(task.dueDate!);
                    const overdue = due < now;
                    return (
                      <div key={task.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition">
                        <button onClick={() => handleComplete(task.id)}
                          className="w-4 h-4 rounded border border-slate-300 hover:border-blue-500 hover:bg-blue-50 flex-shrink-0 transition" />
                        <span className="text-sm text-slate-700 flex-1">{task.title}</span>
                        <span className={cn("text-[10px] font-medium",
                          overdue ? "text-red-500" : "text-amber-500"
                        )}>
                          {overdue ? "Overdue" : due.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

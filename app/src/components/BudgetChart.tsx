"use client";

import { Project } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export function BudgetChart({ projects }: { projects: Project[] }) {
  const maxBudget = Math.max(...projects.map((p) => p.totalBudget), 1);

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const spentPct = project.totalBudget > 0 ? (project.totalSpent / project.totalBudget) * 100 : 0;
        const budgetPct = (project.totalBudget / maxBudget) * 100;
        const overBudget = spentPct > 90;

        return (
          <div key={project.id}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-slate-700">{project.name}</span>
              <span className="text-xs text-slate-400">
                {formatCurrency(project.totalSpent)} / {formatCurrency(project.totalBudget)}
              </span>
            </div>
            <div className="relative h-6 bg-slate-100 rounded-md overflow-hidden" style={{ width: `${budgetPct}%` }}>
              <div
                className={`h-full rounded-md transition-all ${
                  overBudget ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gradient-to-r from-blue-400 to-blue-600"
                }`}
                style={{ width: `${Math.min(spentPct, 100)}%` }}
              ></div>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500">
                {Math.round(spentPct)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

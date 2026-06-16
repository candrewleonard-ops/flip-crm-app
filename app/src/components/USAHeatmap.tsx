"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { US_STATE_PATHS } from "@/lib/us-states";

type MapFilter = "active" | "completed" | "over_budget" | "all";

// Albers USA projection (matches the pre-projected state paths from us-atlas)
function albersProject(lat: number, lng: number): { x: number; y: number } | null {
  // Simplified Albers USA with Alaska/Hawaii offsets matching us-atlas scale=1300 translate=[487.5,305]
  const DEG = Math.PI / 180;
  const lam0 = -96 * DEG;

  // Alaska inset
  if (lat > 50 && lng < -130) {
    const lam = lng * DEG, phi = lat * DEG;
    const x = 150 + (lam + 155 * DEG) * 400;
    const y = 490 + (65 * DEG - phi) * 400;
    return { x, y };
  }
  // Hawaii inset
  if (lat < 25 && lng < -154) {
    const lam = lng * DEG, phi = lat * DEG;
    const x = 300 + (lam + 160 * DEG) * 700;
    const y = 520 + (22 * DEG - phi) * 700;
    return { x, y };
  }

  // Continental US — Albers equal-area conic
  const phi1 = 29.5 * DEG, phi2 = 45.5 * DEG;
  const phi0 = 23 * DEG;
  const n = 0.5 * (Math.sin(phi1) + Math.sin(phi2));
  const C = Math.cos(phi1) * Math.cos(phi1) + 2 * n * Math.sin(phi1);
  const rho0 = Math.sqrt(C - 2 * n * Math.sin(phi0)) / n;

  const lam = lng * DEG;
  const phi = lat * DEG;
  const theta = n * (lam - lam0);
  const rho = Math.sqrt(C - 2 * n * Math.sin(phi)) / n;

  const rawX = rho * Math.sin(theta);
  const rawY = rho0 - rho * Math.cos(theta);

  // Scale and translate to match the us-atlas Albers pre-projection
  const scale = 1300;
  const x = rawX * scale + 487.5;
  const y = -rawY * scale + 305;

  if (x < -50 || x > 1050 || y < -50 || y > 700) return null;
  return { x, y };
}

export function USAHeatmap() {
  const store = useStore();
  const [filter, setFilter] = useState<MapFilter>("active");
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const filtered = store.projects.filter((p) => {
    if (filter === "active") return p.status === "active";
    if (filter === "completed") return p.status === "completed";
    if (filter === "over_budget") return p.totalSpent > p.totalBudget && p.totalBudget > 0;
    return true;
  });

  return (
    <div>
      {/* Filter + Legend */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span> Over Budget
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400"></span> Unconfirmed Orders
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span> On Track
          </span>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as MapFilter)}
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value="active">Active Projects</option>
          <option value="completed">Completed Projects</option>
          <option value="over_budget">Over Budget</option>
          <option value="all">All Projects</option>
        </select>
      </div>

      {/* Map */}
      <div className="relative w-full rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
        <svg
          viewBox="0 0 960 620"
          className="w-full h-auto"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* State shapes */}
          {US_STATE_PATHS.map((state) => {
            const hasProject = filtered.some(
              (p) => p.address.state === stateAbbr(state.name)
            );
            return (
              <path
                key={state.id}
                d={state.d}
                fill={
                  hoveredState === state.id
                    ? "#bfdbfe"
                    : hasProject
                    ? "#e0e7ff"
                    : "#e5e7eb"
                }
                stroke="#ffffff"
                strokeWidth="1"
                strokeLinejoin="round"
                className="transition-colors duration-150"
                onMouseEnter={() => setHoveredState(state.id)}
                onMouseLeave={() => setHoveredState(null)}
              />
            );
          })}

          {/* Project markers */}
          {filtered.map((project) => {
            const pos = albersProject(
              project.address.lat,
              project.address.lng
            );
            if (!pos) return null;

            const overBudget =
              project.totalSpent > project.totalBudget &&
              project.totalBudget > 0;
            const projectTasks = store.tasks.filter(
              (t) => t.projectId === project.id
            );
            const hasUnconfirmed = projectTasks.some(
              (t) => !t.orderConfirmed && t.status !== "completed"
            );

            const fill = overBudget
              ? "#ef4444"
              : hasUnconfirmed
              ? "#f59e0b"
              : "#10b981";
            const ringColor = overBudget
              ? "#fca5a5"
              : hasUnconfirmed
              ? "#fde68a"
              : "#6ee7b7";

            return (
              <g key={project.id}>
                {/* Pulse ring for over-budget */}
                {overBudget && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r="12"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    opacity="0.5"
                    className="animate-ping"
                    style={{ transformOrigin: `${pos.x}px ${pos.y}px` }}
                  />
                )}
                {/* Outer glow */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="9"
                  fill={ringColor}
                  opacity="0.35"
                />
                {/* Main dot */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="6"
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover tooltips via HTML overlay (for richer styling) */}
        <div className="absolute inset-0 pointer-events-none">
          {filtered.map((project) => {
            const pos = albersProject(
              project.address.lat,
              project.address.lng
            );
            if (!pos) return null;

            const overBudget =
              project.totalSpent > project.totalBudget &&
              project.totalBudget > 0;
            const xPct = (pos.x / 960) * 100;
            const yPct = (pos.y / 620) * 100;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="absolute pointer-events-auto group"
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  transform: "translate(-50%, -50%)",
                  width: 20,
                  height: 20,
                }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-10">
                  <strong>{project.name}</strong>
                  <span className="block text-slate-300">
                    {project.address.city}, {project.address.state}
                  </span>
                  {overBudget && (
                    <span className="block text-red-300 font-medium">
                      Over budget!
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Convert full state name to 2-letter abbreviation
const STATE_ABBR: Record<string, string> = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
  "New York": "NY", "North Carolina": "NC", "North Dakota": "ND", Ohio: "OH",
  Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA", "Rhode Island": "RI",
  "South Carolina": "SC", "South Dakota": "SD", Tennessee: "TN", Texas: "TX",
  Utah: "UT", Vermont: "VT", Virginia: "VA", Washington: "WA",
  "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
  "District of Columbia": "DC",
};

function stateAbbr(name: string): string {
  return STATE_ABBR[name] || name;
}

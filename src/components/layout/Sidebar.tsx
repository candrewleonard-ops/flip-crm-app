import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Landmark,
  HardHat,
  ReceiptText,
  MessagesSquare,
  Settings,
  Hammer,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { cn } from "../../lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
}

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/projects", label: "Projects", icon: Building2 },
  { to: "/portfolio", label: "Passive Income", icon: Landmark },
  { to: "/contractors", label: "Contractors", icon: HardHat },
  { to: "/invoices", label: "Invoices", icon: ReceiptText },
  { to: "/communications", label: "Communications", icon: MessagesSquare },
  { to: "/settings", label: "Admin & Settings", icon: Settings },
];

export function Sidebar() {
  const { db } = useStore();
  const unread = db.communications.filter((c) => !c.read && c.direction === "inbound").length;

  return (
    <aside className="sidebar-shell w-64 shrink-0 flex flex-col h-full">
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/5">
        <div className="rounded-xl bg-blue-600 p-2 shadow-lg shadow-blue-900/40">
          <Hammer className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-white font-bold text-lg leading-tight tracking-tight">FlipCRM</h1>
          <p className="text-[11px] text-slate-400 truncate">{db.settings.companyName}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "nav-item flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                isActive ? "active bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )
            }
          >
            <item.icon className="w-[18px] h-[18px] shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.to === "/communications" && unread > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                {unread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Local · Offline · Saved to disk</span>
        </div>
      </div>
    </aside>
  );
}

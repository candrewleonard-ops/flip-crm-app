import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Search, Command as CommandIcon } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { useStore } from "../../lib/store";

export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { db } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const unread = db.communications.filter((c) => !c.read && c.direction === "inbound").length;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-slate-200 bg-white/70 backdrop-blur flex items-center gap-3 px-5">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 hover:bg-slate-200/70 transition-colors rounded-lg px-3 py-1.5 w-72 max-w-[40vw]"
          >
            <Search className="w-4 h-4" />
            <span className="flex-1 text-left">Search…</span>
            <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
              <CommandIcon className="w-3 h-3" />K
            </span>
          </button>
          <div className="flex-1" />
          {unread > 0 && (
            <button
              onClick={() => navigate("/communications")}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              {unread} unread message{unread === 1 ? "" : "s"}
            </button>
          )}
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

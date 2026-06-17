import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Building2,
  HardHat,
  LayoutDashboard,
  Landmark,
  ReceiptText,
  MessagesSquare,
  Settings,
  CornerDownLeft,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { cn, fullAddress } from "../../lib/utils";

interface Command {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ElementType;
  to: string;
  group: string;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { db } = useStore();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const pages: Command[] = [
      { id: "p-dash", label: "Dashboard", icon: LayoutDashboard, to: "/", group: "Pages" },
      { id: "p-proj", label: "Projects", icon: Building2, to: "/projects", group: "Pages" },
      { id: "p-port", label: "Passive Income Portfolio", icon: Landmark, to: "/portfolio", group: "Pages" },
      { id: "p-con", label: "Contractors", icon: HardHat, to: "/contractors", group: "Pages" },
      { id: "p-inv", label: "Invoices", icon: ReceiptText, to: "/invoices", group: "Pages" },
      { id: "p-comm", label: "Communications Hub", icon: MessagesSquare, to: "/communications", group: "Pages" },
      { id: "p-set", label: "Admin & Settings", icon: Settings, to: "/settings", group: "Pages" },
    ];
    const projects: Command[] = db.projects.map((p) => ({
      id: `proj-${p.id}`,
      label: p.name,
      sublabel: fullAddress(p.address),
      icon: Building2,
      to: `/projects/${p.id}`,
      group: "Projects",
    }));
    const contractors: Command[] = db.contractors.map((c) => ({
      id: `con-${c.id}`,
      label: c.name,
      sublabel: c.company,
      icon: HardHat,
      to: `/contractors/${c.id}`,
      group: "Contractors",
    }));
    return [...pages, ...projects, ...contractors];
  }, [db.projects, db.contractors]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(t) || (c.sublabel ?? "").toLowerCase().includes(t)
    );
  }, [q, commands]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  if (!open) return null;

  const go = (c: Command) => {
    navigate(c.to);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div
        className="relative card shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[active]) go(filtered[active]);
          }
        }}
      >
        <div className="flex items-center gap-3 px-4 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Jump to a project, contractor, or page…"
            className="flex-1 py-3.5 text-sm outline-none bg-transparent"
          />
          <kbd className="text-[10px] text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No matches for “{q}”.</p>
          )}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(c)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-left",
                i === active ? "bg-blue-50" : "hover:bg-slate-50"
              )}
            >
              <c.icon className={cn("w-4 h-4 shrink-0", i === active ? "text-blue-600" : "text-slate-400")} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-800 truncate">{c.label}</span>
                {c.sublabel && <span className="block text-xs text-slate-500 truncate">{c.sublabel}</span>}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-slate-400">{c.group}</span>
              {i === active && <CornerDownLeft className="w-3.5 h-3.5 text-blue-500" />}
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

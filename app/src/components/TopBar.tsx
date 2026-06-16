"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, FolderOpen, Bell, Search, FolderKanban, HardHat, FileText, AlertTriangle, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { BrowserNav } from "./BrowserNav";
import { cn } from "@/lib/utils";

export function TopBar() {
  const store = useStore();
  const router = useRouter();
  const [folderOpen, setFolderOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [searchOpen]);

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [] as Array<{ type: string; id: string; label: string; sub: string; href: string; icon: typeof FolderKanban }>;
    const out: Array<{ type: string; id: string; label: string; sub: string; href: string; icon: typeof FolderKanban }> = [];
    for (const p of store.projects) {
      if (p.name.toLowerCase().includes(q) || p.address.city.toLowerCase().includes(q) || p.address.state.toLowerCase().includes(q)) {
        out.push({ type: "Project", id: p.id, label: p.name, sub: `${p.address.city}, ${p.address.state}`, href: `/projects/${p.id}`, icon: FolderKanban });
      }
    }
    for (const c of store.contractors) {
      if (c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.specialty.some((s) => s.toLowerCase().includes(q))) {
        out.push({ type: "Contractor", id: c.id, label: c.name, sub: c.company, href: `/contractors/${c.id}`, icon: HardHat });
      }
    }
    for (const i of store.invoices) {
      if (i.id.toLowerCase().includes(q)) {
        out.push({ type: "Invoice", id: i.id, label: `Invoice #${i.id}`, sub: i.status, href: `/invoices`, icon: FileText });
      }
    }
    for (const t of store.tasks) {
      if (t.title && t.title.toLowerCase().includes(q)) {
        const p = store.getProject(t.projectId);
        out.push({ type: "Task", id: t.id, label: t.title, sub: p?.name || "—", href: `/projects/${t.projectId}`, icon: AlertTriangle });
      }
    }
    return out.slice(0, 10);
  }, [searchQuery, store]);

  const closeSearch = () => { setSearchOpen(false); setSearchQuery(""); };
  const handleSelect = (href: string) => { closeSearch(); router.push(href); };

  return (
    <>
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
        <div className="flex items-center gap-3 flex-1">
          <BrowserNav />
          <button onClick={() => { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
            <Search size={16} />
            <span>Search anything...</span>
            <kbd className="hidden sm:inline text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">⌘K</kbd>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-lg hover:bg-slate-100 transition">
            <Bell size={18} className="text-slate-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative">
            <button onClick={() => setFolderOpen(!folderOpen)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition">
              <FolderOpen size={16} className="text-blue-600" />
              <span>Project Folders</span>
              <ChevronDown size={14} className={cn("text-slate-400 transition-transform", folderOpen && "rotate-180")} />
            </button>

            {folderOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 fade-in">
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Switch Folder</p>
                {store.folders.map((folder) => (
                  <Link key={folder.id} href={`/projects?folder=${folder.id}`} onClick={() => setFolderOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-sm">
                    <span className="w-3 h-3 rounded-full" style={{ background: folder.color }}></span>
                    <span className="flex-1 font-medium text-slate-700">{folder.name}</span>
                    <span className="text-xs text-slate-400">{folder.projectIds.length}</span>
                  </Link>
                ))}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <Link href="/projects" onClick={() => setFolderOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-sm text-blue-600 font-medium">
                    View All Projects
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Command Palette */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-sm fade-in" onClick={closeSearch}>
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
              <Search size={18} className="text-slate-400" />
              <input ref={inputRef} type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, contractors, tasks, invoices..."
                className="flex-1 text-sm bg-transparent border-0 focus:outline-none"
                onKeyDown={(e) => { if (e.key === "Enter" && results[0]) handleSelect(results[0].href); }} />
              <kbd className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">ESC</kbd>
              <button onClick={closeSearch} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
            </div>
            <div className="max-h-96 overflow-auto">
              {searchQuery.trim() === "" ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">Start typing to search across the app</div>
              ) : results.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400">No results for &ldquo;{searchQuery}&rdquo;</div>
              ) : (
                <div className="py-1">
                  {results.map((r) => (
                    <button key={`${r.type}-${r.id}`} onClick={() => handleSelect(r.href)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left transition">
                      <r.icon size={16} className="text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{r.label}</p>
                        <p className="text-xs text-slate-400 truncate">{r.sub}</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{r.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HardHat, Plus, Search, Star, Briefcase } from "lucide-react";
import { useStore } from "../lib/store";
import { PageHeader } from "../components/ui/PageHeader";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/EmptyState";
import { ContractorModal } from "../components/contractor/ContractorModal";
import { cn } from "../lib/utils";

export function Contractors() {
  const { db, getContractorProjects } = useStore();
  const [search, setSearch] = useState("");
  const [trade, setTrade] = useState("");
  const [adding, setAdding] = useState(false);

  const trades = useMemo(() => {
    const set = new Set<string>();
    db.contractors.forEach((c) => c.specialty.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [db.contractors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return db.contractors.filter((c) => {
      if (trade && !c.specialty.includes(trade)) return false;
      if (q && !`${c.name} ${c.company} ${c.specialty.join(" ")}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [db.contractors, search, trade]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      <PageHeader
        icon={HardHat}
        title="Contractors"
        subtitle={`${db.contractors.length} in your directory`}
        actions={<button className="btn btn-primary text-sm" onClick={() => setAdding(true)}><Plus className="w-4 h-4" /> Add Contractor</button>}
      />

      <div className="flex gap-2 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="input pl-9" placeholder="Search by name, company, trade…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-auto" value={trade} onChange={(e) => setTrade(e.target.value)}>
          <option value="">All trades</option>
          {trades.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={HardHat} title="No contractors" message="Add your trusted crews to assign them to projects and tasks." action={<button className="btn btn-primary" onClick={() => setAdding(true)}><Plus className="w-4 h-4" /> Add Contractor</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const projects = getContractorProjects(c.id);
            return (
              <Link key={c.id} to={`/contractors/${c.id}`} className="card p-4 hover:shadow-lg hover:shadow-slate-900/5 hover:-translate-y-0.5 transition-all">
                <div className="flex items-start gap-3">
                  <Avatar name={c.name} src={c.avatarUrl} size={48} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 truncate">{c.name}</h3>
                    <p className="text-xs text-slate-500 truncate">{c.company}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-medium text-slate-600">{c.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {c.specialty.slice(0, 4).map((s) => <span key={s} className="badge bg-slate-100 text-slate-600">{s}</span>)}
                  {c.specialty.length > 4 && <span className="badge bg-slate-100 text-slate-500">+{c.specialty.length - 4}</span>}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {c.totalJobsCompleted} jobs</span>
                  <span className={cn(projects.length > 0 && "text-blue-600 font-medium")}>{projects.length} active project{projects.length === 1 ? "" : "s"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <ContractorModal open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

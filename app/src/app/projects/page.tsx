"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, MapPin, Search, Grid3X3, List, Trash2, Edit3 } from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatCurrency, statusColor, progressPercent, cn } from "@/lib/utils";
import { ProjectStatus } from "@/lib/types";

export default function ProjectsPage() {
  return <Suspense><ProjectsContent /></Suspense>;
}

function ProjectsContent() {
  const searchParams = useSearchParams();
  const folderFilter = searchParams.get("folder");
  const store = useStore();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showNewProject, setShowNewProject] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  let filtered = store.projects;
  if (folderFilter) {
    const folder = store.folders.find((f) => f.id === folderFilter);
    if (folder) filtered = filtered.filter((p) => folder.projectIds.includes(p.id));
  }
  if (statusFilter !== "all") filtered = filtered.filter((p) => p.status === statusFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.address.city.toLowerCase().includes(q) || p.address.state.toLowerCase().includes(q));
  }

  const activeFolder = store.folders.find((f) => f.id === folderFilter);

  const handleDelete = (id: string) => {
    const p = store.getProject(id);
    store.deleteProject(id);
    setDeleteConfirm(null);
    toast.success(`Deleted ${p?.name || "project"}`);
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{activeFolder ? activeFolder.name : "All Projects"}</h1>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} projects</p>
        </div>
        <button onClick={() => setShowNewProject(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-200">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/projects" className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition", !folderFilter ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>All</Link>
        {store.folders.map((f) => (
          <Link key={f.id} href={`/projects?folder=${f.id}`} className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition flex items-center gap-1.5", folderFilter === f.id ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
            <span className="w-2 h-2 rounded-full" style={{ background: f.color }}></span>{f.name}
          </Link>
        ))}
        <div className="flex-1"></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "all")} className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white">
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white w-48" />
        </div>
        <div className="flex border border-slate-200 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode("grid")} className={cn("p-1.5", viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-slate-400")}><Grid3X3 size={14} /></button>
          <button onClick={() => setViewMode("list")} className={cn("p-1.5", viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-slate-400")}><List size={14} /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="stat-card flex flex-col items-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center mb-4">
            <Plus size={28} className="text-blue-500" />
          </div>
          <p className="text-lg font-semibold text-slate-700 mb-1">{store.projects.length === 0 ? "No Projects Yet" : "No Projects Match"}</p>
          <p className="text-sm text-slate-400 mb-5">
            {store.projects.length === 0 ? "Get started by creating your first project" : "Try adjusting your filters"}
          </p>
          {store.projects.length === 0 && (
            <button onClick={() => setShowNewProject(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
              <Plus size={16} /> New Project
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const pTasks = store.getProjectTasks(project.id);
            const completed = pTasks.filter((t) => t.status === "completed").length;
            const progress = progressPercent(project.totalSpent, project.totalBudget);
            const overBudget = project.totalSpent > project.totalBudget && project.totalBudget > 0;
            const folder = store.folders.find((f) => f.id === project.folderId);
            return (
              <div key={project.id} className={cn("stat-card group relative", overBudget && "ring-2 ring-red-300")}>
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <Link href={`/projects/${project.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit3 size={14} /></Link>
                  <button onClick={() => setDeleteConfirm(project.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
                <Link href={`/projects/${project.id}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {folder && <span className="w-2 h-2 rounded-full" style={{ background: folder.color }}></span>}
                    <span className={`badge ${statusColor(project.status)}`}>{project.status.replace("_", " ")}</span>
                    {overBudget && <span className="badge bg-red-100 text-red-700">Over Budget</span>}
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition">{project.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin size={11} /> {project.address.street}, {project.address.city}, {project.address.state}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 rounded-lg p-2"><p className="text-xs text-slate-400">Purchase</p><p className="text-sm font-semibold text-slate-800">{formatCurrency(project.purchasePrice)}</p></div>
                    <div className="bg-slate-50 rounded-lg p-2"><p className="text-xs text-slate-400">ARV</p><p className="text-sm font-semibold text-emerald-700">{formatCurrency(project.estimatedARV)}</p></div>
                    <div className="bg-slate-50 rounded-lg p-2"><p className="text-xs text-slate-400">Spent</p><p className={cn("text-sm font-semibold", overBudget ? "text-red-600" : "text-slate-800")}>{formatCurrency(project.totalSpent)}</p></div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Budget</span><span className={overBudget ? "text-red-600 font-bold" : ""}>{progress}%</span></div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", overBudget ? "bg-red-500" : progress > 70 ? "bg-amber-500" : "bg-blue-500")} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    </div>
                    {overBudget && <p className="text-xs text-red-600 font-medium mt-1">Over by {formatCurrency(project.totalSpent - project.totalBudget)}</p>}
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-slate-400">
                    <span>{completed}/{pTasks.length} tasks done</span>
                    <span>{project.contractorIds.length} contractors</span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="stat-card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-500">Project</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Location</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500">Status</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">Purchase</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">ARV</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">Spent</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">Budget %</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((project) => {
                const progress = progressPercent(project.totalSpent, project.totalBudget);
                const overBudget = project.totalSpent > project.totalBudget && project.totalBudget > 0;
                return (
                  <tr key={project.id} className={cn("border-b border-slate-100 hover:bg-slate-50 transition", overBudget && "bg-red-50/50")}>
                    <td className="py-3 px-4"><Link href={`/projects/${project.id}`} className="font-medium text-slate-900 hover:text-blue-600">{project.name}</Link></td>
                    <td className="py-3 px-4 text-slate-500">{project.address.city}, {project.address.state}</td>
                    <td className="py-3 px-4"><span className={`badge ${statusColor(project.status)}`}>{project.status.replace("_", " ")}</span></td>
                    <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(project.purchasePrice)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-medium">{formatCurrency(project.estimatedARV)}</td>
                    <td className={cn("py-3 px-4 text-right", overBudget ? "text-red-600 font-bold" : "text-slate-700")}>{formatCurrency(project.totalSpent)}</td>
                    <td className="py-3 px-4 text-right"><span className={cn("font-medium", overBudget ? "text-red-600" : progress > 70 ? "text-amber-600" : "text-blue-600")}>{progress}%</span></td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => setDeleteConfirm(project.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showNewProject && <NewProjectModal store={store} onClose={() => setShowNewProject(false)} onCreated={(name) => toast.success(`Created ${name}`)} />}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 fade-in" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Project?</h3>
            <p className="text-sm text-slate-500 mb-4">This will permanently delete the project and all associated tasks and expenses.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NewProjectModal({ store, onClose, onCreated }: { store: ReturnType<typeof useStore>; onClose: () => void; onCreated?: (name: string) => void }) {
  const [form, setForm] = useState({
    name: "", street: "", city: "", state: "", zip: "",
    purchasePrice: "", estimatedARV: "", totalBudget: "",
    startDate: "", estimatedEndDate: "", folderId: "f1",
    scopeOfWork: "",
  });

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const id = `p-${Date.now()}`;
    store.addProject({
      id, name: form.name, folderId: form.folderId, status: "active",
      address: { street: form.street, city: form.city, state: form.state, zip: form.zip, lat: 33 + Math.random() * 15, lng: -120 + Math.random() * 50 },
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      estimatedARV: parseFloat(form.estimatedARV) || 0,
      totalBudget: parseFloat(form.totalBudget) || 0,
      totalSpent: 0,
      startDate: form.startDate, estimatedEndDate: form.estimatedEndDate,
      contractorIds: [], photos: [], renders: [],
      scopeOfWork: form.scopeOfWork,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    onCreated?.(form.name);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Create New Project</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Project Name *</label>
            <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Oakwood Revival" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Street Address</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="1234 Main St" value={form.street} onChange={(e) => set("street", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">City</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Atlanta" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">State</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="GA" value={form.state} onChange={(e) => set("state", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">ZIP</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="30316" value={form.zip} onChange={(e) => set("zip", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Purchase Price</label><input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="185000" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Est. ARV</label><input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="345000" value={form.estimatedARV} onChange={(e) => set("estimatedARV", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Total Budget</label><input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="78000" value={form.totalBudget} onChange={(e) => set("totalBudget", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Start Date</label><input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Est. End Date</label><input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.estimatedEndDate} onChange={(e) => set("estimatedEndDate", e.target.value)} /></div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Folder</label>
            <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.folderId} onChange={(e) => set("folderId", e.target.value)}>
              {store.folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Scope of Work</label>
            <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-24 resize-none" placeholder="Describe the full scope of work for this project..." value={form.scopeOfWork} onChange={(e) => set("scopeOfWork", e.target.value)} />
            <p className="text-xs text-slate-400 mt-1">You can also attach files from the project detail page after creation.</p>
          </div>
          <div className="flex gap-3 justify-end mt-6">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancel</button>
            <button onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">Create Project</button>
          </div>
        </div>
      </div>
    </div>
  );
}

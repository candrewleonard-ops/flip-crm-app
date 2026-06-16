"use client";

export const runtime = 'edge';

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, MapPin, Calendar, Users, CheckCircle2,
  Clock, AlertTriangle, Camera, Box, MessageSquare, Phone,
  FileText, ExternalLink, Upload, Edit3, Trash2,
  Save, X, Key, Zap, Droplets, Flame, Send, ListChecks, Plus,
  Eye, EyeOff, HardHat, ClipboardList, Sparkles, Check, ChevronDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate, statusColor, cn, progressPercent, formatRelativeTime } from "@/lib/utils";
import { DEFAULT_TASKS, getMicrotasksFor, makeMicrotasks } from "@/lib/task-templates";

type Tab =
  | "tasks" | "contractors" | "comms" | "photos" | "renders"
  | "vital" | "expenses" | "invoices" | "documents";

type FolderKey = "reno" | "info";

const TAB_LABELS: Record<Tab, string> = {
  tasks: "Tasks & Work Orders",
  contractors: "Contractors",
  comms: "Communications",
  photos: "Photos & Videos",
  renders: "3D Renders",
  vital: "Vital Information",
  expenses: "Expenses",
  invoices: "Invoices",
  documents: "Documents & Files",
};

const FOLDERS: { key: FolderKey; label: string; icon: typeof HardHat; tabs: Tab[] }[] = [
  { key: "reno", label: "Renovation & Reconstruction", icon: HardHat, tabs: ["tasks", "contractors", "comms", "photos", "renders"] },
  { key: "info", label: "Project Information", icon: ClipboardList, tabs: ["vital", "expenses", "invoices", "photos", "documents"] },
];

// ---- File type detection (shared by Photos & Videos and Documents tabs) ----
export type FileKind = "image" | "video" | "pdf" | "xlsx" | "doc";

function detectFileType(item: { url?: string; caption?: string }): FileKind {
  const url = (item.url || "").toLowerCase();
  const cap = (item.caption || "").toLowerCase();
  if (url.startsWith("data:video") || /\.(mp4|mov|webm|avi|mkv|m4v|ogg)$/.test(cap)) return "video";
  if (url.startsWith("data:application/pdf") || cap.endsWith(".pdf")) return "pdf";
  if (
    url.startsWith("data:application/vnd.openxmlformats-officedocument.spreadsheetml") ||
    url.startsWith("data:application/vnd.ms-excel") ||
    cap.endsWith(".xlsx") || cap.endsWith(".xls") || cap.endsWith(".csv")
  ) return "xlsx";
  if (
    url.startsWith("data:application/msword") ||
    url.startsWith("data:application/vnd.openxmlformats-officedocument.wordprocessingml") ||
    cap.endsWith(".doc") || cap.endsWith(".docx") || cap.endsWith(".txt") || cap.endsWith(".rtf") || cap.endsWith(".ppt") || cap.endsWith(".pptx")
  ) return "doc";
  return "image";
}

const isMedia = (k: FileKind) => k === "image" || k === "video";
const isDoc = (k: FileKind) => k === "pdf" || k === "xlsx" || k === "doc";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const [folder, setFolder] = useState<FolderKey>("reno");
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [composeFor, setComposeFor] = useState<string | null>(null);
  const [composeType, setComposeType] = useState<"sms" | "call">("sms");
  const [messageText, setMessageText] = useState("");

  const project = store.getProject(id);
  if (!project) return <div className="flex items-center justify-center h-96"><p className="text-slate-400">Project not found.</p></div>;

  const projectTasks = store.getProjectTasks(project.id);
  const projectExpenses = store.getProjectExpenses(project.id);
  const projectComms = store.getProjectComms(project.id);
  const projectInvoices = store.getProjectInvoices(project.id);
  const projectContractors = store.contractors.filter((c) => project.contractorIds.includes(c.id));
  const progress = progressPercent(project.totalSpent, project.totalBudget);
  const overBudget = project.totalSpent > project.totalBudget && project.totalBudget > 0;

  const completedTasks = projectTasks.filter((t) => t.status === "completed");
  const inProgressTasks = projectTasks.filter((t) => t.status === "in_progress");
  const scheduledTasks = projectTasks.filter((t) => t.status === "scheduled");
  const blockedTasks = projectTasks.filter((t) => t.status === "blocked");
  const qualityPassed = projectTasks.filter((t) => t.qualityCheck === "passed");
  const vitalInfo = store.getVitalInfo(project.id);

  const mediaCount = project.photos.filter((p) => isMedia(detectFileType(p))).length;
  const docCount = project.photos.filter((p) => isDoc(detectFileType(p))).length;

  const counts: Partial<Record<Tab, number>> = {
    tasks: projectTasks.length,
    contractors: projectContractors.length,
    comms: projectComms.length,
    photos: mediaCount,
    renders: project.renders.length,
    expenses: projectExpenses.length,
    invoices: projectInvoices.length,
    documents: docCount,
  };

  const activeFolder = FOLDERS.find((f) => f.key === folder)!;

  const switchFolder = (key: FolderKey) => {
    setFolder(key);
    const f = FOLDERS.find((x) => x.key === key)!;
    if (!f.tabs.includes(activeTab)) setActiveTab(f.tabs[0]);
  };

  const handleDelete = () => {
    store.deleteProject(project.id);
    router.push("/projects");
  };

  const handleSendMessage = (contractorId: string) => {
    if (!messageText.trim()) return;
    store.addCommunication({
      id: `comm-${Date.now()}`, projectId: project.id, contractorId,
      type: composeType === "sms" ? "sms" : "call", direction: "outbound",
      content: messageText, timestamp: new Date().toISOString(), read: true,
      ...(composeType === "call" ? { callStatus: "completed" as const } : {}),
    });
    setMessageText("");
    setComposeFor(null);
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/projects" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mb-2"><ArrowLeft size={14} /> Back to Projects</Link>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1"><MapPin size={13} /> {project.address.street}, {project.address.city}, {project.address.state} {project.address.zip}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge text-sm ${statusColor(project.status)}`}>{project.status.replace("_", " ")}</span>
          {overBudget && <span className="badge text-sm bg-red-100 text-red-700 font-semibold">OVER BUDGET</span>}
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition"><Edit3 size={14} /> Edit</button>
          <button onClick={() => setDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition"><Trash2 size={14} /> Delete</button>
          <Link href={`/communications?contractor=${projectContractors[0]?.id || ""}`} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"><MessageSquare size={14} /> Messages & Calls</Link>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MiniStat label="Purchase Price" value={formatCurrency(project.purchasePrice)} />
        <MiniStat label="Est. ARV" value={formatCurrency(project.estimatedARV)} accent="emerald" />
        <MiniStat label="Total Budget" value={formatCurrency(project.totalBudget)} />
        <MiniStat label="Total Spent" value={formatCurrency(project.totalSpent)} accent={overBudget ? "red" : "blue"} />
        <div className="stat-card">
          <p className="text-xs text-slate-400 mb-1">Potential Profit</p>
          <p className={cn("text-lg font-bold", overBudget ? "text-red-700" : "text-emerald-700")}>
            {formatCurrency(project.estimatedARV - project.purchasePrice - project.totalSpent)}
          </p>
          <p className="text-[10px] text-slate-400">ARV - Purchase - Spent</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={cn("stat-card", overBudget && "ring-2 ring-red-300")}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Budget Progress</span>
          <span className={cn("text-sm font-semibold", overBudget && "text-red-600")}>{progress}%{overBudget && " — OVER BUDGET"}</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", overBudget ? "bg-red-500" : progress > 70 ? "bg-amber-500" : "bg-blue-500")} style={{ width: `${Math.min(progress, 100)}%` }}></div>
        </div>
        {overBudget && (
          <p className="text-sm text-red-600 font-medium mt-2">Over budget by {formatCurrency(project.totalSpent - project.totalBudget)}</p>
        )}
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>Started {formatDate(project.startDate)}</span>
          <span>Est. Complete {formatDate(project.estimatedEndDate)}</span>
        </div>
      </div>

      {/* Scope of Work */}
      {project.scopeOfWork && (
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Scope of Work</h3>
          <p className="text-sm text-slate-600">{project.scopeOfWork}</p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 size={14} /> {qualityPassed.length} QC Verified</span>
        <span className="flex items-center gap-1.5 text-sky-600"><Clock size={14} /> {inProgressTasks.length} In Progress</span>
        <span className="flex items-center gap-1.5 text-violet-600"><Calendar size={14} /> {scheduledTasks.length} Scheduled</span>
        <span className="flex items-center gap-1.5 text-red-600"><AlertTriangle size={14} /> {blockedTasks.length} Blocked</span>
        <span className="flex items-center gap-1.5 text-emerald-700"><CheckCircle2 size={14} /> {completedTasks.length} Completed</span>
        <span className="flex items-center gap-1.5 text-slate-600"><Users size={14} /> {projectContractors.length} Contractors</span>
      </div>

      {/* This Week */}
      <ThisWeekSection projectId={project.id} />

      {/* ===== Folder system ===== */}
      <div>
        {/* Primary folder tabs */}
        <div className="flex items-end gap-2 px-1">
          {FOLDERS.map((f) => {
            const active = folder === f.key;
            const total = f.tabs.reduce((s, t) => s + (counts[t] || 0), 0);
            return (
              <button
                key={f.key}
                onClick={() => switchFolder(f.key)}
                className={cn(
                  "flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-t-xl text-sm font-semibold transition relative",
                  active
                    ? "bg-white border border-b-0 border-slate-200 text-slate-900 shadow-sm -mb-px z-10"
                    : "bg-slate-100 border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <f.icon size={16} className={active ? "text-blue-600" : "text-slate-400"} />
                <span className="whitespace-nowrap">{f.label}</span>
                {total > 0 && (
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", active ? "bg-blue-50 text-blue-600" : "bg-white text-slate-400")}>{total}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Panel with sub-tabs + content */}
        <div className="bg-white border border-slate-200 rounded-b-xl rounded-tr-xl shadow-sm">
          {/* Sub-tabs */}
          <div className="flex gap-1 px-2 sm:px-3 border-b border-slate-200 overflow-x-auto">
            {activeFolder.tabs.map((key) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={cn("px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap -mb-px",
                  activeTab === key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
                )}>
                {TAB_LABELS[key]}
                {counts[key] !== undefined && <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{counts[key]}</span>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 sm:p-5">
            {activeTab === "tasks" && <TasksTab tasks={projectTasks} projectId={project.id} store={store} />}
            {activeTab === "expenses" && <ExpensesTab expenses={projectExpenses} />}
            {activeTab === "vital" && <VitalInfoTab projectId={project.id} vitalInfo={vitalInfo} store={store} />}
            {activeTab === "photos" && <FilesTab key="media" mode="media" projectId={project.id} store={store} />}
            {activeTab === "documents" && <FilesTab key="docs" mode="docs" projectId={project.id} store={store} />}
            {activeTab === "renders" && <RendersTab renders={project.renders} />}
            {activeTab === "contractors" && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-4">Assigned Contractors</h3>
                {projectContractors.length === 0 && (
                  <div className="flex flex-col items-center py-12 text-center">
                    <Users size={40} className="text-slate-300 mb-3" />
                    <p className="text-sm text-slate-400">No contractors assigned yet.</p>
                    <p className="text-xs text-slate-300 mt-1">Assign one to a task, or add from the Contractors page.</p>
                  </div>
                )}
                <div className="space-y-2">
                  {projectContractors.map((c) => (
                    <div key={c.id} className="border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-200 hover:shadow-md transition" onClick={() => router.push(`/contractors/${c.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">{c.name.split(" ").map((n) => n[0]).join("")}</div>
                        <div className="flex-1">
                          <span className="font-medium text-slate-900 group-hover:text-blue-600">{c.name}</span>
                          <p className="text-xs text-slate-400">{c.company} &middot; {c.phone}</p>
                        </div>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { setComposeFor(c.id); setComposeType("sms"); }} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"><MessageSquare size={14} /></button>
                          <button onClick={() => { setComposeFor(c.id); setComposeType("call"); }} className="p-2 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"><Phone size={14} /></button>
                          <Link href={`/invoices/create?contractor=${c.id}&project=${project.id}`} className="p-2 rounded-lg hover:bg-violet-50 text-slate-400 hover:text-violet-600"><FileText size={14} /></Link>
                        </div>
                      </div>
                      {composeFor === c.id && (
                        <div className="mt-3 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-slate-500">{composeType === "sms" ? "Text" : "Call"} {c.name}</span>
                            <button onClick={() => setComposeFor(null)} className="ml-auto"><X size={12} /></button>
                          </div>
                          {composeType === "call" ? (
                            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm"><Phone size={14} /> Call {c.phone}</button>
                          ) : (
                            <div className="flex gap-2">
                              <input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type message..." className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                              <button onClick={() => handleSendMessage(c.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"><Send size={12} /></button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeTab === "comms" && <CommsTab comms={projectComms} store={store} />}
            {activeTab === "invoices" && <InvoicesTab invoices={projectInvoices} store={store} projectId={project.id} />}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && <EditProjectModal project={project} store={store} onClose={() => setEditing(false)} />}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete {project.name}?</h3>
            <p className="text-sm text-slate-500 mb-4">This will permanently delete the project and all tasks/expenses.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const c = accent === "emerald" ? "text-emerald-700" : accent === "red" ? "text-red-700" : accent === "blue" ? "text-blue-700" : "text-slate-900";
  return <div className="stat-card"><p className="text-xs text-slate-400 mb-1">{label}</p><p className={cn("text-lg font-bold", c)}>{value}</p></div>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function EditProjectModal({ project, store, onClose }: { project: any; store: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: project.name, street: project.address.street, city: project.address.city,
    state: project.address.state, zip: project.address.zip,
    purchasePrice: project.purchasePrice.toString(), estimatedARV: project.estimatedARV.toString(),
    totalBudget: project.totalBudget.toString(), totalSpent: project.totalSpent.toString(),
    status: project.status, scopeOfWork: project.scopeOfWork || "",
  });
  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const save = () => {
    store.updateProject(project.id, {
      name: form.name, status: form.status as any, scopeOfWork: form.scopeOfWork,
      address: { ...project.address, street: form.street, city: form.city, state: form.state, zip: form.zip },
      purchasePrice: parseFloat(form.purchasePrice) || 0, estimatedARV: parseFloat(form.estimatedARV) || 0,
      totalBudget: parseFloat(form.totalBudget) || 0, totalSpent: parseFloat(form.totalSpent) || 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-auto p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Edit Project</h2>
        <div className="space-y-3">
          <div><label className="text-sm font-medium text-slate-700 block mb-1">Name</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Street</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.street} onChange={(e) => set("street", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">City</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">State</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.state} onChange={(e) => set("state", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">ZIP</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.zip} onChange={(e) => set("zip", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Status</label>
              <select className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="active">Active</option><option value="completed">Completed</option><option value="on_hold">On Hold</option><option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Purchase</label><input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">ARV</label><input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.estimatedARV} onChange={(e) => set("estimatedARV", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Budget</label><input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.totalBudget} onChange={(e) => set("totalBudget", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Spent</label><input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.totalSpent} onChange={(e) => set("totalSpent", e.target.value)} /></div>
          </div>
          <div><label className="text-sm font-medium text-slate-700 block mb-1">Scope of Work</label><textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-20 resize-none" value={form.scopeOfWork} onChange={(e) => set("scopeOfWork", e.target.value)} /></div>
          <div className="flex gap-3 justify-end mt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={save} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"><Save size={14} className="inline mr-1" />Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalInfoTab({ projectId, vitalInfo, store }: { projectId: string; vitalInfo: any; store: any }) {
  const [form, setForm] = useState(vitalInfo);
  const [saved, setSaved] = useState(false);
  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const save = () => {
    store.updateVitalInfo(projectId, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2"><Key size={18} className="text-slate-400" /> Vital Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5"><Zap size={12} /> Electric</h4>
            <div><label className="text-xs text-slate-500">Company Name</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="Georgia Power" value={form.electricCompany} onChange={(e) => set("electricCompany", e.target.value)} /></div>
            <div><label className="text-xs text-slate-500">Account # / Login</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="Account number or login info" value={form.electricAccount} onChange={(e) => set("electricAccount", e.target.value)} /></div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5"><Droplets size={12} /> Water</h4>
            <div><label className="text-xs text-slate-500">Company Name</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="City Water Dept" value={form.waterCompany} onChange={(e) => set("waterCompany", e.target.value)} /></div>
            <div><label className="text-xs text-slate-500">Account # / Login</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1" value={form.waterAccount} onChange={(e) => set("waterAccount", e.target.value)} /></div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5"><Flame size={12} /> Gas</h4>
            <div><label className="text-xs text-slate-500">Company Name</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1" placeholder="Atlanta Gas Light" value={form.gasCompany} onChange={(e) => set("gasCompany", e.target.value)} /></div>
            <div><label className="text-xs text-slate-500">Account # / Login</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1" value={form.gasAccount} onChange={(e) => set("gasAccount", e.target.value)} /></div>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1.5"><Key size={12} /> Property Access</h4>
            <div><label className="text-xs text-slate-500">Key Location</label><textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 h-20 resize-none" placeholder="e.g. Lockbox on front door, code 1234. Spare key under the mat at side entrance." value={form.keyLocation} onChange={(e) => set("keyLocation", e.target.value)} /></div>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-xs text-slate-500">Additional Notes</label>
          <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mt-1 h-16 resize-none" placeholder="Any other vital info..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button onClick={save} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1.5"><Save size={14} /> Save Vital Info</button>
          {saved && <span className="text-sm text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 size={14} /> Saved!</span>}
        </div>
      </div>
    </div>
  );
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function TasksTab({ tasks: projectTasks, projectId, store }: { tasks: any[]; projectId: string; store: any }) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [filter, setFilter] = useState<"active" | "completed">("active");

  const projectContractors = store.contractors.filter((c: any) =>
    store.getProject(projectId)?.contractorIds?.includes(c.id)
  );
  const otherContractors = store.contractors.filter((c: any) =>
    !store.getProject(projectId)?.contractorIds?.includes(c.id)
  );

  const handleAddDefaults = () => {
    const today = new Date().toISOString().split("T")[0];
    let cumDays = 0;
    DEFAULT_TASKS.forEach((dt) => {
      const dueDate = addDays(today, cumDays + dt.days);
      store.addTask({
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        projectId,
        title: dt.title,
        description: "",
        status: "not_started" as const,
        priority: "medium" as const,
        qualityCheck: "pending" as const,
        orderConfirmed: false,
        estimatedCost: 0,
        actualCost: 0,
        category: dt.category,
        dueDate,
        scheduledDate: addDays(today, cumDays),
        notes: "",
        photos: [],
        microtasks: makeMicrotasks(dt.microtasks),
      });
      cumDays += dt.days;
    });
  };

  const handleAddSingle = () => {
    store.addTask({
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      projectId,
      title: "",
      description: "",
      status: "not_started" as const,
      priority: "medium" as const,
      qualityCheck: "pending" as const,
      orderConfirmed: false,
      estimatedCost: 0,
      actualCost: 0,
      category: "General",
      dueDate: addDays(new Date().toISOString().split("T")[0], 7),
      notes: "",
      photos: [],
      microtasks: [],
    });
  };

  const handleDeleteTask = (taskId: string) => store.deleteTask(taskId);
  const handleUpdate = (taskId: string, updates: any) => store.updateTask(taskId, updates);

  const handleTaskPhotoUpload = (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        const task = projectTasks.find((t: any) => t.id === taskId);
        const newPhoto = {
          id: `tph_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          url: base64,
          caption: file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: "current_user",
        };
        handleUpdate(taskId, { photos: [...(task?.photos || []), newPhoto] });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeTaskPhoto = (taskId: string, photoId: string) => {
    const task = projectTasks.find((t: any) => t.id === taskId);
    handleUpdate(taskId, { photos: (task?.photos || []).filter((p: any) => p.id !== photoId) });
  };

  const isDueSoon = (dueDate?: string) => {
    if (!dueDate) return false;
    const diff = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && diff >= -1;
  };
  const isOverdue = (dueDate?: string) => (dueDate ? new Date(dueDate) < new Date() : false);

  const sorted = [...projectTasks].sort((a, b) => {
    const aDate = a.dueDate || a.scheduledDate || "9999";
    const bDate = b.dueDate || b.scheduledDate || "9999";
    return aDate.localeCompare(bDate);
  });

  const activeList = sorted.filter((t) => t.status !== "completed");
  const completedList = sorted.filter((t) => t.status === "completed");
  const shown = filter === "active" ? activeList : completedList;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
          <button onClick={() => setFilter("active")}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition", filter === "active" ? "bg-white shadow text-slate-900" : "text-slate-500")}>
            Active ({activeList.length})
          </button>
          <button onClick={() => setFilter("completed")}
            className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition", filter === "completed" ? "bg-white shadow text-slate-900" : "text-slate-500")}>
            Completed ({completedList.length})
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAddSingle} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition">
            <Plus size={12} /> Add Task
          </button>
          <button onClick={handleAddDefaults} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-200">
            <ListChecks size={14} /> Create Scope of Work
          </button>
        </div>
      </div>

      {projectTasks.length === 0 && (
        <div className="border border-slate-200 rounded-xl flex flex-col items-center py-16">
          <ListChecks size={56} className="text-blue-200 mb-4" />
          <p className="text-lg font-semibold text-slate-700 mb-1">No Scope of Work Yet</p>
          <p className="text-sm text-slate-400 mb-5">Create a full renovation scope — {DEFAULT_TASKS.length} tasks, each with an essential microtask checklist</p>
          <button onClick={handleAddDefaults} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
            <ListChecks size={16} /> Create Scope of Work
          </button>
        </div>
      )}

      {projectTasks.length > 0 && shown.length === 0 && (
        <p className="text-sm text-slate-400 py-8 text-center">
          {filter === "active" ? "All tasks are complete. 🎉" : "No completed tasks yet."}
        </p>
      )}

      <div className="space-y-2.5">
        {shown.map((task: any, idx: number) => {
          const isExpanded = expandedTask === task.id;
          const overdue = isOverdue(task.dueDate) && task.status !== "completed";
          const dueSoon = isDueSoon(task.dueDate) && task.status !== "completed";
          const contractor = task.assignedContractorId ? store.getContractor(task.assignedContractorId) : null;
          const mts = task.microtasks || [];
          const mtDone = mts.filter((m: any) => m.done).length;
          const mtPct = mts.length ? Math.round((mtDone / mts.length) * 100) : 0;
          const cost = task.actualCost || task.estimatedCost || 0;

          return (
            <div key={task.id} className={cn("rounded-xl border border-slate-200 bg-white p-3.5 border-l-4 transition hover:shadow-sm",
              task.status === "completed" ? "border-l-emerald-500 opacity-70" :
              overdue ? "border-l-red-500 ring-1 ring-red-200" :
              dueSoon ? "border-l-amber-500" :
              task.status === "blocked" ? "border-l-red-500" :
              task.status === "in_progress" ? "border-l-sky-500" :
              "border-l-slate-300"
            )}>
              {/* Header row */}
              <div className="flex items-center gap-3">
                <button onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  className="text-xs font-bold text-slate-300 w-5 text-center hover:text-slate-500 transition">{idx + 1}</button>

                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => handleUpdate(task.id, { title: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Task name…"
                    className="w-full font-medium text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-400 focus:outline-none pb-0.5"
                  />
                  <div className="flex items-center gap-2 mt-1 flex-wrap cursor-pointer" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                    {task.dueDate && (
                      <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded",
                        overdue ? "bg-red-100 text-red-700" : dueSoon ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {overdue ? "OVERDUE · " : dueSoon ? "DUE SOON · " : ""}{formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.category && <span className="text-[10px] text-slate-400">{task.category}</span>}
                    {contractor && <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded inline-flex items-center gap-1"><HardHat size={9} /> {contractor.name}</span>}
                    {cost > 0 && <span className="text-[10px] text-slate-500 font-medium">{formatCurrency(cost)}</span>}
                    {(task.photos?.length || 0) > 0 && <span className="text-[10px] text-slate-400 inline-flex items-center gap-0.5"><Camera size={10} /> {task.photos.length}</span>}
                  </div>
                </div>

                {/* Microtask progress chip */}
                {mts.length > 0 && (
                  <div className="hidden sm:flex flex-col items-end gap-1 w-24" onClick={() => setExpandedTask(isExpanded ? null : task.id)}>
                    <span className={cn("text-[10px] font-semibold", mtPct === 100 ? "text-emerald-600" : "text-slate-500")}>{mtDone}/{mts.length} steps</span>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", mtPct === 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${mtPct}%` }} />
                    </div>
                  </div>
                )}

                <select
                  value={task.status}
                  onChange={(e) => handleUpdate(task.id, { status: e.target.value, ...(e.target.value === "completed" ? { completedDate: new Date().toISOString().split("T")[0] } : {}) })}
                  onClick={(e) => e.stopPropagation()}
                  className={cn("text-[10px] font-medium rounded-full px-2 py-1 border-0 cursor-pointer",
                    task.status === "completed" ? "bg-emerald-100 text-emerald-700" :
                    task.status === "blocked" ? "bg-red-100 text-red-700" :
                    task.status === "in_progress" ? "bg-sky-100 text-sky-700" :
                    task.status === "scheduled" ? "bg-violet-100 text-violet-700" :
                    "bg-slate-100 text-slate-600"
                  )}>
                  <option value="not_started">Not Started</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                </select>

                <button onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-400 transition">
                  <ChevronDown size={16} className={cn("transition-transform", isExpanded && "rotate-180")} />
                </button>
                <button onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition"><Trash2 size={14} /></button>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 uppercase mb-1 block">Assigned Contractor</label>
                      <select value={task.assignedContractorId || ""} onChange={(e) => handleUpdate(task.id, { assignedContractorId: e.target.value || undefined })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
                        <option value="">Unassigned</option>
                        {projectContractors.length > 0 && (
                          <optgroup label="Project Contractors">
                            {projectContractors.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.specialty.join(", ")}</option>)}
                          </optgroup>
                        )}
                        {otherContractors.length > 0 && (
                          <optgroup label="Other Contractors">
                            {otherContractors.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.specialty.join(", ")}</option>)}
                          </optgroup>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 uppercase mb-1 block">Due Date</label>
                      <input type="date" value={task.dueDate || ""} onChange={(e) => handleUpdate(task.id, { dueDate: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 uppercase mb-1 block">Category</label>
                      <input type="text" value={task.category} onChange={(e) => handleUpdate(task.id, { category: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 uppercase mb-1 block">Priority</label>
                      <select value={task.priority} onChange={(e) => handleUpdate(task.id, { priority: e.target.value })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 uppercase mb-1 block">Est. Cost</label>
                      <input type="number" value={task.estimatedCost || ""} onChange={(e) => handleUpdate(task.id, { estimatedCost: Number(e.target.value) })}
                        placeholder="$0" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-slate-400 uppercase mb-1 block">Actual Cost</label>
                      <input type="number" value={task.actualCost || ""} onChange={(e) => handleUpdate(task.id, { actualCost: Number(e.target.value) })}
                        placeholder="$0" className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm" />
                    </div>
                  </div>

                  {/* Microtasks */}
                  <MicrotaskSection task={task} onUpdate={handleUpdate} />

                  <div>
                    <label className="text-[10px] font-medium text-slate-400 uppercase mb-1 block">Notes</label>
                    <textarea value={task.notes || ""} onChange={(e) => handleUpdate(task.id, { notes: e.target.value })}
                      placeholder="Paint colors, materials, specifications, room-by-room details…"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none h-24" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-medium text-slate-400 uppercase">Photos</label>
                      <label className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-600 cursor-pointer hover:bg-slate-200">
                        <Camera size={10} /> Add Photos
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleTaskPhotoUpload(task.id, e)} />
                      </label>
                    </div>
                    {(task.photos?.length || 0) > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {task.photos.map((p: any) => (
                          <div key={p.id} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                            <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />
                            <button onClick={() => removeTaskPhoto(task.id, p.id)}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {projectTasks.length > 0 && filter === "active" && (
        <button onClick={handleAddSingle} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500 transition flex items-center justify-center gap-2">
          <Plus size={14} /> Add Another Task
        </button>
      )}
    </div>
  );
}

function MicrotaskSection({ task, onUpdate }: { task: any; onUpdate: (id: string, u: any) => void }) {
  const [draft, setDraft] = useState("");
  const mts: any[] = task.microtasks || [];
  const done = mts.filter((m) => m.done).length;
  const pct = mts.length ? Math.round((done / mts.length) * 100) : 0;

  const setList = (list: any[]) => onUpdate(task.id, { microtasks: list });
  const add = (title: string) => {
    const t = title.trim();
    if (!t) return;
    setList([...mts, { id: `mt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, title: t, done: false }]);
  };
  const toggle = (id: string) => setList(mts.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));
  const edit = (id: string, v: string) => setList(mts.map((m) => (m.id === id ? { ...m, title: v } : m)));
  const remove = (id: string) => setList(mts.filter((m) => m.id !== id));
  const loadTemplate = () => setList(getMicrotasksFor(task.title, task.category));

  return (
    <div className="rounded-lg bg-slate-50/70 border border-slate-100 p-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1.5">
          <ListChecks size={12} className="text-blue-500" /> Microtasks {mts.length > 0 && <span className="text-slate-400 font-medium">· {done}/{mts.length}</span>}
        </label>
        <button onClick={loadTemplate}
          className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition">
          <Sparkles size={11} /> {mts.length ? "Reset to template" : "Use template"}
        </button>
      </div>

      {mts.length > 0 && (
        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2.5">
          <div className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="space-y-1">
        {mts.map((m) => (
          <div key={m.id} className="flex items-center gap-2 group">
            <button onClick={() => toggle(m.id)}
              className={cn("w-4 h-4 rounded-[5px] border flex items-center justify-center flex-shrink-0 transition",
                m.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-blue-400 bg-white")}>
              {m.done && <Check size={11} />}
            </button>
            <input
              value={m.title}
              onChange={(e) => edit(m.id, e.target.value)}
              placeholder="Microtask…"
              className={cn("flex-1 bg-transparent text-sm focus:outline-none border-b border-transparent focus:border-blue-300 py-0.5",
                m.done ? "line-through text-slate-400" : "text-slate-700")}
            />
            <button onClick={() => remove(m.id)}
              className="p-1 rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition flex-shrink-0"><X size={12} /></button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { add(draft); setDraft(""); } }}
          placeholder="Add a microtask and press Enter"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-300"
        />
        <button onClick={() => { add(draft); setDraft(""); }}
          className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition"><Plus size={14} /></button>
      </div>
    </div>
  );
}

function ExpensesTab({ expenses }: { expenses: any[] }) {
  const total = expenses.reduce((s, e) => s + e.total, 0);
  return (
    <div>
      <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-semibold text-slate-700">All Expenses</h3><p className="text-sm font-semibold">Total: {formatCurrency(total)}</p></div>
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <FileText size={40} className="text-slate-300 mb-3" />
          <p className="text-sm text-slate-400">No expenses logged yet.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="text-left py-3 px-4 font-medium text-slate-500">Item</th><th className="text-left py-3 px-4 font-medium text-slate-500">Category</th><th className="text-left py-3 px-4 font-medium text-slate-500">Vendor</th><th className="text-right py-3 px-4 font-medium text-slate-500">Unit</th><th className="text-right py-3 px-4 font-medium text-slate-500">Qty</th><th className="text-right py-3 px-4 font-medium text-slate-500">Total</th></tr></thead>
            <tbody>{expenses.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 last:border-0"><td className="py-3 px-4 font-medium text-slate-800">{e.description}</td><td className="py-3 px-4 text-slate-500">{e.category}</td><td className="py-3 px-4 text-slate-500">{e.vendor}</td><td className="py-3 px-4 text-right">{formatCurrency(e.unitPrice)}</td><td className="py-3 px-4 text-right">{e.quantity}</td><td className="py-3 px-4 text-right font-semibold">{formatCurrency(e.total)}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilesTab({ mode, projectId, store }: { mode: "media" | "docs"; projectId: string; store: any }) {
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [captionInput, setCaptionInput] = useState("");
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const allItems: any[] = store.getProject(projectId)?.photos || [];
  const items = allItems.filter((p) => (mode === "media" ? isMedia(detectFileType(p)) : isDoc(detectFileType(p))));

  const accept = mode === "media"
    ? "image/*,video/*"
    : ".pdf,.xlsx,.xls,.csv,.doc,.docx,.txt,.ppt,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setPendingFiles(Array.from(files));
    setCaptionInput("");
    setShowCaptionModal(true);
    e.target.value = "";
  };

  const handleUpload = () => {
    pendingFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        const newItem = {
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          url: base64,
          caption: captionInput || file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: "current_user",
        };
        store.updateProject(projectId, { photos: [...(store.getProject(projectId)?.photos || []), newItem] });
      };
      reader.readAsDataURL(file);
    });
    setShowCaptionModal(false);
    setPendingFiles([]);
    setCaptionInput("");
  };

  const handleDelete = (fileId: string) => {
    store.updateProject(projectId, { photos: allItems.filter((p) => p.id !== fileId) });
    setViewingFile(null);
  };

  const downloadFile = (item: any) => {
    const link = document.createElement("a");
    link.href = item.url;
    link.download = item.caption || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileClick = (item: any) => {
    const k = detectFileType(item);
    if (k === "xlsx" || k === "doc") { downloadFile(item); return; }
    setViewingFile(item.id);
  };

  const viewingItem = items.find((p) => p.id === viewingFile) || allItems.find((p) => p.id === viewingFile);
  const viewingType = viewingItem ? detectFileType(viewingItem) : null;

  const title = mode === "media" ? "Photos & Videos" : "Documents & Files";
  const uploadLabel = mode === "media" ? "Upload Photos / Videos" : "Upload Documents";

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <label className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 cursor-pointer transition">
          <Upload size={14} /> {uploadLabel}
          <input type="file" accept={accept} multiple className="hidden" onChange={handleFileSelect} />
        </label>
      </div>

      {showCaptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCaptionModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Upload {pendingFiles.length} File{pendingFiles.length > 1 ? "s" : ""}</h4>
            <p className="text-sm text-slate-500 mb-4">Add an optional caption for {pendingFiles.length > 1 ? "these files" : "this file"}.</p>
            <input
              type="text"
              placeholder="Caption (optional)"
              value={captionInput}
              onChange={(e) => setCaptionInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleUpload()}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCaptionModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={handleUpload} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Upload</button>
            </div>
          </div>
        </div>
      )}

      {viewingFile && viewingItem && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setViewingFile(null)}>
          <button onClick={() => setViewingFile(null)} className="absolute top-4 right-4 text-white hover:text-slate-300 z-10"><X size={28} /></button>
          <button onClick={() => handleDelete(viewingFile)} className="absolute top-4 left-4 text-red-400 hover:text-red-300 flex items-center gap-1 text-sm z-10"><Trash2 size={16} /> Delete</button>
          {viewingType === "image" && (
            <img src={viewingItem.url} alt="" className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          )}
          {viewingType === "video" && (
            <video src={viewingItem.url} controls autoPlay className="max-w-[90vw] max-h-[85vh] rounded-lg bg-black" onClick={(e) => e.stopPropagation()} />
          )}
          {viewingType === "pdf" && (
            <div className="w-[90vw] h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <iframe src={viewingItem.url} className="w-full h-full rounded-lg bg-white" title={viewingItem.caption} />
              <button onClick={() => window.open(viewingItem.url, "_blank")} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
                <ExternalLink size={14} /> Open in New Tab
              </button>
            </div>
          )}
          <p className="absolute bottom-6 text-white text-sm bg-black/60 px-4 py-2 rounded-lg">{viewingItem.caption}</p>
        </div>
      )}

      {items.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {items.map((p) => {
            const k = detectFileType(p);
            const badge = k === "pdf" ? "PDF" : k === "xlsx" ? "XLSX" : k === "doc" ? "DOC" : k === "video" ? "VIDEO" : "IMG";
            const badgeColor = k === "pdf" ? "bg-red-100 text-red-700" : k === "xlsx" ? "bg-green-100 text-green-700" : k === "doc" ? "bg-sky-100 text-sky-700" : k === "video" ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700";
            return (
              <div key={p.id} className="border border-slate-200 rounded-xl p-3 cursor-pointer hover:shadow-md transition relative bg-white" onClick={() => handleFileClick(p)}>
                <div className="absolute top-2 right-2 z-10">
                  <span className={cn("text-[10px] font-bold uppercase px-1.5 py-0.5 rounded", badgeColor)}>{badge}</span>
                </div>
                <div className="aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden mb-2 flex items-center justify-center relative">
                  {k === "image" && <img src={p.url} alt={p.caption} className="w-full h-full object-cover" />}
                  {k === "video" && (
                    <>
                      <video src={p.url} className="w-full h-full object-cover" muted />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-10 h-10 rounded-full bg-black/55 flex items-center justify-center">
                          <span className="w-0 h-0 border-y-[7px] border-y-transparent border-l-[11px] border-l-white ml-1" />
                        </span>
                      </span>
                    </>
                  )}
                  {k === "pdf" && <div className="flex flex-col items-center gap-2"><FileText size={40} className="text-red-400" /><span className="text-xs text-slate-500 font-medium">PDF Document</span></div>}
                  {k === "xlsx" && <div className="flex flex-col items-center gap-2"><FileText size={40} className="text-green-500" /><span className="text-xs text-slate-500 font-medium">Spreadsheet</span></div>}
                  {k === "doc" && <div className="flex flex-col items-center gap-2"><FileText size={40} className="text-sky-500" /><span className="text-xs text-slate-500 font-medium">Document</span></div>}
                </div>
                <div className="flex items-center gap-1.5">
                  {k === "image" && <Camera size={12} className="text-blue-500 flex-shrink-0" />}
                  {k === "video" && <Box size={12} className="text-violet-500 flex-shrink-0" />}
                  {(k === "pdf" || k === "xlsx" || k === "doc") && <FileText size={12} className="text-slate-500 flex-shrink-0" />}
                  <p className="text-sm font-medium text-slate-800 truncate">{p.caption}</p>
                </div>
                <p className="text-xs text-slate-400">{formatDate(p.uploadedAt)}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl flex flex-col items-center py-12">
          {mode === "media" ? <Camera size={48} className="text-slate-300 mb-3" /> : <FileText size={48} className="text-slate-300 mb-3" />}
          <p className="text-sm text-slate-400">{mode === "media" ? "No photos or videos yet" : "No documents yet"}</p>
          <p className="text-xs text-slate-300 mt-1">
            {mode === "media" ? "Upload site photos and walkthrough videos" : "Upload SOW sheets, PDFs, spreadsheets and contracts"}
          </p>
        </div>
      )}
    </div>
  );
}

function RendersTab({ renders }: { renders: any[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-4">3D Walkthrough Renders</h3>
      {renders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{renders.map((r) => (
          <div key={r.id} className="border border-slate-200 rounded-xl p-4"><div className="aspect-video bg-gradient-to-br from-blue-100 to-violet-100 rounded-lg flex items-center justify-center mb-3"><Box size={40} className="text-blue-400" /></div><h4 className="font-semibold text-slate-900">{r.label}</h4><p className="text-xs text-slate-400 mb-3">Captured {formatDate(r.capturedAt)}</p><a href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"><ExternalLink size={14} /> View 3D Walkthrough</a></div>
        ))}</div>
      ) : (<div className="border border-slate-200 rounded-xl flex flex-col items-center py-12"><Box size={48} className="text-slate-300 mb-3" /><p className="text-sm text-slate-400">No 3D renders yet</p></div>)}
    </div>
  );
}

function CommsTab({ comms, store }: { comms: any[]; store: any }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-semibold text-slate-700">Communications</h3><Link href="/communications" className="text-sm text-blue-600">View All</Link></div>
      {comms.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <MessageSquare size={40} className="text-slate-300 mb-3" />
          <p className="text-sm text-slate-400">No messages or calls logged yet.</p>
        </div>
      )}
      {comms.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((comm) => {
        const contractor = store.getContractor(comm.contractorId);
        return (
          <div key={comm.id} className={cn("border border-slate-200 rounded-xl flex items-start gap-3 p-3", !comm.read && "ring-1 ring-blue-200")}>
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-white text-xs",
              comm.type === "call" ? "bg-emerald-500" : comm.type === "sms" ? "bg-blue-500" : "bg-violet-500"
            )}>{comm.type === "call" ? <Phone size={12} /> : <MessageSquare size={12} />}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-900">{contractor?.name}</span>
                <span className="text-xs text-slate-400 capitalize">{comm.type} &middot; {comm.direction}</span>
                {comm.callStatus === "missed" && <span className="badge bg-red-100 text-red-700 text-[10px]">Missed</span>}
              </div>
              <p className="text-sm text-slate-600 mt-0.5 truncate">{comm.content}</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatRelativeTime(comm.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InvoicesTab({ invoices, store, projectId }: { invoices: any[]; store: any; projectId: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4"><h3 className="text-sm font-semibold text-slate-700">Invoices</h3><Link href={`/invoices/create?project=${projectId}`} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"><FileText size={14} /> Write Invoice</Link></div>
      {invoices.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <FileText size={40} className="text-slate-300 mb-3" />
          <p className="text-sm text-slate-400">No invoices yet.</p>
        </div>
      )}
      <div className="space-y-3">{invoices.map((inv) => {
        const contractor = store.getContractor(inv.contractorId);
        return (
          <div key={inv.id} className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2"><div><h4 className="font-medium text-slate-900">{contractor?.name}</h4><p className="text-xs text-slate-400">Created {formatDate(inv.createdAt)}</p></div><span className={`badge ${statusColor(inv.status)}`}>{inv.status}</span></div>
            {inv.lineItems.map((li: any) => (<div key={li.id} className="flex justify-between text-sm py-1 border-b border-slate-100"><span className="text-slate-700">{li.description}</span><span className="font-medium">{formatCurrency(li.total)}</span></div>))}
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className={cn("text-center p-2 rounded-lg text-xs", inv.depositPaid ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400")}>25% Deposit: {inv.depositPaid ? "Paid" : "Pending"}</div>
              <div className={cn("text-center p-2 rounded-lg text-xs", inv.midpointPaid ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400")}>25% Mid: {inv.midpointPaid ? "Paid" : "Pending"}</div>
              <div className={cn("text-center p-2 rounded-lg text-xs", inv.completionPaid ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400")}>50% Final: {inv.completionPaid ? "Paid" : "Pending"}</div>
            </div>
          </div>
        );
      })}</div>
    </div>
  );
}

function ThisWeekSection({ projectId }: { projectId: string }) {
  const store = useStore();
  const todos = store.getProjectWeeklyTodos(projectId);

  const tasksDueThisWeek = store.getProjectTasks(projectId).filter((t: any) => {
    if (t.status === "completed") return false;
    if (!t.dueDate) return false;
    const diff = (new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && diff >= -3;
  }).sort((a: any, b: any) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = () => {
    if (!newText.trim()) return;
    store.addWeeklyTodo({
      id: `todo-${Date.now()}`,
      projectId,
      text: newText.trim(),
      hiddenFromDashboard: false,
      createdAt: new Date().toISOString(),
    });
    setNewText("");
    setAdding(false);
  };

  const toggleDashboardVisibility = (id: string, currentlyHidden: boolean) => {
    store.updateWeeklyTodo(id, { hiddenFromDashboard: !currentlyHidden });
  };

  const visible = todos.filter((t) => !t.hiddenFromDashboard);
  const hidden = todos.filter((t) => t.hiddenFromDashboard);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <ListChecks size={16} className="text-blue-600" /> This Week
          <span className="text-xs text-slate-400 font-normal">&middot; synced to dashboard</span>
        </h3>
        <button onClick={() => setAdding(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition">
          <Plus size={12} /> Add Item
        </button>
      </div>

      {adding && (
        <div className="mb-3 flex gap-2">
          <input type="text" value={newText} onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") { setAdding(false); setNewText(""); } }}
            placeholder="What needs to happen this week?" autoFocus
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          <button onClick={handleAdd} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Add</button>
          <button onClick={() => { setAdding(false); setNewText(""); }} className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm">Cancel</button>
        </div>
      )}

      {tasksDueThisWeek.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {tasksDueThisWeek.map((task: any) => {
            const overdue = new Date(task.dueDate) < new Date();
            return (
              <div key={task.id} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                overdue ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
              )}>
                <AlertTriangle size={13} className={overdue ? "text-red-500" : "text-amber-500"} />
                <span className="font-medium text-slate-800 flex-1">{task.title}</span>
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded",
                  overdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                )}>{overdue ? "OVERDUE" : "Due"} {formatDate(task.dueDate)}</span>
              </div>
            );
          })}
        </div>
      )}

      {todos.length === 0 && tasksDueThisWeek.length === 0 && !adding && (
        <p className="text-sm text-slate-400 py-3">No items yet. Click &quot;Add Item&quot; to create one.</p>
      )}

      {visible.length > 0 && (
        <div className="space-y-1.5">
          {visible.map((todo) => (
            <div key={todo.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 group">
              <Eye size={14} className="text-blue-500 flex-shrink-0" />
              <span className="text-sm text-slate-700 flex-1">{todo.text}</span>
              <button onClick={() => toggleDashboardVisibility(todo.id, false)}
                className="text-xs text-slate-400 hover:text-amber-600 opacity-0 group-hover:opacity-100 transition">Hide from dashboard</button>
              <button onClick={() => store.deleteWeeklyTodo(todo.id)}
                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}

      {hidden.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400 mb-2">Hidden from dashboard ({hidden.length})</p>
          <div className="space-y-1.5">
            {hidden.map((todo) => (
              <div key={todo.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 group opacity-70">
                <EyeOff size={14} className="text-slate-400 flex-shrink-0" />
                <span className="text-sm text-slate-600 line-through flex-1">{todo.text}</span>
                <button onClick={() => toggleDashboardVisibility(todo.id, true)}
                  className="text-xs text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition">Show on dashboard</button>
                <button onClick={() => store.deleteWeeklyTodo(todo.id)}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

export const runtime = 'edge';

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Phone, MessageSquare, Mail, Star, FileText,
  Clock, CheckCircle2, Calendar, Building2, StickyNote,
  Edit3, Trash2, Save, X, Send, Plus, ChevronDown, ChevronUp,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { formatCurrency, formatDate, formatRelativeTime, statusColor, cn } from "@/lib/utils";

export default function ContractorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const store = useStore();
  const contractor = store.getContractor(id);
  const [activeTab, setActiveTab] = useState<"overview" | "comms" | "invoices">("overview");
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeType, setComposeType] = useState<"sms" | "call">("sms");
  const [messageText, setMessageText] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingCommNote, setEditingCommNote] = useState<string | null>(null);
  const [commNoteText, setCommNoteText] = useState("");

  if (!contractor) return <div className="flex items-center justify-center h-96"><p className="text-slate-400">Contractor not found.</p></div>;

  const comms = store.getContractorComms(contractor.id);
  const cProjects = store.getContractorProjects(contractor.id);
  const cInvoices = store.getContractorInvoices(contractor.id);
  const cTasks = store.tasks.filter((t) => t.assignedContractorId === contractor.id);

  const sharedContractorIds = new Set<string>();
  cProjects.forEach((p) => p.contractorIds.forEach((cid) => { if (cid !== contractor.id) sharedContractorIds.add(cid); }));
  const sharedContractors = store.contractors.filter((c) => sharedContractorIds.has(c.id));

  // Sort comms chronologically (newest first)
  const sortedComms = [...comms].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleDelete = () => { store.deleteContractor(contractor.id); router.push("/contractors"); };

  const handleSend = () => {
    if (!messageText.trim()) return;
    store.addCommunication({
      id: `comm-${Date.now()}`,
      contractorId: contractor.id,
      type: composeType,
      direction: "outbound",
      content: messageText,
      timestamp: new Date().toISOString(),
      read: true,
      ...(composeType === "call" ? { callStatus: "completed" as const } : {}),
    });
    setMessageText("");
    setComposeOpen(false);
  };

  const handleSaveGeneralNotes = () => {
    store.updateContractor(contractor.id, { notes: generalNotes });
    setEditingNotes(false);
  };

  const handleSaveCommNote = (commId: string) => {
    store.updateCommunication(commId, { notes: commNoteText });
    setEditingCommNote(null);
    setCommNoteText("");
  };

  const startEditCommNote = (commId: string, existingNote?: string) => {
    setEditingCommNote(commId);
    setCommNoteText(existingNote || "");
  };

  const removeCommNote = (commId: string) => {
    store.updateCommunication(commId, { notes: undefined });
  };

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl">
            {contractor.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{contractor.name}</h1>
            <p className="text-sm text-slate-500">{contractor.company}</p>
            <p className="text-xs text-slate-400">{contractor.city}, {contractor.state} {contractor.zip}</p>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} className={i < Math.round(contractor.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
              ))}
              <span className="text-sm text-slate-400 ml-1">{contractor.rating}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setComposeOpen(true); setComposeType("sms"); }} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            <MessageSquare size={14} /> Text
          </button>
          <button onClick={() => { setComposeOpen(true); setComposeType("call"); }} className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700">
            <Phone size={14} /> Call
          </button>
          <Link href={`/invoices/create?contractor=${contractor.id}`} className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700">
            <FileText size={14} /> Invoice
          </Link>
          <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200">
            <Edit3 size={14} />
          </button>
          <button onClick={() => setDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Compose */}
      {composeOpen && (
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{composeType === "sms" ? "Text" : "Call"} {contractor.name}</span>
            <button onClick={() => setComposeOpen(false)}><X size={14} /></button>
          </div>
          {composeType === "call" ? (
            <div className="flex items-center gap-3">
              <p className="text-sm text-slate-600 flex-1">Call {contractor.phone}</p>
              <button onClick={handleSend} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">
                <Phone size={14} className="inline mr-1" /> Start Call
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type message..."
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }} />
              <button onClick={handleSend} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
                <Send size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contact + Notes + Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Contact</h3>
          <p className="text-sm text-slate-700 flex items-center gap-2"><Phone size={14} className="text-slate-400" /> {contractor.phone}</p>
          <p className="text-sm text-slate-700 flex items-center gap-2 mt-1"><Mail size={14} className="text-slate-400" /> {contractor.email}</p>
        </div>

        {/* General Notes — editable */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1"><StickyNote size={12} /> Notes</h3>
            {!editingNotes ? (
              <button onClick={() => { setGeneralNotes(contractor.notes || ""); setEditingNotes(true); }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium">{contractor.notes ? "Edit" : "Add Note"}</button>
            ) : (
              <div className="flex gap-1">
                <button onClick={handleSaveGeneralNotes} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Save</button>
                <button onClick={() => setEditingNotes(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
              </div>
            )}
          </div>
          {editingNotes ? (
            <textarea value={generalNotes} onChange={(e) => setGeneralNotes(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm h-20 resize-none" placeholder="Add notes about this contractor..." autoFocus />
          ) : (
            <p className="text-sm text-slate-600">{contractor.notes || <span className="text-slate-400 italic">No notes yet</span>}</p>
          )}
        </div>

        <div className="stat-card">
          <h3 className="text-xs font-semibold text-slate-400 uppercase mb-2">Specialties</h3>
          <div className="flex flex-wrap gap-1.5">
            {contractor.specialty.map((s) => <span key={s} className="badge bg-blue-50 text-blue-700">{s}</span>)}
          </div>
          <div className="grid grid-cols-2 gap-2 text-center mt-3 pt-3 border-t border-slate-100">
            <div><p className="text-lg font-bold">{contractor.totalJobsCompleted}</p><p className="text-xs text-slate-400">Done</p></div>
            <div><p className="text-lg font-bold">{cProjects.filter((p) => p.status === "active").length}</p><p className="text-xs text-slate-400">Active</p></div>
          </div>
        </div>
      </div>

      {/* Shared contractors */}
      {sharedContractors.length > 0 && (
        <div className="stat-card bg-blue-50 border-blue-200">
          <h3 className="text-xs font-semibold text-blue-600 uppercase mb-2">Also on shared projects</h3>
          <div className="flex gap-3 flex-wrap">
            {sharedContractors.map((sc) => (
              <Link key={sc.id} href={`/contractors/${sc.id}`} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg text-sm hover:shadow-md transition">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">{sc.name.split(" ").map((n) => n[0]).join("")}</div>
                <div><p className="font-medium text-slate-800 text-xs">{sc.name}</p><p className="text-[10px] text-slate-400">{sc.specialty.join(", ")}</p></div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1 -mb-px">
          {(["overview", "comms", "invoices"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("px-4 py-2.5 text-sm font-medium border-b-2 transition capitalize",
                activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700")}>
              {tab === "comms" ? `Communications (${comms.length})` : tab === "invoices" ? `Invoices (${cInvoices.length})` : "Overview"}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Projects</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cProjects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`} className="stat-card flex items-center gap-3 group">
                  <Building2 size={20} className="text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 group-hover:text-blue-600">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.address.city}, {p.address.state}</p>
                  </div>
                  <span className={`badge ${statusColor(p.status)}`}>{p.status.replace("_", " ")}</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Tasks ({cTasks.length})</h3>
            <div className="space-y-2">
              {cTasks.map((task) => (
                <div key={task.id} className="stat-card flex items-center gap-3">
                  {task.status === "completed" ? <CheckCircle2 size={16} className="text-emerald-500" /> :
                    task.status === "in_progress" ? <Clock size={16} className="text-sky-500" /> :
                    <Calendar size={16} className="text-violet-500" />}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-400">{task.category} &middot; {task.status.replace("_", " ")}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{formatCurrency(task.estimatedCost)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Communications Tab — full chronological history with notes */}
      {activeTab === "comms" && (
        <div className="space-y-1">
          {sortedComms.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No communications yet. Send a text or make a call to get started.</p>
          ) : (
            sortedComms.map((comm, i) => {
              const isOutbound = comm.direction === "outbound";
              const isCall = comm.type === "call";
              const isMissed = isCall && comm.callStatus === "missed";
              const isEditingNote = editingCommNote === comm.id;
              const hasNote = !!comm.notes;

              // Group by date
              const date = new Date(comm.timestamp).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              const prevDate = i > 0 ? new Date(sortedComms[i - 1].timestamp).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : null;
              const showDateSep = date !== prevDate;

              const time = new Date(comm.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

              return (
                <div key={comm.id}>
                  {showDateSep && (
                    <div className="flex items-center gap-3 py-3">
                      <div className="flex-1 h-px bg-slate-200"></div>
                      <span className="text-xs font-medium text-slate-400">{date}</span>
                      <div className="flex-1 h-px bg-slate-200"></div>
                    </div>
                  )}
                  <div className={cn("flex gap-3 py-2", isOutbound ? "flex-row-reverse" : "")}>
                    {/* Avatar / Icon */}
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0",
                      isOutbound ? "bg-blue-500" : "bg-slate-400")}>
                      {isOutbound ? "You" : contractor.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    {/* Bubble */}
                    <div className={cn("max-w-[70%] min-w-[200px]")}>
                      <div className={cn("rounded-2xl px-4 py-2.5", isCall
                        ? isMissed ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"
                        : isOutbound ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-800")}>
                        {isCall ? (
                          <div className="flex items-center gap-2">
                            <Phone size={14} className={isMissed ? "text-red-500" : "text-emerald-600"} />
                            <span className={cn("text-sm font-medium", isMissed ? "text-red-600" : "text-emerald-700")}>
                              {isMissed ? "Missed Call" : comm.callStatus === "scheduled" ? "Scheduled Call" : "Phone Call"}
                            </span>
                            {comm.duration && <span className="text-xs text-slate-400 ml-1">{Math.floor(comm.duration / 60)}:{String(comm.duration % 60).padStart(2, "0")}</span>}
                          </div>
                        ) : (
                          <p className="text-sm">{comm.content}</p>
                        )}
                        {isCall && comm.content && (
                          <p className={cn("text-sm mt-1", isMissed ? "text-red-500" : "text-slate-600")}>{comm.content}</p>
                        )}
                      </div>

                      {/* Timestamp + actions */}
                      <div className={cn("flex items-center gap-2 mt-1 px-1", isOutbound ? "flex-row-reverse" : "")}>
                        <span className="text-[10px] text-slate-400">{time}</span>
                        <span className="text-[10px] text-slate-300">&middot;</span>
                        <span className="text-[10px] text-slate-400 capitalize">{comm.direction}</span>
                        <button onClick={() => startEditCommNote(comm.id, comm.notes)}
                          className="text-[10px] text-blue-500 hover:text-blue-700 font-medium ml-1">
                          {hasNote ? "Edit Note" : "+ Note"}
                        </button>
                        {hasNote && (
                          <button onClick={() => removeCommNote(comm.id)}
                            className="text-[10px] text-red-400 hover:text-red-600">Remove</button>
                        )}
                      </div>

                      {/* Note on this comm */}
                      {hasNote && !isEditingNote && (
                        <div className={cn("mt-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800", isOutbound ? "ml-auto" : "")}>
                          <StickyNote size={10} className="inline mr-1 text-amber-500" />
                          {comm.notes}
                        </div>
                      )}

                      {/* Editing note */}
                      {isEditingNote && (
                        <div className="mt-1 flex gap-1">
                          <input value={commNoteText} onChange={(e) => setCommNoteText(e.target.value)}
                            placeholder="Add a note..." autoFocus
                            className="flex-1 border border-slate-200 rounded-lg px-2 py-1 text-xs"
                            onKeyDown={(e) => { if (e.key === "Enter") handleSaveCommNote(comm.id); }} />
                          <button onClick={() => handleSaveCommNote(comm.id)}
                            className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs"><Save size={10} /></button>
                          <button onClick={() => setEditingCommNote(null)}
                            className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs"><X size={10} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="space-y-3">
          {cInvoices.length === 0 ? (
            <p className="text-sm text-slate-400">No invoices.</p>
          ) : cInvoices.map((inv) => (
            <div key={inv.id} className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Invoice #{inv.id}</p>
                <span className={`badge ${statusColor(inv.status)}`}>{inv.status}</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(inv.subtotal)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editing && <EditContractorModal contractor={contractor} store={store} onClose={() => setEditing(false)} />}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 fade-in" onClick={() => setDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Delete {contractor.name}?</h3>
            <p className="text-sm text-slate-500 mb-4">This will remove them from all projects.</p>
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

function EditContractorModal({ contractor, store, onClose }: { contractor: any; store: any; onClose: () => void }) {
  const [form, setForm] = useState({
    name: contractor.name, company: contractor.company, email: contractor.email,
    phone: contractor.phone, city: contractor.city, state: contractor.state,
    zip: contractor.zip, specialty: contractor.specialty.join(", "), notes: contractor.notes,
  });
  const set = (k: string, v: string) => setForm((p: any) => ({ ...p, [k]: v }));

  const save = () => {
    store.updateContractor(contractor.id, {
      name: form.name, company: form.company, email: form.email, phone: form.phone,
      city: form.city, state: form.state, zip: form.zip, notes: form.notes,
      specialty: form.specialty.split(",").map((s: string) => s.trim()).filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Edit Contractor</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Name</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Company</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Email</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Phone</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">City</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">State</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.state} onChange={(e) => set("state", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">ZIP</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.zip} onChange={(e) => set("zip", e.target.value)} /></div>
          </div>
          <div><label className="text-sm font-medium text-slate-700 block mb-1">Specialties (comma separated)</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.specialty} onChange={(e) => set("specialty", e.target.value)} /></div>
          <div><label className="text-sm font-medium text-slate-700 block mb-1">Notes</label><textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-16 resize-none" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <div className="flex gap-3 justify-end mt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={save} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"><Save size={14} className="inline mr-1" />Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

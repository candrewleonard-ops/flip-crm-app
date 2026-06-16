"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Phone, MessageSquare, Mail, Star, Search, ChevronDown, X, Send, Clock } from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { cn, formatRelativeTime } from "@/lib/utils";

export default function ContractorsPage() {
  const store = useStore();
  const [stateFilter, setStateFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [composeFor, setComposeFor] = useState<string | null>(null);
  const [composeType, setComposeType] = useState<"sms" | "call">("sms");
  const [messageText, setMessageText] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleAmPm, setScheduleAmPm] = useState<"AM" | "PM">("AM");
  const [showSchedule, setShowSchedule] = useState(false);
  const [showAddContractor, setShowAddContractor] = useState(false);
  const router = useRouter();

  // Get unique states
  const states = useMemo(() => {
    const s = new Set(store.contractors.map((c) => c.state).filter(Boolean));
    return [...s].sort();
  }, [store.contractors]);

  // Get all projects for filter
  const allProjects = store.projects;
  const activeProjects = allProjects.filter((p) => p.status === "active");
  const pastProjects = allProjects.filter((p) => p.status === "completed");

  let filtered = store.contractors;
  if (stateFilter) filtered = filtered.filter((c) => c.state === stateFilter);
  if (projectFilter) filtered = filtered.filter((c) => c.projectIds.includes(projectFilter));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter((c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.specialty.some((s) => s.toLowerCase().includes(q)));
  }

  const handleSend = (contractorId: string) => {
    if (!messageText.trim()) return;
    store.addCommunication({
      id: `comm-${Date.now()}`, contractorId, type: composeType === "sms" ? "sms" : "call",
      direction: "outbound", content: messageText,
      timestamp: new Date().toISOString(), read: true,
      ...(composeType === "call" ? { callStatus: "completed" as const } : {}),
    });
    setMessageText("");
    setComposeFor(null);
  };

  const openCompose = (contractorId: string, type: "sms" | "call") => {
    if (composeFor === contractorId && composeType === type) {
      setComposeFor(null);
    } else {
      setComposeFor(contractorId);
      setComposeType(type);
      setMessageText("");
      setShowSchedule(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contractors</h1>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} contractor{filtered.length !== 1 ? "s" : ""} &middot; {states.length} state{states.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowAddContractor(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm shadow-blue-200">
          <Plus size={16} /> Add Contractor
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search name, company, specialty..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white w-72" />
        </div>
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <option value="">All States</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
          <option value="">Active Project</option>
          {activeProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          <optgroup label="Past Projects">
            {pastProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </optgroup>
        </select>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="stat-card flex flex-col items-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center mb-4">
            <Plus size={28} className="text-blue-500" />
          </div>
          <p className="text-lg font-semibold text-slate-700 mb-1">{store.contractors.length === 0 ? "No Contractors Yet" : "No Matches"}</p>
          <p className="text-sm text-slate-400 mb-5">
            {store.contractors.length === 0 ? "Add your first contractor to start building your team" : "Try adjusting your search or filters"}
          </p>
          {store.contractors.length === 0 && (
            <button onClick={() => setShowAddContractor(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
              <Plus size={16} /> Add Contractor
            </button>
          )}
        </div>
      )}

      {/* Close CRM-style Table */}
      {filtered.length > 0 && <div className="stat-card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left py-3 px-4 font-medium text-slate-500">Name</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">Number</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">Location</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">Specialties</th>
              <th className="text-center py-3 px-4 font-medium text-slate-500">Active Projects</th>
              <th className="text-center py-3 px-4 font-medium text-slate-500">Total Done</th>
              <th className="text-left py-3 px-4 font-medium text-slate-500">Latest Communication</th>
              <th className="text-right py-3 px-4 font-medium text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => {
              const activeCount = store.projects.filter((p) => p.contractorIds.includes(c.id) && p.status === "active").length;
              const lastComm = store.communications.filter((cm) => cm.contractorId === c.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
              const isExpanded = expandedId === c.id;
              const isComposing = composeFor === c.id;

              return (
                <React.Fragment key={c.id}>
                  <tr className={cn("border-b border-slate-100 hover:bg-blue-50/40 transition cursor-pointer", isExpanded && "bg-blue-50/50")} onClick={() => router.push(`/contractors/${c.id}`)}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {c.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <span className="font-medium text-blue-600">{c.name}</span>
                          <p className="text-xs text-slate-400">{c.company}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{c.phone}</td>
                    <td className="py-3 px-4 text-slate-500">{c.city}, {c.state} {c.zip}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {c.specialty.slice(0, 3).map((s) => (
                          <span key={s} className="badge bg-blue-50 text-blue-700 text-[10px]">{s}</span>
                        ))}
                        {c.specialty.length > 3 && <span className="text-xs text-slate-400">+{c.specialty.length - 3}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">{activeCount}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">{c.totalJobsCompleted}</td>
                    <td className="py-3 px-4">
                      {lastComm ? (
                        <div>
                          <p className="text-xs text-slate-600 truncate max-w-[200px]">{lastComm.type === "call" ? (lastComm.callStatus === "missed" ? "Missed call" : lastComm.callStatus === "scheduled" ? "Scheduled call" : "Call") : lastComm.content}</p>
                          <p className="text-[10px] text-slate-400">{formatRelativeTime(lastComm.timestamp)}</p>
                        </div>
                      ) : <span className="text-xs text-slate-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openCompose(c.id, "sms")} className={cn("p-1.5 rounded-lg transition", isComposing && composeType === "sms" ? "bg-blue-100 text-blue-600" : "hover:bg-blue-50 text-slate-400 hover:text-blue-600")}>
                          <MessageSquare size={14} />
                        </button>
                        <button onClick={() => openCompose(c.id, "call")} className={cn("p-1.5 rounded-lg transition", isComposing && composeType === "call" ? "bg-emerald-100 text-emerald-600" : "hover:bg-emerald-50 text-slate-400 hover:text-emerald-600")}>
                          <Phone size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Inline compose panel */}
                  {isComposing && (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-slate-700">
                              {composeType === "sms" ? "Text" : "Call"} {c.name}
                            </span>
                            <button onClick={() => setComposeFor(null)} className="ml-auto p-1 hover:bg-slate-200 rounded"><X size={14} /></button>
                          </div>
                          {composeType === "call" ? (
                            <div className="flex items-center gap-3">
                              <p className="text-sm text-slate-600">Call {c.name} at {c.phone}</p>
                              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition">
                                <Phone size={14} /> Start Call (Twilio)
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Type a message..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none h-16" />
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <button onClick={() => handleSend(c.id)} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                                  <Send size={12} /> Send
                                </button>
                                <button onClick={() => setShowSchedule(!showSchedule)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition", showSchedule ? "bg-violet-100 text-violet-700" : "bg-slate-200 text-slate-600 hover:bg-slate-300")}>
                                  <Clock size={12} /> Schedule
                                </button>
                                {showSchedule && (
                                  <div className="flex items-center gap-2">
                                    <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1 text-sm" />
                                    <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                                      <button onClick={() => setScheduleAmPm("AM")} className={cn("px-2 py-1 text-xs font-medium", scheduleAmPm === "AM" ? "bg-blue-100 text-blue-700" : "text-slate-500")}>AM</button>
                                      <button onClick={() => setScheduleAmPm("PM")} className={cn("px-2 py-1 text-xs font-medium", scheduleAmPm === "PM" ? "bg-blue-100 text-blue-700" : "text-slate-500")}>PM</button>
                                    </div>
                                    <button className="px-3 py-1 bg-violet-600 text-white rounded-lg text-xs hover:bg-violet-700 transition">Schedule Send</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Expanded detail */}
                  {isExpanded && !isComposing && (
                    <tr>
                      <td colSpan={8} className="p-0">
                        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
                          <div className="grid grid-cols-3 gap-6">
                            <div>
                              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Contact</h4>
                              <p className="text-sm text-slate-700">{c.email}</p>
                              <p className="text-sm text-slate-700">{c.phone}</p>
                              <p className="text-sm text-slate-500 mt-1">{c.city}, {c.state} {c.zip}</p>
                              <div className="flex items-center gap-1 mt-2">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} size={12} className={i < Math.round(c.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                                ))}
                                <span className="text-xs text-slate-400 ml-1">{c.rating}</span>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Projects</h4>
                              {store.getContractorProjects(c.id).map((p) => (
                                <Link key={p.id} href={`/projects/${p.id}`} className="block text-sm text-blue-600 hover:text-blue-700 mb-1">
                                  {p.name} <span className={`badge text-[10px] ${cn(p.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}`}>{p.status}</span>
                                </Link>
                              ))}
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Notes</h4>
                              <p className="text-sm text-slate-600">{c.notes || "No notes"}</p>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Link href={`/contractors/${c.id}`} className="text-sm text-blue-600 hover:text-blue-700 font-medium">View Full Profile →</Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>}

      {/* Add Contractor Modal */}
      {showAddContractor && <AddContractorModal store={store} onClose={() => setShowAddContractor(false)} />}
    </div>
  );
}

import React from "react";

function AddContractorModal({ store, onClose }: { store: ReturnType<typeof useStore>; onClose: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: "", company: "", email: "", phone: "",
    city: "", state: "", zip: "",
    specialty: "",
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error("Contractor name is required");
      return;
    }
    store.addContractor({
      id: `c-${Date.now()}`, name: form.name, company: form.company, email: form.email, phone: form.phone,
      city: form.city, state: form.state, zip: form.zip,
      specialty: form.specialty.split(",").map((s) => s.trim()).filter(Boolean),
      rating: 0, projectIds: [], totalJobsCompleted: 0, notes: "",
    });
    toast.success(`Added ${form.name}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl scale-in" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Add Contractor</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Name *</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Company</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.company} onChange={(e) => set("company", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Email</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">Phone</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium text-slate-700 block mb-1">City</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">State</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="TX" value={form.state} onChange={(e) => set("state", e.target.value)} /></div>
            <div><label className="text-sm font-medium text-slate-700 block mb-1">ZIP</label><input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={form.zip} onChange={(e) => set("zip", e.target.value)} /></div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Specialties (comma separated)</label>
            <input className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Flooring, Framing, Roofing" value={form.specialty} onChange={(e) => set("specialty", e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Add Contractor</button>
          </div>
        </div>
      </div>
    </div>
  );
}

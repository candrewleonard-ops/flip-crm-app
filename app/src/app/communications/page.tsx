"use client";

import React, { Suspense, useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MessageSquare, Search, X, ChevronRight,
  Plus, AlertTriangle, Ban, Users,
  UserPlus, FolderKanban, Send, Phone,
  Clock, CalendarClock, ListPlus,
  CheckCircle2, Mail, StickyNote, ArrowRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { formatRelativeTime, formatDate, cn } from "@/lib/utils";
import { Communication, Contractor } from "@/lib/types";

const SPECIALTIES = [
  "Flooring", "Drywall", "Roofing", "Plumbing", "Electrical",
  "HVAC", "Painting", "General", "Kitchen", "Bathroom",
  "Demolition", "Framing", "Exterior",
];

export default function CommunicationsPage() {
  return <Suspense><HotTasksCommsContent /></Suspense>;
}

function HotTasksCommsContent() {
  useSearchParams();
  const store = useStore();
  const toast = useToast();

  const [contactSearch, setContactSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showCreateTask, setShowCreateTask] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskProjectId, setTaskProjectId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedProject = selectedProjectId ? store.getProject(selectedProjectId) : null;
  const selectedContractor = selectedContractorId ? store.getContractor(selectedContractorId) : null;

  const projectContractors = useMemo(() => {
    if (!selectedProject) return [];
    return selectedProject.contractorIds
      .map((cid) => store.getContractor(cid))
      .filter(Boolean) as Contractor[];
  }, [selectedProject, store]);

  const hotTasks = useMemo(() => {
    return store.tasks
      .filter((t) => t.status === "blocked" || (t.priority === "critical" && (t.status === "in_progress" || t.status === "scheduled")))
      .sort((a, b) => {
        if (a.status === "blocked" && b.status !== "blocked") return -1;
        if (b.status === "blocked" && a.status !== "blocked") return 1;
        return 0;
      });
  }, [store.tasks]);

  const filteredContractors = useMemo(() => {
    let result = [...store.contractors];
    if (contactSearch) {
      const q = contactSearch.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q));
    }
    if (activeFilters.length > 0) {
      result = result.filter((c) => c.specialty.some((s) => activeFilters.includes(s)));
    }
    return result;
  }, [store.contractors, contactSearch, activeFilters]);

  const contractorConversations = useMemo(() => {
    return store.contractors.map((c) => {
      const comms = store.getContractorComms(c.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const unread = comms.filter((m) => !m.read && m.direction === "inbound").length;
      const lastComm = comms[0];
      return { contractor: c, comms, unread, lastComm };
    })
      .filter((c) => c.comms.length > 0)
      .sort((a, b) => {
        if (a.unread > 0 && b.unread === 0) return -1;
        if (b.unread > 0 && a.unread === 0) return 1;
        if (!a.lastComm) return 1;
        if (!b.lastComm) return -1;
        return new Date(b.lastComm.timestamp).getTime() - new Date(a.lastComm.timestamp).getTime();
      });
  }, [store.contractors, store.communications, store]);

  const selectedConversation = useMemo(() => {
    if (!selectedContractorId) return [];
    return store.getContractorComms(selectedContractorId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedContractorId, store.communications, store]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation.length]);

  useEffect(() => {
    if (selectedContractorId) {
      const unread = store.getContractorComms(selectedContractorId)
        .filter((c) => !c.read && c.direction === "inbound");
      for (const c of unread) {
        store.updateCommunication(c.id, { read: true });
      }
    }
  }, [selectedContractorId, store]);

  const toggleFilter = (f: string) => {
    setActiveFilters((prev) => prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]);
  };

  const handleSend = () => {
    if (!messageText.trim() || !selectedContractorId) return;
    const comm: Communication = {
      id: `comm-${Date.now()}`,
      contractorId: selectedContractorId,
      type: "sms",
      direction: "outbound",
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
      read: true,
    };
    store.addCommunication(comm);
    setMessageText("");
    toast.success("Message sent");
  };

  const handleScheduleReply = () => {
    if (!messageText.trim() || !selectedContractorId || !scheduleDate || !scheduleTime) {
      toast.error("Fill in the message, date, and time");
      return;
    }
    const scheduledFor = `${scheduleDate}T${scheduleTime}:00`;
    const comm: Communication = {
      id: `comm-${Date.now()}`,
      contractorId: selectedContractorId,
      type: "sms",
      direction: "outbound",
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
      read: true,
      scheduledFor,
      notes: `Scheduled for ${new Date(scheduledFor).toLocaleString()}`,
    };
    store.addCommunication(comm);
    setMessageText("");
    setShowSchedule(false);
    setScheduleDate("");
    setScheduleTime("");
    toast.success(`Reply scheduled for ${new Date(scheduledFor).toLocaleString()}`);
  };

  const handleCreateTask = (commId: string) => {
    if (!taskTitle.trim() || !taskProjectId) {
      toast.error("Enter a title and select a project");
      return;
    }
    store.addTask({
      id: `task-${Date.now()}`,
      projectId: taskProjectId,
      title: taskTitle.trim(),
      description: "",
      category: "general",
      status: "scheduled",
      priority: "medium",
      qualityCheck: "pending",
      estimatedCost: 0,
      actualCost: 0,
      orderConfirmed: false,
      assignedContractorId: selectedContractorId || undefined,
      notes: `Created from communication`,
    });
    const comm = store.communications.find((c) => c.id === commId);
    if (comm) {
      store.updateCommunication(commId, { notes: `${comm.notes || ""} [Task created: ${taskTitle.trim()}]`.trim() });
    }
    toast.success(`Task "${taskTitle.trim()}" created`);
    setShowCreateTask(null);
    setTaskTitle("");
    setTaskProjectId("");
  };

  const formatCommPreview = (comm: Communication) => {
    if (comm.type === "call") {
      if (comm.callStatus === "missed") return "Missed call";
      const dur = comm.duration ? ` - ${Math.floor(comm.duration / 60)}m ${comm.duration % 60}s` : "";
      return `${comm.direction === "inbound" ? "Inbound" : "Outbound"} call${dur}`;
    }
    return comm.content;
  };

  const activeProjects = store.getActiveProjects();

  return (
    <div className="fade-in flex gap-0 h-[calc(100vh-6rem)]">
      {/* LEFT - Contact List + Hot Tasks */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-white border-r border-slate-200 overflow-hidden rounded-l-xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-violet-50">
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-600" /> Messages
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {store.communications.filter((c) => !c.read && c.direction === "inbound").length} unread
          </p>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input placeholder="Search contacts..." className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-lg" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {SPECIALTIES.slice(0, 8).map((s) => (
              <button key={s} onClick={() => toggleFilter(s)}
                className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium transition",
                  activeFilters.includes(s) ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}>
                {s}
              </button>
            ))}
            {SPECIALTIES.length > 8 && (
              <button onClick={() => setActiveFilters([])}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium text-slate-400 hover:text-slate-600">
                {activeFilters.length > 0 ? "Clear" : `+${SPECIALTIES.length - 8}`}
              </button>
            )}
          </div>
        </div>

        {/* Hot Tasks Strip */}
        {hotTasks.length > 0 && (
          <div className="px-3 py-2 border-b border-slate-200 bg-red-50/50">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1 flex items-center gap-1">
              <AlertTriangle size={10} /> {hotTasks.length} Hot Task{hotTasks.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-1 max-h-24 overflow-auto">
              {hotTasks.slice(0, 3).map((task) => {
                const project = store.getProject(task.projectId);
                return (
                  <Link key={task.id} href={`/projects/${task.projectId}`}
                    className="flex items-center gap-1.5 text-[10px] text-slate-700 hover:text-blue-600 transition">
                    {task.status === "blocked" ? <Ban size={10} className="text-red-500" /> : <AlertTriangle size={10} className="text-amber-500" />}
                    <span className="truncate flex-1">{task.title}</span>
                    <span className="text-slate-400 truncate max-w-16">{project?.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Conversation List */}
        <div className="flex-1 overflow-auto">
          {(contactSearch || activeFilters.length > 0 ? filteredContractors : contractorConversations.map((c) => c.contractor)).map((contractor) => {
            const conv = contractorConversations.find((c) => c.contractor.id === contractor.id);
            const isActive = selectedContractorId === contractor.id;
            return (
              <button key={contractor.id} onClick={() => setSelectedContractorId(contractor.id)}
                className={cn("w-full text-left px-4 py-3 border-b border-slate-100 transition flex items-center gap-3",
                  isActive ? "bg-blue-50 border-l-2 border-l-blue-500" : "hover:bg-slate-50"
                )}>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                    {contractor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  {conv && conv.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn("text-sm font-medium truncate", conv?.unread ? "text-slate-900" : "text-slate-700")}>
                      {contractor.name}
                    </p>
                    {conv?.lastComm && (
                      <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{formatRelativeTime(conv.lastComm.timestamp)}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {conv?.lastComm ? formatCommPreview(conv.lastComm) : contractor.company}
                  </p>
                  <div className="flex gap-0.5 mt-0.5">
                    {contractor.specialty.slice(0, 2).map((s) => (
                      <span key={s} className="px-1 rounded text-[8px] bg-slate-100 text-slate-400">{s}</span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
          {filteredContractors.length === 0 && (contactSearch || activeFilters.length > 0) && (
            <div className="text-center py-8 text-slate-400 text-xs">No contacts match your search</div>
          )}
        </div>
      </div>

      {/* CENTER - Conversation Thread */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {selectedContractor ? (
          <>
            {/* Conversation Header */}
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                  {selectedContractor.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <Link href={`/contractors/${selectedContractor.id}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition">
                    {selectedContractor.name}
                  </Link>
                  <p className="text-[11px] text-slate-400">{selectedContractor.company} · {selectedContractor.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => {
                  const comm: Communication = {
                    id: `comm-${Date.now()}`,
                    contractorId: selectedContractor.id,
                    type: "call",
                    direction: "outbound",
                    content: `Called ${selectedContractor.name}`,
                    timestamp: new Date().toISOString(),
                    read: true,
                    callStatus: "completed",
                  };
                  store.addCommunication(comm);
                  toast.success(`Call logged to ${selectedContractor.name}`);
                }}
                  className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition" title="Log call">
                  <Phone size={16} />
                </button>
                <Link href={`/contractors/${selectedContractor.id}`}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition" title="View profile">
                  <Users size={16} />
                </Link>
              </div>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-auto px-5 py-4 space-y-1 bg-slate-50/50">
              {selectedConversation.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageSquare size={32} className="mb-2 text-slate-300" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                selectedConversation.map((comm, i) => {
                  const isOutbound = comm.direction === "outbound";
                  const isCall = comm.type === "call";
                  const isMissed = isCall && comm.callStatus === "missed";
                  const isScheduled = !!comm.scheduledFor;

                  const date = new Date(comm.timestamp).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                  const prevDate = i > 0 ? new Date(selectedConversation[i - 1].timestamp).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : null;
                  const showDateSep = date !== prevDate;
                  const time = new Date(comm.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

                  return (
                    <div key={comm.id}>
                      {showDateSep && (
                        <div className="flex items-center gap-3 py-3">
                          <div className="flex-1 h-px bg-slate-200" />
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2">{date}</span>
                          <div className="flex-1 h-px bg-slate-200" />
                        </div>
                      )}
                      <div className={cn("flex gap-2 mb-2", isOutbound ? "flex-row-reverse" : "")}>
                        <div className={cn("max-w-[65%] min-w-[180px] group")}>
                          {/* Bubble */}
                          <div className={cn("rounded-2xl px-4 py-2.5 shadow-sm",
                            isCall
                              ? isMissed ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"
                              : isScheduled ? "bg-amber-50 border border-amber-200"
                              : isOutbound ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-800"
                          )}>
                            {isCall ? (
                              <div className="flex items-center gap-2">
                                <Phone size={14} className={isMissed ? "text-red-500" : "text-emerald-600"} />
                                <span className={cn("text-sm font-medium", isMissed ? "text-red-600" : "text-emerald-700")}>
                                  {isMissed ? "Missed Call" : comm.callStatus === "scheduled" ? "Scheduled Call" : "Phone Call"}
                                </span>
                                {comm.duration && <span className="text-xs text-slate-400 ml-auto">{Math.floor(comm.duration / 60)}:{String(comm.duration % 60).padStart(2, "0")}</span>}
                              </div>
                            ) : isScheduled ? (
                              <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <CalendarClock size={12} className="text-amber-600" />
                                  <span className="text-[10px] font-medium text-amber-700">Scheduled</span>
                                </div>
                                <p className="text-sm text-slate-700">{comm.content}</p>
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed">{comm.content}</p>
                            )}
                            {isCall && comm.content && (
                              <p className={cn("text-xs mt-1", isMissed ? "text-red-400" : "text-slate-500")}>{comm.content}</p>
                            )}
                          </div>

                          {/* Timestamp + quick actions */}
                          <div className={cn("flex items-center gap-2 mt-0.5 px-1", isOutbound ? "flex-row-reverse" : "")}>
                            <span className="text-[10px] text-slate-400">{time}</span>
                            {comm.notes && (
                              <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                                <StickyNote size={8} /> {comm.notes}
                              </span>
                            )}
                            <button onClick={() => { setShowCreateTask(comm.id); setTaskTitle(comm.content || ""); }}
                              className="text-[10px] text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                              <ListPlus size={10} /> Task
                            </button>
                          </div>

                          {/* Create Task Inline */}
                          {showCreateTask === comm.id && (
                            <div className="mt-2 p-3 bg-white rounded-xl border border-blue-200 shadow-lg space-y-2">
                              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1"><ListPlus size={12} className="text-blue-600" /> Create Task from Message</p>
                              <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                                placeholder="Task title..."
                                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs" />
                              <select value={taskProjectId} onChange={(e) => setTaskProjectId(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs bg-white">
                                <option value="">Select project...</option>
                                {activeProjects.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                              <div className="flex gap-2 justify-end">
                                <button onClick={() => setShowCreateTask(null)} className="px-3 py-1 text-xs text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                                <button onClick={() => handleCreateTask(comm.id)} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1">
                                  <Plus size={10} /> Create
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Compose Bar */}
            <div className="px-4 py-3 border-t border-slate-200 bg-white">
              {showSchedule && (
                <div className="flex items-center gap-2 mb-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                  <CalendarClock size={14} className="text-amber-600" />
                  <span className="text-xs text-amber-700 font-medium">Schedule for:</span>
                  <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                    className="border border-slate-200 rounded px-2 py-1 text-xs bg-white" />
                  <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                    className="border border-slate-200 rounded px-2 py-1 text-xs bg-white" />
                  <button onClick={handleScheduleReply}
                    className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 flex items-center gap-1">
                    <CalendarClock size={10} /> Schedule
                  </button>
                  <button onClick={() => setShowSchedule(false)} className="text-slate-400 hover:text-slate-600 ml-auto">
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)}
                    placeholder={`Message ${selectedContractor.name}...`}
                    rows={messageText.split("\n").length > 2 ? 3 : 1}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm resize-none focus:ring-2 focus:ring-blue-400 focus:border-blue-300"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }} />
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setShowSchedule(!showSchedule)}
                    className={cn("p-2.5 rounded-xl transition", showSchedule ? "bg-amber-100 text-amber-600" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600")}
                    title="Schedule reply">
                    <Clock size={18} />
                  </button>
                  <button onClick={handleSend} disabled={!messageText.trim()}
                    className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
                    title="Send message">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <MessageSquare size={32} className="text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-500">Select a conversation</p>
            <p className="text-sm text-slate-400 mt-1">Choose a contact from the left to view messages</p>
          </div>
        )}
      </div>

      {/* RIGHT - Project Contractors Panel */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-white border-l border-slate-200 overflow-hidden rounded-r-xl">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
            <FolderKanban size={14} className="text-blue-600" /> Project Contractors
          </h2>
          <select
            value={selectedProjectId || ""}
            onChange={(e) => setSelectedProjectId(e.target.value || null)}
            className="w-full text-xs border border-slate-200 rounded-lg px-2 py-2 bg-white"
          >
            <option value="">Select a project...</option>
            {store.projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {selectedProject ? (
          <>
            <div className="px-4 py-2 bg-blue-50/50 border-b border-slate-200">
              <p className="text-xs font-medium text-slate-700">{selectedProject.name}</p>
              <p className="text-[10px] text-slate-400">{selectedProject.address.city}, {selectedProject.address.state} · {projectContractors.length} contractor{projectContractors.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex-1 overflow-auto">
              {projectContractors.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No contractors assigned</div>
              ) : (
                projectContractors.map((c) => {
                  const lastComm = store.getContractorComms(c.id)
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
                  return (
                    <button key={c.id} onClick={() => setSelectedContractorId(c.id)}
                      className={cn("w-full text-left px-4 py-3 border-b border-slate-100 transition hover:bg-blue-50/30 flex items-center gap-3",
                        selectedContractorId === c.id && "bg-blue-50"
                      )}>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                        {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800">{c.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {lastComm ? formatRelativeTime(lastComm.timestamp) : c.specialty.join(", ")}
                        </p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedContractorId(c.id); }}
                        className="p-1 rounded hover:bg-blue-100 text-blue-500 transition" title="Open chat">
                        <MessageSquare size={12} />
                      </button>
                    </button>
                  );
                })
              )}
            </div>
            <div className="p-3 border-t border-slate-200">
              <button onClick={() => setShowAssignModal(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition shadow-md shadow-blue-500/15">
                <UserPlus size={12} /> Assign Contractor
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 px-4">
            <FolderKanban size={24} className="text-slate-300 mb-2" />
            <p className="text-xs text-center">Select a project to see assigned contractors</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/50">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick Links</p>
          <div className="space-y-1">
            <Link href="/contractors" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-white hover:shadow-sm transition">
              <Users size={12} className="text-slate-400" /> All Contractors
              <ArrowRight size={10} className="ml-auto text-slate-300" />
            </Link>
            <Link href="/projects" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-600 hover:bg-white hover:shadow-sm transition">
              <FolderKanban size={12} className="text-slate-400" /> All Projects
              <ArrowRight size={10} className="ml-auto text-slate-300" />
            </Link>
          </div>
        </div>
      </div>

      {/* Assign Contractors Modal */}
      {showAssignModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 fade-in" onClick={() => setShowAssignModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Assign Contractors</h3>
            <p className="text-sm text-slate-500 mb-4">Add contractors to {selectedProject.name}</p>
            <div className="space-y-2 max-h-64 overflow-auto">
              {store.contractors
                .filter((c) => !selectedProject.contractorIds.includes(c.id))
                .map((c) => (
                  <button key={c.id} onClick={() => {
                    const newIds = [...new Set([...selectedProject.contractorIds, c.id])];
                    store.updateProject(selectedProject.id, { contractorIds: newIds });
                    const cProjects = [...new Set([...c.projectIds, selectedProject.id])];
                    store.updateContractor(c.id, { projectIds: cProjects });
                    toast.success(`Assigned ${c.name} to ${selectedProject.name}`);
                  }}
                    className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition flex items-center justify-between group">
                    <div>
                      <p className="text-sm font-medium text-slate-800 group-hover:text-blue-700">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.company} · {c.specialty.join(", ")}</p>
                    </div>
                    <Plus size={14} className="text-slate-300 group-hover:text-blue-500" />
                  </button>
                ))}
              {store.contractors.filter((c) => !selectedProject.contractorIds.includes(c.id)).length === 0 && (
                <p className="text-center text-sm text-slate-400 py-4">All contractors are already assigned</p>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

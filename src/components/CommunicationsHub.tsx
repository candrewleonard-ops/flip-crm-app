import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Megaphone,
  Send,
  Phone,
  StickyNote,
  MessageSquare,
  Mail,
  CheckCircle2,
  CircleDot,
  Inbox,
  CalendarDays,
} from "lucide-react";
import { useStore } from "../lib/store";
import type { TaskItem, Project, Contractor, Communication, CommType } from "../lib/types";
import { TASK_STATUS_META, PRIORITY_META, PRIORITY_RANK } from "../lib/labels";
import { Avatar, AvatarStack } from "./ui/Avatar";
import { MetaBadge } from "./ui/Badge";
import { Modal } from "./ui/Modal";
import { EmptyState } from "./ui/EmptyState";
import { useToast } from "./ui/Toast";
import { cn, timeAgo, formatTime, dueLabel } from "../lib/utils";

interface Thread {
  task: TaskItem;
  project: Project;
  contractors: Contractor[];
  messages: Communication[];
  latest?: Communication;
  unreadCount: number;
  lastUnreadTs: number;
  microDone: number;
  microTotal: number;
  sortDate: number;
}

const TYPE_ICON: Record<CommType, React.ElementType> = {
  sms: MessageSquare,
  call: Phone,
  email: Mail,
  note: StickyNote,
};

function ts(iso?: string): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const t = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`).getTime();
  return isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/**
 * Thread comparator — the EXACT required order:
 *  1. Threads with unread inbound messages float to the absolute top,
 *     most-recently-received unread first.
 *  2. Then Active (in_progress) before Scheduled.
 *  3. Then by priority (critical → high → medium → low).
 *  4. Then by due/scheduled date ascending.
 */
export function compareThreads(a: Thread, b: Thread): number {
  const au = a.unreadCount > 0;
  const bu = b.unreadCount > 0;
  if (au !== bu) return au ? -1 : 1; // (1) unread to the very top
  if (au && bu) return b.lastUnreadTs - a.lastUnreadTs; // most recent unread first

  // (2) active before scheduled
  const rank = (s: TaskItem["status"]) => (s === "in_progress" ? 0 : 1);
  if (rank(a.task.status) !== rank(b.task.status)) return rank(a.task.status) - rank(b.task.status);

  // (3) priority
  const pa = PRIORITY_RANK[a.task.priority];
  const pb = PRIORITY_RANK[b.task.priority];
  if (pa !== pb) return pa - pb;

  // (4) date ascending
  return a.sortDate - b.sortDate;
}

export function CommunicationsHub({
  scope,
  embedded = false,
}: {
  scope: string | "all";
  embedded?: boolean;
}) {
  const store = useStore();
  const { db, getContractor, getProject, addCommunication, markTaskThreadRead } = store;
  const toast = useToast();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  // Build threads (in_progress + scheduled tasks within scope)
  const threads = useMemo<Thread[]>(() => {
    const inScope = (t: TaskItem) => {
      if (t.status !== "in_progress" && t.status !== "scheduled") return false;
      if (scope === "all") {
        const p = getProject(t.projectId);
        return p?.status === "active";
      }
      return t.projectId === scope;
    };
    return db.tasks
      .filter(inScope)
      .map((task): Thread | null => {
        const project = getProject(task.projectId);
        if (!project) return null;
        const contractors = task.assignedContractorIds
          .map((id) => getContractor(id))
          .filter((c): c is Contractor => !!c);
        const messages = db.communications
          .filter((c) => c.taskId === task.id)
          .sort((a, b) => ts(a.timestamp) - ts(b.timestamp));
        const unread = messages.filter((m) => m.direction === "inbound" && !m.read);
        const lastUnreadTs = unread.reduce((mx, m) => Math.max(mx, ts(m.timestamp)), 0);
        const micro = task.microtasks ?? [];
        return {
          task,
          project,
          contractors,
          messages,
          latest: messages[messages.length - 1],
          unreadCount: unread.length,
          lastUnreadTs,
          microDone: micro.filter((m) => m.done).length,
          microTotal: micro.length,
          sortDate: ts(task.dueDate ?? task.scheduledDate),
        };
      })
      .filter((t): t is Thread => t !== null);
  }, [db.tasks, db.communications, scope, getProject, getContractor]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads
      .filter((t) => {
        if (unreadOnly && t.unreadCount === 0) return false;
        if (projectFilter && t.project.id !== projectFilter) return false;
        if (q) {
          const hay = `${t.task.title} ${t.project.name} ${t.contractors.map((c) => c.name).join(" ")}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort(compareThreads);
  }, [threads, search, projectFilter, unreadOnly]);

  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0);

  // Mark a thread read when opened.
  const selected = filtered.find((t) => t.task.id === selectedId) ?? null;
  useEffect(() => {
    if (selected && selected.unreadCount > 0) {
      markTaskThreadRead(selected.task.id);
    }
  }, [selected, markTaskThreadRead]);

  // Projects present in scope (for the "All projects" filter)
  const projectsInScope = useMemo(() => {
    const map = new Map<string, Project>();
    threads.forEach((t) => map.set(t.project.id, t.project));
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [threads]);

  const contractorsInScope = useMemo(() => {
    const map = new Map<string, Contractor>();
    threads.forEach((t) => t.contractors.forEach((c) => map.set(c.id, c)));
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [threads]);

  const heightClass = embedded ? "h-[440px]" : "h-[calc(100vh-13rem)]";

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-600 p-1.5">
            <Megaphone className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 leading-tight">Communications Hub</h2>
            <p className="text-[11px] text-slate-500">
              {scope === "all" ? "Every active & scheduled work order" : "This project's active work"}
            </p>
          </div>
        </div>
        {totalUnread > 0 && (
          <span className="badge bg-red-50 text-red-700 ring-1 ring-red-600/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {totalUnread} unread
          </span>
        )}
        <div className="flex-1" />
        <button className="btn btn-primary text-xs py-1.5" onClick={() => setBroadcastOpen(true)} disabled={contractorsInScope.length === 0}>
          <Megaphone className="w-4 h-4" /> Message all contractors
        </button>
      </div>

      {/* Filter bar */}
      <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, projects, contractors…"
            className="input pl-8 py-1.5 text-sm"
          />
        </div>
        {scope === "all" && (
          <select className="input py-1.5 text-sm w-auto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="">All projects</option>
            {projectsInScope.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        <button
          onClick={() => setUnreadOnly((u) => !u)}
          className={cn("btn text-xs py-1.5", unreadOnly ? "btn-primary" : "btn-outline")}
        >
          <Inbox className="w-4 h-4" /> Unread only
        </button>
      </div>

      {/* Two-pane */}
      <div className={cn("grid", embedded ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1.2fr]" : "grid-cols-1 lg:grid-cols-[380px_1fr]", heightClass)}>
        {/* Thread list */}
        <div className="overflow-y-auto border-r border-slate-200">
          {filtered.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No active work to message"
              message="Threads appear here for every in-progress or scheduled task with assigned contractors."
            />
          ) : (
            filtered.map((t) => (
              <ThreadRow
                key={t.task.id}
                thread={t}
                showProject={scope === "all"}
                active={selectedId === t.task.id}
                onClick={() => setSelectedId(t.task.id)}
              />
            ))
          )}
        </div>

        {/* Conversation */}
        <div className="overflow-hidden flex flex-col bg-slate-50/40">
          {selected ? (
            <Conversation
              key={selected.task.id}
              thread={selected}
              onSend={(content, type, contractorId) => {
                addCommunication({
                  contractorId,
                  projectId: selected.project.id,
                  taskId: selected.task.id,
                  type,
                  direction: "outbound",
                  content,
                  read: true,
                  callStatus: type === "call" ? "completed" : undefined,
                });
                toast.success("Message sent");
              }}
            />
          ) : (
            <EmptyState
              icon={MessageSquare}
              title="Select a thread"
              message="Pick a work order on the left to see the conversation and message the crew."
            />
          )}
        </div>
      </div>

      <BroadcastModal
        open={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        contractors={contractorsInScope}
        onSend={(content, ids) => {
          const projectId = scope === "all" ? undefined : scope;
          ids.forEach((cid) =>
            addCommunication({ contractorId: cid, projectId, type: "sms", direction: "outbound", content, read: true })
          );
          toast.success(`Broadcast sent to ${ids.length} contractor${ids.length === 1 ? "" : "s"}`);
          setBroadcastOpen(false);
        }}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Thread row
// ------------------------------------------------------------
function ThreadRow({
  thread,
  showProject,
  active,
  onClick,
}: {
  thread: Thread;
  showProject: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const unread = thread.unreadCount > 0;
  const statusMeta = TASK_STATUS_META[thread.task.status];
  const accent = unread
    ? "border-l-red-400 bg-red-50/40"
    : thread.task.status === "in_progress"
      ? "border-l-sky-400"
      : "border-l-amber-400";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3.5 py-3 border-b border-slate-100 border-l-4 transition-colors",
        accent,
        active ? "bg-blue-50" : "hover:bg-slate-50"
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusMeta.dot)} />
        <h4 className={cn("text-sm truncate flex-1", unread ? "font-bold text-slate-900" : "font-medium text-slate-700")}>
          {thread.task.title}
        </h4>
        {unread && (
          <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center shrink-0">
            {thread.unreadCount}
          </span>
        )}
      </div>
      {showProject && <p className="text-xs text-slate-500 truncate mt-0.5">{thread.project.name}</p>}
      <div className="flex items-center gap-2 mt-1.5">
        <MetaBadge meta={statusMeta} dot={false} />
        <span className={cn("badge", PRIORITY_META[thread.task.priority].badge)}>{PRIORITY_META[thread.task.priority].label}</span>
        <div className="flex-1" />
        <AvatarStack people={thread.contractors.map((c) => ({ name: c.name }))} size={22} max={3} />
      </div>
      <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3 h-3" /> {dueLabel(thread.task.dueDate ?? thread.task.scheduledDate)}
        </span>
        {thread.microTotal > 0 && (
          <span>
            {thread.microDone}/{thread.microTotal} steps
          </span>
        )}
      </div>
      {thread.latest && (
        <p className={cn("text-xs truncate mt-1.5", unread ? "text-slate-700 font-medium" : "text-slate-400")}>
          {thread.latest.direction === "inbound" ? "↙ " : "↗ "}
          {thread.latest.content}
        </p>
      )}
    </button>
  );
}

// ------------------------------------------------------------
// Conversation panel
// ------------------------------------------------------------
function Conversation({
  thread,
  onSend,
}: {
  thread: Thread;
  onSend: (content: string, type: CommType, contractorId: string) => void;
}) {
  const [text, setText] = useState("");
  const [type, setType] = useState<CommType>("sms");
  const [single, setSingle] = useState<string>(thread.contractors[0]?.id ?? "");

  const send = () => {
    const content = text.trim();
    if (!content || !single) return;
    onSend(content, type, single);
    setText("");
  };

  return (
    <>
      {/* Conversation header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">{thread.task.title}</h3>
              <MetaBadge meta={TASK_STATUS_META[thread.task.status]} />
            </div>
            <Link to={`/projects/${thread.project.id}`} className="text-xs text-blue-600 hover:underline">
              {thread.project.name}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {thread.contractors.map((c) => (
              <Avatar key={c.id} name={c.name} size={28} title={`${c.name} · ${c.company}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {thread.messages.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No messages yet — start the conversation below.</p>
        )}
        {thread.messages.map((m) => {
          const Icon = TYPE_ICON[m.type];
          const outbound = m.direction === "outbound";
          const contractor = thread.contractors.find((c) => c.id === m.contractorId);
          return (
            <div key={m.id} className={cn("flex flex-col max-w-[80%]", outbound ? "ml-auto items-end" : "items-start")}>
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                  outbound ? "bg-blue-600 text-white rounded-br-sm" : "bg-white text-slate-800 rounded-bl-sm ring-1 ring-slate-200"
                )}
              >
                {m.type === "call" && (
                  <span className="flex items-center gap-1.5 text-xs opacity-80 mb-0.5">
                    <Phone className="w-3 h-3" /> Call{m.duration ? ` · ${Math.round(m.duration / 60)}m` : ""}
                  </span>
                )}
                {m.type === "note" && (
                  <span className="flex items-center gap-1.5 text-xs opacity-70 mb-0.5">
                    <StickyNote className="w-3 h-3" /> Note
                  </span>
                )}
                {m.content}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 px-1">
                <Icon className="w-3 h-3" />
                {!outbound && contractor ? `${contractor.name.split(" ")[0]} · ` : ""}
                {timeAgo(m.timestamp) || formatTime(m.timestamp)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200 bg-white p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="inline-flex rounded-lg ring-1 ring-slate-200 overflow-hidden">
            {(["sms", "call", "note", "email"] as CommType[]).map((t) => {
              const Icon = TYPE_ICON[t];
              return (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn("px-2.5 py-1 flex items-center gap-1 capitalize", type === t ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}
                >
                  <Icon className="w-3.5 h-3.5" /> {t}
                </button>
              );
            })}
          </div>
          <span className="text-slate-500">To:</span>
          <select className="input py-1 text-xs w-auto" value={single} onChange={(e) => setSingle(e.target.value)}>
            {thread.contractors.length === 0 && <option value="">No contractors assigned</option>}
            {thread.contractors.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
            }}
            rows={2}
            placeholder="Message contractor…"
            className="input resize-none flex-1 text-sm"
          />
          <button className="btn btn-primary" onClick={send} disabled={!text.trim() || !single}>
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>
    </>
  );
}

// ------------------------------------------------------------
// Broadcast modal ("Message all contractors")
// ------------------------------------------------------------
function BroadcastModal({
  open,
  onClose,
  contractors,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  contractors: Contractor[];
  onSend: (content: string, ids: string[]) => void;
}) {
  const [text, setText] = useState("");
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setText("");
      setIds(contractors.map((c) => c.id));
    }
  }, [open, contractors]);

  const toggle = (id: string) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Message all contractors on active work"
      subtitle="One message, sent to everyone currently working active or scheduled tasks."
      size="lg"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!text.trim() || ids.length === 0} onClick={() => onSend(text.trim(), ids)}>
            <Send className="w-4 h-4" /> Send to {ids.length}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {contractors.map((c) => {
            const on = ids.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.id)}
                className={cn(
                  "flex items-center gap-2 rounded-full pl-1 pr-3 py-1 text-sm ring-1 transition-colors",
                  on ? "bg-blue-50 ring-blue-300 text-blue-800" : "bg-white ring-slate-200 text-slate-500"
                )}
              >
                <Avatar name={c.name} size={22} />
                {c.name}
                {on ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> : <CircleDot className="w-3.5 h-3.5 text-slate-300" />}
              </button>
            );
          })}
          {contractors.length === 0 && <p className="text-sm text-slate-400">No contractors on active work.</p>}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="e.g. Quick reminder — materials staging Friday AM, please confirm your crews."
          className="input resize-none text-sm"
        />
      </div>
    </Modal>
  );
}

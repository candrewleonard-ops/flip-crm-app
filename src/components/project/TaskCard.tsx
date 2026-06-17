import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  MessageSquare,
  PackageCheck,
  GripVertical,
} from "lucide-react";
import type { TaskItem, TaskStatus } from "../../lib/types";
import { useStore } from "../../lib/store";
import { TASK_STATUS_META, PRIORITY_META, QUALITY_META, TASK_STATUS_ORDER } from "../../lib/labels";
import { MetaBadge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";
import { ProgressBar } from "../ui/ProgressBar";
import { cn, money, dueLabel } from "../../lib/utils";

export function TaskCard({
  task,
  showProjectName,
  onEdit,
  onDelete,
  onOpenComms,
  draggable = false,
  onDragStart,
}: {
  task: TaskItem;
  showProjectName?: string;
  onEdit: (task: TaskItem) => void;
  onDelete: (task: TaskItem) => void;
  onOpenComms?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}) {
  const { getContractor, toggleMicrotask, setTaskStatus } = useStore();
  const [expanded, setExpanded] = useState(false);
  const micro = task.microtasks ?? [];
  const done = micro.filter((m) => m.done).length;
  const statusMeta = TASK_STATUS_META[task.status];
  const contractors = task.assignedContractorIds.map((id) => getContractor(id)).filter(Boolean);

  const accent =
    task.status === "blocked"
      ? "border-l-red-400"
      : task.status === "in_progress"
        ? "border-l-sky-400"
        : task.status === "scheduled"
          ? "border-l-amber-400"
          : task.status === "completed"
            ? "border-l-emerald-400"
            : "border-l-slate-200";

  return (
    <div
      className={cn("card border-l-4 p-3.5", accent, task.status === "blocked" && "heat-pulse")}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <div className="flex items-start gap-2">
        {draggable && <GripVertical className="w-4 h-4 text-slate-300 mt-0.5 cursor-grab shrink-0" />}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-slate-900 text-sm">{task.title}</h4>
            <span className={cn("badge", PRIORITY_META[task.priority].badge)}>{PRIORITY_META[task.priority].label}</span>
            {task.orderConfirmed && (
              <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20">
                <PackageCheck className="w-3 h-3" /> Ordered
              </span>
            )}
          </div>
          {showProjectName && (
            <Link to="#" className="text-xs text-slate-500">{showProjectName}</Link>
          )}
          {task.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{task.description}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onOpenComms && (
            <button onClick={onOpenComms} className="text-slate-400 hover:text-blue-600 p-1" title="Message contractors">
              <MessageSquare className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => onEdit(task)} className="text-slate-400 hover:text-slate-700 p-1" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => onDelete(task)} className="text-slate-400 hover:text-red-600 p-1" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <select
          value={task.status}
          onChange={(e) => setTaskStatus(task.id, e.target.value as TaskStatus)}
          className={cn("text-xs rounded-full px-2 py-1 font-semibold border-0 ring-1 cursor-pointer", statusMeta.badge)}
        >
          {TASK_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{TASK_STATUS_META[s].label}</option>
          ))}
        </select>
        <MetaBadge meta={QUALITY_META[task.qualityCheck]} dot={false} />
        <div className="flex-1" />
        <div className="flex -space-x-2">
          {contractors.map((c) => c && <Avatar key={c.id} name={c.name} size={24} ring title={c.name} />)}
          {contractors.length === 0 && <span className="text-xs text-slate-400">Unassigned</span>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-2.5 text-xs text-slate-500">
        <span>{dueLabel(task.dueDate ?? task.scheduledDate)}</span>
        <span>
          Est {money(task.estimatedCost)}
          {task.actualCost > 0 && <span className={cn("ml-1", task.actualCost > task.estimatedCost ? "text-red-600 font-medium" : "text-slate-500")}>· Act {money(task.actualCost)}</span>}
        </span>
      </div>

      {micro.length > 0 && (
        <div className="mt-2.5">
          <button onClick={() => setExpanded((e) => !e)} className="flex items-center gap-1.5 w-full text-left">
            {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-xs text-slate-500">{done}/{micro.length} steps</span>
            <div className="flex-1">
              <ProgressBar value={(done / micro.length) * 100} height="h-1.5" color="bg-emerald-500" />
            </div>
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1 pl-1">
              {micro.map((m) => (
                <li key={m.id}>
                  <button onClick={() => toggleMicrotask(task.id, m.id)} className="flex items-center gap-2 text-left w-full group">
                    {m.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-300 group-hover:text-slate-400 shrink-0" />
                    )}
                    <span className={cn("text-xs", m.done ? "text-slate-400 line-through" : "text-slate-600")}>{m.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {task.notes && (
        <p className="mt-2.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5 flex items-start gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {task.notes}
        </p>
      )}
    </div>
  );
}

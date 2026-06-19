import React, { useEffect, useMemo, useState } from "react";
import { Plus, X, CheckCircle2, Circle, Sparkles } from "lucide-react";
import type { TaskItem, TaskStatus, TaskPriority, QualityCheck, Microtask, ProjectSubfolder, TaskPricing } from "../../lib/types";
import { useStore } from "../../lib/store";
import { DEFAULT_TASKS, getMicrotasksFor } from "../../lib/catalogs";
import { pricingForCategory, computeEstimatedCost } from "../../lib/task-pricing";
import { TASK_STATUS_META, PRIORITY_META, QUALITY_META, TASK_STATUS_ORDER, TASK_CATEGORIES } from "../../lib/labels";
import { Modal } from "../ui/Modal";
import { ContractorMultiSelect } from "./ContractorMultiSelect";
import { cn, money } from "../../lib/utils";

interface Draft {
  title: string;
  category: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  qualityCheck: QualityCheck;
  estimatedCost: number;
  actualCost: number;
  dueDate: string;
  scheduledDate: string;
  orderConfirmed: boolean;
  subfolderId: string;
  notes: string;
  microtasks: Microtask[];
  assignedContractorIds: string[];
  costManuallyEdited: boolean;
  pricingOverride?: TaskPricing;
}

function emptyDraft(): Draft {
  return {
    title: "",
    category: "General",
    description: "",
    status: "not_started",
    priority: "medium",
    qualityCheck: "pending",
    estimatedCost: 0,
    actualCost: 0,
    dueDate: "",
    scheduledDate: "",
    orderConfirmed: false,
    subfolderId: "",
    notes: "",
    microtasks: [],
    assignedContractorIds: [],
    costManuallyEdited: false,
  };
}

let localMt = 0;

export function TaskEditorModal({
  open,
  onClose,
  projectId,
  task,
  subfolders,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  task?: TaskItem;
  subfolders: ProjectSubfolder[];
}) {
  const { db, addTask, updateTask, assignContractorToTask } = useStore();
  const [d, setD] = useState<Draft>(emptyDraft());

  useEffect(() => {
    if (!open) return;
    if (task) {
      setD({
        title: task.title,
        category: task.category,
        description: task.description,
        status: task.status,
        priority: task.priority,
        qualityCheck: task.qualityCheck,
        estimatedCost: task.estimatedCost,
        actualCost: task.actualCost,
        dueDate: task.dueDate ?? "",
        scheduledDate: task.scheduledDate ?? "",
        orderConfirmed: task.orderConfirmed,
        subfolderId: task.subfolderId ?? "",
        notes: task.notes ?? "",
        microtasks: task.microtasks ?? [],
        assignedContractorIds: task.assignedContractorIds,
        costManuallyEdited: task.costManuallyEdited ?? false,
        pricingOverride: task.pricingOverride,
      });
    } else {
      setD(emptyDraft());
    }
  }, [open, task]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));

  // Square-foot pricing (flooring only) — single source of truth in task-pricing.ts.
  const project = db.projects.find((p) => p.id === projectId);
  const sqft = project?.squareFootage ?? 0;
  const pricing = d.pricingOverride ?? pricingForCategory(d.category);
  const perSqft = pricing.mode === "per_sqft";
  const autoCost = computeEstimatedCost(d.category, sqft, d.pricingOverride);
  const effectiveCost = perSqft && !d.costManuallyEdited ? autoCost : Number(d.estimatedCost) || 0;

  const renoSubfolders = useMemo(() => subfolders.filter((s) => s.parent === "renovation"), [subfolders]);

  const applyTemplate = (title: string) => {
    const t = DEFAULT_TASKS.find((x) => x.title === title);
    if (!t) return;
    setD((prev) => ({
      ...prev,
      title: t.title,
      category: t.category,
      microtasks: getMicrotasksFor(t.title, t.category),
    }));
  };

  const addMicro = () => set("microtasks", [...d.microtasks, { id: `mtl_${localMt++}`, title: "", done: false }]);
  const updateMicro = (id: string, patch: Partial<Microtask>) =>
    set("microtasks", d.microtasks.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const removeMicro = (id: string) => set("microtasks", d.microtasks.filter((m) => m.id !== id));

  const save = () => {
    if (!d.title.trim()) return;
    const micro = d.microtasks.filter((m) => m.title.trim());
    const payload = {
      title: d.title.trim(),
      category: d.category,
      description: d.description,
      status: d.status,
      priority: d.priority,
      qualityCheck: d.qualityCheck,
      estimatedCost: effectiveCost,
      actualCost: Number(d.actualCost) || 0,
      dueDate: d.dueDate || undefined,
      scheduledDate: d.scheduledDate || undefined,
      orderConfirmed: d.orderConfirmed,
      subfolderId: d.subfolderId || null,
      notes: d.notes || undefined,
      microtasks: micro,
      assignedContractorIds: d.assignedContractorIds,
      costManuallyEdited: d.costManuallyEdited,
      pricingOverride: d.pricingOverride,
    };
    if (task) {
      updateTask(task.id, payload);
      // ensure assigned contractors are linked to the project
      d.assignedContractorIds.forEach((cid) => assignContractorToTask(task.id, cid));
    } else {
      addTask({ projectId, ...payload });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={task ? "Edit Task" : "New Task"}
      subtitle={task ? task.title : "Add a work order to this project"}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!d.title.trim()}>
            {task ? "Save changes" : "Create task"}
          </button>
        </>
      }
    >
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="space-y-3">
          {!task && (
            <label className="block">
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Start from a template
              </span>
              <select className="input mt-1" defaultValue="" onChange={(e) => e.target.value && applyTemplate(e.target.value)}>
                <option value="">Custom task…</option>
                {DEFAULT_TASKS.map((t) => (
                  <option key={t.title} value={t.title}>{t.title} · {t.category}</option>
                ))}
              </select>
            </label>
          )}

          <label className="block">
            <span className="text-xs font-medium text-slate-600">Title</span>
            <input className="input mt-1" value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Kitchen Remodel" />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Category</span>
              <select className="input mt-1" value={d.category} onChange={(e) => set("category", e.target.value)}>
                {[...new Set([d.category, ...TASK_CATEGORIES])].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Subfolder</span>
              <select className="input mt-1" value={d.subfolderId} onChange={(e) => set("subfolderId", e.target.value)}>
                <option value="">None</option>
                {renoSubfolders.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Status</span>
              <select className="input mt-1" value={d.status} onChange={(e) => set("status", e.target.value as TaskStatus)}>
                {TASK_STATUS_ORDER.map((s) => <option key={s} value={s}>{TASK_STATUS_META[s].label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Priority</span>
              <select className="input mt-1" value={d.priority} onChange={(e) => set("priority", e.target.value as TaskPriority)}>
                {(["critical", "high", "medium", "low"] as TaskPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Quality</span>
              <select className="input mt-1" value={d.qualityCheck} onChange={(e) => set("qualityCheck", e.target.value as QualityCheck)}>
                {(["pending", "passed", "failed"] as QualityCheck[]).map((q) => <option key={q} value={q}>{QUALITY_META[q].label}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="block">
              <span className="text-xs font-medium text-slate-600">Estimated cost</span>
              {perSqft && !d.costManuallyEdited ? (
                <>
                  <input readOnly className="input mt-1 bg-slate-50 text-slate-700" value={money(autoCost)} />
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Auto: {sqft.toLocaleString()} sq ft × ${pricing.rate.toFixed(2)} = {money(autoCost)}
                  </p>
                  <button
                    type="button"
                    className="text-[11px] text-blue-600 hover:underline mt-0.5"
                    onClick={() => setD((p) => ({ ...p, costManuallyEdited: true, estimatedCost: autoCost }))}
                  >
                    Use manual amount
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="number"
                    className="input mt-1"
                    value={d.estimatedCost}
                    onChange={(e) => setD((p) => ({ ...p, estimatedCost: Number(e.target.value), costManuallyEdited: true }))}
                  />
                  {perSqft && (
                    <button
                      type="button"
                      className="text-[11px] text-blue-600 hover:underline mt-0.5"
                      onClick={() => set("costManuallyEdited", false)}
                    >
                      Back to auto ({money(autoCost)})
                    </button>
                  )}
                </>
              )}
            </div>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Actual cost</span>
              <input type="number" className="input mt-1" value={d.actualCost} onChange={(e) => set("actualCost", Number(e.target.value))} />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Due date</span>
              <input type="date" className="input mt-1" value={d.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600">Scheduled date</span>
              <input type="date" className="input mt-1" value={d.scheduledDate} onChange={(e) => set("scheduledDate", e.target.value)} />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={d.orderConfirmed} onChange={(e) => set("orderConfirmed", e.target.checked)} />
            Materials ordered / confirmed
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-600">Notes</span>
            <textarea className="input mt-1 resize-none" rows={2} value={d.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Blocking issues, reminders…" />
          </label>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-600">Microtask checklist</span>
              <button onClick={addMicro} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add step
              </button>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {d.microtasks.length === 0 && <p className="text-xs text-slate-400">No steps yet. Pick a template or add steps.</p>}
              {d.microtasks.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <button onClick={() => updateMicro(m.id, { done: !m.done })}>
                    {m.done ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-slate-300" />}
                  </button>
                  <input
                    value={m.title}
                    onChange={(e) => updateMicro(m.id, { title: e.target.value })}
                    placeholder="Step description"
                    className={cn("input py-1 text-sm flex-1", m.done && "line-through text-slate-400")}
                  />
                  <button onClick={() => removeMicro(m.id)} className="text-slate-400 hover:text-red-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-600 mb-1.5 block">Assigned contractors</span>
            <ContractorMultiSelect
              contractors={db.contractors}
              selected={d.assignedContractorIds}
              onToggle={(id) =>
                set(
                  "assignedContractorIds",
                  d.assignedContractorIds.includes(id)
                    ? d.assignedContractorIds.filter((x) => x !== id)
                    : [...d.assignedContractorIds, id]
                )
              }
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

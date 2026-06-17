import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { v4 as uuid } from "uuid";
import type {
  DB,
  Project,
  Contractor,
  TaskItem,
  ExpenseItem,
  Invoice,
  Communication,
  Folder,
  Investment,
  WeeklyTodo,
  AppSettings,
  StoredFile,
  ThreeDRender,
  ProjectSubfolder,
  FileKind,
  FileAccept,
  ExportInvoicePdfArgs,
} from "./types";
import { createSeedDb, normalizeDb } from "./seed";
import { getMicrotasksFor } from "./catalogs";

// ------------------------------------------------------------
// Platform adapter — desktop (window.api) or localStorage fallback.
// ------------------------------------------------------------
const hasApi = () => typeof window !== "undefined" && !!window.api;
const LS_KEY = "flipcrm-db";

async function platformLoad(): Promise<DB> {
  if (hasApi()) return window.api!.db.load();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return normalizeDb(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  const seed = createSeedDb();
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(seed));
  } catch {
    /* ignore */
  }
  return seed;
}

function platformSave(db: DB) {
  if (hasApi()) {
    void window.api!.db.save(db);
    return;
  }
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function replace<T extends { id: string }>(arr: T[], id: string, patch: Partial<T>): T[] {
  return arr.map((x) => (x.id === id ? { ...x, ...patch } : x));
}

function descendantFolderIds(folders: Folder[], rootId: string): Set<string> {
  const set = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const f of folders) {
      if (f.parentId && set.has(f.parentId) && !set.has(f.id)) {
        set.add(f.id);
        added = true;
      }
    }
  }
  return set;
}

// ------------------------------------------------------------
// File proxy (with browser fallback)
// ------------------------------------------------------------
interface StoreFiles {
  pickAndImport(projectId: string, accept?: FileAccept): Promise<StoredFile[]>;
  importBase64(projectId: string, kind: FileKind, base64: string, name: string): Promise<StoredFile | null>;
  reveal(relPath: string): Promise<void>;
  remove(relPath: string): Promise<void>;
  exportInvoicePdf(args: ExportInvoicePdfArgs): Promise<StoredFile | null>;
}

// ------------------------------------------------------------
// Context value
// ------------------------------------------------------------
export interface StoreValue {
  db: DB;
  loading: boolean;
  isDesktop: boolean;

  // settings
  updateSettings(patch: Partial<AppSettings>): void;
  resetToSampleData(): void;

  // projects
  addProject(input: Partial<Project> & { name: string }): Project;
  updateProject(id: string, patch: Partial<Project>): void;
  deleteProject(id: string): void;
  addProjectSubfolder(projectId: string, name: string, parent: ProjectSubfolder["parent"], color?: string): void;
  deleteProjectSubfolder(projectId: string, subfolderId: string): void;

  // tasks
  addTask(input: Partial<TaskItem> & { projectId: string; title: string }): TaskItem;
  updateTask(id: string, patch: Partial<TaskItem>): void;
  deleteTask(id: string): void;
  toggleMicrotask(taskId: string, microtaskId: string): void;
  assignContractorToTask(taskId: string, contractorId: string): void;
  unassignContractorFromTask(taskId: string, contractorId: string): void;
  setTaskStatus(taskId: string, status: TaskItem["status"]): void;

  // contractors
  addContractor(input: Partial<Contractor> & { name: string }): Contractor;
  updateContractor(id: string, patch: Partial<Contractor>): void;
  deleteContractor(id: string): void;
  setProjectContractors(projectId: string, contractorIds: string[]): void;

  // expenses
  addExpense(input: Partial<ExpenseItem> & { projectId: string }): ExpenseItem;
  updateExpense(id: string, patch: Partial<ExpenseItem>): void;
  deleteExpense(id: string): void;

  // invoices
  addInvoice(input: Partial<Invoice> & { projectId: string; contractorId: string }): Invoice;
  updateInvoice(id: string, patch: Partial<Invoice>): void;
  deleteInvoice(id: string): void;

  // communications
  addCommunication(input: Partial<Communication> & { contractorId: string; type: Communication["type"]; content: string }): Communication;
  updateCommunication(id: string, patch: Partial<Communication>): void;
  deleteCommunication(id: string): void;
  markTaskThreadRead(taskId: string): void;
  markContractorThreadRead(contractorId: string): void;

  // folders
  addFolder(input: { name: string; color?: string; parentId?: string | null }): Folder;
  updateFolder(id: string, patch: Partial<Folder>): void;
  deleteFolder(id: string): void;
  moveProjectToFolder(projectId: string, folderId: string): void;

  // investments
  addInvestment(inv: Investment): void;
  updateInvestment(id: string, patch: Partial<Investment>): void;
  deleteInvestment(id: string): void;

  // weekly todos
  addWeeklyTodo(projectId: string, text: string): void;
  updateWeeklyTodo(id: string, patch: Partial<WeeklyTodo>): void;
  deleteWeeklyTodo(id: string): void;

  // files
  files: StoreFiles;

  // selectors
  getProject(id: string): Project | undefined;
  getProjectTasks(projectId: string): TaskItem[];
  getActiveProjects(): Project[];
  getProjectComms(projectId: string): Communication[];
  getContractor(id: string): Contractor | undefined;
  getContractorComms(contractorId: string): Communication[];
  getFolderProjects(folderId: string, includeNested?: boolean): Project[];
  getChildFolders(parentId: string | null): Folder[];
  getProjectExpenses(projectId: string): ExpenseItem[];
  getProjectInvoices(projectId: string): Invoice[];
  getContractorProjects(contractorId: string): Project[];
  getContractorInvoices(contractorId: string): Invoice[];
  getProjectContractors(projectId: string): Contractor[];
  getTaskComms(taskId: string): Communication[];
  getTopExpenses(limit?: number): ExpenseItem[];
}

const StoreContext = createContext<StoreValue | null>(null);

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

// ------------------------------------------------------------
// Provider
// ------------------------------------------------------------
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<DB>(() => createSeedDb());
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    let mounted = true;
    platformLoad().then((loaded) => {
      if (mounted) {
        setDb(loaded);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Debounced persistence (~400ms after the last change).
  useEffect(() => {
    if (loading || !dirty.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      platformSave(db);
      dirty.current = false;
    }, 400);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [db, loading]);

  const mutate = useCallback((updater: (prev: DB) => DB) => {
    dirty.current = true;
    setDb((prev) => updater(prev));
  }, []);

  // ---------- settings ----------
  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => mutate((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
    [mutate]
  );
  const resetToSampleData = useCallback(() => {
    dirty.current = true;
    const seed = createSeedDb();
    setDb(seed);
    platformSave(seed);
    dirty.current = false;
  }, []);

  // ---------- projects ----------
  const addProject = useCallback<StoreValue["addProject"]>(
    (input) => {
      const project: Project = {
        id: uuid(),
        name: input.name,
        address: input.address ?? { street: "", city: "", state: "", zip: "", lat: 0, lng: 0 },
        status: input.status ?? "active",
        folderId: input.folderId ?? "f-active",
        purchasePrice: input.purchasePrice ?? 0,
        estimatedARV: input.estimatedARV ?? 0,
        totalBudget: input.totalBudget ?? 0,
        totalSpent: input.totalSpent ?? 0,
        startDate: input.startDate ?? "",
        estimatedEndDate: input.estimatedEndDate ?? "",
        completedDate: input.completedDate,
        contractorIds: input.contractorIds ?? [],
        photos: input.photos ?? [],
        documents: input.documents ?? [],
        renders: input.renders ?? [],
        scopeOfWork: input.scopeOfWork ?? "",
        createdAt: new Date().toISOString(),
        subfolders: input.subfolders ?? [],
      };
      mutate((d) => {
        const folders = d.folders.map((f) =>
          f.id === project.folderId
            ? { ...f, projectIds: Array.from(new Set([...f.projectIds, project.id])) }
            : f
        );
        return { ...d, projects: [project, ...d.projects], folders };
      });
      return project;
    },
    [mutate]
  );

  const updateProject = useCallback<StoreValue["updateProject"]>(
    (id, patch) => mutate((d) => ({ ...d, projects: replace(d.projects, id, patch) })),
    [mutate]
  );

  const deleteProject = useCallback<StoreValue["deleteProject"]>(
    (id) =>
      mutate((d) => ({
        ...d,
        projects: d.projects.filter((p) => p.id !== id),
        tasks: d.tasks.filter((t) => t.projectId !== id),
        expenses: d.expenses.filter((e) => e.projectId !== id),
        invoices: d.invoices.filter((i) => i.projectId !== id),
        communications: d.communications.filter((c) => c.projectId !== id),
        weeklyTodos: d.weeklyTodos.filter((w) => w.projectId !== id),
        folders: d.folders.map((f) => ({ ...f, projectIds: f.projectIds.filter((pid) => pid !== id) })),
        contractors: d.contractors.map((c) => ({ ...c, projectIds: c.projectIds.filter((pid) => pid !== id) })),
      })),
    [mutate]
  );

  const addProjectSubfolder = useCallback<StoreValue["addProjectSubfolder"]>(
    (projectId, name, parent, color) =>
      mutate((d) => ({
        ...d,
        projects: d.projects.map((p) =>
          p.id === projectId
            ? { ...p, subfolders: [...(p.subfolders ?? []), { id: uuid(), name, parent, color }] }
            : p
        ),
      })),
    [mutate]
  );

  const deleteProjectSubfolder = useCallback<StoreValue["deleteProjectSubfolder"]>(
    (projectId, subfolderId) =>
      mutate((d) => ({
        ...d,
        projects: d.projects.map((p) =>
          p.id === projectId ? { ...p, subfolders: (p.subfolders ?? []).filter((s) => s.id !== subfolderId) } : p
        ),
        tasks: d.tasks.map((t) =>
          t.projectId === projectId && t.subfolderId === subfolderId ? { ...t, subfolderId: null } : t
        ),
      })),
    [mutate]
  );

  // ---------- tasks ----------
  const addTask = useCallback<StoreValue["addTask"]>(
    (input) => {
      const task: TaskItem = {
        id: uuid(),
        projectId: input.projectId,
        title: input.title,
        description: input.description ?? "",
        status: input.status ?? "not_started",
        priority: input.priority ?? "medium",
        qualityCheck: input.qualityCheck ?? "pending",
        assignedContractorIds: input.assignedContractorIds ?? [],
        scheduledDate: input.scheduledDate,
        completedDate: input.completedDate,
        dueDate: input.dueDate,
        orderConfirmed: input.orderConfirmed ?? false,
        estimatedCost: input.estimatedCost ?? 0,
        actualCost: input.actualCost ?? 0,
        category: input.category ?? "General",
        notes: input.notes,
        photos: input.photos ?? [],
        microtasks:
          input.microtasks && input.microtasks.length > 0
            ? input.microtasks
            : getMicrotasksFor(input.title, input.category),
        subfolderId: input.subfolderId ?? null,
      };
      mutate((d) => {
        // ensure assigned contractors are on the project too
        let projects = d.projects;
        if (task.assignedContractorIds.length > 0) {
          projects = d.projects.map((p) =>
            p.id === task.projectId
              ? { ...p, contractorIds: Array.from(new Set([...p.contractorIds, ...task.assignedContractorIds])) }
              : p
          );
        }
        return { ...d, tasks: [...d.tasks, task], projects };
      });
      return task;
    },
    [mutate]
  );

  const updateTask = useCallback<StoreValue["updateTask"]>(
    (id, patch) => mutate((d) => ({ ...d, tasks: replace(d.tasks, id, patch) })),
    [mutate]
  );

  const deleteTask = useCallback<StoreValue["deleteTask"]>(
    (id) =>
      mutate((d) => ({
        ...d,
        tasks: d.tasks.filter((t) => t.id !== id),
        communications: d.communications.map((c) => (c.taskId === id ? { ...c, taskId: undefined } : c)),
      })),
    [mutate]
  );

  const toggleMicrotask = useCallback<StoreValue["toggleMicrotask"]>(
    (taskId, microtaskId) =>
      mutate((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                microtasks: (t.microtasks ?? []).map((m) =>
                  m.id === microtaskId ? { ...m, done: !m.done } : m
                ),
              }
            : t
        ),
      })),
    [mutate]
  );

  const assignContractorToTask = useCallback<StoreValue["assignContractorToTask"]>(
    (taskId, contractorId) =>
      mutate((d) => {
        const task = d.tasks.find((t) => t.id === taskId);
        if (!task) return d;
        const tasks = d.tasks.map((t) =>
          t.id === taskId
            ? { ...t, assignedContractorIds: Array.from(new Set([...t.assignedContractorIds, contractorId])) }
            : t
        );
        const projects = d.projects.map((p) =>
          p.id === task.projectId
            ? { ...p, contractorIds: Array.from(new Set([...p.contractorIds, contractorId])) }
            : p
        );
        const contractors = d.contractors.map((c) =>
          c.id === contractorId
            ? { ...c, projectIds: Array.from(new Set([...c.projectIds, task.projectId])) }
            : c
        );
        return { ...d, tasks, projects, contractors };
      }),
    [mutate]
  );

  const unassignContractorFromTask = useCallback<StoreValue["unassignContractorFromTask"]>(
    (taskId, contractorId) =>
      mutate((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === taskId
            ? { ...t, assignedContractorIds: t.assignedContractorIds.filter((id) => id !== contractorId) }
            : t
        ),
      })),
    [mutate]
  );

  const setTaskStatus = useCallback<StoreValue["setTaskStatus"]>(
    (taskId, status) =>
      mutate((d) => ({
        ...d,
        tasks: d.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status,
                completedDate: status === "completed" ? new Date().toISOString().slice(0, 10) : t.completedDate,
              }
            : t
        ),
      })),
    [mutate]
  );

  // ---------- contractors ----------
  const addContractor = useCallback<StoreValue["addContractor"]>(
    (input) => {
      const contractor: Contractor = {
        id: uuid(),
        name: input.name,
        company: input.company ?? "",
        email: input.email ?? "",
        phone: input.phone ?? "",
        city: input.city ?? "",
        state: input.state ?? "",
        zip: input.zip ?? "",
        specialty: input.specialty ?? [],
        rating: input.rating ?? 0,
        avatarUrl: input.avatarUrl,
        projectIds: input.projectIds ?? [],
        totalJobsCompleted: input.totalJobsCompleted ?? 0,
        notes: input.notes ?? "",
      };
      mutate((d) => ({ ...d, contractors: [contractor, ...d.contractors] }));
      return contractor;
    },
    [mutate]
  );

  const updateContractor = useCallback<StoreValue["updateContractor"]>(
    (id, patch) => mutate((d) => ({ ...d, contractors: replace(d.contractors, id, patch) })),
    [mutate]
  );

  const deleteContractor = useCallback<StoreValue["deleteContractor"]>(
    (id) =>
      mutate((d) => ({
        ...d,
        contractors: d.contractors.filter((c) => c.id !== id),
        projects: d.projects.map((p) => ({ ...p, contractorIds: p.contractorIds.filter((cid) => cid !== id) })),
        tasks: d.tasks.map((t) => ({
          ...t,
          assignedContractorIds: t.assignedContractorIds.filter((cid) => cid !== id),
        })),
      })),
    [mutate]
  );

  const setProjectContractors = useCallback<StoreValue["setProjectContractors"]>(
    (projectId, contractorIds) =>
      mutate((d) => ({
        ...d,
        projects: d.projects.map((p) => (p.id === projectId ? { ...p, contractorIds } : p)),
        contractors: d.contractors.map((c) => {
          const onProject = contractorIds.includes(c.id);
          const has = c.projectIds.includes(projectId);
          if (onProject && !has) return { ...c, projectIds: [...c.projectIds, projectId] };
          if (!onProject && has) return { ...c, projectIds: c.projectIds.filter((pid) => pid !== projectId) };
          return c;
        }),
      })),
    [mutate]
  );

  // ---------- expenses ----------
  const addExpense = useCallback<StoreValue["addExpense"]>(
    (input) => {
      const qty = input.quantity ?? 1;
      const unit = input.unitPrice ?? 0;
      const expense: ExpenseItem = {
        id: uuid(),
        projectId: input.projectId,
        description: input.description ?? "",
        category: input.category ?? "General",
        unitPrice: unit,
        quantity: qty,
        total: input.total ?? unit * qty,
        vendor: input.vendor ?? "",
        purchasedDate: input.purchasedDate ?? new Date().toISOString().slice(0, 10),
        receipt: input.receipt,
      };
      mutate((d) => ({ ...d, expenses: [expense, ...d.expenses] }));
      return expense;
    },
    [mutate]
  );

  const updateExpense = useCallback<StoreValue["updateExpense"]>(
    (id, patch) => mutate((d) => ({ ...d, expenses: replace(d.expenses, id, patch) })),
    [mutate]
  );

  const deleteExpense = useCallback<StoreValue["deleteExpense"]>(
    (id) => mutate((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) })),
    [mutate]
  );

  // ---------- invoices ----------
  const addInvoice = useCallback<StoreValue["addInvoice"]>(
    (input) => {
      const invoice: Invoice = {
        id: uuid(),
        projectId: input.projectId,
        contractorId: input.contractorId,
        status: input.status ?? "draft",
        lineItems: input.lineItems ?? [],
        subtotal: input.subtotal ?? 0,
        depositAmount: input.depositAmount ?? 0,
        midpointAmount: input.midpointAmount ?? 0,
        completionAmount: input.completionAmount ?? 0,
        depositPaid: input.depositPaid ?? false,
        midpointPaid: input.midpointPaid ?? false,
        completionPaid: input.completionPaid ?? false,
        terms: input.terms ?? "",
        createdAt: new Date().toISOString(),
        sentAt: input.sentAt,
        pdf: input.pdf,
      };
      mutate((d) => ({ ...d, invoices: [invoice, ...d.invoices] }));
      return invoice;
    },
    [mutate]
  );

  const updateInvoice = useCallback<StoreValue["updateInvoice"]>(
    (id, patch) => mutate((d) => ({ ...d, invoices: replace(d.invoices, id, patch) })),
    [mutate]
  );

  const deleteInvoice = useCallback<StoreValue["deleteInvoice"]>(
    (id) => mutate((d) => ({ ...d, invoices: d.invoices.filter((i) => i.id !== id) })),
    [mutate]
  );

  // ---------- communications ----------
  const addCommunication = useCallback<StoreValue["addCommunication"]>(
    (input) => {
      const comm: Communication = {
        id: uuid(),
        projectId: input.projectId,
        contractorId: input.contractorId,
        taskId: input.taskId,
        type: input.type,
        direction: input.direction ?? "outbound",
        callStatus: input.callStatus,
        content: input.content,
        timestamp: input.timestamp ?? new Date().toISOString(),
        duration: input.duration,
        read: input.read ?? true,
        scheduledFor: input.scheduledFor,
        notes: input.notes,
      };
      mutate((d) => ({ ...d, communications: [...d.communications, comm] }));
      return comm;
    },
    [mutate]
  );

  const updateCommunication = useCallback<StoreValue["updateCommunication"]>(
    (id, patch) => mutate((d) => ({ ...d, communications: replace(d.communications, id, patch) })),
    [mutate]
  );

  const deleteCommunication = useCallback<StoreValue["deleteCommunication"]>(
    (id) => mutate((d) => ({ ...d, communications: d.communications.filter((c) => c.id !== id) })),
    [mutate]
  );

  const markTaskThreadRead = useCallback<StoreValue["markTaskThreadRead"]>(
    (taskId) =>
      mutate((d) => ({
        ...d,
        communications: d.communications.map((c) => (c.taskId === taskId && !c.read ? { ...c, read: true } : c)),
      })),
    [mutate]
  );

  const markContractorThreadRead = useCallback<StoreValue["markContractorThreadRead"]>(
    (contractorId) =>
      mutate((d) => ({
        ...d,
        communications: d.communications.map((c) =>
          c.contractorId === contractorId && !c.read ? { ...c, read: true } : c
        ),
      })),
    [mutate]
  );

  // ---------- folders ----------
  const addFolder = useCallback<StoreValue["addFolder"]>(
    (input) => {
      const folder: Folder = {
        id: uuid(),
        name: input.name,
        color: input.color ?? "#64748b",
        parentId: input.parentId ?? null,
        projectIds: [],
      };
      mutate((d) => ({ ...d, folders: [...d.folders, folder] }));
      return folder;
    },
    [mutate]
  );

  const updateFolder = useCallback<StoreValue["updateFolder"]>(
    (id, patch) => mutate((d) => ({ ...d, folders: replace(d.folders, id, patch) })),
    [mutate]
  );

  const deleteFolder = useCallback<StoreValue["deleteFolder"]>(
    (id) =>
      mutate((d) => {
        const ids = descendantFolderIds(d.folders, id);
        // projects under a removed folder fall back to the first remaining top folder
        const fallback = d.folders.find((f) => !ids.has(f.id) && (f.parentId === null || f.parentId === undefined));
        const projects = d.projects.map((p) =>
          ids.has(p.folderId) ? { ...p, folderId: fallback?.id ?? "" } : p
        );
        let folders = d.folders.filter((f) => !ids.has(f.id));
        if (fallback) {
          const moved = projects.filter((p) => p.folderId === fallback.id).map((p) => p.id);
          folders = folders.map((f) =>
            f.id === fallback.id ? { ...f, projectIds: Array.from(new Set([...f.projectIds, ...moved])) } : f
          );
        }
        return { ...d, folders, projects };
      }),
    [mutate]
  );

  const moveProjectToFolder = useCallback<StoreValue["moveProjectToFolder"]>(
    (projectId, folderId) =>
      mutate((d) => ({
        ...d,
        projects: replace(d.projects, projectId, { folderId }),
        folders: d.folders.map((f) => ({
          ...f,
          projectIds:
            f.id === folderId
              ? Array.from(new Set([...f.projectIds, projectId]))
              : f.projectIds.filter((pid) => pid !== projectId),
        })),
      })),
    [mutate]
  );

  // ---------- investments ----------
  const addInvestment = useCallback<StoreValue["addInvestment"]>(
    (inv) => mutate((d) => ({ ...d, investments: [inv, ...d.investments] })),
    [mutate]
  );
  const updateInvestment = useCallback<StoreValue["updateInvestment"]>(
    (id, patch) =>
      mutate((d) => ({
        ...d,
        investments: d.investments.map((i) => (i.id === id ? ({ ...i, ...patch } as Investment) : i)),
      })),
    [mutate]
  );
  const deleteInvestment = useCallback<StoreValue["deleteInvestment"]>(
    (id) => mutate((d) => ({ ...d, investments: d.investments.filter((i) => i.id !== id) })),
    [mutate]
  );

  // ---------- weekly todos ----------
  const addWeeklyTodo = useCallback<StoreValue["addWeeklyTodo"]>(
    (projectId, text) =>
      mutate((d) => ({
        ...d,
        weeklyTodos: [
          { id: uuid(), projectId, text, hiddenFromDashboard: false, createdAt: new Date().toISOString() },
          ...d.weeklyTodos,
        ],
      })),
    [mutate]
  );
  const updateWeeklyTodo = useCallback<StoreValue["updateWeeklyTodo"]>(
    (id, patch) => mutate((d) => ({ ...d, weeklyTodos: replace(d.weeklyTodos, id, patch) })),
    [mutate]
  );
  const deleteWeeklyTodo = useCallback<StoreValue["deleteWeeklyTodo"]>(
    (id) => mutate((d) => ({ ...d, weeklyTodos: d.weeklyTodos.filter((w) => w.id !== id) })),
    [mutate]
  );

  // ---------- files ----------
  const files: StoreFiles = {
    async pickAndImport(projectId, accept) {
      if (hasApi()) return window.api!.files.pickAndImport({ projectId, accept });
      return [];
    },
    async importBase64(projectId, kind, base64, name) {
      if (hasApi()) return window.api!.files.import({ projectId, kind, base64, originalName: name });
      // browser fallback: keep the data URL in memory so the UI still renders
      return {
        id: uuid(),
        projectId,
        kind,
        name,
        relPath: "",
        mediaUrl: base64.startsWith("data:") ? base64 : `data:application/octet-stream;base64,${base64}`,
        size: Math.round((base64.length * 3) / 4),
        addedAt: new Date().toISOString(),
      };
    },
    async reveal(relPath) {
      if (hasApi()) await window.api!.files.reveal(relPath);
    },
    async remove(relPath) {
      if (hasApi() && relPath) await window.api!.files.delete(relPath);
    },
    async exportInvoicePdf(args) {
      if (hasApi()) return window.api!.files.exportInvoicePdf(args);
      return null;
    },
  };

  // ---------- selectors ----------
  const getProject = useCallback((id: string) => db.projects.find((p) => p.id === id), [db.projects]);
  const getProjectTasks = useCallback(
    (projectId: string) => db.tasks.filter((t) => t.projectId === projectId),
    [db.tasks]
  );
  const getActiveProjects = useCallback(() => db.projects.filter((p) => p.status === "active"), [db.projects]);
  const getProjectComms = useCallback(
    (projectId: string) => db.communications.filter((c) => c.projectId === projectId),
    [db.communications]
  );
  const getContractor = useCallback((id: string) => db.contractors.find((c) => c.id === id), [db.contractors]);
  const getContractorComms = useCallback(
    (contractorId: string) => db.communications.filter((c) => c.contractorId === contractorId),
    [db.communications]
  );
  const getFolderProjects = useCallback(
    (folderId: string, includeNested = true) => {
      const ids = includeNested ? descendantFolderIds(db.folders, folderId) : new Set([folderId]);
      return db.projects.filter((p) => ids.has(p.folderId));
    },
    [db.folders, db.projects]
  );
  const getChildFolders = useCallback(
    (parentId: string | null) =>
      db.folders.filter((f) => (f.parentId ?? null) === parentId),
    [db.folders]
  );
  const getProjectExpenses = useCallback(
    (projectId: string) => db.expenses.filter((e) => e.projectId === projectId),
    [db.expenses]
  );
  const getProjectInvoices = useCallback(
    (projectId: string) => db.invoices.filter((i) => i.projectId === projectId),
    [db.invoices]
  );
  const getContractorProjects = useCallback(
    (contractorId: string) => db.projects.filter((p) => p.contractorIds.includes(contractorId)),
    [db.projects]
  );
  const getContractorInvoices = useCallback(
    (contractorId: string) => db.invoices.filter((i) => i.contractorId === contractorId),
    [db.invoices]
  );
  const getProjectContractors = useCallback(
    (projectId: string) => {
      const p = db.projects.find((x) => x.id === projectId);
      if (!p) return [];
      return db.contractors.filter((c) => p.contractorIds.includes(c.id));
    },
    [db.projects, db.contractors]
  );
  const getTaskComms = useCallback(
    (taskId: string) => db.communications.filter((c) => c.taskId === taskId),
    [db.communications]
  );
  const getTopExpenses = useCallback(
    (limit = 8) => [...db.expenses].sort((a, b) => b.total - a.total).slice(0, limit),
    [db.expenses]
  );

  const value: StoreValue = {
    db,
    loading,
    isDesktop: hasApi(),
    updateSettings,
    resetToSampleData,
    addProject,
    updateProject,
    deleteProject,
    addProjectSubfolder,
    deleteProjectSubfolder,
    addTask,
    updateTask,
    deleteTask,
    toggleMicrotask,
    assignContractorToTask,
    unassignContractorFromTask,
    setTaskStatus,
    addContractor,
    updateContractor,
    deleteContractor,
    setProjectContractors,
    addExpense,
    updateExpense,
    deleteExpense,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addCommunication,
    updateCommunication,
    deleteCommunication,
    markTaskThreadRead,
    markContractorThreadRead,
    addFolder,
    updateFolder,
    deleteFolder,
    moveProjectToFolder,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addWeeklyTodo,
    updateWeeklyTodo,
    deleteWeeklyTodo,
    files,
    getProject,
    getProjectTasks,
    getActiveProjects,
    getProjectComms,
    getContractor,
    getContractorComms,
    getFolderProjects,
    getChildFolders,
    getProjectExpenses,
    getProjectInvoices,
    getContractorProjects,
    getContractorInvoices,
    getProjectContractors,
    getTaskComms,
    getTopExpenses,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

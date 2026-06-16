"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  Project, Contractor, TaskItem, ExpenseItem, Invoice,
  Communication, Folder, User, Organization,
  Investment, RentalProperty, NoteInvestment, WorkOrder, WeeklyTodo,
} from "./types";
import {
  projects as defaultProjects,
  contractors as defaultContractors,
  folders as defaultFolders,
  tasks as defaultTasks,
  expenses as defaultExpenses,
  invoices as defaultInvoices,
  communications as defaultComms,
  users as defaultUsers,
  organization as defaultOrg,
  currentUser,
} from "./mock-data";

// ─────────────────────────────────────────────────────────────────────────────
// Standalone desktop build: all data lives locally in the browser/Electron
// localStorage. There is no sign-in and no remote database — the app opens
// straight to the dashboard with the seed data below, and every change is
// persisted locally. A real local datastore can be wired in later without
// touching any UI (all reads/writes go through this store).
// ─────────────────────────────────────────────────────────────────────────────

interface VitalInfo {
  projectId: string;
  electricCompany: string;
  electricAccount: string;
  waterCompany: string;
  waterAccount: string;
  gasCompany: string;
  gasAccount: string;
  keyLocation: string;
  notes: string;
}

interface StoreState {
  projects: Project[];
  contractors: Contractor[];
  tasks: TaskItem[];
  expenses: ExpenseItem[];
  invoices: Invoice[];
  communications: Communication[];
  folders: Folder[];
  users: User[];
  organization: Organization;
  vitalInfos: VitalInfo[];
  investments: Investment[];
  weeklyTodos: WeeklyTodo[];
}

interface StoreActions {
  // Projects
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  // Contractors
  addContractor: (contractor: Contractor) => void;
  updateContractor: (id: string, updates: Partial<Contractor>) => void;
  deleteContractor: (id: string) => void;
  // Tasks
  addTask: (task: TaskItem) => void;
  updateTask: (id: string, updates: Partial<TaskItem>) => void;
  deleteTask: (id: string) => void;
  // Expenses
  addExpense: (expense: ExpenseItem) => void;
  updateExpense: (id: string, updates: Partial<ExpenseItem>) => void;
  deleteExpense: (id: string) => void;
  // Invoices
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  // Communications
  addCommunication: (comm: Communication) => void;
  updateCommunication: (id: string, updates: Partial<Communication>) => void;
  // Users
  addUser: (user: User) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  // Folders
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  // Vital Info
  getVitalInfo: (projectId: string) => VitalInfo;
  updateVitalInfo: (projectId: string, updates: Partial<VitalInfo>) => void;
  // Investments
  addInvestment: (investment: Investment) => void;
  updateInvestment: (id: string, updates: Partial<RentalProperty> | Partial<NoteInvestment>) => void;
  deleteInvestment: (id: string) => void;
  getInvestment: (id: string) => Investment | undefined;
  getRentalProperties: () => RentalProperty[];
  getNoteInvestments: () => NoteInvestment[];
  addWorkOrder: (investmentId: string, workOrder: WorkOrder) => void;
  updateWorkOrder: (investmentId: string, workOrderId: string, updates: Partial<WorkOrder>) => void;
  deleteWorkOrder: (investmentId: string, workOrderId: string) => void;
  // Weekly Todos
  addWeeklyTodo: (todo: WeeklyTodo) => void;
  updateWeeklyTodo: (id: string, updates: Partial<WeeklyTodo>) => void;
  deleteWeeklyTodo: (id: string) => void;
  getProjectWeeklyTodos: (projectId: string) => WeeklyTodo[];
  getVisibleWeeklyTodos: () => WeeklyTodo[];
  // Helpers
  getProject: (id: string) => Project | undefined;
  getContractor: (id: string) => Contractor | undefined;
  getProjectTasks: (projectId: string) => TaskItem[];
  getProjectExpenses: (projectId: string) => ExpenseItem[];
  getProjectComms: (projectId: string) => Communication[];
  getProjectInvoices: (projectId: string) => Invoice[];
  getContractorComms: (contractorId: string) => Communication[];
  getContractorProjects: (contractorId: string) => Project[];
  getContractorInvoices: (contractorId: string) => Invoice[];
  getActiveProjects: () => Project[];
  getTopExpenses: (limit?: number) => ExpenseItem[];
  getFolderProjects: (folderId: string) => Project[];
  currentUser: User;
}

type Store = StoreState & StoreActions;

const STORAGE_KEY = "flipcrm_data_v3";

function getDefaultState(): StoreState {
  return {
    projects: defaultProjects,
    contractors: defaultContractors,
    tasks: defaultTasks,
    expenses: defaultExpenses,
    invoices: defaultInvoices,
    communications: defaultComms,
    folders: defaultFolders,
    users: defaultUsers,
    organization: defaultOrg,
    vitalInfos: [],
    investments: [],
    weeklyTodos: [],
  };
}

function loadState(): StoreState {
  if (typeof window === "undefined") return getDefaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...getDefaultState(), ...parsed };
    }
  } catch {}
  return getDefaultState();
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(getDefaultState);
  const [hydrated, setHydrated] = useState(false);

  // Load any locally-saved data on mount (client only).
  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  // Persist every change locally once hydrated.
  useEffect(() => {
    if (hydrated) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
    }
  }, [state, hydrated]);

  const update = useCallback((fn: (prev: StoreState) => StoreState) => {
    setState((prev) => fn(prev));
  }, []);

  const store: Store = {
    ...state,
    currentUser,
    // Projects
    addProject: (p) => update((s) => ({
      ...s,
      projects: [...s.projects, p],
      folders: s.folders.map((f) => f.id === p.folderId ? { ...f, projectIds: [...f.projectIds, p.id] } : f),
    })),
    updateProject: (id, u) => update((s) => ({
      ...s,
      projects: s.projects.map((p) => p.id === id ? { ...p, ...u } : p),
    })),
    deleteProject: (id) => update((s) => ({
      ...s,
      projects: s.projects.filter((p) => p.id !== id),
      tasks: s.tasks.filter((t) => t.projectId !== id),
      expenses: s.expenses.filter((e) => e.projectId !== id),
      folders: s.folders.map((f) => ({ ...f, projectIds: f.projectIds.filter((pid) => pid !== id) })),
      weeklyTodos: (s.weeklyTodos ?? []).filter((t) => t.projectId !== id),
    })),
    // Contractors
    addContractor: (c) => update((s) => ({ ...s, contractors: [...s.contractors, c] })),
    updateContractor: (id, u) => update((s) => ({
      ...s,
      contractors: s.contractors.map((c) => c.id === id ? { ...c, ...u } : c),
    })),
    deleteContractor: (id) => update((s) => ({
      ...s,
      contractors: s.contractors.filter((c) => c.id !== id),
      projects: s.projects.map((p) => ({ ...p, contractorIds: p.contractorIds.filter((cid) => cid !== id) })),
    })),
    // Tasks
    addTask: (t) => update((s) => ({ ...s, tasks: [...s.tasks, t] })),
    updateTask: (id, u) => update((s) => ({
      ...s,
      tasks: s.tasks.map((t) => t.id === id ? { ...t, ...u } : t),
    })),
    deleteTask: (id) => update((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
    // Expenses
    addExpense: (e) => update((s) => ({ ...s, expenses: [...s.expenses, e] })),
    updateExpense: (id, u) => update((s) => ({
      ...s,
      expenses: s.expenses.map((e) => e.id === id ? { ...e, ...u } : e),
    })),
    deleteExpense: (id) => update((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== id) })),
    // Invoices
    addInvoice: (i) => update((s) => ({ ...s, invoices: [...s.invoices, i] })),
    updateInvoice: (id, u) => update((s) => ({
      ...s,
      invoices: s.invoices.map((i) => i.id === id ? { ...i, ...u } : i),
    })),
    // Communications
    addCommunication: (c) => update((s) => ({ ...s, communications: [...s.communications, c] })),
    updateCommunication: (id, u) => update((s) => ({
      ...s,
      communications: s.communications.map((c) => c.id === id ? { ...c, ...u } : c),
    })),
    // Users
    addUser: (u2) => update((s) => ({
      ...s,
      users: [...s.users, u2],
      organization: { ...s.organization, members: [...s.organization.members, u2.id] },
    })),
    updateUser: (id, u2) => update((s) => ({
      ...s,
      users: s.users.map((u) => u.id === id ? { ...u, ...u2 } : u),
    })),
    deleteUser: (id) => update((s) => ({
      ...s,
      users: s.users.filter((u) => u.id !== id),
      organization: { ...s.organization, members: s.organization.members.filter((m) => m !== id) },
    })),
    // Folders
    addFolder: (f) => update((s) => ({ ...s, folders: [...s.folders, f] })),
    updateFolder: (id, u) => update((s) => ({
      ...s,
      folders: s.folders.map((f) => f.id === id ? { ...f, ...u } : f),
    })),
    // Vital Info
    getVitalInfo: (projectId) => {
      const existing = state.vitalInfos.find((v) => v.projectId === projectId);
      return existing || { projectId, electricCompany: "", electricAccount: "", waterCompany: "", waterAccount: "", gasCompany: "", gasAccount: "", keyLocation: "", notes: "" };
    },
    updateVitalInfo: (projectId, updates) => update((s) => {
      const existing = s.vitalInfos.find((v) => v.projectId === projectId);
      if (existing) {
        return { ...s, vitalInfos: s.vitalInfos.map((v) => v.projectId === projectId ? { ...v, ...updates } : v) };
      }
      return { ...s, vitalInfos: [...s.vitalInfos, { projectId, electricCompany: "", electricAccount: "", waterCompany: "", waterAccount: "", gasCompany: "", gasAccount: "", keyLocation: "", notes: "", ...updates }] };
    }),
    // Investments
    addInvestment: (inv) => update((s) => ({ ...s, investments: [...(s.investments ?? []), inv] })),
    updateInvestment: (id, u) => update((s) => ({
      ...s,
      investments: (s.investments ?? []).map((inv) => inv.id === id ? { ...inv, ...u } as Investment : inv),
    })),
    deleteInvestment: (id) => update((s) => ({
      ...s,
      investments: (s.investments ?? []).filter((inv) => inv.id !== id),
    })),
    getInvestment: (id) => (state.investments ?? []).find((inv) => inv.id === id),
    getRentalProperties: () => (state.investments ?? []).filter((inv): inv is RentalProperty => inv.type === "rental"),
    getNoteInvestments: () => (state.investments ?? []).filter((inv): inv is NoteInvestment => inv.type === "note"),
    addWorkOrder: (investmentId, wo) => update((s) => ({
      ...s,
      investments: s.investments.map((inv) =>
        inv.id === investmentId && inv.type === "rental"
          ? { ...inv, workOrders: [...inv.workOrders, wo] }
          : inv
      ),
    })),
    updateWorkOrder: (investmentId, woId, updates) => update((s) => ({
      ...s,
      investments: s.investments.map((inv) =>
        inv.id === investmentId && inv.type === "rental"
          ? { ...inv, workOrders: (inv as RentalProperty).workOrders.map((wo) => wo.id === woId ? { ...wo, ...updates } : wo) }
          : inv
      ),
    })),
    deleteWorkOrder: (investmentId, woId) => update((s) => ({
      ...s,
      investments: s.investments.map((inv) =>
        inv.id === investmentId && inv.type === "rental"
          ? { ...inv, workOrders: (inv as RentalProperty).workOrders.filter((wo) => wo.id !== woId) }
          : inv
      ),
    })),
    // Weekly Todos
    addWeeklyTodo: (t) => update((s) => ({ ...s, weeklyTodos: [...(s.weeklyTodos ?? []), t] })),
    updateWeeklyTodo: (id, u) => update((s) => ({
      ...s,
      weeklyTodos: (s.weeklyTodos ?? []).map((t) => t.id === id ? { ...t, ...u } : t),
    })),
    deleteWeeklyTodo: (id) => update((s) => ({
      ...s,
      weeklyTodos: (s.weeklyTodos ?? []).filter((t) => t.id !== id),
    })),
    getProjectWeeklyTodos: (pid) => (state.weeklyTodos ?? []).filter((t) => t.projectId === pid),
    getVisibleWeeklyTodos: () => (state.weeklyTodos ?? []).filter((t) => !t.hiddenFromDashboard),
    // Helpers
    getProject: (id) => state.projects.find((p) => p.id === id),
    getContractor: (id) => state.contractors.find((c) => c.id === id),
    getProjectTasks: (pid) => state.tasks.filter((t) => t.projectId === pid),
    getProjectExpenses: (pid) => state.expenses.filter((e) => e.projectId === pid),
    getProjectComms: (pid) => state.communications.filter((c) => c.projectId === pid),
    getProjectInvoices: (pid) => state.invoices.filter((i) => i.projectId === pid),
    getContractorComms: (cid) => state.communications.filter((c) => c.contractorId === cid),
    getContractorProjects: (cid) => state.projects.filter((p) => p.contractorIds.includes(cid)),
    getContractorInvoices: (cid) => state.invoices.filter((i) => i.contractorId === cid),
    getActiveProjects: () => state.projects.filter((p) => p.status === "active"),
    getTopExpenses: (limit = 10) => [...state.expenses].sort((a, b) => b.total - a.total).slice(0, limit),
    getFolderProjects: (fid) => {
      const folder = state.folders.find((f) => f.id === fid);
      if (!folder) return [];
      return state.projects.filter((p) => folder.projectIds.includes(p.id));
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

// ============================================================
// FlipCRM Desktop — canonical data model
// ============================================================
// This file is the single source of truth for every entity the
// app stores. The Electron main process (db load/save, file
// import) and the React renderer both import these types.

import type { TaskPricing, PricingMode } from "./task-pricing";

// Re-export so the rest of the app can import pricing types from the canonical
// types module alongside everything else.
export type { TaskPricing, PricingMode };

export type UserRole = "admin" | "project_manager" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  organizationId: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  ownerUserId: string;
  members: string[];
  createdAt: string;
}

// Project library folders — support nesting via parentId.
export interface Folder {
  id: string;
  name: string;
  color: string;
  parentId?: string | null;
  projectIds: string[];
}

export type ProjectStatus = "active" | "completed" | "on_hold" | "archived";

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
}

export type FileKind = "image" | "video" | "pdf" | "doc" | "other";

export interface StoredFile {
  id: string;
  projectId: string;
  kind: FileKind;
  name: string;
  relPath: string;
  mediaUrl: string;
  caption?: string;
  size: number;
  addedAt: string;
  uploadedBy?: string;
}

export interface ThreeDRender {
  id: string;
  label: string;
  relPath: string;
  mediaUrl: string;
  capturedAt: string;
}

export interface Project {
  id: string;
  name: string;
  address: PropertyAddress;
  status: ProjectStatus;
  folderId: string;
  purchasePrice: number;
  estimatedARV: number;
  totalBudget: number;
  totalSpent: number;
  /** Heated/living square footage — drives square-foot priced tasks (flooring). */
  squareFootage: number;
  startDate: string;
  estimatedEndDate: string;
  completedDate?: string;
  contractorIds: string[];
  photos: StoredFile[];
  documents: StoredFile[];
  renders: ThreeDRender[];
  scopeOfWork: string;
  createdAt: string;
  // Optional user-created subfolders within this project's main folders
  // (used to group tasks / documents, e.g. "Upstairs Bath", "Kitchen").
  subfolders?: ProjectSubfolder[];
  vital?: ProjectVital;
}

export interface ProjectSubfolder {
  id: string;
  name: string;
  // which main folder this grouping lives under
  parent: "renovation" | "information";
  color?: string;
}

// Project "Vital Information" tab (utilities, key location, notes). Optional &
// additive — the canonical Project fields above are unchanged.
export interface ProjectVital {
  keyLocation?: string;
  notes?: string;
  electricProvider?: string;
  electricAccount?: string;
  waterProvider?: string;
  waterAccount?: string;
  gasProvider?: string;
  gasAccount?: string;
  sewerProvider?: string;
  sewerAccount?: string;
  trashProvider?: string;
  trashAccount?: string;
}

export type TaskStatus =
  | "completed"
  | "in_progress"
  | "scheduled"
  | "blocked"
  | "not_started";

export type TaskPriority = "critical" | "high" | "medium" | "low";

export type QualityCheck = "passed" | "failed" | "pending";

export interface Microtask {
  id: string;
  title: string;
  done: boolean;
}

export interface TaskItem {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  qualityCheck: QualityCheck;
  assignedContractorIds: string[]; // multi-contractor assignment
  scheduledDate?: string;
  completedDate?: string;
  dueDate?: string;
  orderConfirmed: boolean;
  estimatedCost: number;
  actualCost: number;
  category: string;
  notes?: string;
  photos?: StoredFile[];
  microtasks?: Microtask[];
  subfolderId?: string | null; // optional grouping within a project folder
  /** True once the user types the cost by hand — protects it from sqft recalc. */
  costManuallyEdited?: boolean;
  /** Optional per-task pricing override (per_sqft / flat with custom rate). */
  pricingOverride?: TaskPricing;
}

export interface Contractor {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zip: string;
  specialty: string[];
  rating: number;
  avatarUrl?: string;
  projectIds: string[];
  totalJobsCompleted: number;
  notes: string;
}

export interface ExpenseItem {
  id: string;
  projectId: string;
  description: string;
  category: string;
  unitPrice: number;
  quantity: number;
  total: number;
  vendor: string;
  purchasedDate: string;
  receipt?: StoredFile;
  /** Contractor this expense was paid to (optional). */
  payeeContractorId?: string;
  /** Free-form context for the expense (what happened / where we went wrong). */
  notes?: string;
}

export type InvoiceStatus = "draft" | "sent" | "approved" | "paid" | "disputed";

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: string;
  subcategory: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Invoice {
  id: string;
  projectId: string;
  contractorId: string;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  depositAmount: number;
  midpointAmount: number;
  completionAmount: number;
  depositPaid: boolean;
  midpointPaid: boolean;
  completionPaid: boolean;
  terms: string;
  createdAt: string;
  sentAt?: string;
  pdf?: StoredFile;
}

export type CommType = "sms" | "call" | "email" | "note";
export type CommDirection = "inbound" | "outbound";
export type CallStatus = "completed" | "missed" | "scheduled" | "voicemail";

export interface Communication {
  id: string;
  projectId?: string;
  contractorId: string;
  taskId?: string;
  type: CommType;
  direction: CommDirection;
  callStatus?: CallStatus;
  content: string;
  timestamp: string;
  duration?: number;
  read: boolean;
  scheduledFor?: string;
  notes?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  services: ServiceItem[];
}

export interface ServiceItem {
  id: string;
  name: string;
  defaultPrice: number;
  unit: string;
}

export interface WeeklyTodo {
  id: string;
  projectId: string;
  text: string;
  hiddenFromDashboard: boolean;
  createdAt: string;
}

// ---- Passive-income portfolio (rentals + private notes) ----
export type InvestmentType = "rental" | "note";

export interface UtilityInfo {
  tenantPays: boolean;
  monthlyCost: number;
}

export interface WorkOrder {
  id: string;
  description: string;
  cost: number;
  date: string;
  status: "open" | "completed";
}

export interface RentalProperty {
  id: string;
  type: "rental";
  name: string;
  address: PropertyAddress;
  photos: StoredFile[];
  collectingIncome: boolean;
  principal: number;
  interest: number;
  taxes: number;
  insurance: number;
  monthlyRent: number;
  gas: UtilityInfo;
  electric: UtilityInfo;
  sewer: UtilityInfo;
  water: UtilityInfo;
  trash: UtilityInfo;
  depositAmount: number;
  leaseStartDate: string;
  leaseEndDate: string;
  tenantNames: string;
  numberOfOccupants: number;
  tenantContactInfo: string;
  propertyManagerContact: string;
  propertyManagerFee: number;
  electricProvider: string;
  electricAccount: string;
  waterProvider: string;
  waterAccount: string;
  gasProvider: string;
  gasAccount: string;
  sewerProvider: string;
  sewerAccount: string;
  trashProvider: string;
  trashAccount: string;
  workOrders: WorkOrder[];
  yearBuilt: string;
  squareFootage: string;
  bedrooms: string;
  bathrooms: string;
  lotSize: string;
  propertyType: string;
  acInstalled: string;
  roofInstalled: string;
  guttersInstalled: string;
  floorsInstalled: string;
  kitchenRemodeled: string;
  bathroomRemodeled: string;
  waterHeaterInstalled: string;
  furnaceInstalled: string;
  electricalUpdated: string;
  plumbingUpdated: string;
  foundationType: string;
  garageType: string;
  propertyNotes: string;
  createdAt: string;
}

export interface NoteInvestment {
  id: string;
  type: "note";
  name: string;
  collectingIncome: boolean;
  borrowerName: string;
  loanAmount: number;
  dateLent: string;
  dateDue: string;
  monthlyPaymentDate: string;
  monthlyPaymentAmount: number;
  annualInterestRate: number;
  collateral: string;
  createdAt: string;
}

export type Investment = RentalProperty | NoteInvestment;

export interface AppSettings {
  companyName: string;
  userName: string;
}

export interface DB {
  projects: Project[];
  contractors: Contractor[];
  tasks: TaskItem[];
  expenses: ExpenseItem[];
  invoices: Invoice[];
  communications: Communication[];
  folders: Folder[];
  investments: Investment[];
  weeklyTodos: WeeklyTodo[];
  settings: AppSettings;
}

// ============================================================
// Typed IPC bridge (window.api) — implemented in electron/preload.ts,
// declared globally in src/types/global.d.ts.
// ============================================================

export interface ImportFileArgs {
  projectId: string;
  kind: FileKind;
  /** Absolute path on disk to copy from (preferred). */
  sourcePath?: string;
  /** Raw base64 / data-URL contents (used for drag-dropped browser files). */
  base64?: string;
  originalName: string;
}

export type FileAccept = "image" | "video" | "media" | "pdf" | "doc" | "all";

export interface PickAndImportArgs {
  projectId: string;
  accept?: FileAccept;
}

export interface ExportInvoicePdfArgs {
  projectId: string;
  fileName: string;
  /** Fully-rendered HTML document for the invoice. */
  html: string;
}

export interface BackupResult {
  ok: boolean;
  path?: string;
  message?: string;
}

export interface FlipApi {
  db: {
    load(): Promise<DB>;
    save(db: DB): Promise<void>;
  };
  files: {
    import(args: ImportFileArgs): Promise<StoredFile>;
    pickAndImport(args: PickAndImportArgs): Promise<StoredFile[]>;
    reveal(relPath: string): Promise<void>;
    delete(relPath: string): Promise<void>;
    exportInvoicePdf(args: ExportInvoicePdfArgs): Promise<StoredFile | null>;
  };
  backup: {
    export(): Promise<BackupResult>;
    import(): Promise<BackupResult>;
    openDataFolder(): Promise<void>;
  };
  app: {
    getVersion(): Promise<string>;
    isDesktop: true;
  };
}

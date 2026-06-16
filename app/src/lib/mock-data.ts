import {
  User, Organization, Folder, Project, TaskItem, Contractor,
  ExpenseItem, Invoice, Communication, HeatmapPoint,
} from "./types";
import { INVOICE_TERMS } from "./invoice-terms";

// ---- Current User ----
// Placeholder only — the live UI reads the signed-in user from Supabase
// via the useUser() hook in src/lib/useUser.ts.
export const currentUser: User = {
  id: "u1", name: "You", email: "you@worktopcrm.com", phone: "",
  role: "admin", organizationId: "org1", createdAt: "2025-06-01",
};

export const organization: Organization = {
  id: "org1", name: "Your Company", ownerUserId: "u1",
  members: ["u1"], createdAt: "2025-06-01",
};

export const users: User[] = [
  currentUser,
];

// ---- Folders ----
export const folders: Folder[] = [
  { id: "f1", name: "Active Flips", color: "#22c55e", projectIds: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "p11"] },
  { id: "f2", name: "Under Evaluation", color: "#f59e0b", projectIds: [] },
  { id: "f3", name: "Completed 2025", color: "#6366f1", projectIds: [] },
  { id: "f4", name: "On Hold", color: "#ef4444", projectIds: [] },
];

// ---- Projects ----
export const projects: Project[] = [
  {
    id: "p1", name: "Northern Ave Flip", folderId: "f1", status: "active",
    address: { street: "620 W Northern Ave", city: "Lima", state: "OH", zip: "45801", lat: 40.7580, lng: -84.1124 },
    purchasePrice: 0, estimatedARV: 0, totalBudget: 0, totalSpent: 0,
    startDate: "", estimatedEndDate: "",
    contractorIds: [], photos: [], renders: [],
    scopeOfWork: "",
    createdAt: "2026-04-26",
  },
  {
    id: "p2", name: "Wayside Dr Rehab", folderId: "f1", status: "active",
    address: { street: "1216 Wayside Dr", city: "Lima", state: "OH", zip: "45805", lat: 40.7290, lng: -84.1052 },
    purchasePrice: 0, estimatedARV: 0, totalBudget: 0, totalSpent: 0,
    startDate: "", estimatedEndDate: "",
    contractorIds: [], photos: [], renders: [],
    scopeOfWork: "",
    createdAt: "2026-04-26",
  },
  {
    id: "p3", name: "Highland Ct Flip", folderId: "f1", status: "active",
    address: { street: "6314 E Highland Ct", city: "Columbus", state: "IN", zip: "47203", lat: 39.2014, lng: -85.9214 },
    purchasePrice: 0, estimatedARV: 0, totalBudget: 0, totalSpent: 0,
    startDate: "", estimatedEndDate: "",
    contractorIds: [], photos: [], renders: [],
    scopeOfWork: "",
    createdAt: "2026-04-26",
  },
  {
    id: "p4", name: "Monroe Ave Rehab", folderId: "f1", status: "active",
    address: { street: "217 N Monroe Ave", city: "Butler", state: "PA", zip: "16001", lat: 40.8612, lng: -79.8953 },
    purchasePrice: 0, estimatedARV: 0, totalBudget: 0, totalSpent: 0,
    startDate: "", estimatedEndDate: "",
    contractorIds: [], photos: [], renders: [],
    scopeOfWork: "",
    createdAt: "2026-04-26",
  },
  {
    id: "p5", name: "Trail Valley Flip", folderId: "f1", status: "active",
    address: { street: "6202 Trail Valley Dr", city: "San Antonio", state: "TX", zip: "78249", lat: 29.5530, lng: -98.6175 },
    purchasePrice: 0, estimatedARV: 0, totalBudget: 0, totalSpent: 0,
    startDate: "", estimatedEndDate: "",
    contractorIds: [], photos: [], renders: [],
    scopeOfWork: "",
    createdAt: "2026-04-26",
  },
  {
    id: "p6", name: "Overland Trail Rehab", folderId: "f1", status: "active",
    address: { street: "509 Overland Trail", city: "Fritch", state: "TX", zip: "79036", lat: 35.6392, lng: -101.6035 },
    purchasePrice: 0, estimatedARV: 0, totalBudget: 0, totalSpent: 0,
    startDate: "", estimatedEndDate: "",
    contractorIds: [], photos: [], renders: [],
    scopeOfWork: "",
    createdAt: "2026-04-26",
  },
  {
    id: "p7", name: "Dilworth Rd Flip", folderId: "f1", status: "active",
    address: { street: "100 W Dilworth Rd", city: "Italy", state: "TX", zip: "76651", lat: 32.1835, lng: -96.8847 },
    purchasePrice: 0, estimatedARV: 0, totalBudget: 0, totalSpent: 0,
    startDate: "", estimatedEndDate: "",
    contractorIds: [], photos: [], renders: [],
    scopeOfWork: "",
    createdAt: "2026-04-26",
  },
  {
    id: "p8", name: "Britt St Rehab", folderId: "f1", status: "active",
    address: { street: "108 Britt St", city: "Franklin", state: "VA", zip: "23851", lat: 36.6776, lng: -76.9224 },
    purchasePrice: 0, estimatedARV: 0, totalBudget: 0, totalSpent: 0,
    startDate: "", estimatedEndDate: "",
    contractorIds: [], photos: [], renders: [],
    scopeOfWork: "",
    createdAt: "2026-04-26",
  },
  {
    id: "p9", name: "W 6th St Flip", folderId: "f1", status: "active",
    address: { street: "123 W 6th St", city: "Peru", state: "IN", zip: "46970", lat: 40.7537, lng: -86.0689 },
    purchasePrice: 0, estimatedARV: 0, totalBudget: 0, totalSpent: 0,
    startDate: "", estimatedEndDate: "",
    contractorIds: [], photos: [], renders: [],
    scopeOfWork: "",
    createdAt: "2026-04-26",
  },
  {
    id: "p10", name: "Sycamore St Rehab", folderId: "f1", status: "active",
    address: { street: "215 E Sycamore St", city: "Dale", state: "IN", zip: "47523", lat: 38.1690, lng: -86.9900 },
    purchasePrice: 0, estimatedARV: 0, totalBudget: 0, totalSpent: 0,
    startDate: "", estimatedEndDate: "",
    contractorIds: [], photos: [], renders: [],
    scopeOfWork: "",
    createdAt: "2026-04-26",
  },
  {
    id: "p11", name: "Williams St Flip", folderId: "f1", status: "active",
    address: { street: "81 Williams St", city: "Zanesville", state: "OH", zip: "43701", lat: 39.9403, lng: -82.0132 },
    purchasePrice: 0, estimatedARV: 0, totalBudget: 0, totalSpent: 0,
    startDate: "", estimatedEndDate: "",
    contractorIds: [], photos: [], renders: [],
    scopeOfWork: "",
    createdAt: "2026-04-26",
  },
];

// ---- Tasks ----
export const tasks: TaskItem[] = [];

// ---- Contractors ----
export const contractors: Contractor[] = [
  {
    id: "c1", name: "Mike Torres", company: "Torres General Contracting", email: "mike@torrescontracting.com", phone: "+15551001001",
    city: "Atlanta", state: "GA", zip: "30312",
    specialty: ["Kitchen", "Flooring", "Painting", "General", "Framing"], rating: 4.8, projectIds: [],
    totalJobsCompleted: 34, notes: "Reliable GC. Prefers 2-week lead time for material orders.",
  },
  {
    id: "c2", name: "Angela Washington", company: "Sparks Electrical & Plumbing", email: "angela@sparksep.com", phone: "+15551002002",
    city: "Dallas", state: "TX", zip: "75202",
    specialty: ["Electrical", "Plumbing"], rating: 4.9, projectIds: [],
    totalJobsCompleted: 28, notes: "Licensed Master Electrician & Plumber. Excellent code compliance record.",
  },
  {
    id: "c3", name: "Dave Kowalski", company: "Kowalski HVAC & Demo", email: "dave@kowalskihvac.com", phone: "+15551003003",
    city: "Nashville", state: "TN", zip: "37201",
    specialty: ["HVAC", "Demolition"], rating: 4.5, projectIds: [],
    totalJobsCompleted: 19, notes: "Strong demo crew. HVAC installs run clean.",
  },
  {
    id: "c4", name: "Rosa Hernandez", company: "Hernandez Roofing & Exteriors", email: "rosa@hernandezroofing.com", phone: "+15551004004",
    city: "Dallas", state: "TX", zip: "75204",
    specialty: ["Roofing", "Exterior", "Demolition", "Framing"], rating: 4.6, projectIds: [],
    totalJobsCompleted: 22, notes: "Family-owned. Very competitive pricing on roofing.",
  },
  {
    id: "c5", name: "Tyler Banks", company: "Banks Finish Works", email: "tyler@banksfinish.com", phone: "+15551005005",
    city: "Phoenix", state: "AZ", zip: "85003",
    specialty: ["Bathroom", "Kitchen", "Painting", "General"], rating: 4.7, projectIds: [],
    totalJobsCompleted: 15, notes: "Detail-oriented finish carpenter. Great for punch list and final touches.",
  },
];

// ---- Expenses ----
export const expenses: ExpenseItem[] = [];

// ---- Invoices ----
export const invoices: Invoice[] = [];

// ---- Communications ----
export const communications: Communication[] = [];

// ---- Helper Functions (kept for backward compat) ----
export function getProject(id: string) { return projects.find((p) => p.id === id); }
export function getContractor(id: string) { return contractors.find((c) => c.id === id); }
export function getProjectTasks(projectId: string) { return tasks.filter((t) => t.projectId === projectId); }
export function getProjectExpenses(projectId: string) { return expenses.filter((e) => e.projectId === projectId); }
export function getContractorComms(contractorId: string) { return communications.filter((c) => c.contractorId === contractorId); }
export function getProjectComms(projectId: string) { return communications.filter((c) => c.projectId === projectId); }
export function getContractorProjects(contractorId: string) { return projects.filter((p) => p.contractorIds.includes(contractorId)); }
export function getProjectInvoices(projectId: string) { return invoices.filter((i) => i.projectId === projectId); }
export function getContractorInvoices(contractorId: string) { return invoices.filter((i) => i.contractorId === contractorId); }
export function getActiveProjects() { return projects.filter((p) => p.status === "active"); }
export function getTopExpenses(limit = 10) { return [...expenses].sort((a, b) => b.total - a.total).slice(0, limit); }
export function getFolderProjects(folderId: string) { const folder = folders.find((f) => f.id === folderId); if (!folder) return []; return projects.filter((p) => folder.projectIds.includes(p.id)); }

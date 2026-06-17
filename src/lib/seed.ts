// ============================================================
// FlipCRM Desktop — seed data + DB normalization/migration
// ============================================================
// createSeedDb() produces a realistic demo database so the app looks
// alive on first run. normalizeDb() coerces any loaded JSON into a
// valid DB (filling missing arrays, migrating old task shapes).

import type {
  DB,
  Project,
  Contractor,
  TaskItem,
  TaskStatus,
  TaskPriority,
  QualityCheck,
  Microtask,
  Folder,
  Invoice,
  Communication,
  ExpenseItem,
  Investment,
  WeeklyTodo,
  AppSettings,
} from "./types";
import { getMicrotasksFor, milestoneSplit } from "./catalogs";

// ---- date helpers anchored to a fixed "now" for stable demo data ----
const NOW = new Date("2026-06-17T15:00:00Z");

function dayOffset(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function tsAgo(hours: number): string {
  const d = new Date(NOW);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

let microSeed = 0;
function micro(title: string, category: string, doneCount = 0): Microtask[] {
  return getMicrotasksFor(title, category).map((m, i) => ({
    id: `mt_seed_${microSeed++}`,
    title: m.title,
    done: i < doneCount,
  }));
}

// ------------------------------------------------------------
// Contractors
// ------------------------------------------------------------
function seedContractors(): Contractor[] {
  return [
    {
      id: "c1", name: "Mike Torres", company: "Torres General Contracting",
      email: "mike@torrescontracting.com", phone: "+15551001001",
      city: "Lima", state: "OH", zip: "45801",
      specialty: ["Kitchen", "Flooring", "Painting", "General", "Framing"],
      rating: 4.8, projectIds: ["p1", "p2", "p3"], totalJobsCompleted: 34,
      notes: "Reliable GC. Prefers 2-week lead time for material orders.",
    },
    {
      id: "c2", name: "Angela Washington", company: "Sparks Electrical & Plumbing",
      email: "angela@sparksep.com", phone: "+15551002002",
      city: "Columbus", state: "IN", zip: "47201",
      specialty: ["Electrical", "Plumbing"],
      rating: 4.9, projectIds: ["p1", "p3"], totalJobsCompleted: 28,
      notes: "Licensed Master Electrician & Plumber. Excellent code compliance record.",
    },
    {
      id: "c3", name: "Dave Kowalski", company: "Kowalski HVAC & Demo",
      email: "dave@kowalskihvac.com", phone: "+15551003003",
      city: "Lima", state: "OH", zip: "45805",
      specialty: ["HVAC", "Demolition"],
      rating: 4.5, projectIds: ["p1", "p4"], totalJobsCompleted: 19,
      notes: "Strong demo crew. HVAC installs run clean.",
    },
    {
      id: "c4", name: "Rosa Hernandez", company: "Hernandez Roofing & Exteriors",
      email: "rosa@hernandezroofing.com", phone: "+15551004004",
      city: "Butler", state: "PA", zip: "16001",
      specialty: ["Roofing", "Exterior", "Demolition", "Framing"],
      rating: 4.6, projectIds: ["p1", "p2", "p3", "p4"], totalJobsCompleted: 22,
      notes: "Family-owned. Very competitive pricing on roofing.",
    },
    {
      id: "c5", name: "Tyler Banks", company: "Banks Finish Works",
      email: "tyler@banksfinish.com", phone: "+15551005005",
      city: "Lima", state: "OH", zip: "45804",
      specialty: ["Bathroom", "Kitchen", "Painting", "General"],
      rating: 4.7, projectIds: ["p2"], totalJobsCompleted: 15,
      notes: "Detail-oriented finish carpenter. Great for punch list and final touches.",
    },
  ];
}

// ------------------------------------------------------------
// Folders (with one nested subfolder)
// ------------------------------------------------------------
function seedFolders(): Folder[] {
  return [
    { id: "f-active", name: "Active Flips", color: "#22c55e", parentId: null, projectIds: ["p2", "p3"] },
    { id: "f-priority", name: "Priority Flips", color: "#0ea5e9", parentId: "f-active", projectIds: ["p1", "p4"] },
    { id: "f-eval", name: "Under Evaluation", color: "#f59e0b", parentId: null, projectIds: [] },
    { id: "f-completed", name: "Completed", color: "#6366f1", parentId: null, projectIds: ["p6"] },
    { id: "f-hold", name: "On Hold", color: "#ef4444", parentId: null, projectIds: ["p5"] },
  ];
}

// ------------------------------------------------------------
// Projects
// ------------------------------------------------------------
function seedProjects(): Project[] {
  return [
    {
      id: "p1", name: "Northern Ave Flip", folderId: "f-priority", status: "active",
      address: { street: "620 W Northern Ave", city: "Lima", state: "OH", zip: "45801", lat: 40.758, lng: -84.1124 },
      purchasePrice: 62000, estimatedARV: 165000, totalBudget: 85000, totalSpent: 61250,
      startDate: dayOffset(-34), estimatedEndDate: dayOffset(28),
      contractorIds: ["c1", "c2", "c3", "c4"],
      photos: [], documents: [], renders: [],
      scopeOfWork:
        "Full cosmetic rehab + mechanicals. New roof, full re-pipe (PEX), 200A panel upgrade, " +
        "HVAC replacement, new kitchen and two baths, LVP throughout, interior/exterior paint.",
      createdAt: dayOffset(-40),
      subfolders: [
        { id: "sf-p1-kitchen", name: "Kitchen", parent: "renovation", color: "#ea580c" },
        { id: "sf-p1-mech", name: "Mechanicals", parent: "renovation", color: "#0891b2" },
      ],
    },
    {
      id: "p2", name: "Wayside Dr Rehab", folderId: "f-active", status: "active",
      address: { street: "1216 Wayside Dr", city: "Lima", state: "OH", zip: "45805", lat: 40.729, lng: -84.1052 },
      purchasePrice: 51000, estimatedARV: 149000, totalBudget: 72000, totalSpent: 78500,
      startDate: dayOffset(-52), estimatedEndDate: dayOffset(6),
      contractorIds: ["c1", "c4", "c5"],
      photos: [], documents: [], renders: [],
      scopeOfWork:
        "Kitchen + two bath remodel, LVP flooring, full repaint, new siding on the north elevation, " +
        "landscaping refresh. Over budget — watch the finish costs.",
      createdAt: dayOffset(-58),
    },
    {
      id: "p3", name: "Highland Ct Flip", folderId: "f-active", status: "active",
      address: { street: "6314 E Highland Ct", city: "Columbus", state: "IN", zip: "47203", lat: 39.2014, lng: -85.9214 },
      purchasePrice: 95000, estimatedARV: 240000, totalBudget: 120000, totalSpent: 44000,
      startDate: dayOffset(-18), estimatedEndDate: dayOffset(70),
      contractorIds: ["c1", "c2", "c4"],
      photos: [], documents: [], renders: [],
      scopeOfWork:
        "Down-to-studs renovation. Foundation stabilization complete. Re-frame rear addition, all-new " +
        "electrical and plumbing, high-end kitchen, three baths.",
      createdAt: dayOffset(-22),
    },
    {
      id: "p4", name: "Monroe Ave Rehab", folderId: "f-priority", status: "active",
      address: { street: "217 N Monroe Ave", city: "Butler", state: "PA", zip: "16001", lat: 40.8612, lng: -79.8953 },
      purchasePrice: 38000, estimatedARV: 112000, totalBudget: 64000, totalSpent: 31000,
      startDate: dayOffset(-9), estimatedEndDate: dayOffset(45),
      contractorIds: ["c3", "c4"],
      photos: [], documents: [], renders: [],
      scopeOfWork: "Trashout complete. HVAC, windows & doors, drywall, paint, flooring, light kitchen refresh.",
      createdAt: dayOffset(-12),
    },
    {
      id: "p5", name: "Trail Valley Flip", folderId: "f-hold", status: "on_hold",
      address: { street: "6202 Trail Valley Dr", city: "San Antonio", state: "TX", zip: "78249", lat: 29.553, lng: -98.6175 },
      purchasePrice: 70000, estimatedARV: 198000, totalBudget: 98000, totalSpent: 12000,
      startDate: dayOffset(-70), estimatedEndDate: dayOffset(120),
      contractorIds: [],
      photos: [], documents: [], renders: [],
      scopeOfWork: "On hold pending survey + title clearance. Major foundation work anticipated.",
      createdAt: dayOffset(-80),
    },
    {
      id: "p6", name: "Dilworth Rd Flip", folderId: "f-completed", status: "completed",
      address: { street: "100 W Dilworth Rd", city: "Italy", state: "TX", zip: "76651", lat: 32.1835, lng: -96.8847 },
      purchasePrice: 44000, estimatedARV: 138000, totalBudget: 70000, totalSpent: 67400,
      startDate: dayOffset(-220), estimatedEndDate: dayOffset(-30), completedDate: dayOffset(-28),
      contractorIds: ["c1"],
      photos: [], documents: [], renders: [],
      scopeOfWork: "Completed full flip. Sold above ARV. Reference project for budgeting future Texas flips.",
      createdAt: dayOffset(-230),
    },
  ];
}

// ------------------------------------------------------------
// Tasks
// ------------------------------------------------------------
interface TS {
  id: string; p: string; title: string; cat: string;
  status: TaskStatus; pr: TaskPriority; qc: QualityCheck;
  c: string[]; est: number; act: number;
  due?: number; sched?: number; done?: number;
  order?: boolean; sub?: string | null; notes?: string;
}

function seedTasks(): TaskItem[] {
  const rows: TS[] = [
    // p1 — Northern Ave
    { id: "t-p1-demo", p: "p1", title: "Demo", cat: "Demolition", status: "completed", pr: "high", qc: "passed", c: ["c3"], est: 3000, act: 2850, done: 6, order: true },
    { id: "t-p1-roof", p: "p1", title: "Roof", cat: "Roofing", status: "blocked", pr: "critical", qc: "pending", c: ["c4"], est: 9500, act: 0, due: 1, order: false, notes: "Waiting on shingle delivery — supplier backordered to next week." },
    { id: "t-p1-plumb", p: "p1", title: "Plumbing Rough-In", cat: "Plumbing", status: "in_progress", pr: "critical", qc: "pending", c: ["c2"], est: 5200, act: 3100, due: 2, done: 3, order: true, sub: "sf-p1-mech" },
    { id: "t-p1-elec", p: "p1", title: "Electrical Rough-In", cat: "Electrical", status: "in_progress", pr: "high", qc: "pending", c: ["c2"], est: 4800, act: 1800, due: 3, done: 2, order: true, sub: "sf-p1-mech" },
    { id: "t-p1-hvac", p: "p1", title: "HVAC", cat: "HVAC", status: "scheduled", pr: "medium", qc: "pending", c: ["c3"], est: 5500, act: 0, sched: 5, order: true, sub: "sf-p1-mech" },
    { id: "t-p1-kitchen", p: "p1", title: "Kitchen Remodel", cat: "Kitchen", status: "scheduled", pr: "high", qc: "pending", c: ["c1"], est: 12000, act: 0, sched: 9, order: true, sub: "sf-p1-kitchen" },
    { id: "t-p1-drywall", p: "p1", title: "Drywall Work", cat: "Drywall", status: "not_started", pr: "medium", qc: "pending", c: ["c1"], est: 4200, act: 0 },

    // p2 — Wayside Dr
    { id: "t-p2-demo", p: "p2", title: "Demo", cat: "Demolition", status: "completed", pr: "high", qc: "passed", c: ["c4"], est: 2800, act: 2700, done: 6 },
    { id: "t-p2-bath", p: "p2", title: "Bathroom Remodel", cat: "Bathroom", status: "in_progress", pr: "high", qc: "pending", c: ["c5"], est: 8000, act: 4200, due: 1, done: 3, order: true },
    { id: "t-p2-floor", p: "p2", title: "Flooring", cat: "Flooring", status: "in_progress", pr: "medium", qc: "pending", c: ["c1"], est: 6500, act: 2629, due: 4, done: 1, order: true },
    { id: "t-p2-paint", p: "p2", title: "Paint By Room", cat: "Painting", status: "scheduled", pr: "low", qc: "pending", c: ["c5"], est: 3200, act: 0, sched: 6 },
    { id: "t-p2-siding", p: "p2", title: "Siding & Exterior", cat: "Exterior", status: "blocked", pr: "high", qc: "pending", c: ["c4"], est: 5400, act: 0, due: 0, notes: "HOA color approval pending." },

    // p3 — Highland Ct
    { id: "t-p3-foundation", p: "p3", title: "Foundation Work", cat: "Foundation", status: "completed", pr: "critical", qc: "passed", c: ["c4"], est: 11000, act: 10800, done: 5 },
    { id: "t-p3-framing", p: "p3", title: "Framing Work", cat: "Framing", status: "in_progress", pr: "high", qc: "pending", c: ["c1"], est: 9000, act: 5200, due: 2, done: 3, order: true },
    { id: "t-p3-elec", p: "p3", title: "Electrical Rough-In", cat: "Electrical", status: "scheduled", pr: "medium", qc: "pending", c: ["c2"], est: 7200, act: 0, sched: 4 },

    // p4 — Monroe Ave
    { id: "t-p4-demo", p: "p4", title: "Demo", cat: "Demolition", status: "in_progress", pr: "medium", qc: "pending", c: ["c3"], est: 2500, act: 1200, due: 1, done: 2, order: true },
    { id: "t-p4-hvac", p: "p4", title: "HVAC", cat: "HVAC", status: "scheduled", pr: "high", qc: "pending", c: ["c3"], est: 5200, act: 0, sched: 4 },
    { id: "t-p4-windows", p: "p4", title: "Windows & Doors", cat: "Exterior", status: "scheduled", pr: "low", qc: "pending", c: ["c4"], est: 4100, act: 0, sched: 7 },
  ];

  return rows.map((r) => ({
    id: r.id,
    projectId: r.p,
    title: r.title,
    description: "",
    status: r.status,
    priority: r.pr,
    qualityCheck: r.qc,
    assignedContractorIds: r.c,
    scheduledDate: r.sched !== undefined ? dayOffset(r.sched) : undefined,
    completedDate: r.status === "completed" ? dayOffset(-3) : undefined,
    dueDate: r.due !== undefined ? dayOffset(r.due) : r.sched !== undefined ? dayOffset(r.sched) : undefined,
    orderConfirmed: r.order ?? false,
    estimatedCost: r.est,
    actualCost: r.act,
    category: r.cat,
    notes: r.notes,
    microtasks: micro(r.title, r.cat, r.done ?? (r.status === "completed" ? 6 : 0)),
    subfolderId: r.sub ?? null,
  }));
}

// ------------------------------------------------------------
// Communications (threaded by taskId; some unread inbound)
// ------------------------------------------------------------
function seedCommunications(): Communication[] {
  return [
    // p1 plumbing thread
    { id: "m1", projectId: "p1", contractorId: "c2", taskId: "t-p1-plumb", type: "sms", direction: "outbound", content: "Hey Angela — still on track to finish the rough-in by Thursday?", timestamp: tsAgo(30), read: true },
    { id: "m2", projectId: "p1", contractorId: "c2", taskId: "t-p1-plumb", type: "sms", direction: "inbound", content: "Yep, supply lines are in. Starting DWV first thing tomorrow.", timestamp: tsAgo(26), read: true },
    { id: "m3", projectId: "p1", contractorId: "c2", taskId: "t-p1-plumb", type: "sms", direction: "inbound", content: "Can you send the updated master bath layout? Want to set the shower valve right.", timestamp: tsAgo(2), read: false },

    // p1 electrical thread
    { id: "m4", projectId: "p1", contractorId: "c2", taskId: "t-p1-elec", type: "sms", direction: "outbound", content: "Panel location confirmed on the garage wall?", timestamp: tsAgo(20), read: true },
    { id: "m5", projectId: "p1", contractorId: "c2", taskId: "t-p1-elec", type: "sms", direction: "inbound", content: "Confirmed. Pulling the permit today, inspection booked for Friday.", timestamp: tsAgo(4), read: false },

    // p1 kitchen scheduled — a logged call
    { id: "m6", projectId: "p1", contractorId: "c1", taskId: "t-p1-kitchen", type: "call", direction: "outbound", callStatus: "completed", duration: 320, content: "Reviewed kitchen scope + cabinet order timeline. 6-week lead — ordering this week.", timestamp: tsAgo(8), read: true },

    // p1 HVAC scheduled reminder (scheduled message)
    { id: "m7", projectId: "p1", contractorId: "c3", taskId: "t-p1-hvac", type: "sms", direction: "outbound", content: "Reminder: HVAC set scheduled for next week. Confirm your crew.", timestamp: tsAgo(1), read: true, scheduledFor: dayOffset(4) },

    // p2 bathroom thread (unread inbound)
    { id: "m8", projectId: "p2", contractorId: "c5", taskId: "t-p2-bath", type: "sms", direction: "inbound", content: "Tile delivery slipped to Monday — ok if I set the vanity first?", timestamp: tsAgo(1.2), read: false },
    { id: "m9", projectId: "p2", contractorId: "c5", taskId: "t-p2-bath", type: "sms", direction: "outbound", content: "Yes, do the vanity first. Thanks for the heads up.", timestamp: tsAgo(0.6), read: true },

    // p2 flooring note
    { id: "m10", projectId: "p2", contractorId: "c1", taskId: "t-p2-floor", type: "note", direction: "outbound", content: "Confirmed LVP color = Smoked Oak. 1,100 sqft ordered.", timestamp: tsAgo(50), read: true },

    // p3 framing thread
    { id: "m11", projectId: "p3", contractorId: "c1", taskId: "t-p3-framing", type: "sms", direction: "inbound", content: "Framing is ~60% done, rear addition squared up. On schedule.", timestamp: tsAgo(6), read: true },

    // p4 demo
    { id: "m12", projectId: "p4", contractorId: "c3", taskId: "t-p4-demo", type: "sms", direction: "inbound", content: "Dumpster is full — scheduling a swap for tomorrow AM.", timestamp: tsAgo(3), read: false },
  ];
}

// ------------------------------------------------------------
// Invoices
// ------------------------------------------------------------
function seedInvoices(): Invoice[] {
  const inv1Subtotal = 5500 + 2800;
  const inv2Subtotal = 3500 + 800;
  const s1 = milestoneSplit(inv1Subtotal);
  const s2 = milestoneSplit(inv2Subtotal);
  return [
    {
      id: "inv1", projectId: "p1", contractorId: "c2", status: "sent",
      lineItems: [
        { id: "li1", description: "Full Re-Pipe (PEX)", category: "Plumbing", subcategory: "plumb-2", unitPrice: 5500, quantity: 1, total: 5500 },
        { id: "li2", description: "Panel Upgrade (200 AMP)", category: "Electrical", subcategory: "elec-2", unitPrice: 2800, quantity: 1, total: 2800 },
      ],
      subtotal: inv1Subtotal, ...s1,
      depositPaid: true, midpointPaid: false, completionPaid: false,
      terms: "Standard fix-&-flip agreement. 25% deposit / 25% midpoint / 50% completion.",
      createdAt: tsAgo(72), sentAt: tsAgo(70),
    },
    {
      id: "inv2", projectId: "p2", contractorId: "c5", status: "approved",
      lineItems: [
        { id: "li3", description: "Shower Tile Install", category: "Bathroom", subcategory: "bath-2", unitPrice: 3500, quantity: 1, total: 3500 },
        { id: "li4", description: "Vanity Installation", category: "Bathroom", subcategory: "bath-3", unitPrice: 800, quantity: 1, total: 800 },
      ],
      subtotal: inv2Subtotal, ...s2,
      depositPaid: true, midpointPaid: false, completionPaid: false,
      terms: "Standard fix-&-flip agreement. 25% deposit / 25% midpoint / 50% completion.",
      createdAt: tsAgo(120), sentAt: tsAgo(118),
    },
  ];
}

// ------------------------------------------------------------
// Expenses
// ------------------------------------------------------------
function seedExpenses(): ExpenseItem[] {
  return [
    { id: "e1", projectId: "p1", description: "Kitchen cabinets (shaker white)", category: "Kitchen", unitPrice: 6200, quantity: 1, total: 6200, vendor: "ProSource", purchasedDate: dayOffset(-6) },
    { id: "e2", projectId: "p1", description: "PEX tubing & fittings", category: "Plumbing", unitPrice: 1450, quantity: 1, total: 1450, vendor: "Ferguson", purchasedDate: dayOffset(-10) },
    { id: "e3", projectId: "p1", description: "Architectural shingles", category: "Roofing", unitPrice: 3850, quantity: 1, total: 3850, vendor: "ABC Supply", purchasedDate: dayOffset(-4) },
    { id: "e4", projectId: "p2", description: "LVP flooring — Smoked Oak", category: "Flooring", unitPrice: 2.39, quantity: 1100, total: 2629, vendor: "Floor & Decor", purchasedDate: dayOffset(-14) },
    { id: "e5", projectId: "p2", description: "Bathroom tile & setting materials", category: "Bathroom", unitPrice: 1850, quantity: 1, total: 1850, vendor: "The Tile Shop", purchasedDate: dayOffset(-9) },
    { id: "e6", projectId: "p3", description: "Framing lumber package", category: "Framing", unitPrice: 7800, quantity: 1, total: 7800, vendor: "84 Lumber", purchasedDate: dayOffset(-12) },
  ];
}

// ------------------------------------------------------------
// Investments (1 rental + 1 note)
// ------------------------------------------------------------
function seedInvestments(): Investment[] {
  const noUtil = { tenantPays: true, monthlyCost: 0 };
  return [
    {
      id: "r1", type: "rental", name: "Maple St Duplex", collectingIncome: true,
      address: { street: "412 Maple St", city: "Lima", state: "OH", zip: "45804", lat: 40.742, lng: -84.105 },
      photos: [],
      principal: 720, interest: 305, taxes: 185, insurance: 95,
      monthlyRent: 1750,
      gas: noUtil, electric: noUtil, sewer: { tenantPays: false, monthlyCost: 65 }, water: { tenantPays: false, monthlyCost: 80 }, trash: { tenantPays: false, monthlyCost: 30 },
      depositAmount: 1750, leaseStartDate: dayOffset(-200), leaseEndDate: dayOffset(165),
      tenantNames: "Marcus & Tina Reed", numberOfOccupants: 3,
      tenantContactInfo: "(555) 884-2210 · reed.family@email.com",
      propertyManagerContact: "Self-managed", propertyManagerFee: 0,
      electricProvider: "AEP Ohio", electricAccount: "AEP-44821",
      waterProvider: "City of Lima", waterAccount: "LW-90233",
      gasProvider: "Columbia Gas", gasAccount: "CG-71140",
      sewerProvider: "City of Lima", sewerAccount: "LS-90233",
      trashProvider: "Republic Services", trashAccount: "RS-55012",
      workOrders: [
        { id: "wo1", description: "Replace garbage disposal — unit B", cost: 220, date: dayOffset(-15), status: "completed" },
        { id: "wo2", description: "Furnace annual service", cost: 145, date: dayOffset(5), status: "open" },
      ],
      yearBuilt: "1968", squareFootage: "2,240", bedrooms: "4", bathrooms: "2", lotSize: "0.18 ac",
      propertyType: "Duplex", acInstalled: "2021", roofInstalled: "2019", guttersInstalled: "2019",
      floorsInstalled: "2020", kitchenRemodeled: "2020", bathroomRemodeled: "2020",
      waterHeaterInstalled: "2022", furnaceInstalled: "2018", electricalUpdated: "2020",
      plumbingUpdated: "2020", foundationType: "Poured concrete", garageType: "Detached 1-car",
      propertyNotes: "Solid cash-flowing duplex. Both units occupied, leases stagger by 6 months.",
      createdAt: dayOffset(-210),
    },
    {
      id: "n1", type: "note", name: "Henderson Bridge Loan", collectingIncome: true,
      borrowerName: "J. Henderson Holdings LLC", loanAmount: 45000,
      dateLent: dayOffset(-90), dateDue: dayOffset(275),
      monthlyPaymentDate: "1st of month", monthlyPaymentAmount: 600,
      annualInterestRate: 12, collateral: "2nd lien on 88 Oak St, Lima OH (ARV $140k)",
      createdAt: dayOffset(-90),
    },
  ];
}

function seedWeeklyTodos(): WeeklyTodo[] {
  return [
    { id: "wt1", projectId: "p1", text: "Order kitchen cabinets (6-week lead time)", hiddenFromDashboard: false, createdAt: dayOffset(-2) },
    { id: "wt2", projectId: "p1", text: "Confirm dumpster pickup Friday", hiddenFromDashboard: false, createdAt: dayOffset(-1) },
    { id: "wt3", projectId: "p2", text: "Schedule final plumbing inspection", hiddenFromDashboard: false, createdAt: dayOffset(-1) },
    { id: "wt4", projectId: "p3", text: "Get HOA color approval for rear addition", hiddenFromDashboard: false, createdAt: dayOffset(-3) },
  ];
}

const DEFAULT_SETTINGS: AppSettings = {
  companyName: "Reinnovation Homes",
  userName: "You",
};

export function createSeedDb(): DB {
  microSeed = 0;
  return {
    projects: seedProjects(),
    contractors: seedContractors(),
    tasks: seedTasks(),
    expenses: seedExpenses(),
    invoices: seedInvoices(),
    communications: seedCommunications(),
    folders: seedFolders(),
    investments: seedInvestments(),
    weeklyTodos: seedWeeklyTodos(),
    settings: { ...DEFAULT_SETTINGS },
  };
}

// ------------------------------------------------------------
// Normalization / migration
// ------------------------------------------------------------
function asArray<T>(v: unknown, fallback: T[]): T[] {
  return Array.isArray(v) ? (v as T[]) : fallback;
}

function migrateTask(raw: unknown): TaskItem {
  const t = (raw ?? {}) as Partial<TaskItem> & { assignedContractorId?: string };
  const ids = Array.isArray(t.assignedContractorIds)
    ? t.assignedContractorIds
    : t.assignedContractorId
      ? [t.assignedContractorId]
      : [];
  return {
    ...(t as TaskItem),
    assignedContractorIds: ids,
    microtasks: Array.isArray(t.microtasks) ? t.microtasks : [],
  };
}

/** Coerce arbitrary parsed JSON into a valid DB. */
export function normalizeDb(raw: unknown): DB {
  const seed = createSeedDb();
  if (!raw || typeof raw !== "object") return seed;
  const d = raw as Record<string, unknown>;
  const s = (d.settings && typeof d.settings === "object" ? d.settings : {}) as Partial<AppSettings>;
  return {
    projects: asArray<Project>(d.projects, seed.projects),
    contractors: asArray<Contractor>(d.contractors, seed.contractors),
    tasks: Array.isArray(d.tasks) ? d.tasks.map(migrateTask) : seed.tasks,
    expenses: asArray<ExpenseItem>(d.expenses, []),
    invoices: asArray<Invoice>(d.invoices, []),
    communications: asArray<Communication>(d.communications, []),
    folders: asArray<Folder>(d.folders, seed.folders),
    investments: asArray<Investment>(d.investments, []),
    weeklyTodos: asArray<WeeklyTodo>(d.weeklyTodos, []),
    settings: {
      companyName: typeof s.companyName === "string" ? s.companyName : seed.settings.companyName,
      userName: typeof s.userName === "string" ? s.userName : seed.settings.userName,
    },
  };
}

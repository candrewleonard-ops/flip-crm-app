// ============================================================
// FlipCRM Desktop — domain catalogs
//   - DEFAULT_TASKS: standard fix-&-flip scope-of-work templates
//   - getMicrotasksFor(): fresh microtask checklist for a task
//   - SERVICE_CATALOG: pricing catalog used by the invoice builder
//   - INVOICE_TERMS: standard payment-terms boilerplate
// ============================================================

import type { Microtask, ServiceCategory } from "./types";

export interface DefaultTaskSeed {
  title: string;
  category: string;
  days: number;
  microtasks: string[];
}

export const DEFAULT_TASKS: DefaultTaskSeed[] = [
  {
    title: "Demo", category: "Demolition", days: 2,
    microtasks: [
      "Shut off power & water to work areas",
      "Protect fixtures & finishes being kept",
      "Remove damaged drywall & flooring",
      "Demo cabinets, counters & fixtures",
      "Haul debris to dumpster",
      "Broom-clean the site",
    ],
  },
  {
    title: "Foundation Work", category: "Foundation", days: 2,
    microtasks: [
      "Inspect footings & foundation walls",
      "Repair cracks / address settling",
      "Waterproof & seal as needed",
      "Backfill & grade away from house",
      "Pass foundation inspection",
    ],
  },
  {
    title: "Framing Work", category: "Framing", days: 2,
    microtasks: [
      "Verify layout against plans",
      "Frame walls & partitions",
      "Set headers, beams & posts",
      "Frame rough openings for doors & windows",
      "Check level, plumb & square",
      "Pass framing inspection",
    ],
  },
  {
    title: "Roof", category: "Roofing", days: 2,
    microtasks: [
      "Tear off old roofing",
      "Inspect & repair decking",
      "Install underlayment & flashing",
      "Install shingles / roofing material",
      "Seal penetrations & check for leaks",
    ],
  },
  {
    title: "Siding & Exterior", category: "Exterior", days: 2,
    microtasks: [
      "Remove damaged siding",
      "Install house wrap / weather barrier",
      "Install siding",
      "Caulk & seal seams",
      "Touch-up trim & paint",
    ],
  },
  {
    title: "Windows & Doors", category: "Exterior", days: 1,
    microtasks: [
      "Confirm rough-opening sizes",
      "Install & flash windows",
      "Hang exterior doors",
      "Insulate & seal gaps",
      "Install locks & hardware",
    ],
  },
  {
    title: "Plumbing Rough-In", category: "Plumbing", days: 2,
    microtasks: [
      "Run supply lines",
      "Run drain, waste & vent lines",
      "Set tubs / shower pans",
      "Pressure-test the system",
      "Pass rough-in inspection",
    ],
  },
  {
    title: "Electrical Rough-In", category: "Electrical", days: 2,
    microtasks: [
      "Run circuits & home-run wiring",
      "Set boxes for outlets & switches",
      "Install & wire the panel",
      "Label circuits",
      "Pass rough-in inspection",
    ],
  },
  {
    title: "HVAC", category: "HVAC", days: 2,
    microtasks: [
      "Set furnace / air handler",
      "Run & seal ductwork",
      "Set condenser & lineset",
      "Install & program thermostat",
      "Test heating & cooling",
    ],
  },
  {
    title: "Insulation", category: "General", days: 1,
    microtasks: [
      "Insulate exterior walls",
      "Insulate attic & ceilings",
      "Air-seal gaps & penetrations",
      "Pass insulation inspection",
    ],
  },
  {
    title: "Drywall Work", category: "Drywall", days: 2,
    microtasks: [
      "Hang drywall",
      "Tape & mud seams",
      "Sand smooth",
      "Prime walls & ceilings",
      "Touch up imperfections",
    ],
  },
  {
    title: "Subfloors", category: "Flooring", days: 1,
    microtasks: [
      "Inspect & sister damaged joists",
      "Replace rotten subfloor",
      "Screw down & secure",
      "Level high & low spots",
    ],
  },
  {
    title: "Flooring", category: "Flooring", days: 2,
    microtasks: [
      "Acclimate flooring materials",
      "Prep & level subfloor",
      "Install flooring",
      "Install trim & transitions",
      "Final clean & protect",
    ],
  },
  {
    title: "Kitchen Remodel", category: "Kitchen", days: 3,
    microtasks: [
      "Set base & wall cabinets",
      "Template & install countertops",
      "Install sink & faucet",
      "Install backsplash",
      "Connect appliances",
      "Final hardware & caulk",
    ],
  },
  {
    title: "Bathroom Remodel", category: "Bathroom", days: 2,
    microtasks: [
      "Set tub / shower",
      "Waterproof & tile walls & floor",
      "Install vanity & top",
      "Set toilet",
      "Install fixtures & accessories",
      "Caulk & seal",
    ],
  },
  {
    title: "Outlets & Switches", category: "Electrical", days: 1,
    microtasks: [
      "Install outlets",
      "Install switches & dimmers",
      "Install cover plates",
      "Test every circuit",
    ],
  },
  {
    title: "Ceiling Fans & Lights", category: "Electrical", days: 1,
    microtasks: [
      "Install ceiling boxes",
      "Hang light fixtures",
      "Install ceiling fans",
      "Test & confirm operation",
    ],
  },
  {
    title: "Paint By Room", category: "Painting", days: 2,
    microtasks: [
      "Patch & sand walls",
      "Prime where needed",
      "Cut in edges",
      "Roll walls & ceilings",
      "Paint trim & doors",
      "Final touch-ups",
    ],
  },
  {
    title: "Appliances", category: "Kitchen", days: 1,
    microtasks: [
      "Confirm measurements & hookups",
      "Install refrigerator",
      "Install range / oven",
      "Install dishwasher & microwave",
      "Test all appliances",
    ],
  },
  {
    title: "Landscaping & Exterior Cleanup", category: "Exterior", days: 1,
    microtasks: [
      "Haul off exterior debris",
      "Grade & clean the yard",
      "Lay sod / mulch / beds",
      "Pressure-wash exterior & walks",
      "Final curb-appeal pass",
    ],
  },
  {
    title: "Final Cleanup & Punch List", category: "General", days: 1,
    microtasks: [
      "Deep-clean interior",
      "Clean windows & fixtures",
      "Walk & log the punch list",
      "Fix punch items",
      "Stage for listing photos",
    ],
  },
  {
    title: "Final Inspection & QC", category: "General", days: 1,
    microtasks: [
      "Schedule final inspection",
      "Walk with the inspector",
      "Address corrections",
      "Obtain certificate of occupancy",
      "Manager QC sign-off",
    ],
  },
];

// Generic fallback for custom / unknown tasks.
const GENERIC_MICROTASKS = [
  "Plan & order materials",
  "Schedule the contractor",
  "Complete the work",
  "Inspect & QC",
  "Mark complete",
];

let mtCounter = 0;
export function makeMicrotasks(titles: string[]): Microtask[] {
  return titles.map((title) => ({
    id: `mt_${Date.now().toString(36)}_${(mtCounter++).toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    title,
    done: false,
  }));
}

const BY_TITLE = new Map(DEFAULT_TASKS.map((t) => [t.title.toLowerCase(), t]));
const BY_CATEGORY: Record<string, string[]> = Object.fromEntries(
  DEFAULT_TASKS.map((t) => [t.category.toLowerCase(), t.microtasks])
);

/**
 * Returns a fresh microtask checklist for a task, matched by title first,
 * then by category keyword, then a sensible generic fallback.
 */
export function getMicrotasksFor(title: string, category?: string): Microtask[] {
  const t = (title || "").trim().toLowerCase();
  if (t && BY_TITLE.has(t)) return makeMicrotasks(BY_TITLE.get(t)!.microtasks);
  if (t) {
    for (const [key, seed] of BY_TITLE) {
      if (key.includes(t) || t.includes(key)) return makeMicrotasks(seed.microtasks);
    }
  }
  const c = (category || "").trim().toLowerCase();
  if (c && BY_CATEGORY[c]) return makeMicrotasks(BY_CATEGORY[c]);
  return makeMicrotasks(GENERIC_MICROTASKS);
}

// ------------------------------------------------------------
// Service & pricing catalog (invoice builder)
// ------------------------------------------------------------
export const SERVICE_CATALOG: ServiceCategory[] = [
  {
    id: "hvac", name: "HVAC Services", icon: "Thermometer",
    services: [
      { id: "hvac-1", name: "Full AC System Installation", defaultPrice: 5500, unit: "per unit" },
      { id: "hvac-2", name: "AC Unit Replacement", defaultPrice: 3800, unit: "per unit" },
      { id: "hvac-3", name: "Furnace Installation", defaultPrice: 4200, unit: "per unit" },
      { id: "hvac-4", name: "Furnace Replacement", defaultPrice: 3500, unit: "per unit" },
      { id: "hvac-5", name: "Blower Motor Replacement", defaultPrice: 650, unit: "per unit" },
      { id: "hvac-6", name: "Freon / Refrigerant Recharge", defaultPrice: 350, unit: "per unit" },
      { id: "hvac-7", name: "Ductwork Repair", defaultPrice: 1200, unit: "flat rate" },
      { id: "hvac-8", name: "Ductwork Installation", defaultPrice: 2800, unit: "flat rate" },
      { id: "hvac-9", name: "Thermostat Installation", defaultPrice: 250, unit: "per unit" },
      { id: "hvac-10", name: "Condenser Coil Replacement", defaultPrice: 1800, unit: "per unit" },
      { id: "hvac-11", name: "Evaporator Coil Replacement", defaultPrice: 1500, unit: "per unit" },
      { id: "hvac-12", name: "HVAC System Tune-Up", defaultPrice: 180, unit: "per unit" },
    ],
  },
  {
    id: "plumbing", name: "Plumbing", icon: "Droplets",
    services: [
      { id: "plumb-1", name: "Full Re-Pipe (Copper)", defaultPrice: 8500, unit: "flat rate" },
      { id: "plumb-2", name: "Full Re-Pipe (PEX)", defaultPrice: 5500, unit: "flat rate" },
      { id: "plumb-3", name: "Water Heater Installation", defaultPrice: 1800, unit: "per unit" },
      { id: "plumb-4", name: "Tankless Water Heater Install", defaultPrice: 3200, unit: "per unit" },
      { id: "plumb-5", name: "Toilet Installation", defaultPrice: 350, unit: "per unit" },
      { id: "plumb-6", name: "Bathtub/Shower Installation", defaultPrice: 2200, unit: "per unit" },
      { id: "plumb-7", name: "Sink & Faucet Install", defaultPrice: 450, unit: "per unit" },
      { id: "plumb-8", name: "Garbage Disposal Install", defaultPrice: 280, unit: "per unit" },
      { id: "plumb-9", name: "Sewer Line Repair", defaultPrice: 4500, unit: "flat rate" },
      { id: "plumb-10", name: "Drain Cleaning", defaultPrice: 250, unit: "per visit" },
    ],
  },
  {
    id: "electrical", name: "Electrical", icon: "Zap",
    services: [
      { id: "elec-1", name: "Full Electrical Rewire", defaultPrice: 12000, unit: "flat rate" },
      { id: "elec-2", name: "Panel Upgrade (200 AMP)", defaultPrice: 2800, unit: "per unit" },
      { id: "elec-3", name: "Outlet Installation", defaultPrice: 180, unit: "per unit" },
      { id: "elec-4", name: "Light Fixture Installation", defaultPrice: 150, unit: "per unit" },
      { id: "elec-5", name: "Ceiling Fan Installation", defaultPrice: 250, unit: "per unit" },
      { id: "elec-6", name: "GFCI Outlet Install", defaultPrice: 200, unit: "per unit" },
      { id: "elec-7", name: "Smoke Detector Install", defaultPrice: 120, unit: "per unit" },
      { id: "elec-8", name: "EV Charger Installation", defaultPrice: 1500, unit: "per unit" },
    ],
  },
  {
    id: "roofing", name: "Roofing", icon: "Home",
    services: [
      { id: "roof-1", name: "Full Roof Replacement (Shingle)", defaultPrice: 9500, unit: "flat rate" },
      { id: "roof-2", name: "Roof Repair / Patch", defaultPrice: 1200, unit: "flat rate" },
      { id: "roof-3", name: "Gutter Installation", defaultPrice: 1800, unit: "flat rate" },
      { id: "roof-4", name: "Gutter Cleaning", defaultPrice: 250, unit: "per visit" },
      { id: "roof-5", name: "Fascia & Soffit Repair", defaultPrice: 1500, unit: "flat rate" },
      { id: "roof-6", name: "Skylight Installation", defaultPrice: 2200, unit: "per unit" },
    ],
  },
  {
    id: "flooring", name: "Flooring", icon: "Layers",
    services: [
      { id: "floor-1", name: "Hardwood Floor Install", defaultPrice: 8, unit: "per sqft" },
      { id: "floor-2", name: "Laminate Floor Install", defaultPrice: 5, unit: "per sqft" },
      { id: "floor-3", name: "LVP Floor Install", defaultPrice: 6, unit: "per sqft" },
      { id: "floor-4", name: "Tile Floor Install", defaultPrice: 12, unit: "per sqft" },
      { id: "floor-5", name: "Carpet Install", defaultPrice: 4, unit: "per sqft" },
      { id: "floor-6", name: "Floor Demolition", defaultPrice: 2, unit: "per sqft" },
      { id: "floor-7", name: "Hardwood Refinishing", defaultPrice: 5, unit: "per sqft" },
    ],
  },
  {
    id: "painting", name: "Painting", icon: "Paintbrush",
    services: [
      { id: "paint-1", name: "Interior Paint (per room)", defaultPrice: 450, unit: "per room" },
      { id: "paint-2", name: "Exterior Paint", defaultPrice: 4500, unit: "flat rate" },
      { id: "paint-3", name: "Cabinet Painting", defaultPrice: 2800, unit: "flat rate" },
      { id: "paint-4", name: "Deck/Fence Staining", defaultPrice: 1200, unit: "flat rate" },
      { id: "paint-5", name: "Drywall Repair & Texture", defaultPrice: 350, unit: "per area" },
    ],
  },
  {
    id: "kitchen", name: "Kitchen", icon: "ChefHat",
    services: [
      { id: "kit-1", name: "Full Kitchen Remodel", defaultPrice: 25000, unit: "flat rate" },
      { id: "kit-2", name: "Cabinet Installation", defaultPrice: 6500, unit: "flat rate" },
      { id: "kit-3", name: "Countertop Install (Granite)", defaultPrice: 4500, unit: "flat rate" },
      { id: "kit-4", name: "Countertop Install (Quartz)", defaultPrice: 5500, unit: "flat rate" },
      { id: "kit-5", name: "Backsplash Tile Install", defaultPrice: 1200, unit: "flat rate" },
      { id: "kit-6", name: "Appliance Installation", defaultPrice: 350, unit: "per unit" },
    ],
  },
  {
    id: "bathroom", name: "Bathroom", icon: "Bath",
    services: [
      { id: "bath-1", name: "Full Bathroom Remodel", defaultPrice: 15000, unit: "flat rate" },
      { id: "bath-2", name: "Shower Tile Install", defaultPrice: 3500, unit: "flat rate" },
      { id: "bath-3", name: "Vanity Installation", defaultPrice: 800, unit: "per unit" },
      { id: "bath-4", name: "Tub-to-Shower Conversion", defaultPrice: 4500, unit: "flat rate" },
      { id: "bath-5", name: "Mirror & Hardware Install", defaultPrice: 300, unit: "per set" },
    ],
  },
  {
    id: "exterior", name: "Exterior / Landscaping", icon: "Trees",
    services: [
      { id: "ext-1", name: "Siding Replacement (Vinyl)", defaultPrice: 8500, unit: "flat rate" },
      { id: "ext-2", name: "Window Installation", defaultPrice: 650, unit: "per unit" },
      { id: "ext-3", name: "Door Installation (Exterior)", defaultPrice: 900, unit: "per unit" },
      { id: "ext-4", name: "Door Installation (Interior)", defaultPrice: 350, unit: "per unit" },
      { id: "ext-5", name: "Fence Installation", defaultPrice: 3500, unit: "flat rate" },
      { id: "ext-6", name: "Concrete / Driveway Work", defaultPrice: 4500, unit: "flat rate" },
      { id: "ext-7", name: "Landscaping Package", defaultPrice: 2500, unit: "flat rate" },
      { id: "ext-8", name: "Deck Build", defaultPrice: 5500, unit: "flat rate" },
    ],
  },
  {
    id: "demolition", name: "Demolition & Cleanup", icon: "Hammer",
    services: [
      { id: "demo-1", name: "Full Interior Demo", defaultPrice: 5000, unit: "flat rate" },
      { id: "demo-2", name: "Trashout / Junk Removal", defaultPrice: 2500, unit: "flat rate" },
      { id: "demo-3", name: "Dumpster Rental (Week)", defaultPrice: 550, unit: "per week" },
      { id: "demo-4", name: "Mold Remediation", defaultPrice: 3500, unit: "flat rate" },
      { id: "demo-5", name: "Asbestos Abatement", defaultPrice: 6000, unit: "flat rate" },
    ],
  },
];

export const INVOICE_TERMS = `INDEPENDENT CONTRACTOR SERVICE AGREEMENT & INVOICE

PAYMENT SCHEDULE:

1. DEPOSIT — Twenty-five percent (25%) of the total contract amount is due upon
   execution of this agreement. This deposit secures scheduling priority and covers
   initial mobilization, material procurement, and project planning.

2. MIDPOINT PAYMENT — An additional twenty-five percent (25%) of the total contract
   amount is due upon verified completion of approximately fifty percent (50%) of the
   agreed-upon scope of work. Midpoint completion shall be determined by mutual
   assessment between the Project Manager and Contractor.

3. FINAL PAYMENT — The remaining fifty percent (50%) of the total contract amount is
   due upon satisfactory completion of all work, subject to quality inspection and
   sign-off by the Project Manager or authorized representative.

TERMS & CONDITIONS:

a) SCOPE OF WORK — The Contractor shall perform all services as described in the
   attached line items. Any changes to the scope must be agreed upon in writing
   before work commences on the changed items.

b) QUALITY STANDARDS — All work shall be performed in a professional and workmanlike
   manner, in accordance with applicable building codes, manufacturer specifications,
   and industry best practices.

c) MATERIALS — Unless otherwise specified, the Contractor is responsible for procuring
   all materials required to complete the scope of work. Material selections shall be
   approved by the Project Manager prior to purchase.

d) TIMELINE — The Contractor agrees to commence work on the scheduled start date and
   to diligently pursue completion. Any anticipated delays must be communicated
   promptly to the Project Manager.

e) PROGRESS ASSESSMENT — The Company reserves the right to evaluate the progress and
   quality of work at any stage.

f) WARRANTY — The Contractor warrants all labor for a period of twelve (12) months
   from the date of final completion. Any deficiencies identified during this period
   shall be remedied by the Contractor at no additional cost.

g) INSURANCE & LIABILITY — The Contractor shall maintain adequate general liability
   insurance and workers' compensation coverage for the duration of the engagement.

h) CLEAN WORKSPACE — The Contractor shall maintain a clean and safe work environment
   and shall remove all debris upon completion of each phase of work.

i) INDEPENDENT CONTRACTOR STATUS — The Contractor is an independent contractor and
   not an employee of the Company.

By accepting this invoice, the Contractor acknowledges and agrees to the above terms.`;

/** Standard milestone split. */
export function milestoneSplit(subtotal: number) {
  return {
    depositAmount: Math.round(subtotal * 0.25 * 100) / 100,
    midpointAmount: Math.round(subtotal * 0.25 * 100) / 100,
    completionAmount: Math.round(subtotal * 0.5 * 100) / 100,
  };
}

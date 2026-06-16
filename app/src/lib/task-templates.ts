// ============================================================
// WorkTop CRM — Scope-of-Work task templates + microtask presets
// ============================================================
// Every default renovation task ships with a short, essential
// microtask checklist. These are intentionally generic-but-useful
// so they apply to most fix & flip / reconstruction jobs.

import { Microtask } from "./types";

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
    title: "Plumbing (Rough-In)", category: "Plumbing", days: 2,
    microtasks: [
      "Run supply lines",
      "Run drain, waste & vent lines",
      "Set tubs / shower pans",
      "Pressure-test the system",
      "Pass rough-in inspection",
    ],
  },
  {
    title: "Electrical (Rough-In)", category: "Electrical", days: 2,
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

// Build a quick lookup keyed by lowercased title.
const BY_TITLE = new Map(DEFAULT_TASKS.map((t) => [t.title.toLowerCase(), t]));

// Category keyword → microtask titles (used when the title isn't an exact match).
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

  // Partial title match (e.g. "framing" → "Framing Work").
  if (t) {
    for (const [key, seed] of BY_TITLE) {
      if (key.includes(t) || t.includes(key)) return makeMicrotasks(seed.microtasks);
    }
  }

  const c = (category || "").trim().toLowerCase();
  if (c && BY_CATEGORY[c]) return makeMicrotasks(BY_CATEGORY[c]);

  return makeMicrotasks(GENERIC_MICROTASKS);
}

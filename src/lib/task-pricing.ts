// ============================================================
// FlipCRM Desktop — task pricing rules (single source of truth)
// ============================================================
// Only Flooring is square-foot priced ($4.50/sq ft). Everything else is
// flat (manual / template default). To change pricing behavior, edit ONLY
// this file — change the rate, or add another category to CATEGORY_PRICING.

export type PricingMode = "per_sqft" | "flat";

export interface TaskPricing {
  mode: PricingMode;
  rate: number; // rate = $/sqft when per_sqft, else flat $
}

// DEFAULT: only Flooring is square-foot priced. Everything else is flat.
export const CATEGORY_PRICING: Record<string, TaskPricing> = {
  Flooring: { mode: "per_sqft", rate: 4.5 }, // $4.50 per square foot
};

export const DEFAULT_PRICING: TaskPricing = { mode: "flat", rate: 0 };

export function pricingForCategory(category: string): TaskPricing {
  return CATEGORY_PRICING[category] ?? DEFAULT_PRICING;
}

export function computeEstimatedCost(
  category: string,
  squareFootage: number,
  override?: TaskPricing
): number {
  const p = override ?? pricingForCategory(category);
  if (p.mode === "per_sqft") return Math.round((squareFootage || 0) * p.rate);
  return p.rate; // flat (0 = user enters manually)
}

/** Is this category (or override) driven by square footage? */
export function isPerSqft(category: string, override?: TaskPricing): boolean {
  return (override ?? pricingForCategory(category)).mode === "per_sqft";
}

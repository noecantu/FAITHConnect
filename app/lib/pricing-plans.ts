export type BillingCycle = "monthly" | "yearly";
export type PlanId = "beginning" | "beginningPlus" | "growing" | "growingPlus" | "abounding";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlight?: boolean;
};

export const PRICING_PLANS: PlanDefinition[] = [
  {
    id: "beginning",
    name: "Beginning Plan",
    monthlyPrice: 12,
    yearlyPrice: 129,
    features: ["Up to 50 Members", "All Core Features", "Email Support"],
  },
  {
    id: "beginningPlus",
    name: "Beginning Plus Plan",
    monthlyPrice: 30,
    yearlyPrice: 320,
    features: ["Up to 150 Members", "All Core Features", "Email Support"],
  },
  {
    id: "growing",
    name: "Growing Plan",
    monthlyPrice: 42,
    yearlyPrice: 453,
    features: ["Up to 300 Members", "All Core Features", "Priority Email Support"],
    highlight: true,
  },
  {
    id: "growingPlus",
    name: "Growing Plus Plan",
    monthlyPrice: 60,
    yearlyPrice: 645,
    features: ["Up to 600 Members", "All Core Features", "Priority Email Support"],
    highlight: true,
  },
  {
    id: "abounding",
    name: "Abounding Plan",
    monthlyPrice: 82,
    yearlyPrice: 885,
    features: ["Unlimited Members", "All Core Features", "Priority Support"],
  },
];

export function normalizePlanId(raw: string | null | undefined): PlanId | null {
  if (!raw) return null;

  const normalized = raw.toLowerCase();
  const map: Record<string, PlanId> = {
    beginning: "beginning",
    beginningplus: "beginningPlus",
    growing: "growing",
    growingplus: "growingPlus",
    abounding: "abounding",
  };

  return map[normalized] ?? null;
}

export function normalizeBillingCycle(raw: string | null | undefined): BillingCycle {
  return raw?.toLowerCase() === "yearly" ? "yearly" : "monthly";
}

export function getPlanById(raw: string | null | undefined): PlanDefinition | null {
  const id = normalizePlanId(raw);
  if (!id) return null;
  return PRICING_PLANS.find((plan) => plan.id === id) ?? null;
}

export function formatPrice(plan: PlanDefinition, cycle: BillingCycle): string {
  if (cycle === "yearly") {
    return `$${plan.yearlyPrice}`;
  }

  return `$${plan.monthlyPrice}`;
}

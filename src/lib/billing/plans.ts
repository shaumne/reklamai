// Subscription plans and credit packs. Product ids are wired to the payment
// provider via env so sandbox/production catalogs can differ.

export type Plan = {
  tier: "free" | "starter" | "pro" | "business";
  priceUsdMonth: number;
  creditsMonth: number;
  rolloverMonths: number;
  seats: number;
  maxResolution: "720p" | "1080p" | "4k";
  watermark: boolean;
  apiAccess: boolean;
  highlight?: boolean;
};

export const PLANS: Plan[] = [
  {
    tier: "free",
    priceUsdMonth: 0,
    creditsMonth: 0, // one-time 20 welcome credits, not recurring
    rolloverMonths: 0,
    seats: 1,
    maxResolution: "720p",
    watermark: true,
    apiAccess: false,
  },
  {
    tier: "starter",
    priceUsdMonth: 29,
    creditsMonth: 200,
    rolloverMonths: 1,
    seats: 1,
    maxResolution: "1080p",
    watermark: false,
    apiAccess: false,
    highlight: true,
  },
  {
    tier: "pro",
    priceUsdMonth: 79,
    creditsMonth: 600,
    rolloverMonths: 2,
    seats: 3,
    maxResolution: "4k",
    watermark: false,
    apiAccess: true,
  },
  {
    tier: "business",
    priceUsdMonth: 149,
    creditsMonth: 1150,
    rolloverMonths: 2,
    seats: 10,
    maxResolution: "4k",
    watermark: false,
    apiAccess: true,
  },
];

export type CreditPack = {
  id: "boost" | "growth" | "scale";
  priceUsd: number;
  credits: number;
};

// Per-credit pack prices sit above every plan's per-credit rate so a
// subscription is always the better deal.
export const CREDIT_PACKS: CreditPack[] = [
  { id: "boost", priceUsd: 19, credits: 100 },
  { id: "growth", priceUsd: 49, credits: 300 },
  { id: "scale", priceUsd: 149, credits: 1000 },
];

export const ANNUAL_MONTHS_FREE = 2; // yearly = 10 months price

export function planByTier(tier: string): Plan | undefined {
  return PLANS.find((p) => p.tier === tier);
}

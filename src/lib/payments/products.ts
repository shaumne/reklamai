import { CREDIT_PACKS, PLANS } from "@/lib/billing/plans";

// Product keys are stable app-side identifiers; each maps to a provider
// product id via env so sandbox/production catalogs stay interchangeable.

export type ProductKey =
  | "starter"
  | "pro"
  | "business"
  | "starter-annual"
  | "pro-annual"
  | "business-annual"
  | "pack-boost"
  | "pack-growth"
  | "pack-scale";

export type ProductInfo = {
  key: ProductKey;
  type: "subscription" | "credit_pack";
  planTier?: "starter" | "pro" | "business";
  annual?: boolean;
  credits: number; // per period for subscriptions, total for packs
};

export const PRODUCTS: ProductInfo[] = [
  ...(["starter", "pro", "business"] as const).flatMap((tier) => {
    const plan = PLANS.find((p) => p.tier === tier)!;
    return [
      { key: tier as ProductKey, type: "subscription" as const, planTier: tier, credits: plan.creditsMonth },
      {
        key: `${tier}-annual` as ProductKey,
        type: "subscription" as const,
        planTier: tier,
        annual: true,
        credits: plan.creditsMonth,
      },
    ];
  }),
  ...CREDIT_PACKS.map((pack) => ({
    key: `pack-${pack.id}` as ProductKey,
    type: "credit_pack" as const,
    credits: pack.credits,
  })),
];

const ENV_BY_KEY: Record<ProductKey, string> = {
  starter: "POLAR_PRODUCT_STARTER",
  pro: "POLAR_PRODUCT_PRO",
  business: "POLAR_PRODUCT_BUSINESS",
  "starter-annual": "POLAR_PRODUCT_STARTER_ANNUAL",
  "pro-annual": "POLAR_PRODUCT_PRO_ANNUAL",
  "business-annual": "POLAR_PRODUCT_BUSINESS_ANNUAL",
  "pack-boost": "POLAR_PRODUCT_PACK_BOOST",
  "pack-growth": "POLAR_PRODUCT_PACK_GROWTH",
  "pack-scale": "POLAR_PRODUCT_PACK_SCALE",
};

export function providerProductId(key: ProductKey): string | undefined {
  const prefix = (process.env.PAYMENT_PROVIDER ?? "polar").toUpperCase() === "STRIPE"
    ? "STRIPE_PRICE_"
    : "POLAR_PRODUCT_";
  const envName = ENV_BY_KEY[key].replace("POLAR_PRODUCT_", prefix);
  return process.env[envName] || undefined;
}

export function productByProviderId(providerId: string): ProductInfo | undefined {
  for (const product of PRODUCTS) {
    if (providerProductId(product.key) === providerId) return product;
  }
  return undefined;
}

export function productByKey(key: string): ProductInfo | undefined {
  return PRODUCTS.find((p) => p.key === key);
}

// Credit economics. 1 credit = $0.05 of provider cost; every action is
// charged ceil(cost / 0.05) with a 1-credit minimum. Margin lives entirely
// in the credit sale price, so no action can ever be sold below cost.

export const CREDIT_UNIT_USD = 0.05;
export const WELCOME_CREDITS = 20;

export type ModelCatalogRow = {
  id: string;
  fal_model_id: string;
  kind: "video_t2v" | "video_i2v" | "video_v2v" | "tts" | "music" | "image" | "upscale";
  tier: "budget" | "standard" | "premium" | "ultra";
  label: string;
  per_unit: "second" | "video" | "chars_1k" | "minute" | "generation" | "megapixel";
  unit_price_usd: number;
  audio_unit_price_usd: number | null;
  native_audio: boolean;
  durations: number[] | null;
  aspect_ratios: string[] | null;
  min_plan: "free" | "starter" | "pro" | "business";
  enabled: boolean;
  sort: number;
};

export function usdToCredits(costUsd: number): number {
  return Math.max(1, Math.ceil(costUsd / CREDIT_UNIT_USD - 1e-9));
}

export type CostInput = {
  model: Pick<ModelCatalogRow, "per_unit" | "unit_price_usd" | "audio_unit_price_usd">;
  durationSeconds?: number;
  withAudio?: boolean;
  characters?: number;
  megapixels?: number;
  minutes?: number;
};

export function computeCostUsd(input: CostInput): number {
  const { model } = input;
  const price =
    input.withAudio && model.audio_unit_price_usd != null
      ? Number(model.audio_unit_price_usd)
      : Number(model.unit_price_usd);

  switch (model.per_unit) {
    case "second":
      return price * (input.durationSeconds ?? 5);
    case "video":
    case "generation":
      return price;
    case "chars_1k":
      return price * Math.max(1, Math.ceil((input.characters ?? 500) / 1000));
    case "minute":
      return price * Math.max(0.5, (input.minutes ?? 0.5));
    case "megapixel":
      return price * Math.max(1, Math.ceil(input.megapixels ?? 1));
  }
}

export function computeCredits(input: CostInput): number {
  return usdToCredits(computeCostUsd(input));
}

const PLAN_ORDER = ["free", "starter", "pro", "business"] as const;
export type PlanTier = (typeof PLAN_ORDER)[number];

export function planAtLeast(userPlan: PlanTier, required: PlanTier): boolean {
  return PLAN_ORDER.indexOf(userPlan) >= PLAN_ORDER.indexOf(required);
}

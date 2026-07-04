import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateWizard } from "@/components/wizard/create-wizard";
import type { ModelCatalogRow, PlanTier } from "@/lib/credits";

export default async function CreatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // catalog via service client: RLS hides disabled rows from users, but the
  // wizard renders those as "coming soon" cards. Only UI-required columns
  // leave the server; provider refs, notes and dark-row pricing stay behind.
  const admin = createAdminClient();
  const [{ data: profile }, { data: balanceRow }, { data: rawModels }] = await Promise.all([
    supabase.from("profiles").select("plan_tier").eq("id", user.id).maybeSingle(),
    supabase.from("credit_balances").select("balance").eq("user_id", user.id).maybeSingle(),
    admin
      .from("model_catalog")
      .select(
        "id, kind, tier, label, per_unit, unit_price_usd, audio_unit_price_usd, native_audio, durations, aspect_ratios, min_plan, enabled, sort",
      )
      .order("sort", { ascending: true }),
  ]);

  const models: ModelCatalogRow[] = (rawModels ?? []).map((m) => ({
    ...(m as Omit<ModelCatalogRow, "fal_model_id">),
    fal_model_id: "",
    unit_price_usd: m.enabled ? m.unit_price_usd : 0,
    audio_unit_price_usd: m.enabled ? m.audio_unit_price_usd : null,
    durations: m.enabled ? m.durations : null,
  }));

  return (
    <CreateWizard
      models={models}
      balance={balanceRow?.balance ?? 0}
      planTier={(profile?.plan_tier ?? "free") as PlanTier}
      locale={locale as Locale}
    />
  );
}

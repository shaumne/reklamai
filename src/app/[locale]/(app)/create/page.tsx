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
  // wizard renders those as "coming soon" cards
  const admin = createAdminClient();
  const [{ data: profile }, { data: balanceRow }, { data: models }] = await Promise.all([
    supabase.from("profiles").select("plan_tier").eq("id", user.id).maybeSingle(),
    supabase.from("credit_balances").select("balance").eq("user_id", user.id).maybeSingle(),
    admin
      .from("model_catalog")
      .select("*")
      .order("sort", { ascending: true }),
  ]);

  return (
    <CreateWizard
      models={(models ?? []) as ModelCatalogRow[]}
      balance={balanceRow?.balance ?? 0}
      planTier={(profile?.plan_tier ?? "free") as PlanTier}
      locale={locale as Locale}
    />
  );
}

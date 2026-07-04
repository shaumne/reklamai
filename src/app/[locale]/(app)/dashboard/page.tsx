import { Film } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GenerationCard, type GenerationRow } from "@/components/app/generation-card";
import { LiveRefresh } from "@/components/app/live-refresh";
import { cn } from "@/lib/utils";

const VIDEO_KINDS = ["video_t2v", "video_i2v", "video_v2v"];

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: balanceRow }, { data: generations }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("credit_balances").select("balance").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("generations")
      .select(
        "id, kind, model_id, prompt, params, category, platform, credit_cost, status, output_asset_id, output_url, error, created_at, completed_at",
      )
      .eq("user_id", user.id)
      .in("kind", VIDEO_KINDS)
      .order("created_at", { ascending: false })
      .limit(9),
  ]);

  const rows = (generations ?? []) as GenerationRow[];
  const balance = balanceRow?.balance ?? 0;
  const displayName = profile?.display_name || user.email?.split("@")[0] || "";
  const activeIds = rows
    .filter((row) => row.status === "queued" || row.status === "processing")
    .map((row) => row.id);

  return (
    <div className="flex animate-rise flex-col gap-8">
      <div>
        <h1 className="text-3xl text-ink-900">{t("title")}</h1>
        <p className="mt-1 text-ink-500">{t("welcome", { name: displayName })}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6">
          <p className="text-sm font-medium text-ink-500">{t("balance")}</p>
          <p className="mt-2 font-display text-4xl text-ink-900">{balance}</p>
          <Link
            href="/billing"
            className="mt-4 inline-block text-sm font-semibold text-flame-600 transition-colors duration-150 hover:text-flame-700"
          >
            {t("buyCredits")}
          </Link>
        </Card>

        <div className="dark-surface flex flex-col justify-between rounded-2xl p-6 shadow-(--shadow-lift-lg)">
          <div className="relative z-10">
            <p className="font-display text-xl">{t("newVideo")}</p>
          </div>
          <div className="relative z-10 mt-6">
            <Link
              href="/create"
              className={cn(buttonVariants({ variant: "primary", size: "lg" }), "w-full sm:w-auto")}
            >
              {t("newVideo")}
            </Link>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-xl text-ink-900">{t("recentTitle")}</h2>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-200 py-16 text-center">
            <Film className="size-8 text-ink-300" />
            <p className="text-ink-500">{t("empty")}</p>
            <Link href="/create" className={buttonVariants({ variant: "primary" })}>
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((generation) => (
              <GenerationCard key={generation.id} generation={generation} locale={locale} />
            ))}
          </div>
        )}
      </div>

      {activeIds.length > 0 && <LiveRefresh ids={activeIds} active />}
    </div>
  );
}

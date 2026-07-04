import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LiveRefresh } from "@/components/app/live-refresh";
import type { GenerationRow } from "@/components/app/generation-card";

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("videos");
  const tCommon = await getTranslations("common");
  const tCreate = await getTranslations("create");
  const tCategories = await getTranslations("categories");
  const tPlatforms = await getTranslations("platforms");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: generation } = await supabase
    .from("generations")
    .select(
      "id, kind, model_id, prompt, params, category, platform, credit_cost, status, output_asset_id, output_url, error, created_at, completed_at",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!generation) notFound();

  const row = generation as GenerationRow;

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_tier")
    .eq("id", user.id)
    .maybeSingle();
  const isFree = (profile?.plan_tier ?? "free") === "free";

  let signedUrl: string | null = null;
  if (row.status === "completed") {
    if (row.output_asset_id) {
      const { data: asset } = await supabase
        .from("assets")
        .select("bucket, storage_path")
        .eq("id", row.output_asset_id)
        .maybeSingle();
      if (asset) {
        const { data: signed } = await supabase.storage
          .from(asset.bucket)
          .createSignedUrl(asset.storage_path, 3600);
        signedUrl = signed?.signedUrl ?? null;
      }
    }
    if (!signedUrl) signedUrl = row.output_url;
  }

  const createdLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(row.created_at));

  return (
    <div className="flex animate-rise flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl text-ink-900">{t("detailTitle")}</h1>
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-ink-500 transition-colors duration-150 hover:text-flame-700"
        >
          {t("backToDashboard")}
        </Link>
      </div>

      {row.status === "completed" && (
        <div className="relative overflow-hidden rounded-2xl">
          <video controls className="w-full rounded-2xl bg-ink-900" src={signedUrl ?? undefined} />
          {isFree && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="rotate-[-18deg] font-display text-4xl text-white/40">ReklamAI</span>
            </div>
          )}
        </div>
      )}

      {(row.status === "queued" || row.status === "processing") && (
        <>
          <div className="flex aspect-video animate-pulse-soft flex-col items-center justify-center gap-3 rounded-2xl bg-ink-100">
            <Spinner className="size-6" />
            <p className="text-sm text-ink-500">{t("processingHint")}</p>
          </div>
          <LiveRefresh ids={[row.id]} active />
        </>
      )}

      {row.status === "failed" && (
        <div className="rounded-2xl border border-danger-100 bg-danger-100/60 p-6">
          <p className="font-medium text-danger-700">{t("failedHint")}</p>
          {row.error && <p className="mt-2 text-sm text-danger-500">{row.error}</p>}
        </div>
      )}

      {row.status === "completed" &&
        (isFree ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-gold-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-700">{t("watermarkNotice")}</p>
            <div className="flex shrink-0 items-center gap-3">
              <Button variant="outline" disabled>
                {t("downloadLocked")}
              </Button>
              <Link href="/billing" className={buttonVariants({ variant: "primary" })}>
                {tCommon("upgrade")}
              </Link>
            </div>
          </div>
        ) : (
          signedUrl && (
            <a href={signedUrl} download className={buttonVariants({ variant: "primary" })}>
              {t("download")}
            </a>
          )
        ))}

      <div className="grid gap-5 rounded-2xl border border-ink-100 bg-white p-6 shadow-(--shadow-lift) sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
            {t("modelLabel")}
          </p>
          <p className="mt-1 text-sm text-ink-900">{row.model_id}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
            {t("costLabel")}
          </p>
          <p className="mt-1 text-sm text-ink-900">{row.credit_cost}</p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
            {t("createdLabel")}
          </p>
          <p className="mt-1 text-sm text-ink-900">{createdLabel}</p>
        </div>
        {row.platform && (
          <div>
            <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              {tCreate("platformTitle")}
            </p>
            <p className="mt-1 text-sm text-ink-900">{tPlatforms(row.platform)}</p>
          </div>
        )}
        {row.category && (
          <div>
            <p className="text-xs font-medium tracking-wide text-ink-400 uppercase">
              {tCreate("categoryTitle")}
            </p>
            <p className="mt-1 text-sm text-ink-900">{tCategories(row.category)}</p>
          </div>
        )}
      </div>

      {row.prompt && (
        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">{t("promptLabel")}</p>
          <pre className="rounded-xl bg-ink-50 p-4 font-sans text-sm whitespace-pre-wrap text-ink-700">
            {row.prompt}
          </pre>
        </div>
      )}
    </div>
  );
}

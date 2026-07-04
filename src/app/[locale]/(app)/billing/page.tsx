import type { Metadata } from "next";
import { Sparkles, Users, Monitor, RotateCcw, Calendar } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { paymentsEnabled } from "@/lib/payments";
import { PLANS, CREDIT_PACKS } from "@/lib/billing/plans";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SubscribeButton } from "@/components/billing/subscribe-button";
import { PortalButton } from "@/components/billing/portal-button";
import { cn } from "@/lib/utils";

type PageProps = { params: Promise<{ locale: string }> };

type SubscriptionRow = {
  plan_tier: "starter" | "pro" | "business";
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

type TransactionRow = {
  id: string;
  amount: number;
  type: string;
  created_at: string;
};

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "billing" });
  return { title: t("title") };
}

export default async function BillingPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("billing");
  const tLanding = await getTranslations("landing");
  const tCommon = await getTranslations("common");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const [{ data: profile }, { data: balanceRow }, { data: activeSub }, { data: txns }] =
    await Promise.all([
      supabase.from("profiles").select("plan_tier").eq("id", user.id).single(),
      supabase.from("credit_balances").select("balance").eq("user_id", user.id).single(),
      supabase
        .from("subscriptions")
        .select("plan_tier, status, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("credit_transactions")
        .select("id, amount, type, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const subscription = activeSub as SubscriptionRow | null;
  const transactions = (txns ?? []) as TransactionRow[];
  const balance = balanceRow?.balance ?? 0;
  const currentTier = subscription?.plan_tier ?? (profile?.plan_tier as string | undefined) ?? "free";
  const hasActiveSub = Boolean(subscription);
  const enabled = paymentsEnabled();

  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const paidPlans = PLANS.filter(
    (plan): plan is (typeof PLANS)[number] & { tier: "starter" | "pro" | "business" } =>
      plan.tier !== "free",
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">{t("title")}</h1>

      <Card className="mt-8 animate-rise p-6 sm:p-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-ink-500">{t("currentPlan")}</p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink-900">
              {currentTier === "free" ? t("freePlan") : capitalize(currentTier)}
            </p>
            {subscription?.current_period_end ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink-500">
                <Calendar className="size-4" />
                {dateFormatter.format(new Date(subscription.current_period_end))}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm font-medium text-ink-500">{tCommon("credits")}</p>
              <p className="font-display text-3xl font-semibold tabular-nums text-flame-600">
                {balance.toLocaleString(locale)}
              </p>
            </div>
            {hasActiveSub ? <PortalButton disabled={!enabled} /> : null}
          </div>
        </div>
      </Card>

      {!enabled ? (
        <div className="mt-6 flex animate-rise items-start gap-3 rounded-2xl bg-gold-100 p-4 text-ink-800">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-gold-500" />
          <p className="text-sm">{t("paymentsSoon")}</p>
        </div>
      ) : null}

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink-900">{t("plansTitle")}</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {paidPlans.map((plan) => {
            const isCurrent = plan.tier === currentTier;
            return (
              <Card
                key={plan.tier}
                className={cn(
                  "flex animate-rise flex-col p-6",
                  plan.highlight && "border-flame-300 shadow-(--shadow-lift-lg)",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-ink-900">
                    {tLanding(`plan${capitalize(plan.tier)}Name`)}
                  </h3>
                  {plan.highlight ? <Badge tone="flame">{tLanding("popular")}</Badge> : null}
                </div>
                <p className="mt-1 text-sm text-ink-500">
                  {tLanding(`plan${capitalize(plan.tier)}Desc`)}
                </p>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className="font-display text-3xl font-semibold text-ink-900">
                    ${plan.priceUsdMonth}
                  </span>
                  <span className="text-sm text-ink-500">{tLanding("perMonth")}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-flame-700">
                  {plan.creditsMonth.toLocaleString(locale)} {tCommon("credits")}
                </p>

                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink-600">
                  <li className="inline-flex items-center gap-1.5">
                    <Users className="size-4 text-ink-400" />
                    {plan.seats}
                  </li>
                  <li className="inline-flex items-center gap-1.5">
                    <Monitor className="size-4 text-ink-400" />
                    {plan.maxResolution}
                  </li>
                  {plan.rolloverMonths > 0 ? (
                    <li className="inline-flex items-center gap-1.5">
                      <RotateCcw className="size-4 text-ink-400" />
                      {plan.rolloverMonths}mo
                    </li>
                  ) : null}
                </ul>

                <div className="mt-6">
                  {isCurrent ? (
                    <Badge tone="success">{t("currentPlan")}</Badge>
                  ) : (
                    <SubscribeButton productKey={plan.tier} disabled={!enabled}>
                      {t("subscribe")}
                    </SubscribeButton>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink-900">{t("packsTitle")}</h2>
        <p className="mt-1 text-sm text-ink-500">{t("packsNote")}</p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <Card key={pack.id} className="flex animate-rise flex-col p-6">
              <p className="font-display text-2xl font-semibold text-ink-900">
                {pack.credits.toLocaleString(locale)} {tCommon("credits")}
              </p>
              <p className="mt-1 text-sm font-medium text-ink-500">${pack.priceUsd}</p>
              <div className="mt-6">
                <SubscribeButton
                  productKey={`pack-${pack.id}`}
                  disabled={!enabled || !hasActiveSub}
                >
                  {t("buy")}
                </SubscribeButton>
                {!hasActiveSub ? (
                  <p className="mt-1.5 text-xs text-ink-500">{t("subscriptionRequired")}</p>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold text-ink-900">{t("historyTitle")}</h2>
        <Card className="mt-5 animate-rise overflow-hidden">
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <p className="px-6 py-6 text-sm text-ink-500">{t("historyEmpty")}</p>
            ) : (
              <div>
                <div className="hidden items-center justify-between gap-4 border-b border-ink-100 px-6 py-2.5 text-xs font-semibold tracking-wide text-ink-400 uppercase sm:flex">
                  <span>
                    {t("date")} · {t("description")}
                  </span>
                  <span>{t("amount")}</span>
                </div>
                <div className="divide-y divide-ink-100">
                  {transactions.map((txn) => (
                    <div key={txn.id} className="flex items-center gap-4 px-6 py-3.5">
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-4">
                        <span className="w-28 shrink-0 text-xs tabular-nums text-ink-500">
                          {dateFormatter.format(new Date(txn.created_at))}
                        </span>
                        <span className="truncate text-sm font-medium text-ink-800">
                          {t(`txn_${txn.type}`)}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 font-mono text-sm font-semibold tabular-nums",
                          txn.amount >= 0 ? "text-moss-700" : "text-ink-600",
                        )}
                      >
                        {txn.amount >= 0 ? `+${txn.amount}` : txn.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

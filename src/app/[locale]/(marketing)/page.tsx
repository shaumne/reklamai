import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Check,
  ChevronDown,
  Clapperboard,
  Coins,
  MonitorSmartphone,
  Mic2,
  Palette,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ locale: string }>;
};

const tintClasses = {
  flame: "bg-flame-100 text-flame-700",
  gold: "bg-gold-100 text-gold-500",
  moss: "bg-moss-100 text-moss-700",
} as const;

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tNav = await getTranslations("nav");

  const steps = [
    { title: t("how1Title"), desc: t("how1Desc") },
    { title: t("how2Title"), desc: t("how2Desc") },
    { title: t("how3Title"), desc: t("how3Desc") },
  ];

  const features = [
    { title: t("feature1Title"), desc: t("feature1Desc"), icon: Palette, tint: "flame" as const },
    {
      title: t("feature2Title"),
      desc: t("feature2Desc"),
      icon: Clapperboard,
      tint: "gold" as const,
    },
    { title: t("feature3Title"), desc: t("feature3Desc"), icon: Mic2, tint: "moss" as const },
    {
      title: t("feature4Title"),
      desc: t("feature4Desc"),
      icon: MonitorSmartphone,
      tint: "flame" as const,
    },
    { title: t("feature5Title"), desc: t("feature5Desc"), icon: Sparkles, tint: "gold" as const },
    { title: t("feature6Title"), desc: t("feature6Desc"), icon: Coins, tint: "moss" as const },
  ];

  const plans = [
    {
      name: t("planFreeName"),
      desc: t("planFreeDesc"),
      price: "$0",
      credits: t("planFreeCredits"),
      features: [t("planFree1"), t("planFree2"), t("planFree3")],
      highlight: false,
    },
    {
      name: t("planStarterName"),
      desc: t("planStarterDesc"),
      price: "$29",
      credits: t("planStarterCredits"),
      features: [
        t("planStarter1"),
        t("planStarter2"),
        t("planStarter3"),
        t("planStarter4"),
        t("planStarter5"),
      ],
      highlight: true,
    },
    {
      name: t("planProName"),
      desc: t("planProDesc"),
      price: "$79",
      credits: t("planProCredits"),
      features: [t("planPro1"), t("planPro2"), t("planPro3"), t("planPro4"), t("planPro5")],
      highlight: false,
    },
    {
      name: t("planBusinessName"),
      desc: t("planBusinessDesc"),
      price: "$149",
      credits: t("planBusinessCredits"),
      features: [t("planBusiness1"), t("planBusiness2"), t("planBusiness3"), t("planBusiness4")],
      highlight: false,
    },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
  ];

  return (
    <>
      <section className="hero-surface overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-20 pb-20 sm:px-6 sm:pt-28">
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <Badge tone="flame" className="animate-rise">
              {t("badge")}
            </Badge>
            <h1 className="animate-rise mt-6 text-5xl font-bold text-ink-900 md:text-7xl">
              {t("heroTitle")}
            </h1>
            <p className="animate-rise mx-auto mt-6 max-w-2xl text-lg text-ink-600">
              {t("heroSubtitle")}
            </p>
            <div className="animate-rise mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/register" className={buttonVariants({ variant: "primary", size: "lg" })}>
                {t("heroCta")}
              </Link>
              <Link href="/#pricing" className={buttonVariants({ variant: "outline", size: "lg" })}>
                {t("heroSecondary")}
              </Link>
            </div>
            <p className="animate-rise mt-4 text-sm text-ink-400">{t("heroNote")}</p>
          </div>

          <div className="animate-rise relative z-10 mx-auto mt-16 max-w-4xl">
            <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-(--shadow-lift-lg)">
              <div className="flex items-center gap-1.5 border-b border-ink-100 bg-ink-50 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-flame-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-gold-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-moss-500/70" />
              </div>
              <div className="p-4 sm:p-6">
                <div className="relative aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-flame-500 via-flame-400 to-gold-400">
                  <video
                    className="absolute inset-0 h-full w-full object-cover"
                    src="/hero.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                </div>
                <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-flame-500 to-gold-400" />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span className="rounded-full border border-ink-200 px-3 py-1 text-xs font-medium text-ink-600">
                    16:9
                  </span>
                  <span className="rounded-full border border-ink-200 px-3 py-1 text-xs font-medium text-ink-600">
                    9:16
                  </span>
                  <span className="rounded-full border border-ink-200 px-3 py-1 text-xs font-medium text-ink-600">
                    1:1
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-ink-900 md:text-4xl">
          {t("howTitle")}
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="rounded-2xl border border-ink-100 bg-white p-6 shadow-(--shadow-lift)"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-flame-100 text-sm font-bold text-flame-700">
                {index + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-2 text-sm text-ink-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="scroll-mt-24 bg-white/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold text-ink-900 md:text-4xl">
            {t("featuresTitle")}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-ink-100 bg-white p-6 shadow-(--shadow-lift) transition-transform duration-200 hover:-translate-y-1"
                >
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-2xl",
                      tintClasses[feature.tint],
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-ink-900">{feature.title}</h3>
                  <p className="mt-2 text-sm text-ink-600">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-ink-900 md:text-4xl">{t("pricingTitle")}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-ink-600">{t("pricingSubtitle")}</p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white p-6 shadow-(--shadow-lift)",
                plan.highlight ? "border-flame-300 ring-2 ring-flame-400" : "border-ink-100",
              )}
            >
              {plan.highlight && (
                <Badge tone="flame" className="absolute -top-3 left-6">
                  {t("popular")}
                </Badge>
              )}
              <h3 className="text-lg font-semibold text-ink-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-ink-500">{plan.desc}</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-ink-900">{plan.price}</span>
                <span className="text-sm text-ink-400">{t("perMonth")}</span>
              </p>
              <p className="mt-3 text-sm font-semibold text-flame-600">{plan.credits}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-ink-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-moss-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: plan.highlight ? "primary" : "outline", size: "md" }),
                  "mt-8 w-full",
                )}
              >
                {tNav("register")}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-ink-100 bg-white p-8 text-center shadow-(--shadow-lift)">
          <h3 className="text-lg font-semibold text-ink-900">{t("creditExamplesTitle")}</h3>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full bg-flame-50 px-4 py-2 text-sm text-ink-700">
              {t("creditExample1")}
            </span>
            <span className="rounded-full bg-gold-100 px-4 py-2 text-sm text-ink-700">
              {t("creditExample2")}
            </span>
            <span className="rounded-full bg-moss-100 px-4 py-2 text-sm text-ink-700">
              {t("creditExample3")}
            </span>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-20 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-ink-900 md:text-4xl">
          {t("faqTitle")}
        </h2>
        <div className="mt-10 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-ink-100 bg-white p-5 shadow-(--shadow-lift)"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
                {faq.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-ink-400 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-ink-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <div className="dark-surface rounded-3xl px-8 py-16 text-center sm:px-16">
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-ink-50 md:text-4xl">{t("ctaTitle")}</h2>
            <p className="mx-auto mt-4 max-w-xl text-ink-300">{t("ctaSubtitle")}</p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/register"
                className={buttonVariants({ variant: "primary", size: "lg" })}
              >
                {tNav("register")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

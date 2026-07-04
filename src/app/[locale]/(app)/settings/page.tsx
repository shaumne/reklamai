import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { SettingsForm } from "@/components/app/settings-form";
import { SignOutButton } from "@/components/app/sign-out-button";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("settings");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <div className="flex animate-rise flex-col gap-8">
      <h1 className="text-3xl text-ink-900">{t("title")}</h1>

      <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-(--shadow-lift)">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">{t("profileTitle")}</h2>
        <SettingsForm initialDisplayName={profile?.display_name ?? ""} userId={user?.id ?? ""} />
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-(--shadow-lift)">
        <h2 className="mb-4 text-lg font-semibold text-ink-900">{t("languageTitle")}</h2>
        <div className="flex gap-3">
          <Link
            href="/settings"
            locale="tr"
            className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition-colors duration-150 hover:border-flame-300 hover:text-flame-700 aria-[current=page]:border-flame-500 aria-[current=page]:bg-flame-100 aria-[current=page]:text-flame-700 aria-[current=page]:ring-2 aria-[current=page]:ring-flame-200"
          >
            Türkçe
          </Link>
          <Link
            href="/settings"
            locale="en"
            className="rounded-full border border-ink-200 px-4 py-2 text-sm font-medium text-ink-600 transition-colors duration-150 hover:border-flame-300 hover:text-flame-700 aria-[current=page]:border-flame-500 aria-[current=page]:bg-flame-100 aria-[current=page]:text-flame-700 aria-[current=page]:ring-2 aria-[current=page]:ring-flame-200"
          >
            English
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-ink-100 bg-white p-6 shadow-(--shadow-lift)">
        <h2 className="mb-2 text-lg font-semibold text-ink-900">{t("accountTitle")}</h2>
        <p className="mb-4 text-sm text-ink-500">{t("signOutDesc")}</p>
        <SignOutButton className="w-auto" />
      </section>
    </div>
  );
}

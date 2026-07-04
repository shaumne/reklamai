import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CardHeader, CardContent } from "@/components/ui/card";
import { ForgotForm } from "@/components/auth/forgot-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("resetTitle") };
}

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <>
      <CardHeader className="text-center">
        <h1 className="text-2xl font-semibold text-ink-900">{t("resetTitle")}</h1>
        <p className="mt-1.5 text-sm text-ink-500">{t("resetSubtitle")}</p>
      </CardHeader>
      <CardContent>
        <ForgotForm />
      </CardContent>
    </>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CardHeader, CardContent } from "@/components/ui/card";
import { ResetForm } from "@/components/auth/reset-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("newPasswordTitle") };
}

export default async function ResetPasswordPage({
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
        <h1 className="text-2xl font-semibold text-ink-900">{t("newPasswordTitle")}</h1>
      </CardHeader>
      <CardContent>
        <ResetForm />
      </CardContent>
    </>
  );
}

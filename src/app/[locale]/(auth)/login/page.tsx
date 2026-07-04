import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CardHeader, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("loginTitle") };
}

export default async function LoginPage({
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
        <h1 className="text-2xl font-semibold text-ink-900">{t("loginTitle")}</h1>
        <p className="mt-1.5 text-sm text-ink-500">{t("loginSubtitle")}</p>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </>
  );
}

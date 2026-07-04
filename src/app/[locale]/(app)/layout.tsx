import type { ReactNode } from "react";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/app/sidebar";
import { CreditBadge } from "@/components/app/credit-badge";

export default async function AppLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect({ href: "/login", locale: locale as Locale });

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar />
      <main className="flex-1 px-6 py-8 pb-24 md:pb-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="flex items-center justify-end">
            <CreditBadge />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

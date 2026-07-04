"use client";

import { Flame, LayoutDashboard, Clapperboard, CreditCard, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/app/sign-out-button";

const NAV_ITEMS = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/create", key: "create", icon: Clapperboard },
  { href: "/billing", key: "billing", icon: CreditCard },
  { href: "/settings", key: "settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col justify-between border-r border-ink-100 bg-white/70 px-4 py-6 md:flex">
        <div>
          <Link
            href="/dashboard"
            className="mb-8 flex items-center gap-2 px-2 text-lg font-semibold tracking-tight text-ink-900"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-flame-500 text-white shadow-(--shadow-lift)">
              <Flame className="size-4" strokeWidth={2.5} />
            </span>
            <span className="font-display">
              Reklam<span className="text-flame-500">AI</span>
            </span>
          </Link>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, key, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600",
                  "transition-colors duration-150 hover:bg-ink-100 hover:text-ink-900",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
                  isActive(pathname, href) && "bg-flame-100 text-flame-700",
                )}
              >
                <Icon className="size-4" />
                {t(key)}
              </Link>
            ))}
          </nav>
        </div>

        <SignOutButton />
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-around border-t border-ink-100 bg-white/95 px-2 py-2 backdrop-blur md:hidden">
        {NAV_ITEMS.map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-ink-500",
              "transition-colors duration-150 hover:text-flame-700",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
              isActive(pathname, href) && "bg-flame-100 text-flame-700",
            )}
          >
            <Icon className="size-5" />
            {t(key)}
          </Link>
        ))}
      </nav>
    </>
  );
}

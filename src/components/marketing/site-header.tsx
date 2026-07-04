"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/#how", key: "howItWorks" },
  { href: "/#features", key: "features" },
  { href: "/#pricing", key: "pricing" },
  { href: "/#faq", key: "faq" },
] as const;

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink-100 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="font-display text-xl font-bold tracking-tight text-ink-900"
        >
          Reklamlar<span className="text-flame-500">AI</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink-600 transition-colors duration-150 hover:text-flame-600"
            >
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-0.5 rounded-full border border-ink-200 p-0.5 text-xs font-semibold text-ink-500">
            <Link
              href={pathname}
              locale="tr"
              className="rounded-full px-2.5 py-1 transition-colors duration-150 hover:text-flame-600 aria-[current=page]:bg-ink-900 aria-[current=page]:text-white"
            >
              TR
            </Link>
            <Link
              href={pathname}
              locale="en"
              className="rounded-full px-2.5 py-1 transition-colors duration-150 hover:text-flame-600 aria-[current=page]:bg-ink-900 aria-[current=page]:text-white"
            >
              EN
            </Link>
          </div>
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            {t("login")}
          </Link>
          <Link href="/register" className={buttonVariants({ variant: "primary", size: "sm" })}>
            {t("register")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition-colors duration-150 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500 md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="animate-rise border-t border-ink-100 bg-paper px-4 pb-6 pt-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700",
                  "transition-colors duration-150 hover:bg-ink-100 hover:text-flame-600",
                )}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>

          <div className="mt-4 flex items-center gap-2 border-t border-ink-100 pt-4">
            <Link
              href={pathname}
              locale="tr"
              onClick={() => setOpen(false)}
              className="rounded-full border border-ink-200 px-3 py-1 text-xs font-semibold text-ink-600 transition-colors duration-150 hover:border-flame-300 hover:text-flame-600"
            >
              TR
            </Link>
            <Link
              href={pathname}
              locale="en"
              onClick={() => setOpen(false)}
              className="rounded-full border border-ink-200 px-3 py-1 text-xs font-semibold text-ink-600 transition-colors duration-150 hover:border-flame-300 hover:text-flame-600"
            >
              EN
            </Link>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "ghost", size: "md" }), "w-full")}
            >
              {t("login")}
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: "primary", size: "md" }), "w-full")}
            >
              {t("register")}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

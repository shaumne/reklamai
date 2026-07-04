import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("landing");
  const tNav = await getTranslations("nav");

  const productLinks = [
    { href: "/#how", label: tNav("howItWorks") },
    { href: "/#features", label: tNav("features") },
    { href: "/#pricing", label: tNav("pricing") },
    { href: "/#faq", label: tNav("faq") },
  ];

  return (
    <footer className="dark-surface mt-24">
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 sm:grid-cols-3">
          <div>
            <Link href="/" className="font-display text-xl font-bold tracking-tight text-ink-50">
              Reklamlar<span className="text-flame-400">AI</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-ink-300">{t("footerTagline")}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide text-ink-200 uppercase">
              {t("footerProduct")}
            </h3>
            <ul className="mt-4 space-y-3">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-300 transition-colors duration-150 hover:text-flame-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wide text-ink-200 uppercase">
              {t("footerLegal")}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-ink-300 transition-colors duration-150 hover:text-flame-300"
                >
                  {t("footerTerms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-ink-300 transition-colors duration-150 hover:text-flame-300"
                >
                  {t("footerPrivacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-sm text-ink-400">
          © 2026 ReklamlarAI. {t("footerRights")}
        </div>
      </div>
    </footer>
  );
}

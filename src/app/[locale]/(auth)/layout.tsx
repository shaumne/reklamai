import type { ReactNode } from "react";
import { Flame } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="hero-surface flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link
        href="/"
        className="animate-rise mb-8 inline-flex items-center gap-2 text-xl font-semibold text-ink-900 transition-transform duration-200 hover:-translate-y-0.5"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-flame-500 text-white shadow-(--shadow-lift)">
          <Flame className="size-5" strokeWidth={2.5} />
        </span>
        <span className="font-display tracking-tight">
          Reklamlar<span className="text-flame-500">AI</span>
        </span>
      </Link>
      <Card className="animate-rise w-full max-w-md shadow-(--shadow-lift-lg)">{children}</Card>
    </div>
  );
}

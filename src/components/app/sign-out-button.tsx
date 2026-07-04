"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  const t = useTranslations("common");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch {
      // best-effort: still navigate away even if the network call fails
    }
    router.push("/");
    router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleSignOut}
      disabled={loading}
      className={cn("w-full justify-start", className)}
    >
      <LogOut className="size-4" />
      {t("signOut")}
    </Button>
  );
}

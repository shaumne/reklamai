"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function ResetForm() {
  const t = useTranslations("auth");
  const tDashboard = useTranslations("dashboard");

  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(false);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(true);
      setPending(false);
      return;
    }

    setDone(true);
    setPending(false);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-moss-100 p-4 text-sm text-moss-700" role="status">
          {t("passwordUpdated")}
        </div>
        <Link href="/dashboard" className={cn(buttonVariants({ size: "lg" }), "w-full")}>
          {tDashboard("title")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-danger-100 p-3 text-sm text-danger-700" role="alert">
          {t("genericError")}
        </div>
      )}

      <div>
        <Label htmlFor="newPassword">{t("newPassword")}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Spinner className="border-white/40 border-t-white" /> : t("updatePassword")}
      </Button>
    </form>
  );
}

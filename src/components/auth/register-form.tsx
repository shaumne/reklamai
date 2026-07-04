"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { registerUser } from "@/lib/actions/register";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { GoogleButton } from "./google-button";

export function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await registerUser({
      name,
      email,
      password,
      locale: locale === "en" || locale === "ja" ? locale : "tr",
    });

    if (!result.ok) {
      setError(
        result.error === "EMAIL_DOMAIN"
          ? t("errEmailDomain")
          : result.error === "EMAIL_TAKEN"
            ? t("errEmailTaken")
            : t("genericError"),
      );
      setPending(false);
      return;
    }

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      setError(t("genericError"));
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <>
      <GoogleButton />
      <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-danger-100 p-3 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      <div>
        <Label htmlFor="name">{t("name")}</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="mt-1.5 text-xs text-ink-400">{t("passwordHint")}</p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Spinner className="border-white/40 border-t-white" /> : t("register")}
      </Button>

      <p className="text-center text-sm text-ink-500">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-medium text-flame-600 hover:text-flame-700">
          {t("login")}
        </Link>
      </p>
    </form>
    </>
  );
}

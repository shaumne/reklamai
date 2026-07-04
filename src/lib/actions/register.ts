"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDisposableEmail } from "@/lib/auth/disposable-domains";
import { maybeGrantWelcome } from "@/lib/auth/welcome";

const registerSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  locale: z.enum(["tr", "en"]),
});

type RegisterResult = { ok: true } | { ok: false; error: string };

export async function registerUser(raw: {
  name: string;
  email: string;
  password: string;
  locale: string;
}): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const input = parsed.data;

  if (isDisposableEmail(input.email)) {
    return { ok: false, error: "EMAIL_DOMAIN" };
  }

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { display_name: input.name, locale: input.locale },
  });

  if (error || !created.user) {
    const msg = error?.message ?? "";
    return {
      ok: false,
      error: msg.includes("already") ? "EMAIL_TAKEN" : "SIGNUP_FAILED",
    };
  }

  await maybeGrantWelcome(created.user.id);
  return { ok: true };
}

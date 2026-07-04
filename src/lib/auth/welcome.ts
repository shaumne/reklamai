import { createHmac } from "crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { WELCOME_CREDITS } from "@/lib/credits";

export async function clientIpHash(): Promise<string> {
  const h = await headers();
  // platform-set headers only — x-forwarded-for's leftmost entry can be
  // forged by the client, so it is deliberately last and taken from the right
  const forwarded = h.get("x-forwarded-for")?.split(",").map((s) => s.trim());
  const ip =
    h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    forwarded?.[forwarded.length - 1] ||
    "unknown";
  return createHmac("sha256", process.env.CRON_SECRET ?? "reklamlarai")
    .update(ip)
    .digest("hex");
}

// Atomically records the signup and grants welcome credits unless this IP
// already spawned too many accounts in the window. Idempotent per user.
export async function maybeGrantWelcome(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const ipHash = await clientIpHash();

  const { data: allowed, error } = await admin.rpc("register_signup_guard", {
    p_ip_hash: ipHash,
    p_user_id: userId,
  });

  if (error || allowed !== true) {
    return false; // account exists, but no trial credits
  }

  await admin.rpc("grant_credits", {
    p_user_id: userId,
    p_amount: WELCOME_CREDITS,
    p_type: "grant_welcome",
    p_reference_type: "signup",
    p_reference_id: userId,
    p_idempotency_key: `signup:${userId}`,
  });
  return true;
}

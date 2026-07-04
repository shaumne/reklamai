import { createHmac } from "crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { WELCOME_CREDITS } from "@/lib/credits";

const WINDOW_HOURS = 24;
const MAX_GRANTS_PER_IP = 2;

export async function clientIpHash(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return createHmac("sha256", process.env.CRON_SECRET ?? "reklamlarai")
    .update(ip)
    .digest("hex");
}

// Grants welcome credits unless this IP already spawned too many accounts
// in the window. Always records the signup; idempotent per user.
export async function maybeGrantWelcome(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const ipHash = await clientIpHash();

  const since = new Date(Date.now() - WINDOW_HOURS * 3600 * 1000).toISOString();
  const { count } = await admin
    .from("signup_guard")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  await admin.from("signup_guard").insert({ ip_hash: ipHash, user_id: userId });

  if ((count ?? 0) >= MAX_GRANTS_PER_IP) {
    return false; // account exists, but no trial credits for this farm
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

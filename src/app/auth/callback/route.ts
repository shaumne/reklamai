import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { maybeGrantWelcome } from "@/lib/auth/welcome";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // only allow same-origin relative paths; anything else falls back to /dashboard
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\")
      ? rawNext
      : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // first OAuth sign-in: run the welcome-credit guard once per user
      const userId = data.session?.user.id;
      if (userId) {
        const admin = createAdminClient();
        const { data: existing } = await admin
          .from("credit_transactions")
          .select("id")
          .eq("idempotency_key", `signup:${userId}`)
          .maybeSingle();
        const { count: guardRows } = await admin
          .from("signup_guard")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);
        if (!existing && (guardRows ?? 0) === 0) {
          await maybeGrantWelcome(userId);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}

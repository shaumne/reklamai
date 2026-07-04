import { Coins } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export async function CreditBadge() {
  const t = await getTranslations("common");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let balance = 0;
  if (user) {
    const { data } = await supabase
      .from("credit_balances")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    balance = data?.balance ?? 0;
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3.5 py-1.5 text-sm font-semibold text-ink-50 shadow-(--shadow-lift)">
      <Coins className="size-4 text-gold-300" />
      {balance}
      <span className="font-normal text-ink-300">{t("credits")}</span>
    </span>
  );
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider, paymentsEnabled } from "@/lib/payments";
import { productByKey, type ProductKey } from "@/lib/payments/products";

type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

export async function startCheckout(productKey: ProductKey): Promise<CheckoutResult> {
  if (!paymentsEnabled()) return { ok: false, error: "PAYMENTS_DISABLED" };

  const product = productByKey(productKey);
  if (!product) return { ok: false, error: "INVALID_PRODUCT" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "UNAUTHENTICATED" };

  // credit packs require an active subscription (keeps the premium gate
  // and per-credit pricing rules meaningful)
  if (product.type === "credit_pack") {
    const admin = createAdminClient();
    const { data: active } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .limit(1);
    if (!active || active.length === 0) {
      return { ok: false, error: "SUBSCRIPTION_REQUIRED" };
    }
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  try {
    const url = await getPaymentProvider().createCheckoutUrl({
      userId: user.id,
      email: user.email,
      productKey,
      successUrl: `${base}/billing?status=success`,
    });
    return { ok: true, url };
  } catch {
    return { ok: false, error: "CHECKOUT_FAILED" };
  }
}

export async function openCustomerPortal(): Promise<CheckoutResult> {
  if (!paymentsEnabled()) return { ok: false, error: "PAYMENTS_DISABLED" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "UNAUTHENTICATED" };

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = await getPaymentProvider().customerPortalUrl(user.id, `${base}/billing`);
  if (!url) return { ok: false, error: "PORTAL_UNAVAILABLE" };
  return { ok: true, url };
}

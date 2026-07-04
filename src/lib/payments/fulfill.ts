import { createAdminClient } from "@/lib/supabase/admin";
import { productByProviderId } from "./products";

// Shared fulfillment used by Polar and Stripe webhooks: idempotent order
// recording + credit grant, and subscription state mirroring.

export async function fulfillOrder(args: {
  provider: "polar" | "stripe";
  externalOrderId: string;
  userId: string;
  providerProductId: string;
  billingReason?: string | null;
  amountUsd?: number | null;
}): Promise<{ granted: boolean }> {
  const supabase = createAdminClient();
  const product = productByProviderId(args.providerProductId);
  if (!product) {
    return { granted: false };
  }

  const { error: orderError } = await supabase.from("orders").insert({
    provider: args.provider,
    external_order_id: args.externalOrderId,
    user_id: args.userId,
    type: product.type,
    product_id: args.providerProductId,
    amount_usd: args.amountUsd ?? null,
    credits_granted: product.credits,
    billing_reason: args.billingReason ?? null,
    status: "paid",
  });
  if (orderError) {
    // unique violation → this order was already fulfilled
    return { granted: false };
  }

  const { error: grantError } = await supabase.rpc("grant_credits", {
    p_user_id: args.userId,
    p_amount: product.credits,
    p_type: product.type === "subscription" ? "grant_subscription" : "grant_pack",
    p_reference_type: "order",
    p_reference_id: args.externalOrderId,
    p_idempotency_key: `${args.provider}_order:${args.externalOrderId}`,
    p_metadata: { product_key: product.key },
  });

  return { granted: !grantError };
}

export async function syncSubscription(args: {
  provider: "polar" | "stripe";
  externalSubscriptionId: string;
  externalCustomerId?: string | null;
  userId: string;
  providerProductId?: string | null;
  status: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
}): Promise<void> {
  const supabase = createAdminClient();

  const product = args.providerProductId
    ? productByProviderId(args.providerProductId)
    : undefined;
  const planTier = product?.planTier;

  const normalized = ["active", "trialing", "past_due", "canceled", "revoked"].includes(
    args.status,
  )
    ? args.status
    : args.status === "incomplete_expired" || args.status === "unpaid"
      ? "revoked"
      : "canceled";

  await supabase.from("subscriptions").upsert(
    {
      provider: args.provider,
      external_subscription_id: args.externalSubscriptionId,
      external_customer_id: args.externalCustomerId ?? null,
      user_id: args.userId,
      product_id: args.providerProductId ?? null,
      plan_tier: planTier ?? "starter",
      status: normalized,
      monthly_credit_grant: product?.credits ?? 0,
      current_period_start: args.currentPeriodStart ?? null,
      current_period_end: args.currentPeriodEnd ?? null,
      cancel_at_period_end: args.cancelAtPeriodEnd ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider,external_subscription_id" },
  );

  // entitlement lives on the profile
  if (normalized === "active" || normalized === "trialing" || normalized === "past_due") {
    if (planTier) {
      await supabase.from("profiles").update({ plan_tier: planTier }).eq("id", args.userId);
    }
  } else {
    // no other active subscription → back to free
    const { data: remaining } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", args.userId)
      .in("status", ["active", "trialing", "past_due"])
      .neq("external_subscription_id", args.externalSubscriptionId)
      .limit(1);
    if (!remaining || remaining.length === 0) {
      await supabase.from("profiles").update({ plan_tier: "free" }).eq("id", args.userId);
    }
  }
}

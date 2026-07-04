import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillOrder, syncSubscription } from "@/lib/payments/fulfill";

export const runtime = "nodejs";
export const maxDuration = 60;

// Dormant until PAYMENT_PROVIDER=stripe; mirrors the Polar flow.
export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (process.env.PAYMENT_PROVIDER !== "stripe" || !secretKey || !webhookSecret) {
    return NextResponse.json({ error: "payments disabled" }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature ?? "", webhookSecret);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 403 });
  }

  const supabase = createAdminClient();
  const { error: dedupeError } = await supabase.from("webhook_events").insert({
    provider: "stripe",
    external_event_id: event.id,
    event_type: event.type,
    payload: event.data.object as unknown as Record<string, unknown>,
  });
  if (dedupeError) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id ?? session.metadata?.user_id;
        if (session.mode === "payment" && userId) {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            limit: 1,
          });
          const priceId = lineItems.data[0]?.price?.id;
          if (priceId) {
            await fulfillOrder({
              provider: "stripe",
              externalOrderId: session.id,
              userId,
              providerProductId: priceId,
              billingReason: "purchase",
              amountUsd: session.amount_total != null ? session.amount_total / 100 : null,
            });
          }
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object;
        const subDetails = invoice.parent?.subscription_details;
        const userId = subDetails?.metadata?.user_id ?? invoice.metadata?.user_id;
        const priceId = invoice.lines?.data?.[0]?.pricing?.price_details?.price;
        if (userId && priceId) {
          await fulfillOrder({
            provider: "stripe",
            externalOrderId: invoice.id!,
            userId,
            providerProductId: priceId,
            billingReason: invoice.billing_reason ?? null,
            amountUsd: invoice.amount_paid != null ? invoice.amount_paid / 100 : null,
          });
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        const item = subscription.items.data[0];
        if (userId) {
          await syncSubscription({
            provider: "stripe",
            externalSubscriptionId: subscription.id,
            externalCustomerId:
              typeof subscription.customer === "string"
                ? subscription.customer
                : subscription.customer.id,
            userId,
            providerProductId: item?.price?.id ?? null,
            status: subscription.status === "canceled" ? "canceled" : subscription.status,
            currentPeriodStart: item?.current_period_start
              ? new Date(item.current_period_start * 1000).toISOString()
              : null,
            currentPeriodEnd: item?.current_period_end
              ? new Date(item.current_period_end * 1000).toISOString()
              : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        }
        break;
      }
      default:
        break;
    }

    await supabase
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("provider", "stripe")
      .eq("external_event_id", event.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    await supabase
      .from("webhook_events")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message.slice(0, 500) : "unknown",
      })
      .eq("provider", "stripe")
      .eq("external_event_id", event.id);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}

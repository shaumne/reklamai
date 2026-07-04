import { NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { createAdminClient } from "@/lib/supabase/admin";
import { fulfillOrder, syncSubscription } from "@/lib/payments/fulfill";

export const runtime = "nodejs";
export const maxDuration = 60;

type AnyRecord = Record<string, unknown>;

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function resolveUserId(data: AnyRecord): string | null {
  const metadata = (data.metadata ?? {}) as AnyRecord;
  const customer = (data.customer ?? {}) as AnyRecord;
  return (
    str(metadata.user_id) ??
    str(customer.externalId) ??
    str((customer as AnyRecord).external_id)
  );
}

export async function POST(request: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (process.env.POLAR_ENABLED !== "true" || !secret) {
    return NextResponse.json({ error: "payments disabled" }, { status: 503 });
  }

  const rawBody = await request.text();
  let event: { type: string; data: AnyRecord };
  try {
    event = validateEvent(
      rawBody,
      Object.fromEntries(request.headers.entries()),
      secret,
    ) as { type: string; data: AnyRecord };
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "invalid signature" }, { status: 403 });
    }
    throw err;
  }

  const supabase = createAdminClient();
  const eventId =
    request.headers.get("webhook-id") ?? `${event.type}:${str(event.data.id) ?? rawBody.length}`;

  const { error: dedupeError } = await supabase.from("webhook_events").insert({
    provider: "polar",
    external_event_id: eventId,
    event_type: event.type,
    payload: event.data,
  });
  if (dedupeError) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  const data = event.data;
  const userId = resolveUserId(data);

  try {
    switch (event.type) {
      case "order.paid": {
        const productId =
          str(data.productId) ?? str((data.product as AnyRecord | undefined)?.id);
        if (userId && productId && str(data.id)) {
          await fulfillOrder({
            provider: "polar",
            externalOrderId: str(data.id)!,
            userId,
            providerProductId: productId,
            billingReason: str(data.billingReason),
            amountUsd:
              typeof data.totalAmount === "number" ? data.totalAmount / 100 : null,
          });
        }
        break;
      }
      case "subscription.created":
      case "subscription.active":
      case "subscription.updated":
      case "subscription.canceled":
      case "subscription.revoked": {
        const productId =
          str(data.productId) ?? str((data.product as AnyRecord | undefined)?.id);
        if (userId && str(data.id)) {
          await syncSubscription({
            provider: "polar",
            externalSubscriptionId: str(data.id)!,
            externalCustomerId: str((data.customer as AnyRecord | undefined)?.id),
            userId,
            providerProductId: productId,
            status: str(data.status) ?? "canceled",
            currentPeriodStart: str(data.currentPeriodStart),
            currentPeriodEnd: str(data.currentPeriodEnd),
            cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
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
      .eq("provider", "polar")
      .eq("external_event_id", eventId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    await supabase
      .from("webhook_events")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message.slice(0, 500) : "unknown",
      })
      .eq("provider", "polar")
      .eq("external_event_id", eventId);
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}

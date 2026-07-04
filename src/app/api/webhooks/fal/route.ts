import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFalWebhook } from "@/lib/generation/fal-webhook-verify";
import { completeGeneration, failGeneration } from "@/lib/generation/complete";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());

  const valid = await verifyFalWebhook({
    requestId: request.headers.get("x-fal-webhook-request-id"),
    userId: request.headers.get("x-fal-webhook-user-id"),
    timestamp: request.headers.get("x-fal-webhook-timestamp"),
    signatureHex: request.headers.get("x-fal-webhook-signature"),
    rawBody,
  });
  if (!valid) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let body: {
    request_id?: string;
    status?: string;
    payload?: Record<string, unknown>;
    error?: string;
    payload_error?: string;
  };
  try {
    body = JSON.parse(rawBody.toString("utf-8"));
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const requestId = body.request_id;
  if (!requestId) {
    return NextResponse.json({ error: "missing request_id" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // idempotency: a given fal request produces exactly one terminal event
  const { error: dedupeError } = await supabase.from("webhook_events").insert({
    provider: "fal",
    external_event_id: requestId,
    event_type: body.status ?? "unknown",
    payload: body as unknown as Record<string, unknown>,
  });
  if (dedupeError) {
    // unique violation → already processed (or in flight); ack so fal stops retrying
    return NextResponse.json({ ok: true, deduped: true });
  }

  const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const generationIdParam = new URL(request.url).searchParams.get("generation_id");
  const generationId =
    generationIdParam && UUID_RE.test(generationIdParam) ? generationIdParam : null;

  let { data: generation } = await supabase
    .from("generations")
    .select("id, user_id, kind, status")
    .eq("fal_request_id", requestId)
    .maybeSingle();

  if (!generation && generationId) {
    const { data: byId } = await supabase
      .from("generations")
      .select("id, user_id, kind, status")
      .eq("id", generationId)
      .maybeSingle();
    generation = byId;
  }

  if (!generation) {
    await supabase
      .from("webhook_events")
      .update({ status: "failed", error: "generation not found" })
      .eq("provider", "fal")
      .eq("external_event_id", requestId);
    return NextResponse.json({ ok: true });
  }

  if (["completed", "failed", "canceled"].includes(generation.status)) {
    return NextResponse.json({ ok: true, alreadyTerminal: true });
  }

  try {
    if (body.status === "OK" && body.payload) {
      await completeGeneration(generation, body.payload);
    } else {
      await failGeneration(
        generation,
        body.error ?? body.payload_error ?? "generation failed",
      );
    }

    await supabase
      .from("webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("provider", "fal")
      .eq("external_event_id", requestId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    await supabase
      .from("webhook_events")
      .update({
        status: "failed",
        error: err instanceof Error ? err.message.slice(0, 500) : "unknown",
      })
      .eq("provider", "fal")
      .eq("external_event_id", requestId);
    // 500 → fal retries; processing is idempotent via settle/refund guards
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}

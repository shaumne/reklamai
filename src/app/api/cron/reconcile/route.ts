import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { falProvider } from "@/lib/providers/fal";
import { completeGeneration, failGeneration } from "@/lib/generation/complete";

export const runtime = "nodejs";
export const maxDuration = 300;

const STUCK_AFTER_MS = 3 * 60 * 1000;
const GIVE_UP_AFTER_MS = 60 * 60 * 1000;
const BATCH = 10;

// Sweeps generations stuck in queued/processing: settles or refunds them.
// Covers missed webhooks and local development (where fal cannot call back).
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const cutoff = new Date(Date.now() - STUCK_AFTER_MS).toISOString();

  const { data: stuck } = await supabase
    .from("generations")
    .select("id, user_id, kind, status, model_id, fal_request_id, created_at, model_catalog(fal_model_id)")
    .in("status", ["queued", "processing"])
    .lt("created_at", cutoff)
    .order("created_at", { ascending: true })
    .limit(BATCH);

  const results: Array<{ id: string; action: string }> = [];

  for (const generation of stuck ?? []) {
    const falModelId = (generation.model_catalog as unknown as { fal_model_id: string } | null)
      ?.fal_model_id;

    if (!generation.fal_request_id || !falModelId) {
      await failGeneration(generation, "job was never submitted to the provider");
      results.push({ id: generation.id, action: "refunded_unsubmitted" });
      continue;
    }

    try {
      const status = await falProvider.checkJob(falModelId, generation.fal_request_id);

      if (status.state === "completed") {
        await completeGeneration(generation, status.payload);
        results.push({ id: generation.id, action: "completed" });
      } else if (status.state === "failed") {
        await failGeneration(generation, status.error);
        results.push({ id: generation.id, action: "refunded" });
      } else {
        const age = Date.now() - new Date(generation.created_at).getTime();
        if (age > GIVE_UP_AFTER_MS) {
          await failGeneration(generation, "generation timed out");
          results.push({ id: generation.id, action: "refunded_timeout" });
        } else if (status.state === "processing" && generation.status === "queued") {
          await supabase
            .from("generations")
            .update({ status: "processing", updated_at: new Date().toISOString() })
            .eq("id", generation.id);
          results.push({ id: generation.id, action: "marked_processing" });
        }
      }
    } catch (err) {
      results.push({
        id: generation.id,
        action: `check_failed: ${err instanceof Error ? err.message.slice(0, 100) : "unknown"}`,
      });
    }
  }

  return NextResponse.json({ swept: results.length, results });
}

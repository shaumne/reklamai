"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeCredits, planAtLeast, type ModelCatalogRow, type PlanTier } from "@/lib/credits";
import { planByTier } from "@/lib/billing/plans";
import { categoryById } from "@/lib/ads/categories";
import { directVideoPrompt } from "@/lib/ads/director";
import { platformById } from "@/lib/ads/platforms";
import { falProvider, buildVideoInput, buildTtsInput, buildMusicInput } from "@/lib/providers/fal";
import { createGenerationSchema, type CreateGenerationInput } from "@/lib/validation/generation";

type ActionResult =
  | { ok: true; generationIds: string[] }
  | { ok: false; error: string };

function webhookUrlFor(generationId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/api/webhooks/fal?generation_id=${generationId}`;
}

async function signedInputUrl(
  admin: ReturnType<typeof createAdminClient>,
  assetId: string,
  userId: string,
): Promise<string | null> {
  const { data: asset } = await admin
    .from("assets")
    .select("bucket, storage_path, user_id")
    .eq("id", assetId)
    .single();
  if (!asset || asset.user_id !== userId) return null;

  const { data } = await admin.storage
    .from(asset.bucket)
    .createSignedUrl(asset.storage_path, 3600);
  return data?.signedUrl ?? null;
}

export async function createGeneration(raw: CreateGenerationInput): Promise<ActionResult> {
  const parsed = createGenerationSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID_INPUT" };
  const input = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "UNAUTHENTICATED" };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("plan_tier, locale")
    .eq("id", user.id)
    .single();
  const planTier = (profile?.plan_tier ?? "free") as PlanTier;

  const category = categoryById(input.categoryId);
  const platform = platformById(input.platformId);
  if (!category || !platform) return { ok: false, error: "INVALID_INPUT" };

  // load requested models from the server-authoritative catalog
  const modelIds = [
    input.modelId,
    input.voiceover?.modelId,
    input.music?.modelId,
  ].filter(Boolean) as string[];

  const { data: models } = await admin
    .from("model_catalog")
    .select("*")
    .in("id", modelIds)
    .eq("enabled", true);

  const catalog = new Map<string, ModelCatalogRow>(
    (models ?? []).map((m) => [m.id, m as ModelCatalogRow]),
  );

  const videoModel = catalog.get(input.modelId);
  if (!videoModel || !videoModel.kind.startsWith("video")) {
    return { ok: false, error: "MODEL_NOT_AVAILABLE" };
  }
  if (!planAtLeast(planTier, videoModel.min_plan)) {
    return { ok: false, error: "PLAN_REQUIRED" };
  }
  if (videoModel.durations && !videoModel.durations.includes(input.durationSeconds)) {
    return { ok: false, error: "INVALID_DURATION" };
  }
  const plan = planByTier(planTier);
  if (plan && input.durationSeconds > plan.maxDurationSeconds) {
    return { ok: false, error: "PLAN_DURATION" };
  }
  if (
    videoModel.aspect_ratios &&
    !videoModel.aspect_ratios.includes(platform.aspectRatio)
  ) {
    return { ok: false, error: "INVALID_ASPECT_RATIO" };
  }

  const jobs: Array<{
    kind: string;
    model: ModelCatalogRow;
    prompt: string | null;
    falInput: (urls: { imageUrl?: string; videoUrl?: string }) => Record<string, unknown>;
    credits: number;
    params: Record<string, unknown>;
  }> = [];

  const videoPrompt = await directVideoPrompt({
    category,
    brief: {
      productName: input.productName,
      description: input.description,
      campaign: input.campaign,
      extraDirection: input.extraDirection,
    },
    durationSeconds: input.durationSeconds,
    aspectRatio: platform.aspectRatio,
    platformId: input.platformId,
  });

  const videoCredits = computeCredits({
    model: videoModel,
    durationSeconds: input.durationSeconds,
    withAudio: input.withAudio,
  });

  jobs.push({
    kind: input.kind,
    model: videoModel,
    prompt: videoPrompt,
    credits: videoCredits,
    params: {
      durationSeconds: input.durationSeconds,
      aspectRatio: platform.aspectRatio,
      withAudio: Boolean(input.withAudio),
      category: input.categoryId,
      platform: input.platformId,
      productName: input.productName,
      campaign: input.campaign ?? null,
    },
    falInput: (urls) =>
      buildVideoInput(videoModel.fal_model_id, {
        prompt: videoPrompt,
        durationSeconds: input.durationSeconds,
        aspectRatio: platform.aspectRatio,
        withAudio: input.withAudio,
        imageUrl: urls.imageUrl,
        videoUrl: urls.videoUrl,
      }),
  });

  if (input.voiceover) {
    const ttsModel = catalog.get(input.voiceover.modelId);
    if (!ttsModel || ttsModel.kind !== "tts") return { ok: false, error: "MODEL_NOT_AVAILABLE" };
    if (!planAtLeast(planTier, ttsModel.min_plan)) return { ok: false, error: "PLAN_REQUIRED" };
    const script = input.voiceover.script;
    jobs.push({
      kind: "tts",
      model: ttsModel,
      prompt: script,
      credits: computeCredits({ model: ttsModel, characters: script.length }),
      params: { voice: input.voiceover.voice, category: input.categoryId },
      falInput: () => buildTtsInput(script, input.voiceover!.voice),
    });
  }

  if (input.music) {
    const musicModel = catalog.get(input.music.modelId);
    if (!musicModel || musicModel.kind !== "music") return { ok: false, error: "MODEL_NOT_AVAILABLE" };
    if (!planAtLeast(planTier, musicModel.min_plan)) return { ok: false, error: "PLAN_REQUIRED" };
    const musicSeconds = Math.max(input.durationSeconds, 10);
    jobs.push({
      kind: "music",
      model: musicModel,
      prompt: input.music.stylePrompt,
      credits: computeCredits({ model: musicModel, minutes: musicSeconds / 60 }),
      params: { stylePrompt: input.music.stylePrompt, seconds: musicSeconds },
      falInput: () => buildMusicInput(musicModel.fal_model_id, input.music!.stylePrompt, musicSeconds),
    });
  }

  // resolve input media (image-to-video / video-to-video)
  let imageUrl: string | undefined;
  let videoUrl: string | undefined;
  if (input.kind !== "video_t2v") {
    if (!input.inputAssetId) return { ok: false, error: "INPUT_MEDIA_REQUIRED" };
    const url = await signedInputUrl(admin, input.inputAssetId, user.id);
    if (!url) return { ok: false, error: "INPUT_MEDIA_NOT_FOUND" };
    if (input.kind === "video_i2v") imageUrl = url;
    else videoUrl = url;
  }

  const generationIds: string[] = [];
  const submitted: Array<{ generationId: string; falModelId: string; requestId: string }> = [];

  // if a later job in the bundle fails, cancel and refund everything that
  // already went out so the user is never partially charged for a "failed" run
  async function rollbackSubmitted() {
    for (const done of submitted) {
      try {
        await falProvider.cancelJob(done.falModelId, done.requestId);
      } catch {
        // already running/finished — settle/refund guards keep the ledger sane
      }
      await admin.rpc("refund_generation", { p_generation_id: done.generationId });
      await admin
        .from("generations")
        .update({ status: "canceled", error: "bundle rolled back" })
        .eq("id", done.generationId)
        .in("status", ["queued", "processing"]);
    }
  }

  for (const job of jobs) {
    const { data: generation, error: insertError } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        project_id: input.projectId ?? null,
        kind: job.kind,
        model_id: job.model.id,
        prompt: job.prompt,
        params: job.params,
        category: input.categoryId,
        platform: input.platformId,
        credit_cost: job.credits,
        status: "queued",
        input_asset_id: input.inputAssetId ?? null,
      })
      .select("id")
      .single();

    if (insertError || !generation) {
      return { ok: false, error: "CREATE_FAILED" };
    }

    const { error: reserveError } = await admin.rpc("reserve_credits", {
      p_user_id: user.id,
      p_generation_id: generation.id,
      p_amount: job.credits,
    });

    if (reserveError) {
      await admin
        .from("generations")
        .update({ status: "canceled", error: "insufficient credits" })
        .eq("id", generation.id);
      await rollbackSubmitted();
      return {
        ok: false,
        error: reserveError.message.includes("INSUFFICIENT_CREDITS")
          ? "INSUFFICIENT_CREDITS"
          : "RESERVE_FAILED",
      };
    }

    try {
      const { requestId } = await falProvider.submitJob({
        modelRef: job.model.fal_model_id,
        input: job.falInput({ imageUrl, videoUrl }),
        webhookUrl: webhookUrlFor(generation.id),
      });

      await admin
        .from("generations")
        .update({ fal_request_id: requestId, updated_at: new Date().toISOString() })
        .eq("id", generation.id);

      generationIds.push(generation.id);
      submitted.push({
        generationId: generation.id,
        falModelId: job.model.fal_model_id,
        requestId,
      });
    } catch (err) {
      await admin.rpc("refund_generation", { p_generation_id: generation.id });
      await admin
        .from("generations")
        .update({
          status: "failed",
          error: `submit failed: ${err instanceof Error ? err.message.slice(0, 300) : "unknown"}`,
        })
        .eq("id", generation.id);
      await rollbackSubmitted();
      return { ok: false, error: "SUBMIT_FAILED" };
    }
  }

  return { ok: true, generationIds };
}

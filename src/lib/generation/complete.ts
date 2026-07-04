import { createAdminClient } from "@/lib/supabase/admin";
import { extractOutputUrl } from "./output";

type GenerationRow = {
  id: string;
  user_id: string;
  kind: string;
  status: string;
};

const EXT_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
  "image/png": "png",
};

// Shared terminal-state handlers used by both the fal webhook and the
// cron reconciler, so a missed webhook converges to the same result.
export async function completeGeneration(
  generation: GenerationRow,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = createAdminClient();
  const { url, mime } = extractOutputUrl(payload);

  if (!url) {
    await failGeneration(generation, "Provider returned no output media");
    return;
  }

  let outputAssetId: string | null = null;
  let storedOk = false;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch output failed: ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    const ext = EXT_BY_MIME[mime ?? ""] ?? "bin";
    const path = `${generation.user_id}/${generation.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("outputs")
      .upload(path, bytes, { contentType: mime ?? "application/octet-stream", upsert: true });
    if (uploadError) throw uploadError;

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .upsert(
        {
          user_id: generation.user_id,
          kind: generation.kind.startsWith("video")
            ? "output_video"
            : generation.kind === "tts" || generation.kind === "music"
              ? "output_audio"
              : "thumbnail",
          bucket: "outputs",
          storage_path: path,
          mime,
          size_bytes: bytes.byteLength,
        },
        { onConflict: "bucket,storage_path" },
      )
      .select("id")
      .single();
    if (assetError) throw assetError;

    outputAssetId = asset.id;
    storedOk = true;
  } catch {
    // keep the provider CDN URL as a fallback so the user still gets output
    storedOk = false;
  }

  await supabase.rpc("settle_generation", { p_generation_id: generation.id });

  await supabase
    .from("generations")
    .update({
      status: "completed",
      output_asset_id: outputAssetId,
      output_url: storedOk ? null : url,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", generation.id);
}

export async function failGeneration(
  generation: GenerationRow,
  errorMessage: string,
): Promise<void> {
  const supabase = createAdminClient();

  await supabase.rpc("refund_generation", { p_generation_id: generation.id });

  await supabase
    .from("generations")
    .update({
      status: "failed",
      error: errorMessage.slice(0, 500),
      updated_at: new Date().toISOString(),
    })
    .eq("id", generation.id);
}

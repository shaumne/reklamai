import { fal } from "@fal-ai/client";
import type {
  GenerationProvider,
  JobStatusResult,
  SubmitJobInput,
  SubmitJobResult,
} from "./types";

fal.config({ credentials: process.env.FAL_KEY });

class FalProvider implements GenerationProvider {
  async submitJob(job: SubmitJobInput): Promise<SubmitJobResult> {
    const { request_id } = await fal.queue.submit(job.modelRef, {
      input: job.input,
      webhookUrl: job.webhookUrl,
    });
    return { requestId: request_id };
  }

  async checkJob(modelRef: string, requestId: string): Promise<JobStatusResult> {
    const status = await fal.queue.status(modelRef, { requestId, logs: false });

    if (status.status === "COMPLETED") {
      const result = await fal.queue.result(modelRef, { requestId });
      return { state: "completed", payload: result.data as Record<string, unknown> };
    }
    if (status.status === "IN_PROGRESS") return { state: "processing" };
    return { state: "queued" };
  }
}

export const falProvider = new FalProvider();

type VideoParams = {
  prompt: string;
  durationSeconds: number;
  aspectRatio: string;
  withAudio?: boolean;
  imageUrl?: string;
  videoUrl?: string;
};

// Each model family expects slightly different input shapes.
export function buildVideoInput(
  falModelId: string,
  p: VideoParams,
): Record<string, unknown> {
  if (falModelId.includes("kling-video")) {
    const input: Record<string, unknown> = {
      prompt: p.prompt,
      duration: String(p.durationSeconds),
      aspect_ratio: p.aspectRatio,
    };
    if (p.imageUrl) input.image_url = p.imageUrl;
    if (p.videoUrl) input.video_url = p.videoUrl;
    return input;
  }

  if (falModelId.includes("veo")) {
    const input: Record<string, unknown> = {
      prompt: p.prompt,
      aspect_ratio: p.aspectRatio,
      duration: `${p.durationSeconds}s`,
      generate_audio: Boolean(p.withAudio),
    };
    if (p.imageUrl) input.image_url = p.imageUrl;
    return input;
  }

  if (falModelId.includes("sora")) {
    const input: Record<string, unknown> = {
      prompt: p.prompt,
      aspect_ratio: p.aspectRatio,
      duration: p.durationSeconds,
    };
    if (p.imageUrl) input.image_url = p.imageUrl;
    if (p.videoUrl) input.video_url = p.videoUrl;
    return input;
  }

  // wan / ltx / generic fallback
  const input: Record<string, unknown> = {
    prompt: p.prompt,
    duration: p.durationSeconds,
    aspect_ratio: p.aspectRatio,
  };
  if (p.imageUrl) input.image_url = p.imageUrl;
  if (p.videoUrl) input.video_url = p.videoUrl;
  return input;
}

export function buildTtsInput(text: string, voice: string): Record<string, unknown> {
  return { text, voice };
}

export function buildMusicInput(
  prompt: string,
  durationSeconds: number,
): Record<string, unknown> {
  return { prompt, duration: durationSeconds };
}

export function buildImageInput(
  prompt: string,
  aspectRatio: string,
): Record<string, unknown> {
  const sizeMap: Record<string, string> = {
    "16:9": "landscape_16_9",
    "9:16": "portrait_16_9",
    "1:1": "square_hd",
  };
  return { prompt, image_size: sizeMap[aspectRatio] ?? "landscape_16_9" };
}

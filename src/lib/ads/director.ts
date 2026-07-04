import Anthropic from "@anthropic-ai/sdk";
import {
  buildVideoPrompt,
  type AdCategory,
  type ProductBrief,
} from "./categories";

// LLM creative director: writes a bespoke, duration-aware video prompt for
// each brief. Falls back to the category template when no ANTHROPIC_API_KEY
// is configured or the call fails — generation never blocks on this layer.

const DIRECTOR_SYSTEM = `You are an award-winning commercial director writing prompts for AI video generation models (Google Veo, Kling).
Given a product brief, write ONE prompt describing a single coherent shot sequence that fits the exact duration.

Rules:
- Duration discipline: 4-6 seconds fits ONE continuous camera move on ONE subject; 7-10 seconds fits at most TWO connected beats; longer fits three. Never cram more.
- Show the product (or its effect) within the first second — no slow reveals from darkness in short ads.
- Be concrete about the subject: name its material, color, texture and setting from the brief. The model renders what you describe, not what you imply.
- Specify exactly one camera move (slow push-in, orbital arc, tracking shot...), one lighting setup, and a color mood that fits the industry.
- Physical realism only: describe what a real camera could film in one take; no montage cuts, no abstract concepts.
- End on a stable, composed frame suitable for a text overlay added later.
- No on-screen text, no logos, no watermarks, no brand names rendered as text.
- Write in English, 60-120 words, present tense.`;

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    video_prompt: { type: "string" },
  },
  required: ["video_prompt"],
  additionalProperties: false,
} as const;

export async function directVideoPrompt(args: {
  category: AdCategory;
  brief: ProductBrief;
  durationSeconds: number;
  aspectRatio: string;
  platformId: string;
}): Promise<string> {
  const fallback = buildVideoPrompt(args.category, args.brief, {
    durationSeconds: args.durationSeconds,
    aspectRatio: args.aspectRatio,
  });

  if (!process.env.ANTHROPIC_API_KEY) return fallback;

  try {
    const client = new Anthropic({ timeout: 25_000, maxRetries: 1 });
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 700,
      system: DIRECTOR_SYSTEM,
      output_config: {
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            product_name: args.brief.productName,
            description: args.brief.description ?? null,
            campaign_context: args.brief.campaign ?? null,
            extra_direction: args.brief.extraDirection ?? null,
            industry: args.category.id,
            style_reference: {
              tone: args.category.tone,
              lighting: args.category.lighting,
              camera: args.category.camera,
            },
            duration_seconds: args.durationSeconds,
            aspect_ratio: args.aspectRatio,
            platform: args.platformId,
          }),
        },
      ],
    });

    const text = response.content.find((block) => block.type === "text")?.text;
    if (!text) return fallback;
    const parsed = JSON.parse(text) as { video_prompt?: string };
    return typeof parsed.video_prompt === "string" && parsed.video_prompt.length > 40
      ? parsed.video_prompt
      : fallback;
  } catch {
    return fallback;
  }
}

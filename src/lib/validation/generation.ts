import { z } from "zod";

export const createGenerationSchema = z.object({
  kind: z.enum(["video_t2v", "video_i2v", "video_v2v"]),
  modelId: z.string().min(1).max(64),
  categoryId: z.string().min(1).max(64),
  platformId: z.string().min(1).max(64),
  productName: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  campaign: z.string().max(200).optional(),
  extraDirection: z.string().max(500).optional(),
  durationSeconds: z.number().int().min(3).max(60),
  withAudio: z.boolean().optional(),
  inputAssetId: z.string().uuid().optional(),
  voiceover: z
    .object({
      modelId: z.string().min(1).max(64),
      voice: z.string().min(1).max(64),
      script: z.string().min(1).max(2000),
    })
    .optional(),
  music: z
    .object({
      modelId: z.string().min(1).max(64),
      stylePrompt: z.string().min(1).max(300),
    })
    .optional(),
  projectId: z.string().uuid().optional(),
});

export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;

-- Model catalog seed. unit_price_usd = provider cost per unit.
-- Credits are derived server-side: ceil(cost_usd / 0.05), min 1.
-- Rows with enabled=false ship dark until the model id + price is verified
-- against the live provider API, then get flipped on.

insert into public.model_catalog
  (id, fal_model_id, kind, tier, label, per_unit, unit_price_usd, audio_unit_price_usd,
   native_audio, durations, aspect_ratios, min_plan, enabled, sort, notes)
values
  -- ---- text-to-video ----
  ('wan-25', 'fal-ai/wan-25-preview/text-to-video', 'video_t2v', 'budget', 'WAN 2.5',
   'second', 0.050000, null, false, array[5, 10], array['16:9', '9:16', '1:1'],
   'free', true, 10, '720p budget tier, $0.05/s verified'),

  ('kling-25-turbo-t2v', 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video', 'video_t2v', 'standard', 'Kling 2.5 Turbo',
   'second', 0.070000, null, false, array[5, 10], array['16:9', '9:16', '1:1'],
   'free', true, 20, 'cinematic motion, fast'),

  ('veo-31-t2v', 'fal-ai/veo3.1', 'video_t2v', 'premium', 'Veo 3.1',
   'second', 0.200000, 0.400000, false, array[4, 6, 8], array['16:9', '9:16'],
   'free', true, 30, 'audio toggle doubles per-second price'),

  ('sora-2-t2v', 'fal-ai/sora-2/text-to-video', 'video_t2v', 'premium', 'Sora 2',
   'second', 0.100000, null, true, array[4, 8, 12], array['16:9', '9:16'],
   'free', false, 40, 'live-verified 2026-07-05'),

  ('seedance-2-fast-t2v', 'bytedance/seedance-2.0/fast/text-to-video', 'video_t2v', 'standard', 'Seedance',
   'second', 0.241900, null, true, array[5, 10], array['16:9', '9:16', '1:1'],
   'free', false, 50, 'live-verified 2026-07-05; native audio'),

  ('ltx-2-t2v', 'fal-ai/ltx-2/text-to-video', 'video_t2v', 'budget', 'LTX 2',
   'second', 0.060000, null, false, array[5, 10], array['16:9', '9:16'],
   'free', true, 15, '1080p at $0.06/s verified'),

  -- ---- image-to-video ----
  ('kling-21-std-i2v', 'fal-ai/kling-video/v2.1/standard/image-to-video', 'video_i2v', 'budget', 'Kling 2.1',
   'second', 0.056000, null, false, array[5, 10], array['16:9', '9:16', '1:1'],
   'free', true, 10, 'flat $0.28 per 5s clip, modeled per-second'),

  ('kling-v3-turbo-i2v', 'fal-ai/kling-video/v3/turbo/pro/image-to-video', 'video_i2v', 'standard', 'Kling V3 Turbo',
   'second', 0.140000, null, false, array[5, 10], array['16:9', '9:16', '1:1'],
   'free', true, 20, null),

  ('veo-31-i2v', 'fal-ai/veo3.1/image-to-video', 'video_i2v', 'premium', 'Veo 3.1',
   'second', 0.200000, 0.400000, false, array[4, 6, 8], array['16:9', '9:16'],
   'free', false, 30, 'live-verified 2026-07-05'),

  ('kling-v3-4k-i2v', 'fal-ai/kling-video/v3/4k/image-to-video', 'video_i2v', 'ultra', 'Kling V3 4K',
   'second', 0.420000, null, false, array[5, 10], array['16:9', '9:16'],
   'pro', false, 40, '4K; Pro+ only; live-verified 2026-07-05'),

  -- ---- video-to-video ----
  ('kling-o1-v2v', 'fal-ai/kling-video/o1/video-to-video/edit', 'video_v2v', 'standard', 'Kling O1 Edit',
   'second', 0.168000, null, false, array[5, 10], array['16:9', '9:16', '1:1'],
   'free', true, 10, 'style transfer / edit, keeps motion'),

  ('sora-2-v2v', 'fal-ai/sora-2/video-to-video/remix', 'video_v2v', 'premium', 'Sora 2 Remix',
   'second', 0.100000, null, true, array[4, 8], array['16:9', '9:16'],
   'free', false, 20, 'live-verified 2026-07-05'),

  -- ---- voiceover (tts) ----
  ('elevenlabs-turbo', 'fal-ai/elevenlabs/tts/turbo-v2.5', 'tts', 'standard', 'Voiceover',
   'chars_1k', 0.050000, null, false, null, null,
   'free', true, 10, 'multilingual incl. Turkish'),

  ('elevenlabs-v3', 'fal-ai/elevenlabs/tts/eleven-v3', 'tts', 'premium', 'Voiceover Pro',
   'chars_1k', 0.100000, null, false, null, null,
   'free', true, 20, null),

  -- ---- music ----
  ('cassette-music', 'cassetteai/music-generator', 'music', 'budget', 'Music',
   'minute', 0.020000, null, false, null, null,
   'free', false, 10, 'live-verified 2026-07-05'),

  ('stable-audio-25', 'fal-ai/stable-audio-25/text-to-audio', 'music', 'premium', 'Music Pro',
   'generation', 0.200000, null, false, null, null,
   'free', false, 20, 'live-verified 2026-07-05'),

  -- ---- image (storyboard / stills) ----
  ('flux-schnell', 'fal-ai/flux/schnell', 'image', 'budget', 'Flux Schnell',
   'megapixel', 0.003000, null, false, null, array['16:9', '9:16', '1:1'],
   'free', true, 10, null),

  ('flux-dev', 'fal-ai/flux/dev', 'image', 'standard', 'Flux Dev',
   'megapixel', 0.025000, null, false, null, array['16:9', '9:16', '1:1'],
   'free', true, 20, null),

  -- ---- upscale ----
  ('video-upscaler', 'fal-ai/video-upscaler', 'upscale', 'standard', 'Video Upscale',
   'second', 0.020000, null, false, null, null,
   'free', false, 10, 'live-verified 2026-07-05')
on conflict (id) do update set
  fal_model_id = excluded.fal_model_id,
  unit_price_usd = excluded.unit_price_usd,
  audio_unit_price_usd = excluded.audio_unit_price_usd,
  durations = excluded.durations,
  aspect_ratios = excluded.aspect_ratios,
  updated_at = now();

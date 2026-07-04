// fal result payloads differ per model family; find the primary media URL.

type AnyRecord = Record<string, unknown>;

function urlFrom(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string" && value.startsWith("http")) return value;
  if (typeof value === "object" && value !== null) {
    const url = (value as AnyRecord).url;
    if (typeof url === "string" && url.startsWith("http")) return url;
  }
  return null;
}

export function extractOutputUrl(payload: AnyRecord): {
  url: string | null;
  mime: string | null;
} {
  const video =
    urlFrom(payload.video) ??
    urlFrom(payload.video_url) ??
    urlFrom((payload.videos as unknown[])?.[0]);
  if (video) return { url: video, mime: "video/mp4" };

  const audio =
    urlFrom(payload.audio) ??
    urlFrom(payload.audio_url) ??
    urlFrom(payload.audio_file);
  if (audio) return { url: audio, mime: "audio/mpeg" };

  const image = urlFrom((payload.images as unknown[])?.[0]) ?? urlFrom(payload.image);
  if (image) return { url: image, mime: "image/png" };

  return { url: null, mime: null };
}

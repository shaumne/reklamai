// Target platform presets: aspect ratio + sensible duration options.
// The wizard filters these against the chosen model's supported values.

export type PlatformPreset = {
  id: string;
  icon: string; // lucide icon name
  aspectRatio: "16:9" | "9:16" | "1:1";
  preferredDurations: number[];
};

export const PLATFORM_PRESETS: PlatformPreset[] = [
  {
    id: "youtube-google",
    icon: "youtube",
    aspectRatio: "16:9",
    preferredDurations: [5, 6, 8, 10, 15, 30],
  },
  {
    id: "reels-tiktok",
    icon: "clapperboard",
    aspectRatio: "9:16",
    preferredDurations: [5, 8, 10, 15],
  },
  {
    id: "feed-square",
    icon: "instagram",
    aspectRatio: "1:1",
    preferredDurations: [5, 10, 15],
  },
  {
    id: "web-landscape",
    icon: "monitor-play",
    aspectRatio: "16:9",
    preferredDurations: [5, 10, 15, 30],
  },
];

export function platformById(id: string): PlatformPreset | undefined {
  return PLATFORM_PRESETS.find((p) => p.id === id);
}

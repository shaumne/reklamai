"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FORMATS = [
  { id: "16:9", src: "/hero.mp4", frame: "aspect-video w-full" },
  { id: "9:16", src: "/hero-916.mp4", frame: "aspect-[9/16] h-[420px] sm:h-[480px]" },
  { id: "1:1", src: "/hero-11.mp4", frame: "aspect-square h-[340px] sm:h-[420px]" },
] as const;

type FormatId = (typeof FORMATS)[number]["id"];

export function HeroPlayer() {
  const [active, setActive] = useState<FormatId>("16:9");
  const format = FORMATS.find((f) => f.id === active)!;

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-center">
        <div
          className={cn(
            "relative overflow-hidden rounded-xl bg-gradient-to-br from-flame-500 via-flame-400 to-gold-400",
            "transition-[width,height] duration-200",
            format.frame,
          )}
        >
          <video
            key={format.src}
            className="absolute inset-0 h-full w-full object-cover"
            src={format.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        </div>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-flame-500 to-gold-400" />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {FORMATS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActive(f.id)}
            aria-pressed={active === f.id}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-150",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500 active:scale-[0.97]",
              active === f.id
                ? "border-flame-500 bg-flame-500 text-white"
                : "border-ink-200 text-ink-600 hover:border-flame-300 hover:text-flame-700",
            )}
          >
            {f.id}
          </button>
        ))}
      </div>
    </div>
  );
}

import { Coins } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";

export type GenerationStatus = "queued" | "processing" | "completed" | "failed" | "canceled";

export type GenerationRow = {
  id: string;
  kind: string;
  model_id: string;
  prompt: string | null;
  params: Record<string, unknown> | null;
  category: string | null;
  platform: string | null;
  credit_cost: number;
  status: GenerationStatus;
  output_asset_id: string | null;
  output_url: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
};

const STATUS_TONE: Record<GenerationStatus, "gold" | "success" | "danger" | "outline"> = {
  queued: "gold",
  processing: "gold",
  completed: "success",
  failed: "danger",
  canceled: "outline",
};

export async function GenerationCard({
  generation,
  locale,
  thumbnailUrl,
}: {
  generation: GenerationRow;
  locale: string;
  thumbnailUrl?: string | null;
}) {
  const t = await getTranslations();

  const title =
    (generation.params?.productName as string | undefined) ?? generation.prompt ?? generation.model_id;
  const createdLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(generation.created_at));
  const isBusy = generation.status === "queued" || generation.status === "processing";

  return (
    <Link href={`/videos/${generation.id}`} className="group block h-full">
      <Card className="flex h-full flex-col gap-3 p-5 transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            className="aspect-video w-full rounded-xl object-cover"
          />
        ) : null}

        <div className="flex items-center justify-between gap-2">
          <Badge tone={STATUS_TONE[generation.status]}>
            {isBusy ? <Spinner className="size-3 border-[1.5px]" /> : null}
            {t(`status.${generation.status}`)}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-ink-500">
            <Coins className="size-3.5 text-gold-500" />
            {generation.credit_cost}
          </span>
        </div>

        <p className="line-clamp-2 text-sm font-medium text-ink-900">{title}</p>

        <div className="mt-auto flex items-center justify-between text-xs text-ink-400">
          <span className="truncate">{generation.model_id}</span>
          <span className="shrink-0">{createdLabel}</span>
        </div>
      </Card>
    </Link>
  );
}

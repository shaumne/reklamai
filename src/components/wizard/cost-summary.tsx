import { cn } from "@/lib/utils";

type CostSummaryRowProps = {
  label: string;
  value: number;
  bold?: boolean;
  danger?: boolean;
};

export function CostSummaryRow({ label, value, bold, danger }: CostSummaryRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-sm text-ink-500", bold && "text-base font-semibold text-ink-900")}>
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-semibold text-ink-900 tabular-nums",
          bold && "text-base",
          danger && "text-danger-700",
        )}
      >
        {value}
      </span>
    </div>
  );
}

import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="loading"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border-2 border-ink-200 border-t-flame-500",
        className,
      )}
    />
  );
}

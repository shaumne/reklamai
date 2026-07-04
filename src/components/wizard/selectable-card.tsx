import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function selectableCardClasses(selected: boolean, disabled?: boolean) {
  return cn(
    "relative w-full rounded-2xl border p-4 text-left transition-[transform,box-shadow,border-color,background-color] duration-200",
    "hover:-translate-y-0.5 hover:shadow-(--shadow-lift)",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
    "active:scale-[0.98]",
    selected ? "border-flame-500 bg-flame-50 ring-2 ring-flame-500" : "border-ink-200 bg-white",
    disabled &&
      "cursor-not-allowed opacity-50 hover:translate-y-0 hover:shadow-none active:scale-100",
  );
}

type SelectableCardProps = {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  title: string;
  description?: string;
  disabled?: boolean;
  className?: string;
};

export function SelectableCard({
  selected,
  onClick,
  icon,
  title,
  description,
  disabled,
  className,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(selectableCardClasses(selected, disabled), className)}
    >
      {selected && (
        <span className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-flame-500 text-white">
          <Check className="size-3" />
        </span>
      )}
      {icon && (
        <span
          className={cn(
            "mb-3 flex size-9 items-center justify-center rounded-xl text-flame-600",
            selected ? "bg-white" : "bg-flame-50",
          )}
        >
          {icon}
        </span>
      )}
      <span className="block pr-5 text-sm font-semibold text-ink-900">{title}</span>
      {description && <span className="mt-1 block text-xs text-ink-500">{description}</span>}
    </button>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToggleSwitchProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

export function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
  description,
  icon,
  disabled,
}: ToggleSwitchProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-ink-100 bg-white p-4 transition-colors duration-150",
        "hover:border-flame-200",
        disabled && "cursor-not-allowed opacity-60 hover:border-ink-100",
      )}
    >
      <span className="flex flex-1 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-flame-50 text-flame-600">
            {icon}
          </span>
        )}
        <span>
          <span className="block text-sm font-semibold text-ink-900">{label}</span>
          {description && <span className="mt-0.5 block text-xs text-ink-500">{description}</span>}
        </span>
      </span>
      <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full transition-colors duration-200",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-flame-500",
            checked ? "bg-flame-500" : "bg-ink-200",
          )}
        />
        <span
          aria-hidden
          className={cn(
            "absolute left-1 size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
    </label>
  );
}

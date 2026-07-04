import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type StepHeaderProps = {
  steps: string[];
  currentStep: number;
};

export function StepHeader({ steps, currentStep }: StepHeaderProps) {
  return (
    <ol className="flex items-start justify-between">
      {steps.map((label, index) => {
        const done = index < currentStep;
        const current = index === currentStep;
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center gap-2 text-center">
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-[18px] left-1/2 h-0.5 w-full sm:top-5",
                  done ? "bg-flame-500" : "bg-ink-100",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200 sm:size-10",
                done && "bg-flame-500 text-white",
                current && "bg-white text-flame-600 ring-2 ring-flame-500",
                !done && !current && "bg-ink-100 text-ink-400",
              )}
            >
              {done ? <Check className="size-4" /> : index + 1}
            </span>
            <span
              className={cn(
                "relative z-10 hidden text-xs font-medium sm:block",
                current || done ? "text-ink-900" : "text-ink-400",
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

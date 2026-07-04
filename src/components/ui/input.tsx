import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldClasses = [
  "w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900",
  "placeholder:text-ink-400 transition-[border-color,box-shadow] duration-150",
  "hover:border-ink-300",
  "focus:border-flame-400 focus:shadow-[0_0_0_3px_rgba(255,77,43,0.12)] focus:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-60",
].join(" ");

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldClasses, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldClasses, "min-h-24", className)} {...props} />
));
Textarea.displayName = "Textarea";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-ink-700", className)}
      {...props}
    />
  );
}

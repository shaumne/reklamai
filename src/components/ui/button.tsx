import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap",
    "rounded-full transition-[transform,opacity,box-shadow] duration-200 ease-out",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame-500",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-flame-500 text-white shadow-[0_2px_8px_rgba(255,77,43,0.35),0_8px_24px_rgba(255,77,43,0.2)] hover:bg-flame-600 hover:-translate-y-0.5",
        secondary:
          "bg-ink-900 text-ink-50 hover:bg-ink-700 hover:-translate-y-0.5 shadow-[0_2px_8px_rgba(25,20,18,0.25)]",
        outline:
          "border border-ink-200 bg-white/70 text-ink-800 hover:border-flame-300 hover:text-flame-700 hover:-translate-y-0.5",
        ghost: "text-ink-700 hover:bg-ink-100 hover:text-ink-900",
        danger: "bg-danger-500 text-white hover:bg-danger-700",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type, ...props }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };

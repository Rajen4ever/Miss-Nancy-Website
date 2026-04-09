import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-violet-500 text-white shadow-glow hover:bg-violet-400 active:bg-violet-600",
        secondary:
          "border border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800",
        outline:
          "border border-zinc-700 bg-transparent text-zinc-100 hover:border-zinc-600 hover:bg-zinc-900/80",
        ghost: "bg-transparent text-zinc-200 hover:bg-zinc-900 hover:text-zinc-50",
        destructive:
          "bg-rose-500 text-white shadow-card hover:bg-rose-400 active:bg-rose-600",
        subtle: "bg-zinc-800/70 text-zinc-100 hover:bg-zinc-800"
      },
      size: {
        sm: "h-9 gap-2 px-3.5",
        default: "h-11 gap-2 px-5",
        lg: "h-12 gap-2.5 px-6 text-[15px]",
        icon: "h-11 w-11"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), loading && "cursor-wait", className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };

import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-2 text-sm text-zinc-50 placeholder:text-zinc-500 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:border-violet-400/50 focus-visible:ring-2 focus-visible:ring-violet-400/25 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";

export { Input };

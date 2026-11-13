import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ComponentProps<"button"> & { variant?: "primary" | "secondary" };

/** Project button: 44px tall, small radius, no shadow. Inputs in the same row should line up with it. */
function Button({ className, variant = "secondary", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-sm px-4 text-sm font-medium transition-colors duration-150 ease-out-soft",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" ? "bg-primary text-primary-foreground" : "border border-border bg-surface text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Button };

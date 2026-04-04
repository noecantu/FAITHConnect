import * as React from "react"
import { cn } from "@/app/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  "data-with-icon"?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          // Base dark glass styling
          "flex h-10 w-full rounded-md border border-white/10 bg-white/5",
          "px-3 py-2 text-base text-white placeholder:text-white/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-0",
          "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",

          // Icon padding support
          props['data-with-icon'] ? "pl-10 pr-10" : "px-3",

          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }

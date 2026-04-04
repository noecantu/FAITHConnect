"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"
import { cn } from "@/app/lib/utils"

function Switch({
  className,
  size = "default",
  checked,
  onCheckedChange,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      data-slot="switch"
      data-size={size}
      className={cn(
        "inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "bg-white/20 data-[state=checked]:bg-white/40",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
          "data-[state=checked]:translate-x-5"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }

"use client"

import * as React from "react"
import { cn } from "cn"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

// 1-bit theme: 14px square with a 1px border; checked shows an 8px black square inset 2px from the border.
function Checkbox({
  className,
  ...props
}) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-[14px] shrink-0 p-0 cursor-pointer items-center justify-center border border-foreground bg-background outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:outline-1 focus-visible:outline-offset-3 focus-visible:outline-dashed focus-visible:outline-foreground disabled:cursor-default disabled:opacity-40",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="block size-[8px] bg-foreground" />
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }

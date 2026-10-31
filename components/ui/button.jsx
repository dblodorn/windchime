import * as React from "react"
import { cva } from "class-variance-authority";
import { cn } from "cn"
import { Slot } from "radix-ui"

// 1-bit theme: black border on white, inverted on hover and while pressed (aria-pressed), dashed focus outline.
const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 border whitespace-nowrap uppercase tracking-[.06em] outline-none select-none focus-visible:outline-1 focus-visible:outline-offset-3 focus-visible:outline-dashed focus-visible:outline-foreground disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "border-foreground bg-background text-foreground hover:bg-foreground hover:text-background aria-pressed:bg-foreground aria-pressed:text-background",
        ghost: "border-transparent bg-background text-foreground hover:border-foreground",
        link: "border-transparent bg-transparent text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "px-[10px] py-[6px]",
        icon: "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

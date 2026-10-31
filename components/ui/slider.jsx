"use client"

import * as React from "react"
import { cn } from "cn"
import { Slider as SliderPrimitive } from "radix-ui"

// 1-bit theme: 1px black track, 9x17 black block thumb. The thumb carries role="slider",
// so aria-label / aria-labelledby are passed to it rather than the root.
const THUMB_W = 9

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  ...props
}) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )
  // Radix finds each thumb's index from the DOM, so on the server its thumbs render hidden.
  // Until mount, draw a stand-in at the same spot (Radix keeps the thumb inside the track by half its width).
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex h-[22px] w-full touch-none items-center select-none data-disabled:opacity-40",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-px w-full grow bg-foreground"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-transparent select-none"
        />
      </SliderPrimitive.Track>
      {!mounted && _values.map((v, index) => {
        const pct = ((v - min) / (max - min)) * 100
        return (
          <span
            key={`ssr-${index}`}
            aria-hidden
            data-slot="slider-thumb-placeholder"
            className="pointer-events-none absolute top-1/2 block h-[17px] w-[9px] -translate-x-1/2 -translate-y-1/2 bg-foreground"
            style={{ left: `calc(${pct}% + ${(THUMB_W / 2) * (1 - pct / 50)}px)` }}
          />
        )
      })}
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          className="relative block h-[17px] w-[9px] shrink-0 cursor-grab bg-foreground outline-none select-none after:absolute after:-inset-2 focus-visible:outline-1 focus-visible:outline-offset-3 focus-visible:outline-dashed focus-visible:outline-foreground active:cursor-grabbing disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }

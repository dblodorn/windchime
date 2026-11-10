import { cn } from "cn"

// 1-bit theme exception: a small filled tag with white text, square, no border. The fill comes from `color`
// (a hex, at least 4.5:1 against white). Plain <span>, no Slot, so server pages that use it ship no client JS.
function Badge({ className, color = "#000000", style, ...props }) {
  return (
    <span
      data-slot="badge"
      className={cn("inline-flex h-[18px] items-center px-1.5 text-[10px] leading-none tracking-[.08em] whitespace-nowrap text-white", className)}
      style={{ background: color, ...style }}
      {...props}
    />
  )
}

export { Badge }

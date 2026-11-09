"use client"

import * as React from "react"
import { cn } from "cn"
import { Popover as PopoverPrimitive } from "radix-ui"
import { Button } from "./button"

// A select with a search field, for long lists (SCALE, SOUNDFONT). Same field and list look as select.jsx.
// `groups` is [{ label, items: [{ value, name, text }] }]: `name` is matched, `text` is shown.
// Hand-written on Radix Popover (not cmdk) so the ordering is exactly rank()'s; nested in the settings
// popover, Radix's layer stack sends Escape and outside presses to this list first.
// iOS Safari zooms the page into any field under 16px on focus, so the search is 16px there only
// (-webkit-touch-callout is iOS-only); a maximum-scale viewport would also stop pinch zoom on Android.
// The panel has a fixed height, so filtering (down to the empty state) never shrinks, moves or flips it.

const TOUCH = "(any-hover: none) and (any-pointer: coarse)" // the `touch` variant in globals.css
const byName = (a, b) => a.name.localeCompare(b.name, "en", { numeric: true })

// Empty query: the groups as given. Otherwise one flat list of names containing it (any case):
// names that start with it first, then the rest, each part alphabetical. With `byGroup`, the groups
// whose label contains it follow, under their headings in their own order, minus options already listed.
export function rank(groups, query, byGroup = false) {
  const q = query.trim().toUpperCase()
  if (!q) return groups
  const hits = groups.flatMap(g => g.items).filter(o => o.name.toUpperCase().includes(q))
  const starts = o => o.name.toUpperCase().startsWith(q)
  const out = hits.length ? [{ label: null, items: [...hits.filter(starts).sort(byName), ...hits.filter(o => !starts(o)).sort(byName)] }] : []
  if (byGroup) {
    const listed = new Set(hits)
    for (const g of groups)
      if (g.label.toUpperCase().includes(q)) {
        const items = g.items.filter(o => !listed.has(o))
        if (items.length) out.push({ label: g.label, items })
      }
  }
  return out
}

function SearchSelect({ id, value, display, onChange, groups, byGroup, disabled, contentStyle }) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [hi, setHi] = React.useState(0)
  const inputRef = React.useRef(null)
  const listRef = React.useRef(null)

  const shown = React.useMemo(() => rank(groups, query, byGroup), [groups, query, byGroup])
  const flat = shown.flatMap(g => g.items)
  const listId = `${id}-list`
  const optId = i => `${id}-o-${i}`
  const current = list => Math.max(0, list.findIndex(o => o.value === value))

  // every opening starts from `q` (empty, or the key typed on the closed field)
  const openWith = q => {
    setQuery(q)
    setHi(q ? 0 : current(groups.flatMap(g => g.items)))
    setOpen(true)
  }
  const search = q => {
    setQuery(q)
    setHi(q.trim() ? 0 : current(groups.flatMap(g => g.items)))
  }
  const choose = o => {
    if (!o) return
    setOpen(false)
    if (o.value !== value) onChange(o.value)
  }

  React.useEffect(() => {
    if (open) document.getElementById(optId(hi))?.scrollIntoView({ block: "nearest" })
  }, [open, hi, query]) // eslint-disable-line react-hooks/exhaustive-deps

  const onTriggerKey = e => {
    if (e.key === "ArrowDown") { e.preventDefault(); openWith("") }
    // type to open: a printable key opens the list with it as the search
    else if (e.key.length === 1 && e.key !== " " && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); openWith(e.key) }
  }
  const onListKey = e => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi(i => Math.min(i + 1, flat.length - 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi(i => Math.max(i - 1, 0)) }
    else if (e.key === "Enter") { e.preventDefault(); choose(flat[hi]) }
  }
  const active = flat[hi] ? optId(hi) : undefined

  let n = -1 // running index into `flat` across groups
  const option = o => {
    const i = ++n
    return (
      <div key={o.value} id={optId(i)} role="option" aria-selected={o.value === value} data-highlighted={i === hi ? "" : undefined}
        className="relative flex w-full cursor-default items-center py-0.5 pr-7 pl-2 whitespace-pre select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
        onPointerMove={() => i !== hi && setHi(i)} onMouseDown={e => e.preventDefault()} onClick={() => choose(o)}>
        {o.text}
        {o.value === value && <span className="pointer-events-none absolute right-2" aria-hidden>■</span>}
      </div>
    )
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={o => (o ? openWith("") : setOpen(false))}>
      <PopoverPrimitive.Trigger id={id} disabled={disabled} role="combobox" aria-labelledby={`${id}-label`} aria-haspopup="listbox" aria-controls={open ? listId : undefined}
        data-slot="search-select-trigger" onKeyDown={onTriggerKey}
        className="mt-1 flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 border border-foreground bg-background px-1 py-0.5 text-left text-foreground outline-none select-none focus-visible:outline-1 focus-visible:outline-offset-3 focus-visible:outline-dashed focus-visible:outline-foreground disabled:cursor-default disabled:opacity-40">
        <span className="truncate whitespace-pre">{display}</span>
        <span className="pointer-events-none shrink-0" aria-hidden>▾</span>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content role="presentation" data-slot="search-select-content" style={contentStyle} side="bottom" align="start" sideOffset={2} collisionPadding={16}
          onOpenAutoFocus={e => {
            e.preventDefault()
            // phones and tablets: don't raise the on-screen keyboard over the list until the field is tapped
            if (window.matchMedia(TOUCH).matches) listRef.current?.focus({ preventScroll: true })
            else { const el = inputRef.current; el?.focus(); el?.setSelectionRange(el.value.length, el.value.length) }
          }}
          className="z-50 flex h-[min(320px,var(--radix-popover-content-available-height))] w-[max(var(--radix-popover-trigger-width),240px)] max-w-[calc(100vw-32px)] flex-col border border-foreground bg-popover text-popover-foreground outline-none">
          <div className="flex shrink-0 items-baseline gap-2 border-b border-foreground px-2 py-1">
            <span id={`${id}-search-label`} className="text-[11px] tracking-[.08em]">SEARCH</span>
            <input ref={inputRef} type="text" role="searchbox" aria-labelledby={`${id}-search-label`} aria-controls={listId} aria-activedescendant={active}
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} enterKeyHint="done"
              value={query} onChange={e => search(e.target.value)} onKeyDown={onListKey}
              className="min-w-0 flex-1 border-0 bg-background p-0 text-foreground uppercase [@supports(-webkit-touch-callout:none)]:text-[16px] outline-none focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-dashed focus-visible:outline-foreground" />
          </div>
          <div ref={listRef} id={listId} role="listbox" aria-labelledby={`${id}-label`} tabIndex={-1} aria-activedescendant={active} onKeyDown={onListKey}
            className="min-h-0 overflow-x-hidden overflow-y-auto outline-none">
            {flat.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-2 py-4 text-center">
                <p className="m-0 break-all">NO MATCH FOR {query.trim().toUpperCase()}</p>
                <Button onMouseDown={e => e.preventDefault()} onClick={() => { search(""); inputRef.current?.focus() }}>CLEAR SEARCH</Button>
              </div>
            )}
            {shown.map((g, k) => g.label === null ? g.items.map(option) : (
              <div key={g.label} role="group" aria-labelledby={`${id}-g-${k}`}>
                <div id={`${id}-g-${k}`} className="px-2 pt-2 pb-0.5 text-[11px] font-bold uppercase tracking-[.06em]">{g.label}</div>
                {g.items.map(option)}
              </div>
            ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { SearchSelect }

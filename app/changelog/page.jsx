import Link from "next/link";
import { CHANGELOG } from "@/lib/changelog";

export const metadata = { title: "Changelog · Chime" };

const SMALL = "text-[10px] tracking-[.08em]";
// Button's default look, written out: importing components/ui/button pulls radix-ui into this page's client JS
const BUTTON = "inline-flex h-8 items-center border border-foreground bg-background px-2.5 tracking-[.06em] text-foreground no-underline hover:bg-foreground hover:text-background focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-foreground focus-visible:outline-offset-3";

export default function ChangelogPage() {
  return (
    <main className="grid max-w-[560px] gap-3.5">
      <header className="flex items-center justify-between gap-3">
        <h1 className="m-0 text-[11px] font-normal tracking-[.08em]">CHANGELOG</h1>
        <Link href="/" className={BUTTON}>CHIME</Link>
      </header>
      <ul className="m-0 grid list-none p-0">
        {CHANGELOG.map((e, i) => (
          <li key={i} className="grid gap-0.5 border-t border-foreground py-2">
            <span className={`flex gap-3 ${SMALL}`}>
              <time dateTime={e.date}>{e.date}</time>
              <span>{e.type}</span>
            </span>
            <span className="text-[13px] [overflow-wrap:anywhere]">{e.text}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}

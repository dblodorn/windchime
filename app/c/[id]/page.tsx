import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Chime from "../../../components/Chime";
import { loadComposition } from "./CompositionPage";

// a composition can be hidden at any time, so every request asks the API
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await loadComposition((await params).id);
  if (c.kind !== "found") return {};
  const title = `${c.title} · Chime`;
  return { title, openGraph: { title }, twitter: { title } };
}

// /c/<24-hex id>: the player with that saved composition, muted (opening an address isn't a tap). Missing or hidden
// is a 404 with the browser's own units (not-found.tsx); an API that can't be reached keeps them too and says so.
export default async function Page({ params }: Props) {
  const c = await loadComposition((await params).id);
  if (c.kind === "missing") notFound();
  if (c.kind === "error") return <Chime notice="COULD NOT OPEN" />;
  return <Chime initial={{ id: c.id, units: c.units }} />;
}

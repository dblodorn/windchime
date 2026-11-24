"use client";
// PATCH: an external synth's patches, its bundled INIT first, then its dmbk library newest first, 20 at a time,
// searched by name on the API (openspec/specs/external-synths). Loaded with next/dynamic when a unit on an external
// synth shows its settings; nothing is requested until the list is opened. Each opening shows the last list for
// that search at once and fetches it again.
import { useEffect, useRef, useState } from "react";
import type * as React from "react";
import { fetchQuery, graphql } from "relay-runtime";
import { relayEnvironment } from "../lib/relay/environment";
import { rememberName } from "../lib/patches";
import type { ExternalSynth } from "../lib/synths";
import { SearchSelect, type SearchFooter, type SearchOption } from "@dblodorn/sound-ui";
import type { PatchSelectVzQuery, PatchSelectVzQuery$data } from "./__generated__/PatchSelectVzQuery.graphql";
import type { PatchSelectDx7Query, PatchSelectDx7Query$data } from "./__generated__/PatchSelectDx7Query.graphql";

const PAGE = 20; // the API's page size; its limit on `search` is the synth's nameLength
const INIT = "init"; // the INIT option's value (select values can't be empty)

// each synth's library listing; a later synth adds its own query here
const VzQuery = graphql`
  query PatchSelectVzQuery($first: Int!, $after: String, $search: String) {
    dmbkSoundVzVoices(first: $first, after: $after, search: $search) {
      edges { node { id name } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;
const Dx7Query = graphql`
  query PatchSelectDx7Query($first: Int!, $after: String, $search: String) {
    dmbkSoundDx7Voices(first: $first, after: $after, search: $search) {
      edges { node { id name } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;
type Page = { items: { id: string; name: string }[]; next: string | null };
// a library node's global id is base64 of "<Type>:<id>"; a unit stores the 24-hex id
const localId = (globalId: string) => { try { return atob(globalId).split(":")[1] ?? ""; } catch { return ""; } };
// a library's connection → a page, the same for every synth
type Connection = PatchSelectVzQuery$data["dmbkSoundVzVoices"] | PatchSelectDx7Query$data["dmbkSoundDx7Voices"];
const toPage = (c: Connection): Page => ({
  items: c.edges.map(e => ({ id: localId(e.node.id), name: e.node.name.trim() })).filter(p => /^[0-9a-f]{24}$/.test(p.id)),
  next: c.pageInfo.hasNextPage ? c.pageInfo.endCursor ?? null : null,
});
const LISTS: Record<string, (search: string, after: string | null) => Promise<Page>> = {
  "casio-vz": (search, after) =>
    fetchQuery<PatchSelectVzQuery>(relayEnvironment(), VzQuery, { first: PAGE, after, search: search || null }, { fetchPolicy: "network-only" })
      .toPromise().then(d => toPage(d!.dmbkSoundVzVoices)),
  "yamaha-dx7": (search, after) =>
    fetchQuery<PatchSelectDx7Query>(relayEnvironment(), Dx7Query, { first: PAGE, after, search: search || null }, { fetchPolicy: "network-only" })
      .toPromise().then(d => toPage(d!.dmbkSoundDx7Voices)),
};

// the last list per synth and search, so reopening shows it at once
const lastLists = new Map<string, Page>();
const nameOf = (name: string) => name.toUpperCase() || "UNTITLED";

export default function PatchSelect({ id, synth, value, display, onPick }: {
  id: string; synth: ExternalSynth; value: string | null; display: React.ReactNode;
  onPick: (patch: string | null, name: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState<Page>(() => lastLists.get(`${synth.id}:`) ?? { items: [], next: null });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const gen = useRef(0); // the newest request; older answers are dropped
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const load = (q: string, after: string | null) => {
    const list = LISTS[synth.id];
    if (!list) return;
    const g = ++gen.current;
    setStatus("loading");
    list(q, after).then(
      res => {
        if (g !== gen.current) return;
        setPage(prev => {
          const next = after ? { items: [...prev.items, ...res.items.filter(p => !prev.items.some(o => o.id === p.id))], next: res.next } : res;
          if (!after) lastLists.set(`${synth.id}:${q}`, next);
          return next;
        });
        setStatus("idle");
      },
      () => { if (g === gen.current) setStatus("error"); },
    );
  };
  // every opening (q "") and every search: show the last list for it, fetch it again (typing waits a moment)
  const onQueryChange = (q: string) => {
    const s = q.trim().slice(0, synth.nameLength);
    setSearch(s);
    setPage(lastLists.get(`${synth.id}:${s}`) ?? { items: [], next: null });
    clearTimeout(timer.current);
    if (!s) load("", null);
    else { setStatus("loading"); gen.current++; timer.current = setTimeout(() => load(s, null), 250); }
  };

  const q = search.toUpperCase();
  const options: SearchOption[] = [
    ...(!q || synth.initName.includes(q) ? [{ value: INIT, name: synth.initName, text: synth.initName }] : []),
    ...page.items.map(p => ({ value: p.id, name: nameOf(p.name), text: nameOf(p.name) })),
  ];
  const footer: SearchFooter | undefined =
    status === "loading" ? { kind: "loading" }
    : status === "error" ? { kind: "error", onAction: () => load(search, page.items.length ? page.next : null) }
    : page.next ? { kind: "more", onAction: () => load(search, page.next) }
    : undefined;

  return (
    <SearchSelect id={id} value={value ?? INIT} display={display} groups={[{ label: "", items: options }]} filter={false}
      onQueryChange={onQueryChange} maxLength={synth.nameLength} footer={footer}
      onChange={v => {
        if (v === INIT) { onPick(null, synth.initName); return; }
        const name = nameOf(page.items.find(p => p.id === v)?.name ?? "");
        rememberName(synth, v, name);
        onPick(v, name);
      }} />
  );
}

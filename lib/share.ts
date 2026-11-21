// Share links: a composition (every unit's settings, position and stacking order) packed into the URL fragment.
// zod checks a unit before it is packed and after it is unpacked; UnitSchema is also the stored-data check.
// No DOM at module top level, so this imports in Node.
import { z } from "zod";
import { SCALE_LIST, MIN_TUBES, MAX_TUBES } from "./engine.ts";
import type { Instrument } from "./engine.ts";
import { EXTERNAL_SYNTHS, PATCH_ID, isExternalVoice, synthOf } from "./synths.ts";

export const MAX_UNITS = 16;
// non-empty, as z.enum needs: SCALE_LIST always has its scales
const SCALE_NAMES = SCALE_LIST.map(s => s.name) as [string, ...string[]];

// ---------- unit record ----------
// The one definition of a unit's fields, ranges and defaults. Each field falls back to its default on its own,
// so one bad value never costs the rest of the unit. SOUND is never carried (audio starts only from a tap).
export const DEFAULTS = {
  instrument: "chime" as Instrument, volume: 1, tubes: 6, wind: 0.45, decay: 4, cutX: 0.78, q: 3, root: 72, scale: SCALE_NAMES[0],
  voice: null as string | null, patch: null as string | null, channel: 1, midiMode: "poly" as "poly" | "mono", output: "1-2",
  notes: false, sound: false, x: 0, y: 0, z: 1,
};
// OUTPUT: a channel pair "1-2", "3-4", … or one channel "1", "2", …, up to 32. It describes this browser's
// audio device, so it stays in browser storage: links and saved compositions never carry it.
export const MAX_OUTPUT_CHANNELS = 32;
const outputOk = (v: string) => {
  const m = /^(\d{1,2})(?:-(\d{1,2}))?$/.exec(v);
  if (!m) return false;
  const a = +m[1], b = m[2] && +m[2];
  return a >= 1 && (b ? a % 2 === 1 && b === a + 1 && b <= MAX_OUTPUT_CHANNELS : a <= MAX_OUTPUT_CHANNELS);
};
const num = (lo: number, hi: number, d: number, round = false) =>
  z.number().transform(v => { const c = Math.min(hi, Math.max(lo, v)); return round ? Math.round(c) : c; }).catch(d);

export const INSTRUMENTS = ["chime", "furin"] as const;
// ROOT is a MIDI note from C-1 to B8 (ROOT picks the note, OCTAVE −1 to 8 the octave)
export const MIN_ROOT = 0, MAX_ROOT = 119;

export const UnitSchema = z.preprocess(r => (r && typeof r === "object" && !Array.isArray(r) ? r : {}), z.object({
  // "chime" the tube chime, "furin" the furin bell (a furin keeps its tubes and scale for switching back)
  instrument: z.enum(INSTRUMENTS).catch(DEFAULTS.instrument),
  volume: num(0, 1, DEFAULTS.volume),
  tubes: num(MIN_TUBES, MAX_TUBES, DEFAULTS.tubes, true),
  wind: num(0, 1, DEFAULTS.wind),
  decay: num(0.3, 12, DEFAULTS.decay),
  cutX: num(0, 1, DEFAULTS.cutX),
  q: num(0.5, 18, DEFAULTS.q),
  root: num(MIN_ROOT, MAX_ROOT, DEFAULTS.root, true),
  scale: z.enum(SCALE_NAMES).catch(DEFAULTS.scale),
  // `v<i>` built-in, `s<font>:<preset>` soundfont, `x:<synth>` external synth (an unknown synth → the default)
  voice: z.string().regex(/^(v\d+|s\d+:\d+|x:[a-z0-9-]+)$/).nullable().transform(v => (v?.startsWith("x:") && !synthOf(v) ? null : v)).catch(null),
  // an external synth's patch: its 24-hex library id, or null for the synth's INIT (see lib/synths.ts)
  patch: z.string().regex(PATCH_ID).nullable().catch(null),
  channel: num(1, 16, DEFAULTS.channel, true),
  midiMode: z.enum(["poly", "mono"]).catch("poly"),
  output: z.string().refine(outputOk).catch(DEFAULTS.output),
  notes: z.boolean().transform(v => v === true).catch(false),
  sound: z.literal(false).catch(false),
  x: num(-1e5, 1e5, 0, true),
  y: num(-1e5, 1e5, 0, true),
  z: num(1, 1e6, 1, true),
}).transform(u => (u.patch !== null && !isExternalVoice(u.voice) ? { ...u, patch: null } : u))); // only external synths have a patch

// a unit's fields as the schema gives them back (SOUND always off)
export type UnitFields = z.infer<typeof UnitSchema>;
// a unit as the page holds it: with an id, and SOUND, which may be on for the visit
export type Unit = Omit<UnitFields, "sound"> & { id: string; sound: boolean };

export const CompositionSchema = z.preprocess(
  us => (Array.isArray(us) ? us.slice(0, MAX_UNITS) : us),
  z.array(UnitSchema).min(1),
);

// ---------- packed form, version 2 ----------
// Integers at each slider's own step. Parsing throws on anything a byte (or two) can't hold exactly.
export const PackedUnitSchema = z.object({
  volume: z.int().min(0).max(100),  // ×100
  tubes: z.int().min(MIN_TUBES).max(MAX_TUBES),
  wind: z.int().min(0).max(100),    // ×100
  decay: z.int().min(3).max(120),   // ×10
  cutX: z.int().min(0).max(1000),   // ×1000
  q: z.int().min(5).max(180),       // ×10
  root: z.int().min(MIN_ROOT).max(MAX_ROOT),
  scale: z.int().min(0).max(255),   // index in SCALE_LIST
  voice: z.int().min(0).max(65535), // 0 default, 1 + i built-in voice i, 1000 + p GM preset p
  flags: z.int().min(0).max(63),    // bits 0-3 channel - 1, bit 4 MONO, bit 5 NOTES
  x: z.int().min(-32768).max(32767),
  y: z.int().min(-32768).max(32767),
  rank: z.int().min(0).max(MAX_UNITS - 1), // stacking order among the units
  instrument: z.int().min(0).max(INSTRUMENTS.length - 1), // index in INSTRUMENTS (byte 17)
  synth: z.int().min(0).max(255),   // 0 none, 1 + i external synth EXTERNAL_SYNTHS[i] (byte 18); voice is 0 then
  patch: z.string().regex(PATCH_ID).nullable(), // the external synth's patch, null for INIT (12 bytes after the unit)
}).strict();

type PackedUnit = z.infer<typeof PackedUnitSchema>;

const VERSION = 2, UNIT_BYTES = 19, PATCH_BYTES = 12;
const i16 = (v: number) => Math.max(-32768, Math.min(32767, Math.round(v)));

function voiceCode(v: string | null) {
  if (!v) return 0;
  let m = /^v(\d+)$/.exec(v);
  if (m && +m[1] < 999) return 1 + +m[1];
  m = /^s0:(\d+)$/.exec(v);
  if (m && +m[1] <= 65535 - 1000) return 1000 + +m[1];
  return 0;
}
const voiceId = (c: number) => (c === 0 ? null : c < 1000 ? "v" + (c - 1) : "s0:" + (c - 1000));
// an external synth's voice → 1 + its registry index, anything else → 0; and back (an unknown code → undefined)
const synthCode = (v: string | null) => { const s = synthOf(v); return s ? 1 + EXTERNAL_SYNTHS.indexOf(s) : 0; };
const synthVoice = (c: number) => { const s = EXTERNAL_SYNTHS[c - 1]; return s && "x:" + s.id; };

function pack(u: Omit<UnitFields, "sound">, rank: number) {
  const synth = synthCode(u.voice);
  return PackedUnitSchema.parse({
    volume: Math.round(u.volume * 100), tubes: u.tubes, wind: Math.round(u.wind * 100), decay: Math.round(u.decay * 10),
    cutX: Math.round(u.cutX * 1000), q: Math.round(u.q * 10), root: u.root, scale: SCALE_NAMES.indexOf(u.scale),
    voice: synth ? 0 : voiceCode(u.voice), flags: (u.channel - 1) | (u.midiMode === "mono" ? 16 : 0) | (u.notes ? 32 : 0),
    x: i16(u.x), y: i16(u.y), rank, instrument: INSTRUMENTS.indexOf(u.instrument), synth, patch: synth ? u.patch : null,
  });
}
function unpack(p: PackedUnit) {
  return {
    volume: p.volume / 100, tubes: p.tubes, wind: p.wind / 100, decay: p.decay / 10, cutX: p.cutX / 1000, q: p.q / 10,
    root: p.root, scale: SCALE_NAMES[p.scale], channel: (p.flags & 15) + 1,
    // an unknown synth code gives no voice, which the schema turns into the default
    voice: p.synth ? synthVoice(p.synth) : voiceId(p.voice), patch: p.synth ? p.patch : null,
    midiMode: p.flags & 16 ? "mono" : "poly", notes: !!(p.flags & 32), x: p.x, y: p.y, z: p.rank + 1,
    instrument: INSTRUMENTS[p.instrument], // unknown: undefined, which the schema turns into "chime"
  };
}

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function fromB64(s: string) {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null;
  try { return Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)); } catch (e) { return null; }
}
// a patch id ↔ its 12 bytes; INIT (null) is 12 zero bytes, an ObjectId the API never issues
const patchHex = (dv: DataView, o: number) => {
  let h = "";
  for (let k = 0; k < PATCH_BYTES; k++) h += dv.getUint8(o + k).toString(16).padStart(2, "0");
  return /^0+$/.test(h) ? null : h;
};

// units (records as the page holds them) → the fragment code. Version 2: version, unit count, then per unit in
// page order its 19 bytes, followed by 12 patch bytes when its byte 18 (synth code) is not 0.
export function encode(units: readonly Unit[]) {
  const us = CompositionSchema.parse(units);
  const order = us.map((u, i) => i).sort((a, b) => us[a].z - us[b].z);
  const rank = new Map(order.map((ui, r) => [ui, r]));
  const packed = us.map((u, i) => pack(u, rank.get(i)!));
  const dv = new DataView(new ArrayBuffer(2 + packed.reduce((n, p) => n + UNIT_BYTES + (p.synth ? PATCH_BYTES : 0), 0)));
  dv.setUint8(0, VERSION);
  dv.setUint8(1, us.length);
  let o = 2;
  for (const p of packed) {
    dv.setUint8(o, p.volume); dv.setUint8(o + 1, p.tubes); dv.setUint8(o + 2, p.wind); dv.setUint8(o + 3, p.decay);
    dv.setUint16(o + 4, p.cutX); dv.setUint8(o + 6, p.q); dv.setUint8(o + 7, p.root); dv.setUint8(o + 8, p.scale);
    dv.setUint16(o + 9, p.voice); dv.setUint8(o + 11, p.flags); dv.setInt16(o + 12, p.x); dv.setInt16(o + 14, p.y);
    dv.setUint8(o + 16, p.rank); dv.setUint8(o + 17, p.instrument); dv.setUint8(o + 18, p.synth);
    o += UNIT_BYTES;
    if (p.synth) {
      for (let k = 0; k < PATCH_BYTES; k++) dv.setUint8(o + k, p.patch ? parseInt(p.patch.slice(2 * k, 2 * k + 2), 16) : 0);
      o += PATCH_BYTES;
    }
  }
  return toB64(new Uint8Array(dv.buffer));
}

// One reader per link version. Version 1 (before external synths) is no longer read: those links are ignored.
// From version 2 on, a new version adds a reader here and keeps the old ones.
const readers: Record<number, (dv: DataView) => ReturnType<typeof unpack>[] | null> = {
  2(dv) {
    const n = dv.getUint8(1);
    if (n < 1 || n > MAX_UNITS) return null;
    const units = [];
    let o = 2;
    for (let i = 0; i < n; i++) {
      if (o + UNIT_BYTES > dv.byteLength) return null;
      const synth = dv.getUint8(o + 18);
      const end = o + UNIT_BYTES + (synth ? PATCH_BYTES : 0);
      if (end > dv.byteLength) return null;
      units.push(unpack({
        volume: dv.getUint8(o), tubes: dv.getUint8(o + 1), wind: dv.getUint8(o + 2), decay: dv.getUint8(o + 3),
        cutX: dv.getUint16(o + 4), q: dv.getUint8(o + 6), root: dv.getUint8(o + 7), scale: dv.getUint8(o + 8),
        voice: dv.getUint16(o + 9), flags: dv.getUint8(o + 11), x: dv.getInt16(o + 12), y: dv.getInt16(o + 14),
        rank: dv.getUint8(o + 16), instrument: dv.getUint8(o + 17), synth, patch: synth ? patchHex(dv, o + UNIT_BYTES) : null,
      }));
      o = end;
    }
    return o === dv.byteLength ? units : null;
  },
};

// the fragment code → checked unit records (without ids), or null when it isn't a composition
export function decode(code: string | null | undefined) {
  const bytes = typeof code === "string" ? fromB64(code) : null;
  if (!bytes || bytes.length < 2) return null;
  const read = readers[bytes[0]];
  const units = read && read(new DataView(bytes.buffer));
  if (!units) return null;
  const r = CompositionSchema.safeParse(units);
  return r.success ? r.data : null;
}

// ---------- saved compositions (dmbk GraphQL API) ----------
// The API stores the packed integers under readable names, scale by name and voice by id (ChimeUnit /
// ChimeUnitInput in schemas/dmbk-graphql-api.graphql). Same conversion as a link, so a loaded composition
// gives the same SHARE link as the one it was saved from. An external synth's unit also carries `patch`; no other
// unit sends one, so a composition without external synths is saved exactly as before they existed (and the API
// still sees it as the same composition).
const SavedUnitSchema = z.object({
  volume: z.int().min(0).max(100), tubes: z.int().min(MIN_TUBES).max(MAX_TUBES), wind: z.int().min(0).max(100),
  decay: z.int().min(3).max(120), cutoff: z.int().min(0).max(1000), resonance: z.int().min(5).max(180),
  root: z.int().min(MIN_ROOT).max(MAX_ROOT), scale: z.enum(SCALE_NAMES), voice: z.string().regex(/^(v\d+|s0:\d+|x:[a-z0-9-]+)$/).nullable(),
  channel: z.int().min(1).max(16), midiMode: z.enum(["POLY", "MONO"]), notes: z.boolean(),
  x: z.int().min(-32768).max(32767), y: z.int().min(-32768).max(32767), rank: z.int().min(0).max(MAX_UNITS - 1),
  instrument: z.enum(["CHIME", "FURIN"]).nullish().transform(v => v ?? "CHIME"), // saves before it have none
  patch: z.string().regex(PATCH_ID).nullish().transform(v => v ?? null), // saves before it have none
});

// units (records as the page holds them) → ChimeUnitInput list for dmbkSoundSaveChimeComposition
export function toSaved(units: readonly Unit[]) {
  const us = CompositionSchema.parse(units);
  const order = us.map((u, i) => i).sort((a, b) => us[a].z - us[b].z);
  const rank = new Map(order.map((ui, r) => [ui, r]));
  return us.map((u, i) => {
    const p = pack(u, rank.get(i)!);
    const unit = {
      volume: p.volume, tubes: p.tubes, wind: p.wind, decay: p.decay, cutoff: p.cutX, resonance: p.q, root: p.root,
      scale: u.scale, voice: p.synth ? synthVoice(p.synth)! : voiceId(p.voice), channel: u.channel,
      midiMode: u.midiMode === "mono" ? "MONO" as const : "POLY" as const,
      notes: u.notes, x: p.x, y: p.y, rank: p.rank, instrument: u.instrument === "furin" ? "FURIN" as const : "CHIME" as const,
    };
    return p.synth ? { ...unit, patch: p.patch } : unit;
  });
}

// ChimeUnit list from the API → checked unit records (without ids), or null when it isn't a composition this
// build can open (an unknown scale, a value out of range, no units or more than 16). A voice of an external synth
// this build doesn't know becomes the default voice rather than refusing the composition.
export function fromSaved(saved: unknown) {
  const r = z.array(SavedUnitSchema).min(1).max(MAX_UNITS).safeParse(saved);
  if (!r.success) return null;
  const units = r.data.map(s => {
    const synth = synthCode(s.voice);
    return unpack({
      volume: s.volume, tubes: s.tubes, wind: s.wind, decay: s.decay, cutX: s.cutoff, q: s.resonance, root: s.root,
      scale: SCALE_NAMES.indexOf(s.scale), voice: synth ? 0 : voiceCode(s.voice),
      flags: (s.channel - 1) | (s.midiMode === "MONO" ? 16 : 0) | (s.notes ? 32 : 0), x: s.x, y: s.y, rank: s.rank,
      instrument: s.instrument === "FURIN" ? 1 : 0, synth, patch: synth ? s.patch : null,
    });
  });
  const c = CompositionSchema.safeParse(units);
  return c.success ? c.data : null;
}

// "#c=<code>" (or "c=<code>") → the code, or null
export function codeFromHash(hash: string | null | undefined) {
  const m = /^#?c=([A-Za-z0-9_-]+)$/.exec(hash || "");
  return m ? m[1] : null;
}

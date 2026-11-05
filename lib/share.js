// Share links: a composition (every unit's settings, position and stacking order) packed into the URL fragment.
// zod checks a unit before it is packed and after it is unpacked; UnitSchema is also the stored-data check.
// No DOM at module top level, so this imports in Node.
import { z } from "zod";
import { SCALE_LIST, MIN_TUBES, MAX_TUBES } from "./engine.js";

export const MAX_UNITS = 16;
const SCALE_NAMES = SCALE_LIST.map(s => s.name);

// ---------- unit record ----------
// The one definition of a unit's fields, ranges and defaults. Each field falls back to its default on its own,
// so one bad value never costs the rest of the unit. SOUND is never carried (audio starts only from a tap).
export const DEFAULTS = {
  volume: 1, tubes: 6, wind: 0.45, decay: 4, cutX: 0.78, q: 3, root: 72, scale: SCALE_NAMES[0], voice: null,
  channel: 1, midiMode: "poly", notes: false, sound: false, x: 0, y: 0, z: 1,
};
const num = (lo, hi, d, round = false) =>
  z.number().transform(v => { const c = Math.min(hi, Math.max(lo, v)); return round ? Math.round(c) : c; }).catch(d);

export const UnitSchema = z.preprocess(r => (r && typeof r === "object" && !Array.isArray(r) ? r : {}), z.object({
  volume: num(0, 1, DEFAULTS.volume),
  tubes: num(MIN_TUBES, MAX_TUBES, DEFAULTS.tubes, true),
  wind: num(0, 1, DEFAULTS.wind),
  decay: num(0.3, 12, DEFAULTS.decay),
  cutX: num(0, 1, DEFAULTS.cutX),
  q: num(0.5, 18, DEFAULTS.q),
  root: num(48, 84, DEFAULTS.root, true),
  scale: z.enum(SCALE_NAMES).catch(DEFAULTS.scale),
  voice: z.string().regex(/^(v\d+|s\d+:\d+)$/).nullable().catch(null),
  channel: num(1, 16, DEFAULTS.channel, true),
  midiMode: z.enum(["poly", "mono"]).catch("poly"),
  notes: z.boolean().transform(v => v === true).catch(false),
  sound: z.literal(false).catch(false),
  x: num(-1e5, 1e5, 0, true),
  y: num(-1e5, 1e5, 0, true),
  z: num(1, 1e6, 1, true),
}));

export const CompositionSchema = z.preprocess(
  us => (Array.isArray(us) ? us.slice(0, MAX_UNITS) : us),
  z.array(UnitSchema).min(1),
);

// ---------- packed form, version 1 ----------
// Integers at each slider's own step. Parsing throws on anything a byte (or two) can't hold exactly.
export const PackedUnitSchema = z.object({
  volume: z.int().min(0).max(100),  // ×100
  tubes: z.int().min(MIN_TUBES).max(MAX_TUBES),
  wind: z.int().min(0).max(100),    // ×100
  decay: z.int().min(3).max(120),   // ×10
  cutX: z.int().min(0).max(1000),   // ×1000
  q: z.int().min(5).max(180),       // ×10
  root: z.int().min(48).max(84),
  scale: z.int().min(0).max(255),   // index in SCALE_LIST
  voice: z.int().min(0).max(65535), // 0 default, 1 + i built-in voice i, 1000 + p GM preset p
  flags: z.int().min(0).max(63),    // bits 0-3 channel - 1, bit 4 MONO, bit 5 NOTES
  x: z.int().min(-32768).max(32767),
  y: z.int().min(-32768).max(32767),
  rank: z.int().min(0).max(MAX_UNITS - 1), // stacking order among the units
}).strict();

const VERSION = 1, UNIT_BYTES = 19;
const i16 = v => Math.max(-32768, Math.min(32767, Math.round(v)));

function voiceCode(v) {
  if (!v) return 0;
  let m = /^v(\d+)$/.exec(v);
  if (m && +m[1] < 999) return 1 + +m[1];
  m = /^s0:(\d+)$/.exec(v);
  if (m && +m[1] <= 65535 - 1000) return 1000 + +m[1];
  return 0;
}
const voiceId = c => (c === 0 ? null : c < 1000 ? "v" + (c - 1) : "s0:" + (c - 1000));

function pack(u, rank) {
  return PackedUnitSchema.parse({
    volume: Math.round(u.volume * 100), tubes: u.tubes, wind: Math.round(u.wind * 100), decay: Math.round(u.decay * 10),
    cutX: Math.round(u.cutX * 1000), q: Math.round(u.q * 10), root: u.root, scale: SCALE_NAMES.indexOf(u.scale),
    voice: voiceCode(u.voice), flags: (u.channel - 1) | (u.midiMode === "mono" ? 16 : 0) | (u.notes ? 32 : 0),
    x: i16(u.x), y: i16(u.y), rank,
  });
}
function unpack(p) {
  return {
    volume: p.volume / 100, tubes: p.tubes, wind: p.wind / 100, decay: p.decay / 10, cutX: p.cutX / 1000, q: p.q / 10,
    root: p.root, scale: SCALE_NAMES[p.scale], voice: voiceId(p.voice), channel: (p.flags & 15) + 1,
    midiMode: p.flags & 16 ? "mono" : "poly", notes: !!(p.flags & 32), x: p.x, y: p.y, z: p.rank + 1,
  };
}

const toB64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function fromB64(s) {
  if (!/^[A-Za-z0-9_-]*$/.test(s)) return null;
  try { return Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)); } catch (e) { return null; }
}

// units (records as the page holds them) → the fragment code
export function encode(units) {
  const us = CompositionSchema.parse(units);
  const order = us.map((u, i) => i).sort((a, b) => us[a].z - us[b].z);
  const rank = new Map(order.map((ui, r) => [ui, r]));
  const dv = new DataView(new ArrayBuffer(2 + UNIT_BYTES * us.length));
  dv.setUint8(0, VERSION);
  dv.setUint8(1, us.length);
  us.forEach((u, i) => {
    const p = pack(u, rank.get(i)), o = 2 + UNIT_BYTES * i;
    dv.setUint8(o, p.volume); dv.setUint8(o + 1, p.tubes); dv.setUint8(o + 2, p.wind); dv.setUint8(o + 3, p.decay);
    dv.setUint16(o + 4, p.cutX); dv.setUint8(o + 6, p.q); dv.setUint8(o + 7, p.root); dv.setUint8(o + 8, p.scale);
    dv.setUint16(o + 9, p.voice); dv.setUint8(o + 11, p.flags); dv.setInt16(o + 12, p.x); dv.setInt16(o + 14, p.y);
    dv.setUint8(o + 16, p.rank);
    // bytes 17-18 are reserved (zero) in version 1
  });
  return toB64(new Uint8Array(dv.buffer));
}

const readers = {
  1(dv) {
    const n = dv.getUint8(1);
    if (n < 1 || n > MAX_UNITS || dv.byteLength !== 2 + UNIT_BYTES * n) return null;
    const units = [];
    for (let i = 0; i < n; i++) {
      const o = 2 + UNIT_BYTES * i;
      units.push(unpack({
        volume: dv.getUint8(o), tubes: dv.getUint8(o + 1), wind: dv.getUint8(o + 2), decay: dv.getUint8(o + 3),
        cutX: dv.getUint16(o + 4), q: dv.getUint8(o + 6), root: dv.getUint8(o + 7), scale: dv.getUint8(o + 8),
        voice: dv.getUint16(o + 9), flags: dv.getUint8(o + 11), x: dv.getInt16(o + 12), y: dv.getInt16(o + 14),
        rank: dv.getUint8(o + 16),
      }));
    }
    return units;
  },
};

// the fragment code → checked unit records (without ids), or null when it isn't a composition
export function decode(code) {
  const bytes = typeof code === "string" ? fromB64(code) : null;
  if (!bytes || bytes.length < 2) return null;
  const read = readers[bytes[0]];
  const units = read && read(new DataView(bytes.buffer));
  if (!units) return null;
  const r = CompositionSchema.safeParse(units);
  return r.success ? r.data : null;
}

// "#c=<code>" (or "c=<code>") → the code, or null
export function codeFromHash(hash) {
  const m = /^#?c=([A-Za-z0-9_-]+)$/.exec(hash || "");
  return m ? m[1] : null;
}

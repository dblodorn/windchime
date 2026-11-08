// Six Tube Chime engine: raster drawing, wind/clapper physics, audio (Tone.js + SF2 sampler) and MIDI export.
// Browser-only. Make a chime with createChime() and call its attach() inside an effect; every attached
// chime is stepped and drawn by one shared loop and plays through one shared output stage.

export const W = 200, H = 200;
// scratch raster: each chime draws into it in turn, then presents it to its own canvas
const buf = new Uint8Array(W * H);
function px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < W && y >= 0 && y < H) buf[y * W + x] = c; }
function line(x0, y0, x1, y1, c = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    px(x0, y0, c);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
// The figure is computed in the original 192x232 three-quarter projection and mapped onto the
// 200x200 paper by one scale (K, set from measured extents: fits at rest and in 99% of frames at WIND 0.45).
const K = 0.8, TOP = 0;
const toX = x => 100 + (x - 96) * K, toY = y => TOP + y * K;
const OX0 = 96 - 100 / K, OX1 = 96 + 100 / K;   // paper edges in projection space
function seg(x0, y0, x1, y1) { line(toX(x0), toY(y0), toX(x1), toY(y1)); }
// closed ellipse as n straight segments
function outline(cx, cy, rx, ry, n) {
  let x0 = cx + rx, y0 = cy;
  for (let k = 1; k <= n; k++) { const a = k / n * Math.PI * 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; seg(x0, y0, x, y); x0 = x; y0 = y; }
}
function present(ch) {
  if (!ch.ctx2d) return;
  const d = ch.img.data;
  for (let i = 0, j = 0; i < buf.length; i++, j += 4) { const v = buf[i] ? 0 : 255; d[j] = d[j + 1] = d[j + 2] = v; d[j + 3] = 255; }
  ch.ctx2d.putImageData(ch.img, 0, 0);
}

// ---------- pitch and scales ----------
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const noteName = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);
export const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
export const cutoffHz = x => 60 * Math.pow(2, x * 8);
// Share links store a scale by its index in SCALE_LIST: only append scales (reordering or removing needs a new
// link version in lib/share.js that maps the old indices).
const SCALES = [
  ["Japan and Okinawa", [
    ["RYUKYU", [0, 4, 5, 7, 11]],
    ["IN-SEN", [0, 1, 5, 7, 10]],
    ["HIRAJOSHI", [0, 2, 3, 7, 8]],
    ["IWATO", [0, 1, 5, 6, 10]],
    ["YO", [0, 2, 5, 7, 9]],
    ["KUMOI", [0, 2, 3, 7, 9]],
    ["MIYAKO-BUSHI", [0, 1, 5, 7, 8]],
  ]],
  ["Korea", [
    ["PYEONGJO", [0, 2, 5, 7, 9]],
    ["UJO", [0, 2, 5, 7, 9]],
    ["GYEMYEONJO", [0, 3, 5, 7, 10]],
    ["PYEONGJO HEXATONIC", [0, 2, 5, 7, 9, 10]],
    ["NANDO-GYEMYEONJO", [0, 2, 3, 5, 7]],
  ]],
  ["Pentatonic", [
    ["MAJOR PENTATONIC", [0, 2, 4, 7, 9]],
    ["MINOR PENTATONIC", [0, 3, 5, 7, 10]],
    ["EGYPTIAN", [0, 2, 5, 7, 10]],
    ["PELOG (12-TET)", [0, 1, 3, 7, 8]],
    ["CHINESE GONG", [0, 2, 4, 7, 9, 12, 14]],
  ]],
  ["Hexatonic", [
    ["BLUES", [0, 3, 5, 6, 7, 10]],
    ["WHOLE TONE", [0, 2, 4, 6, 8, 10]],
    ["AUGMENTED", [0, 3, 4, 7, 8, 11]],
    ["PROMETHEUS", [0, 2, 4, 6, 9, 10]],
    ["TRITONE", [0, 1, 4, 6, 7, 10]],
  ]],
  ["Modes and maqam", [
    ["DORIAN", [0, 2, 3, 5, 7, 9, 10]],
    ["LYDIAN", [0, 2, 4, 6, 7, 9, 11]],
    ["MIXOLYDIAN", [0, 2, 4, 5, 7, 9, 10]],
    ["HARMONIC MINOR", [0, 2, 3, 5, 7, 8, 11]],
    ["HIJAZ", [0, 1, 4, 5, 7, 8, 10]],
    ["DOUBLE HARMONIC", [0, 1, 4, 5, 7, 8, 11]],
  ]],
  ["Chords and series", [
    ["MAJOR 9", [0, 4, 7, 11, 14, 16]],
    ["MINOR 11", [0, 3, 7, 10, 14, 17]],
    ["QUARTAL", [0, 5, 10, 15, 20, 25]],
    ["HARMONIC SERIES 4-9", [0, 7, 12, 16, 19, 22]],
  ]],
];
export { SCALES };
export const SCALE_LIST = SCALES.flatMap(([group, items]) => items.map(([name, deg]) => ({ group, name, deg })));
// the first n notes of a scale, one per tube; a shorter scale wraps around an octave up
export function tubeNotes(deg, n) {
  const out = [];
  for (let k = 0; out.length < n; k++) out.push(deg[k % deg.length] + 12 * Math.floor(k / deg.length));
  return out;
}

// ---------- parameters (each chime has its own, changed with its setParams) ----------
const defaultParams = () => ({ volume: 1, wind: 0.45, decay: 4, cutX: 0.78, cutoff: cutoffHz(0.78), q: 3, root: 72, tubes: 6, scale: tubeNotes(SCALE_LIST[0].deg, 6), output: { first: 0, count: 2 } });

// ---------- geometry ----------
const CX = 96, RING_Y = 22, R = 58, Z = 0.3, STR = 8;
const STRIKER_Y = RING_Y + 66, RS = 16, RT = 3.5, SAIL_Y = RING_Y + 128;
export const MIN_TUBES = 2, MAX_TUBES = 8;
const clampTubes = n => Math.max(MIN_TUBES, Math.min(MAX_TUBES, Math.round(n) || 6));
// Tube i of n hangs at start(n) + i·2π/n. Each count's start angle spreads the tubes widest on screen
// (through the YAW view); 6 keeps the original layout exactly.
const START = { 2: -20, 3: -50, 4: -38.5, 5: -74, 7: -58.5, 8: -73 };
const layouts = {};
function layout(n) {
  if (!layouts[n]) {
    const a0 = n === 6 ? -Math.PI / 2 + Math.PI / 6 : START[n] * Math.PI / 180;
    const ang = Array.from({ length: n }, (_, i) => a0 + i * 2 * Math.PI / n);
    layouts[n] = { n, ang, rest: ang.map(a => ({ x: Math.cos(a) * R, z: Math.sin(a) * R })) };
  }
  return layouts[n];
}
const offsetOf = (P, i) => P.scale[i % P.scale.length];
function tubeLen(P, i) { return 118 * Math.sqrt(mtof(P.root) / mtof(P.root + offsetOf(P, i))); }

// ---------- simulation ----------
function rngFrom(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function makeSim(seed, n = 6) {
  const lay = layout(n);
  const rnd = rngFrom(seed);
  const gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
  return { t: 0, rnd, gauss, s: { x: 0, z: 0, vx: 0, vz: 0 }, F: { x: 0, z: 0 }, phi: rnd() * Math.PI * 2, g: 0,
    lay, tubes: lay.rest.map(restTube) };
}
const restTube = () => ({ dx: 0, dz: 0, vx: 0, vz: 0, cool: 0, env: 0 });
// A new tube count: tubes 1..min(old, new) keep their motion, new ones start at rest; the wind, clapper, sail and
// random stream carry on. Every tube waits one cooldown, so a tube moved onto the clapper doesn't strike.
function resize(sim, n) {
  sim.lay = layout(n);
  sim.tubes = sim.lay.rest.map((_, i) => sim.tubes[i] || restTube());
  for (const tb of sim.tubes) tb.cool = Math.max(tb.cool, 0.08);
}
const KS = 10, CS = 0.45, KT = 30, CT = 1.1, MS = 1, MT = 0.5, E = 0.6, TAU = 0.6;
function step(sim, P, dt, onHit) {
  const w = Math.sqrt(P.wind), sq = Math.sqrt(dt);
  sim.phi += 0.25 * sq * sim.gauss();
  sim.g += (-sim.g / 4) * dt + 0.5 * Math.sqrt(2 / 4) * sq * sim.gauss();
  const mag = w * 300 * Math.max(0.1, 1 + sim.g);
  const mx = Math.cos(sim.phi) * mag, mz = Math.sin(sim.phi) * mag;
  const sd = w * 260, sig = sd * Math.sqrt(2 / TAU);
  sim.F.x += ((mx - sim.F.x) / TAU) * dt + sig * sq * sim.gauss();
  sim.F.z += ((mz - sim.F.z) / TAU) * dt + sig * sq * sim.gauss();
  const s = sim.s;
  s.vx += (sim.F.x - KS * s.x - CS * s.vx) * dt; s.vz += (sim.F.z - KS * s.z - CS * s.vz) * dt;
  s.x += s.vx * dt; s.z += s.vz * dt;
  const fall = Math.exp(-dt * 6.91 / P.decay), rest = sim.lay.rest;
  sim.tubes.forEach((tb, i) => {
    tb.vx += (0.06 * sim.F.x - KT * tb.dx - CT * tb.vx) * dt; tb.vz += (0.06 * sim.F.z - KT * tb.dz - CT * tb.vz) * dt;
    tb.dx += tb.vx * dt; tb.dz += tb.vz * dt;
    tb.cool -= dt; tb.env *= fall;
    const tx = rest[i].x + tb.dx, tz = rest[i].z + tb.dz;
    let nx = s.x - tx, nz = s.z - tz; const d = Math.hypot(nx, nz), min = RS + RT;
    if (d < min && d > 1e-6) {
      nx /= d; nz /= d;
      const vr = (s.vx - tb.vx) * nx + (s.vz - tb.vz) * nz;
      const push = (min - d);
      s.x += nx * push * 0.67; s.z += nz * push * 0.67; tb.dx -= nx * push * 0.33; tb.dz -= nz * push * 0.33;
      if (vr < 0) {
        const j = -(1 + E) * vr / (1 / MS + 1 / MT);
        s.vx += j / MS * nx; s.vz += j / MS * nz; tb.vx -= j / MT * nx; tb.vz -= j / MT * nz;
        if (-vr > 2 && tb.cool <= 0) {
          const vel = Math.max(1, Math.min(127, Math.round(24 + -vr * 1.1)));
          tb.cool = 0.08; tb.env = Math.max(tb.env, vel / 127);
          onHit(i, vel, sim.t);
        }
      }
    }
  });
  sim.t += dt;
}

// ---------- drawing ----------
function makeStreaks() {
  return Array.from({ length: 30 }, () => ({ x: OX0 + Math.random() * (OX1 - OX0), y: 12 + Math.random() * (H / K - 24), len: 3 + Math.floor(Math.random() * 7) }));
}
// Single-pixel lines only, no fills, so nothing hides anything else and no depth sort is needed.
function draw(ch) {
  buf.fill(0);
  const n = Math.round(ch.P.wind * ch.streaks.length);
  for (let k = 0; k < n; k++) { const st = ch.streaks[k]; seg(st.x, st.y, st.x + st.len, st.y); }
  // hook and ring
  seg(CX, 0, CX, RING_Y - (R + 4) * Z);
  outline(CX, RING_Y, R + 4, (R + 4) * Z, 24);
  ch.sim.tubes.forEach((tb, i) => drawTube(tubeGeom(ch.P, ch.sim.lay, i, tb)));
  drawStriker(ch.sim);
  present(ch);
}
// The camera is turned YAW about the vertical axis so no two tubes share a screen x (drawing only; the sim is untouched).
const YAW = 20 * Math.PI / 180, CYAW = Math.cos(YAW), SYAW = Math.sin(YAW);
const view = (x, z) => [x * CYAW - z * SYAW, x * SYAW + z * CYAW];
// string attach point on the ring, tube top and bottom, in projection space
function tubeGeom(P, lay, i, tb) {
  const a = lay.ang[i], L = tubeLen(P, i), rest = lay.rest;
  const [ax, az] = view(Math.cos(a) * (R + 4) * 0.9, Math.sin(a) * (R + 4) * 0.9);
  const [tx, tz] = view(rest[i].x + tb.dx * 0.35, rest[i].z + tb.dz * 0.35);
  const [bx, bz] = view(rest[i].x + tb.dx * 1.4, rest[i].z + tb.dz * 1.4);
  return {
    ax: CX + ax, ay: RING_Y + az * Z,
    tx: CX + tx, ty: RING_Y + tz * Z + STR, bx: CX + bx, by: RING_Y + bz * Z + STR + L,
  };
}
// a tube: its string, then an outlined body as wide as the sim's tube (2·RT), open inside
function drawTube(g) {
  seg(g.ax, g.ay, g.tx, g.ty);
  seg(g.tx - RT, g.ty, g.bx - RT, g.by); seg(g.tx + RT, g.ty, g.bx + RT, g.by);
  seg(g.tx - RT, g.ty, g.tx + RT, g.ty); seg(g.bx - RT, g.by, g.bx + RT, g.by);
}
function drawStriker(sim) {
  const [vx, vz] = view(sim.s.x, sim.s.z), sx = CX + vx, sy = STRIKER_Y + vz * Z, ry = RS * Z * 0.6;
  seg(CX, RING_Y, sx, sy - ry);
  outline(sx, sy, RS, ry, 16);
  const ang = Math.atan2(sim.F.z, sim.F.x) + YAW;
  const qx = CX + vx * 1.45, qy = SAIL_Y + vz * 1.45 * Z, hw = 2 + 11 * Math.abs(Math.cos(ang)), sh = 36;
  seg(sx, sy + ry, qx, qy);
  const sail = [[qx - hw, qy], [qx + hw, qy], [qx + hw, qy + sh], [qx - hw, qy + sh]];
  for (let k = 0; k < 4; k++) seg(sail[k][0], sail[k][1], sail[(k + 1) % 4][0], sail[(k + 1) % 4][1]);
}

// ---------- audio ----------
// Chain: a chime's voices -> its input gain (VOLUME while its SOUND is on, else 0) -> its Tone low-pass filter
// (FREQUENCY = cutoff, RESONANCE = Q) -> its router -> the bus of its channel pair (compressor -> gain -> splitter)
// -> one channel merger -> the device's N discrete channels. Buses are made only for pairs a chime uses.
let Tone = null, actx = null, master = null, muted = false;
const sounding = new Set(); // chimes with SOUND on
const graphs = new Set();   // chimes with an audio graph (their routers follow the device's channel count)
const MAX_OUT = 32;
let sinkId = "", sinkListed = false, outN = 2, merger = null;
const buses = new Map();     // pair index k (channels 2k+1, 2k+2) -> { comp, split }
const outListeners = new Set();
export const VOICES = [
  { id: "tubular", name: "TUBULAR BELLS", gm: 14, partials: [1, 2.756, 5.404, 8.933], amps: [1, 0.55, 0.3, 0.16], dmul: 1, pd: 1.2, chorus: true },
  { id: "glock", name: "GLOCKENSPIEL", gm: 9, partials: [1, 2.756, 5.404], amps: [1, 0.4, 0.2], dmul: 0.45, pd: 1.5, oct: 12 },
  { id: "vibes", name: "VIBRAPHONE", gm: 11, partials: [1, 4, 10], amps: [1, 0.25, 0.08], dmul: 0.9, pd: 2, trem: true },
  { id: "musicbox", name: "MUSIC BOX", gm: 10, partials: [1, 2, 3, 4.2], amps: [1, 0.35, 0.15, 0.1], dmul: 0.3, pd: 1, oct: 12 },
  { id: "bamboo", name: "BAMBOO (WOODBLOCK)", gm: 115, partials: [1, 2.32, 4.25, 6.8], amps: [1, 0.6, 0.35, 0.2], dmul: 0.05, pd: 0.5, oct: -12 },
  { id: "fm", name: "FM CRYSTAL", gm: 98, fm: true },
];
export const GM_FAMILIES = ["PIANO", "CHROMATIC PERCUSSION", "ORGAN", "GUITAR", "BASS", "STRINGS", "ENSEMBLE", "BRASS", "REED", "PIPE",
  "SYNTH LEAD", "SYNTH PAD", "SYNTH EFFECTS", "ETHNIC", "PERCUSSIVE", "SOUND EFFECTS"];
export const fonts = [];

// value: "v<index>" for a built-in voice, "s<font>:<preset>" for a soundfont preset; null when the preset doesn't exist
function voiceFor(value) {
  if (value && value[0] === "s") {
    const [fi, pi] = value.slice(1).split(":").map(Number), f = fonts[fi];
    if (!f || !f.presets[pi]) return null;
    return { voice: null, sfPreset: f.presets[pi], sfRegions: resolvePreset(f, pi) };
  }
  return { voice: VOICES[+String(value || "v0").slice(1)] || VOICES[0], sfPreset: null, sfRegions: null };
}
export function findPreset(fi, bank, prog) { return fonts[fi] ? fonts[fi].presets.findIndex(p => p.bank === bank && p.preset === prog) : -1; }
// a whole .sf2 in memory (every sample present); loadFont below fetches the bundled one in pieces
export function addFont(arrayBuffer, name, gm = false) {
  const f = parseSF2(arrayBuffer, name); f.gm = gm; f.all = true;
  if (gm) fonts.unshift(f); else fonts.push(f);
  return f;
}

let unlockEl = null;
function silentWav() {
  const n = 4410, b = new DataView(new ArrayBuffer(44 + n * 2));
  const s = (o, t) => [...t].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
  s(0, "RIFF"); b.setUint32(4, 36 + n * 2, true); s(8, "WAVEfmt "); b.setUint32(16, 16, true); b.setUint16(20, 1, true); b.setUint16(22, 1, true);
  b.setUint32(24, 44100, true); b.setUint32(28, 88200, true); b.setUint16(32, 2, true); b.setUint16(34, 16, true); s(36, "data"); b.setUint32(40, n * 2, true);
  let bin = ""; new Uint8Array(b.buffer).forEach(x => bin += String.fromCharCode(x));
  return "data:audio/wav;base64," + btoa(bin);
}
function unlockAudio() {
  // iOS: ask for the playback session so the ring/silent switch does not mute web audio
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
  // older iOS: a looping silent media element moves the page into the playback category
  try {
    if (!unlockEl) { unlockEl = new Audio(silentWav()); unlockEl.loop = true; unlockEl.setAttribute("playsinline", ""); }
    const p = unlockEl.play(); if (p) p.catch(() => {});
  } catch (e) {}
  try { const sb = actx.createBufferSource(); sb.buffer = actx.createBuffer(1, 1, 22050); sb.connect(actx.destination); sb.start(0); } catch (e) {}
}
// Load Tone.js ahead of the first tap so the tap itself can start audio (Safari needs that).
export function preloadAudio() { if (!Tone) import("tone").then(m => { Tone = m; }).catch(() => {}); }
// ---------- output device and channels ----------
// OUTPUT "1-2", "3-4", … (a pair) or "1", "2", … (one channel) -> { first, count } (first is 0-based)
export function outputOf(s) {
  const m = /^(\d+)(?:-(\d+))?$/.exec(String(s || ""));
  return m ? { first: +m[1] - 1, count: m[2] ? 2 : 1 } : { first: 0, count: 2 };
}
export function audioOutSupported() { return typeof AudioContext !== "undefined" && "setSinkId" in AudioContext.prototype; }
const channelsNow = () => Math.max(1, Math.min(MAX_OUT, actx.destination.maxChannelCount || 2));
// the device's channel count, or null before audio has started
export function outputChannels() { return actx ? outN : null; }
// listeners get the channel count when audio starts and whenever it changes; returns the unsubscribe
export function onOutputChange(fn) { outListeners.add(fn); return () => outListeners.delete(fn); }
// "" is the system default. Before audio starts it is only remembered: startAudio opens the context on it when
// `listed` (the browser lists that device now), and switches to it right after otherwise, since an unknown id in
// the constructor breaks the context instead of failing.
export async function setAudioDevice(id, { listed = false } = {}) {
  sinkId = id || ""; sinkListed = !!(sinkId && listed);
  if (!actx || !actx.setSinkId) return;
  try { await actx.setSinkId(sinkId); } catch (e) { console.warn("audio device", e); }
  refreshOutput();
}
function bus(k) {
  if (buses.has(k)) return buses.get(k);
  const comp = actx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.25;
  const gain = actx.createGain(), split = actx.createChannelSplitter(2);
  gain.gain.value = 0.85;
  comp.connect(gain); gain.connect(split);
  const b = { comp, split };
  buses.set(k, b);
  wireBus(k, b);
  return b;
}
function wireBus(k, b) {
  if (2 * k < outN) b.split.connect(merger, 0, 2 * k);
  if (2 * k + 1 < outN) b.split.connect(merger, 1, 2 * k + 1);
}
// one merger input per device channel, nothing up- or down-mixed on the way out
function buildMerger() {
  if (merger) merger.disconnect();
  buses.forEach(b => b.split.disconnect());
  const d = actx.destination;
  d.channelCount = outN; d.channelCountMode = "explicit"; d.channelInterpretation = "discrete";
  merger = actx.createChannelMerger(outN);
  merger.connect(d);
  buses.forEach((b, k) => wireBus(k, b));
}
// where a chime is heard: its OUTPUT, or 1-2 when the device doesn't have those channels
function effectiveOutput(ch) {
  const o = ch.P.output;
  return o.first + o.count <= outN ? o : { first: 0, count: Math.min(2, outN) };
}
// connect the filter to its bus: a pair directly, one channel through a mono fold into one side of its pair's bus
function route(ch) {
  const g = ch.graph, o = effectiveOutput(ch), key = o.first + ":" + o.count;
  if (g.routed === key) return;
  g.filter.disconnect();
  if (g.mono) { g.mono.disconnect(); g.pick.disconnect(); }
  const b = bus(o.first >> 1);
  if (o.count === 2) Tone.connect(g.filter, b.comp);
  else {
    if (!g.mono) {
      g.mono = actx.createGain();
      g.mono.channelCount = 1; g.mono.channelCountMode = "explicit"; g.mono.channelInterpretation = "speakers";
      g.pick = actx.createChannelMerger(2);
    }
    Tone.connect(g.filter, g.mono);
    g.mono.connect(g.pick, 0, o.first & 1);
    g.pick.connect(b.comp);
  }
  g.routed = key;
}
function refreshOutput() {
  if (!actx) return;
  const n = channelsNow(), changed = n !== outN;
  if (changed) { outN = n; buildMerger(); }
  graphs.forEach(route);
  if (changed) outListeners.forEach(fn => fn(outN));
}
function setupOutput() {
  actx = Tone.getContext().rawContext;
  outN = channelsNow();
  buildMerger();
  if (actx.addEventListener) actx.addEventListener("sinkchange", refreshOutput);
  master = merger;
  outListeners.forEach(fn => fn(outN));
}
// Must be called from a click/tap handler: it unlocks and resumes audio synchronously inside the tap, then waits.
export async function startAudio() {
  if (!Tone) Tone = await import("tone");
  if (!master) {
    // our own context, so it can open on the chosen device (setSinkId lives on the native context)
    const opts = { latencyHint: "interactive" };
    if (sinkListed && audioOutSupported()) opts.sinkId = sinkId;
    let ctx;
    try { ctx = new AudioContext(opts); } catch (e) { ctx = new AudioContext({ latencyHint: "interactive" }); }
    Tone.setContext(new Tone.Context(ctx));
    setupOutput();
    // a browser that ignored (or refused) the option still gets the device
    if (sinkId && ctx.setSinkId && ctx.sinkId !== sinkId) setAudioDevice(sinkId);
  }
  unlockAudio();
  const started = Promise.resolve(Tone.start()).catch(() => {});
  const resumed = Promise.resolve(actx.resume()).catch(() => {});
  await Promise.all([started, resumed]);
}
// Silence the browser's own sound for every chime (for example while a MIDI device plays the notes) without stopping anything.
export function setMuted(m) { muted = !!m; }

function buildGraph(ch) {
  const input = actx.createGain();
  input.gain.value = 0;
  const filter = new Tone.Filter({ type: "lowpass", frequency: ch.P.cutoff, Q: ch.P.q, rolloff: -12 });
  Tone.connect(input, filter);
  ch.graph = { input, filter, fm: null, mono: null, pick: null, routed: "" };
  graphs.add(ch);
  route(ch);
}
// ramp the input gain to VOLUME (SOUND on) or 0 over about 40 ms, so a VOLUME drag doesn't click
function level(ch) {
  if (!ch.graph) return;
  const g = ch.graph.input.gain;
  g.cancelScheduledValues(actx.currentTime);
  g.setTargetAtTime(ch.sound ? ch.P.volume : 0, actx.currentTime, 0.013);
}
function fmFor(ch) {
  if (ch.graph.fm) return ch.graph.fm;
  const fm = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3.01, modulationIndex: 12,
    oscillator: { type: "sine" }, modulation: { type: "sine" },
    envelope: { attack: 0.002, decay: 2, sustain: 0, release: 1 },
    modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0, release: 0.5 },
  });
  fm.maxPolyphony = 24;
  fm.volume.value = -10;
  fm.connect(ch.graph.input);
  return (ch.graph.fm = fm);
}
// a silent chime (SOUND off, VOLUME 0 or muted) schedules nothing
function ring(ch, i, vel) {
  const P = ch.P;
  if (muted || !ch.sound || !(P.volume > 0) || !ch.graph || actx.state !== "running") return;
  const n = P.root + offsetOf(P, i), t = actx.currentTime + 0.005;
  if (ch.sfRegions) return playSF(ch, n, vel, t);
  playVoice(ch, ch.voice, n, vel, t);
}
// a built-in voice: additive partials, or the FM synth
function playVoice(ch, voice, n, vel, t) {
  const P = ch.P, bus = ch.graph.input;
  if (voice.fm) {
    const fm = fmFor(ch);
    fm.set({ envelope: { decay: P.decay, release: P.decay * 0.3 }, modulationEnvelope: { decay: Math.min(1.5, P.decay * 0.25) } });
    fm.triggerAttackRelease(mtof(n), P.decay, Tone.now() + 0.005, vel / 127);
    return;
  }
  const f0 = mtof(n + (voice.oct || 0)), amp = Math.pow(vel / 127, 1.4) * 0.2, D = Math.max(0.08, P.decay * voice.dmul);
  voice.partials.forEach((r, k) => {
    const f = f0 * r; if (f > actx.sampleRate * 0.45) return;
    const a = amp * voice.amps[k], T = D / (1 + k * voice.pd);
    const dets = voice.chorus && k === 0 ? [1, 1.0009] : [1];
    dets.forEach((dt, vi) => {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = f * dt;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vi ? a * 0.4 : a, t + 0.003);
      g.gain.setTargetAtTime(0, t + 0.003, T / 6.91);
      let last = g;
      if (voice.trem && k === 0) {
        const lfo = actx.createOscillator(), lg = actx.createGain(), tg = actx.createGain();
        lfo.frequency.value = 5.5; lg.gain.value = 0.35; tg.gain.value = 0.65;
        lfo.connect(lg); lg.connect(tg.gain); g.connect(tg); last = tg;
        lfo.start(t); lfo.stop(t + T + 0.3);
      }
      o.connect(g); last.connect(bus); o.start(t); o.stop(t + T + 0.3);
    });
  });
}
// ---------- SF2 sampler ----------
function parseSF2(ab, fileName) {
  const dv = new DataView(ab);
  const str = (o, n) => { let s = ""; for (let i = 0; i < n; i++) { const c = dv.getUint8(o + i); if (!c) break; s += String.fromCharCode(c); } return s.trim(); };
  if (str(0, 4) !== "RIFF" || str(8, 4) !== "sfbk") throw new Error("This file is not a SoundFont 2 (.sf2) file.");
  const ch = {};
  (function walk(o, end) {
    while (o + 8 <= end) {
      const id = str(o, 4), size = dv.getUint32(o + 4, true);
      if (id === "LIST") walk(o + 12, Math.min(end, o + 8 + size)); else ch[id] = { o: o + 8, size };
      o += 8 + size + (size & 1);
    }
  })(12, Math.min(ab.byteLength, 8 + dv.getUint32(4, true)));
  for (const k of ["smpl", "phdr", "pbag", "pgen", "inst", "ibag", "igen", "shdr"]) if (!ch[k]) throw new Error("The .sf2 file is missing its " + k + " chunk.");
  const rec = (id, sz, fn) => { const c = ch[id], out = []; for (let i = 0; i + sz <= c.size; i += sz) out.push(fn(c.o + i)); return out; };
  const gen = o => ({ op: dv.getUint16(o, true), lo: dv.getUint8(o + 2), hi: dv.getUint8(o + 3), s: dv.getInt16(o + 2, true), u: dv.getUint16(o + 2, true) });
  const phdr = rec("phdr", 38, o => ({ name: str(o, 20), preset: dv.getUint16(o + 20, true), bank: dv.getUint16(o + 22, true), bag: dv.getUint16(o + 24, true) }));
  const inst = rec("inst", 22, o => ({ name: str(o, 20), bag: dv.getUint16(o + 20, true) }));
  const shdr = rec("shdr", 46, o => ({ name: str(o, 20), start: dv.getUint32(o + 20, true), end: dv.getUint32(o + 24, true), ls: dv.getUint32(o + 28, true), le: dv.getUint32(o + 32, true),
    rate: dv.getUint32(o + 36, true), root: dv.getUint8(o + 40), corr: dv.getInt8(o + 41), type: dv.getUint16(o + 44, true) }));
  return { ab, fileName, cache: new Map(), smpl: ch.smpl, phdr, inst, shdr, presets: phdr.slice(0, -1),
    pbag: rec("pbag", 4, o => dv.getUint16(o, true)), pgen: rec("pgen", 4, gen),
    ibag: rec("ibag", 4, o => dv.getUint16(o, true)), igen: rec("igen", 4, gen) };
}
function zonesOf(bags, gens, from, to) {
  const zs = [];
  for (let b = from; b < to; b++) { const z = {}; for (let g = bags[b]; g < (bags[b + 1] ?? gens.length); g++) z[gens[g].op] = gens[g]; zs.push(z); }
  return zs;
}
function resolvePreset(f, pi) {
  const pz = zonesOf(f.pbag, f.pgen, f.phdr[pi].bag, f.phdr[pi + 1].bag);
  const pg = pz.length && !pz[0][41] ? pz.shift() : {};
  const regions = [];
  const range = (z, op) => z[op] ? [z[op].lo, z[op].hi] : null;
  for (const z of pz) {
    if (!z[41]) continue;
    const pzm = { ...pg, ...z }, ii = z[41].u;
    if (!f.inst[ii + 1]) continue;
    const iz = zonesOf(f.ibag, f.igen, f.inst[ii].bag, f.inst[ii + 1].bag);
    const ig = iz.length && !iz[0][53] ? iz.shift() : {};
    const pk = range(pzm, 43) || [0, 127], pv = range(pzm, 44) || [0, 127];
    for (const zz of iz) {
      if (!zz[53]) continue;
      const m = { ...ig, ...zz }, s = f.shdr[m[53].u];
      if (!s || (s.type & 0x8000)) continue;
      const ik = range(m, 43) || [0, 127], iv = range(m, 44) || [0, 127];
      const rootOv = m[58] && m[58].s >= 0 ? m[58].s : -1;
      regions.push({
        kl: Math.max(pk[0], ik[0]), kh: Math.min(pk[1], ik[1]), vl: Math.max(pv[0], iv[0]), vh: Math.min(pv[1], iv[1]),
        f, si: m[53].u, s, root: rootOv >= 0 ? rootOv : (s.root > 127 ? 60 : s.root),
        tune: ((m[51]?.s || 0) + (pzm[51]?.s || 0)) * 100 + (m[52]?.s || 0) + (pzm[52]?.s || 0),
        att: (m[48]?.s || 0) + (pzm[48]?.s || 0),
        pan: Math.max(-500, Math.min(500, (m[17]?.s || 0) + (pzm[17]?.s || 0))),
        loop: [1, 3].includes((m[54]?.u || 0) & 3),
      });
    }
  }
  return regions;
}
function sampleBuffer(r) {
  const f = r.f;
  if (f.cache.has(r.si)) return f.cache.get(r.si);
  const s = r.s, len = Math.max(1, s.end - s.start), off = f.smpl.o + s.start * 2;
  const pcm = new Int16Array(f.ab.slice(off, off + len * 2));
  const rate = Math.min(192000, Math.max(8000, s.rate || 44100));
  const b = actx.createBuffer(1, len, rate), d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = pcm[i] / 32768;
  f.cache.set(r.si, b);
  return b;
}
// ---------- SF2 loading ----------
// The bundled font is fetched in pieces with HTTP range requests into one buffer of the file's full size, so
// parseSF2 / sampleBuffer read it at the usual offsets: the header and the pdta tables (presets, instruments, sample
// headers; at the end of the file) on load, and each sample only when a sounding chime needs it. f.loaded holds the
// sample indices whose bytes are in, f.pending the downloads in flight; f.all means the whole file is in (a server
// that ignores Range, or addFont).
const HEAD = 4096, MERGE_GAP = 16384;
const hasSample = r => r.f.all || r.f.loaded.has(r.si);
async function getRange(url, from, to, signal) {
  const res = await fetch(url, { headers: { Range: `bytes=${from}-${to}` }, signal });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const ab = await res.arrayBuffer();
  if (res.status !== 206) return { whole: ab };
  const m = /\/(\d+)\s*$/.exec(res.headers.get("Content-Range") || "");
  return { ab, total: m ? +m[1] : NaN };
}
function installFont(f, name, url, signal) {
  Object.assign(f, { gm: true, url, signal, loaded: new Set(), pending: new Map() });
  const at = fonts.findIndex(g => g.gm);
  if (at >= 0) fonts.splice(at, 1);
  fonts.unshift(f);
  return f;
}
// Fetch the font's header and tables (about 205 KB of the bundled 6 MB); samples come later through loadSamples.
export async function loadFont(url, name, { signal } = {}) {
  const whole = ab => { const f = installFont(parseSF2(ab, name), name, url, signal); f.all = true; return f; };
  let r = await getRange(url, 0, HEAD - 1, signal);
  if (r.whole) return whole(r.whole);
  const total = r.total;
  if (!(total > 12)) throw new Error(`${url}: no Content-Range`);
  const buf = new Uint8Array(total);
  buf.set(new Uint8Array(r.ab), 0);
  const got = [[0, r.ab.byteLength]], has = (a, b) => got.some(([x, y]) => a >= x && b <= y);
  const dv = new DataView(buf.buffer), id = o => String.fromCharCode(buf[o], buf[o + 1], buf[o + 2], buf[o + 3]);
  // Walk the top-level chunks for the pdta list. A chunk header just past the bytes we have (a long INFO) gets the
  // next few KB; one further on (past the samples) is the start of the tables, so fetch from there to the end.
  let o = 12, pdta = -1;
  while (pdta < 0) {
    if (o + 12 > total) throw new Error(`${url}: no pdta chunk`);
    if (!has(o, o + 12)) {
      const to = o < 4 * HEAD ? Math.min(total, o + HEAD) : total;
      r = await getRange(url, o, to - 1, signal);
      if (r.whole) return whole(r.whole);
      buf.set(new Uint8Array(r.ab), o);
      got.push([o, o + r.ab.byteLength]);
    }
    const size = dv.getUint32(o + 4, true);
    if (id(o) === "LIST" && id(o + 8) === "pdta") pdta = o;
    else o += 8 + size + (size & 1);
  }
  if (!has(pdta, total)) {
    r = await getRange(url, pdta, total - 1, signal);
    if (r.whole) return whole(r.whole);
    buf.set(new Uint8Array(r.ab), pdta);
  }
  return installFont(parseSF2(buf.buffer, name), name, url, signal);
}
// Fetch the samples these regions use that aren't in yet: nearby byte ranges are merged into one request, each
// sample is fetched once, and a failed download is forgotten so the next call tries again. Never rejects.
export function loadSamples(regions) {
  const f = regions && regions.length ? regions[0].f : null;
  if (!f || f.all) return Promise.resolve();
  const waits = new Set(), need = new Map();
  for (const r of regions) {
    if (f.loaded.has(r.si)) continue;
    if (f.pending.has(r.si)) waits.add(f.pending.get(r.si));
    else need.set(r.si, [f.smpl.o + r.s.start * 2, f.smpl.o + Math.max(r.s.start + 1, r.s.end) * 2]);
  }
  const runs = [];
  for (const [si, [a, b]] of [...need].sort((x, y) => x[1][0] - y[1][0])) {
    const l = runs[runs.length - 1];
    if (l && a - l.to < MERGE_GAP) { l.to = Math.max(l.to, b); l.sis.push(si); } else runs.push({ from: a, to: b, sis: [si] });
  }
  for (const run of runs) {
    const done = getRange(f.url, run.from, run.to - 1, f.signal).then(res => {
      if (res.whole) { new Uint8Array(f.ab).set(new Uint8Array(res.whole)); f.all = true; }
      else new Uint8Array(f.ab).set(new Uint8Array(res.ab), run.from);
      run.sis.forEach(si => f.loaded.add(si));
    }).finally(() => run.sis.forEach(si => f.pending.delete(si)));
    run.sis.forEach(si => f.pending.set(si, done));
    waits.add(done);
  }
  return Promise.allSettled([...waits]).then(() => {});
}
function playSF(ch, n, vel, t) {
  const hits = ch.sfRegions.filter(r => n >= r.kl && n <= r.kh && vel >= r.vl && vel <= r.vh);
  // samples still on their way: the built-in tubular bells, through the same input (VOLUME and filter apply)
  if (hits.some(r => !hasSample(r))) return playVoice(ch, VOICES[0], n, vel, t);
  for (const r of hits) {
    const src = actx.createBufferSource(), g = actx.createGain();
    src.buffer = sampleBuffer(r);
    src.playbackRate.value = Math.pow(2, ((n - r.root) * 100 + r.tune + r.s.corr) / 1200);
    if (r.loop && r.s.le > r.s.ls) { src.loop = true; src.loopStart = (r.s.ls - r.s.start) / src.buffer.sampleRate; src.loopEnd = (r.s.le - r.s.start) / src.buffer.sampleRate; }
    const a = Math.pow(vel / 127, 2) * Math.pow(10, -r.att * 0.4 / 200) * 0.7, T = ch.P.decay;
    g.gain.setValueAtTime(a, t);
    g.gain.setTargetAtTime(0, t + 0.02, T / 6.91);
    let last = g;
    if (r.pan && actx.createStereoPanner) { const p = actx.createStereoPanner(); p.pan.value = r.pan / 500; g.connect(p); last = p; }
    src.connect(g); last.connect(ch.graph.input);
    src.start(t); src.stop(t + T + 0.5);
  }
}

// ---------- chimes ----------
const DT = 1 / 240;
const live = new Set(); // attached chimes: one shared loop steps and draws each of them
let lastT = 0, raf = 0;
function tick(now) {
  const dt = Math.min(0.05, (now - (lastT || now)) / 1000); lastT = now;
  for (const ch of live) {
    ch.acc += dt;
    while (ch.acc >= DT) { step(ch.sim, ch.P, DT, ch.hit); ch.acc -= DT; }
    const sp = ch.sim.F.x * 0.18 * dt, wind = ch.P.wind;
    for (const st of ch.streaks) { st.x += sp + (sp >= 0 ? 6 : -6) * wind * dt * 4; if (st.x > OX1 + 10) st.x = OX0 - 10; if (st.x < OX0 - 12) st.x = OX1 + 8; }
    draw(ch);
  }
  raf = live.size ? requestAnimationFrame(tick) : 0;
}

// One chime: its own parameters, simulation, wind, voice, audio chain, hit listeners and recording.
export function createChime({ seed = (Math.random() * 2 ** 32) >>> 0 } = {}) {
  const ch = {
    P: defaultParams(), sim: makeSim(seed), streaks: makeStreaks(), acc: 0,
    voice: VOICES[0], sfPreset: null, sfRegions: null,
    sound: false, graph: null, ctx2d: null, img: null, rec: null,
  };
  const listeners = new Set();
  const noteOf = i => ch.P.root + offsetOf(ch.P, i);
  ch.hit = (i, vel, t) => {
    ring(ch, i, vel);
    if (ch.rec) ch.rec.hits.push({ t: t - ch.rec.t0, n: noteOf(i), v: vel });
    listeners.forEach(fn => fn(i, vel));
  };
  const midiProgram = () => ch.sfPreset
    ? { prog: ch.sfPreset.preset & 127, bank: ch.sfPreset.bank > 127 ? 128 : ch.sfPreset.bank, name: ch.sfPreset.name }
    : { prog: ch.voice.gm, bank: 0, name: ch.voice.name };
  const strikeTube = i => {
    const tb = ch.sim.tubes[i];
    if (!tb) return;
    const dir = Math.sign(ch.sim.lay.rest[i].x) || 1;
    tb.vx += dir * 30; tb.env = Math.max(tb.env, 0.75);
    ch.hit(i, 96, ch.sim.t);
  };
  // Each tube's line on the paper (raster pixels), for hit-testing and tests.
  const tubeSegments = () => ch.sim.tubes.map((tb, i) => { const g = tubeGeom(ch.P, ch.sim.lay, i, tb); return { x0: toX(g.tx), y0: toY(g.ty), x1: toX(g.bx), y1: toY(g.by) }; });
  const detach = () => {
    live.delete(ch); ch.ctx2d = null;
    if (!live.size && raf) { cancelAnimationFrame(raf); raf = 0; }
  };
  return Object.assign(ch, {
    noteOf, midiProgram, strikeTube, tubeSegments,
    // value: "v<index>" or "s<font>:<preset>"; an unknown preset leaves the voice as it was and returns false
    // a soundfont preset picked while the sound is on fetches its samples now (strikes play the built-in voice until then)
    chooseVoice(value) {
      const v = voiceFor(value);
      if (!v) return false;
      Object.assign(ch, v);
      if (ch.sound) loadSamples(ch.sfRegions);
      return true;
    },
    setParams(p) {
      const P = ch.P;
      const filterMoved = (p.cutX !== undefined && p.cutX !== P.cutX) || (p.q !== undefined && p.q !== P.q);
      const volumeMoved = p.volume !== undefined && p.volume !== P.volume;
      if (p.tubes !== undefined) {
        p = { ...p, tubes: clampTubes(p.tubes) };
        if (p.tubes !== ch.sim.lay.n) resize(ch.sim, p.tubes);
      }
      Object.assign(P, p);
      P.cutoff = cutoffHz(P.cutX);
      if (filterMoved) {
        if (ch.graph) { ch.graph.filter.frequency.rampTo(P.cutoff, 0.04); ch.graph.filter.Q.rampTo(P.q, 0.04); }
        if (ch.rec) ch.rec.cc.push({ t: ch.sim.t - ch.rec.t0, x: P.cutX, q: P.q });
      }
      if (volumeMoved) level(ch);
      if (p.output !== undefined && ch.graph) route(ch);
    },
    // false while the device lacks this chime's OUTPUT channels (it plays on 1-2 meanwhile)
    outputAvailable() { return !actx || ch.P.output.first + ch.P.output.count <= outN; },
    // Turning SOUND on needs startAudio() to have run (from the tap); it plays a short arpeggio as confirmation,
    // unless `quiet` (a composition turning many chimes on at once).
    setSound(on, { quiet = false } = {}) {
      on = !!on;
      if (on === ch.sound) return;
      ch.sound = on;
      if (on) {
        sounding.add(ch);
        loadSamples(ch.sfRegions);
        if (master && !ch.graph) buildGraph(ch);
        level(ch);
        if (quiet) return;
        const last = ch.sim.lay.n - 1;
        ring(ch, 0, 90); setTimeout(() => ring(ch, Math.min(2, last), 80), 180); setTimeout(() => ring(ch, Math.min(4, last), 80), 360);
      } else {
        sounding.delete(ch);
        level(ch);
        if (!sounding.size && unlockEl) unlockEl.pause();
      }
    },
    onHit(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    attach(canvas) {
      ch.ctx2d = canvas.getContext("2d");
      ch.img = ch.ctx2d.createImageData(W, H);
      live.add(ch);
      if (!raf) { lastT = 0; raf = requestAnimationFrame(tick); }
      return detach;
    },
    // x, y in paper pixels (0..W, 0..H). A tube is hit within 6 px of its line and its height; the nearest wins.
    // Returns the struck tube's index, or -1 for empty paper.
    strikeAt(x, y) {
      let best = -1, bd = 6;
      tubeSegments().forEach((t, i) => {
        if (y < t.y0 - 6 || y > t.y1 + 6) return;
        const f = Math.max(0, Math.min(1, (y - t.y0) / (t.y1 - t.y0 || 1)));
        const d = Math.abs(x - (t.x0 + (t.x1 - t.x0) * f));
        if (d <= bd) { bd = d; best = i; }
      });
      if (best >= 0) strikeTube(best);
      return best;
    },
    recording() { return ch.rec ? { secs: ch.sim.t - ch.rec.t0, notes: ch.rec.hits.length } : null; },
    startRec() { ch.rec = { t0: ch.sim.t, hits: [], cc: [{ t: 0, x: ch.P.cutX, q: ch.P.q }] }; },
    stopRec() {
      if (!ch.rec) return null;
      const r = ch.rec, take = { kind: "LIVE", hits: r.hits, dur: ch.sim.t - r.t0, decay: ch.P.decay, cc: r.cc, ...midiProgram() };
      ch.rec = null;
      return take;
    },
    renderTake(DUR = 120) {
      const off = makeSim((Math.random() * 2 ** 32) >>> 0, ch.sim.lay.n), hits = [];
      for (let k = 0; k < 2 * 240; k++) step(off, ch.P, DT, () => {});   // let the clapper settle into the wind first
      const t0 = off.t;
      for (let k = 0; k < DUR * 240; k++) step(off, ch.P, DT, (i, v, t) => hits.push({ t: t - t0, n: noteOf(i), v }));
      return { kind: "RENDER", hits, dur: DUR, decay: ch.P.decay, cc: [{ t: 0, x: ch.P.cutX, q: ch.P.q }], ...midiProgram() };
    },
    destroy() {
      detach();
      listeners.clear();
      ch.sound = false;
      if (sounding.delete(ch) && !sounding.size && unlockEl) unlockEl.pause();
      if (ch.graph) {
        const g = ch.graph;
        g.input.disconnect(); g.filter.dispose(); if (g.fm) g.fm.dispose();
        if (g.mono) { g.mono.disconnect(); g.pick.disconnect(); }
        graphs.delete(ch); ch.graph = null;
      }
    },
  });
}

// ---------- MIDI ----------
function vlq(n) { const out = [n & 0x7f]; while ((n >>= 7)) out.unshift((n & 0x7f) | 0x80); return out; }
function buildMidi(t) {
  const TPS = 960, offT = Math.max(1, Math.round(t.decay * TPS));
  const byNote = {};
  t.hits.forEach(h => (byNote[h.n] = byNote[h.n] || []).push({ tick: Math.round(h.t * TPS), v: h.v }));
  const ev = [];
  for (const n in byNote) {
    const list = byNote[n].sort((a, b) => a.tick - b.tick);
    list.forEach((h, k) => {
      if (k && list[k - 1].tick === h.tick) return;
      let off = h.tick + offT;
      const next = list.slice(k + 1).find(x => x.tick > h.tick);
      if (next) off = Math.min(off, next.tick);
      ev.push({ tick: h.tick, o: 1, b: [0x90, +n, h.v] }, { tick: off, o: 0, b: [0x80, +n, 64] });
    });
  }
  const ch = t.bank === 128 ? 9 : 0;
  ev.forEach(e => { e.b[0] |= ch; });
  const cc74 = x => Math.max(0, Math.min(127, Math.round(x * 127)));
  const cc71 = q => Math.max(0, Math.min(127, Math.round((q - 0.5) / 17.5 * 127)));
  let lx = -1, lq = -1;
  for (const c of t.cc) {
    const tick = Math.max(0, Math.round(c.t * TPS)), a = cc74(c.x), b = cc71(c.q);
    if (a !== lx) ev.push({ tick, o: 0.5, b: [0xb0 | ch, 74, a] });
    if (b !== lq) ev.push({ tick, o: 0.5, b: [0xb0 | ch, 71, b] });
    lx = a; lq = b;
  }
  ev.sort((a, b) => a.tick - b.tick || a.o - b.o);
  const name = [..."Wind chime"].map(c => c.charCodeAt(0));
  const trk = [0, 0xff, 0x03, name.length, ...name, 0, 0xff, 0x51, 3, 0x07, 0xa1, 0x20, 0, 0xff, 0x58, 4, 4, 2, 24, 8,
    0, 0xb0 | ch, 0, t.bank & 127, 0, 0xb0 | ch, 32, 0, 0, 0xc0 | ch, t.prog & 127];
  let last = 0;
  for (const e of ev) { trk.push(...vlq(e.tick - last), ...e.b); last = e.tick; }
  const end = Math.max(last, Math.round(t.dur * TPS));
  trk.push(...vlq(end - last), 0xff, 0x2f, 0);
  const L = trk.length;
  return new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xe0, 0x4d, 0x54, 0x72, 0x6b, L >>> 24, (L >>> 16) & 255, (L >>> 8) & 255, L & 255, ...trk]);
}
export { buildMidi };

// Six Tube Chime engine: raster drawing, wind/clapper physics, audio (Tone.js + SF2 sampler) and MIDI export.
// Browser-only. Import from client components and call attach() inside an effect.

export const W = 192, H = 232;
let ctx2d = null, img = null;
const buf = new Uint8Array(W * H);
function px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && x < W && y >= 0 && y < H) buf[y * W + x] = c; }
function line(x0, y0, x1, y1, c = 1, dash = 0) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, n = 0;
  for (;;) {
    if (!dash || (n % (dash * 2)) < dash) px(x0, y0, c);
    n++;
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}
function fillPoly(pts, c) {
  let y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const yc = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) px(x, y, c);
  }
}
function ellipse(cx, cy, rx, ry, c = 1) {
  const n = Math.max(24, Math.ceil(Math.PI * 2 * Math.max(rx, ry) / 2));
  let pxp = cx + rx, pyp = cy;
  for (let i = 1; i <= n; i++) { const a = i / n * Math.PI * 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; line(pxp, pyp, x, y, c); pxp = x; pyp = y; }
}
function fillEllipse(cx, cy, rx, ry, c) {
  for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) {
    const t = (y - cy) / ry, d = rx * Math.sqrt(Math.max(0, 1 - t * t));
    for (let x = Math.round(cx - d); x <= Math.round(cx + d); x++) px(x, y, c);
  }
}
function present() {
  if (!ctx2d) return;
  const d = img.data;
  for (let i = 0, j = 0; i < buf.length; i++, j += 4) { const v = buf[i] ? 0 : 255; d[j] = d[j + 1] = d[j + 2] = v; d[j + 3] = 255; }
  ctx2d.putImageData(img, 0, 0);
}

// ---------- pitch and scales ----------
const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const noteName = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);
export const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
export const cutoffHz = x => 60 * Math.pow(2, x * 8);
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
export function sixOf(deg) {
  const out = [];
  for (let k = 0; out.length < 6; k++) out.push(deg[k % deg.length] + 12 * Math.floor(k / deg.length));
  return out;
}

// ---------- live parameters (mutated by setParams) ----------
export const P = { wind: 0.45, decay: 4, cutX: 0.78, cutoff: cutoffHz(0.78), q: 3, root: 72, scale: sixOf(SCALE_LIST[0].deg) };
export const noteOf = i => P.root + P.scale[i];

// ---------- geometry ----------
const CX = 96, RING_Y = 22, R = 58, Z = 0.3, STR = 8;
const STRIKER_Y = RING_Y + 66, RS = 16, RT = 3.5, SAIL_Y = RING_Y + 128;
const ANG = Array.from({ length: 6 }, (_, i) => -Math.PI / 2 + Math.PI / 6 + i * Math.PI / 3);
const REST = ANG.map(a => ({ x: Math.cos(a) * R, z: Math.sin(a) * R }));
function tubeLen(i) { return 118 * Math.sqrt(mtof(P.root) / mtof(noteOf(i))); }

// ---------- simulation ----------
function rngFrom(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function makeSim(seed) {
  const rnd = rngFrom(seed);
  const gauss = () => { let u = 0; while (!u) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
  return { t: 0, rnd, gauss, s: { x: 0, z: 0, vx: 0, vz: 0 }, F: { x: 0, z: 0 }, phi: rnd() * Math.PI * 2, g: 0,
    tubes: REST.map(() => ({ dx: 0, dz: 0, vx: 0, vz: 0, cool: 0, env: 0 })) };
}
const KS = 10, CS = 0.45, KT = 30, CT = 1.1, MS = 1, MT = 0.5, E = 0.6, TAU = 0.6;
function step(sim, dt, onHit) {
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
  const fall = Math.exp(-dt * 6.91 / P.decay);
  sim.tubes.forEach((tb, i) => {
    tb.vx += (0.06 * sim.F.x - KT * tb.dx - CT * tb.vx) * dt; tb.vz += (0.06 * sim.F.z - KT * tb.dz - CT * tb.vz) * dt;
    tb.dx += tb.vx * dt; tb.dz += tb.vz * dt;
    tb.cool -= dt; tb.env *= fall;
    const tx = REST[i].x + tb.dx, tz = REST[i].z + tb.dz;
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
let sim = makeSim((Math.random() * 2 ** 32) >>> 0);
let frame = 0;
const streaks = Array.from({ length: 30 }, () => ({ x: Math.random() * W, y: 10 + Math.random() * (H - 20), len: 3 + Math.floor(Math.random() * 7) }));
function draw() {
  buf.fill(0);
  const w = P.wind, n = Math.round(w * streaks.length);
  for (let k = 0; k < n; k++) { const st = streaks[k]; for (let j = 0; j < st.len; j += 2) px(st.x + j, st.y, 1); }
  // hook and ring
  line(CX, 0, CX, RING_Y - (R + 4) * Z);
  ellipse(CX, RING_Y, R + 4, (R + 4) * Z); ellipse(CX, RING_Y + 1, R + 4, (R + 4) * Z);
  const items = [];
  sim.tubes.forEach((tb, i) => items.push({ z: REST[i].z + tb.dz, f: () => drawTube(i, tb) }));
  items.push({ z: sim.s.z, f: drawStriker });
  items.sort((a, b) => a.z - b.z).forEach(it => it.f());
  present();
}
function drawTube(i, tb) {
  const a = ANG[i], ax = CX + Math.cos(a) * (R + 4) * 0.9, ay = RING_Y + Math.sin(a) * (R + 4) * Z * 0.9;
  const hx = CX + REST[i].x, hy = RING_Y + REST[i].z * Z + STR, L = tubeLen(i);
  const tx = hx + tb.dx * 0.35, ty = hy + tb.dz * 0.35 * Z, bx = hx + tb.dx * 1.4, by = hy + L + tb.dz * 1.4 * Z;
  line(ax, ay, tx, ty);
  const q = [[tx - RT, ty], [tx + RT, ty], [bx + RT, by], [bx - RT, by]];
  fillPoly(q, 0);
  line(q[0][0], q[0][1], q[3][0], q[3][1]); line(q[1][0], q[1][1], q[2][0], q[2][1]);
  ellipse(tx, ty, RT, 1.2); line(q[3][0], q[3][1], q[2][0], q[2][1]);
  line(tx + 1.5, ty + 4, bx + 1.5, by - 3, 1, 1);
  if (tb.env > 0.03) {
    const j = (frame & 1) * Math.round(tb.env * 2) + 2;
    for (let y = 8; y < L - 4; y += 12) {
      const f = y / L, x = tx + (bx - tx) * f, yy = ty + (by - ty) * f;
      line(x - RT - j - 1, yy, x - RT - j, yy); line(x + RT + j, yy, x + RT + j + 1, yy);
    }
  }
}
function drawStriker() {
  const s = sim.s, sx = CX + s.x, sy = STRIKER_Y + s.z * Z, ry = RS * Z * 0.6;
  line(CX, RING_Y, sx, sy - ry);
  const ang = Math.atan2(sim.F.z, sim.F.x);
  const qx = CX + s.x * 1.45, qy = SAIL_Y + s.z * 1.45 * Z, hw = 2 + 11 * Math.abs(Math.cos(ang)), sh = 36;
  line(sx, sy + 3, qx, qy);
  const sail = [[qx - hw, qy], [qx + hw, qy], [qx + hw, qy + sh], [qx - hw, qy + sh]];
  fillPoly(sail, 0);
  for (let k = 0; k < 4; k++) line(sail[k][0], sail[k][1], sail[(k + 1) % 4][0], sail[(k + 1) % 4][1]);
  if (hw > 5) line(qx - hw + 3, qy + sh - 6, qx + hw - 3, qy + sh - 6, 1, 1);
  fillEllipse(sx, sy + 1.5, RS, ry + 1.5, 0);
  ellipse(sx, sy + 3, RS, ry); line(sx - RS, sy, sx - RS, sy + 3); line(sx + RS, sy, sx + RS, sy + 3);
  fillEllipse(sx, sy, RS - 1, ry - 0.5, 0); ellipse(sx, sy, RS, ry);
}

// ---------- audio ----------
// Chain: every voice -> bus -> Tone low-pass filter (FREQUENCY = cutoff, RESONANCE = Q) -> compressor -> speakers
let Tone = null, actx = null, bus = null, filter = null, fmPoly = null, soundOn = false;
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
let voice = VOICES[0], sfPreset = null, sfRegions = null;

// value: "v<index>" for a built-in voice, "s<font>:<preset>" for a soundfont preset
export function chooseVoice(value) {
  if (value && value[0] === "s") {
    const [fi, pi] = value.slice(1).split(":").map(Number), f = fonts[fi];
    if (!f || !f.presets[pi]) return;
    sfPreset = f.presets[pi]; sfRegions = resolvePreset(f, pi); voice = null;
  } else {
    sfPreset = null; sfRegions = null; voice = VOICES[+String(value || "v0").slice(1)] || VOICES[0];
  }
}
export function midiProgram() {
  return sfPreset ? { prog: sfPreset.preset & 127, bank: sfPreset.bank > 127 ? 128 : sfPreset.bank, name: sfPreset.name } : { prog: voice.gm, bank: 0, name: voice.name };
}
export function findPreset(fi, bank, prog) { return fonts[fi] ? fonts[fi].presets.findIndex(p => p.bank === bank && p.preset === prog) : -1; }
export function addFont(arrayBuffer, name, gm = false) {
  const f = parseSF2(arrayBuffer, name); f.gm = gm;
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
export function audioState() { return !soundOn ? "off" : actx ? actx.state : "none"; }

// Load Tone.js ahead of the first tap so the tap itself can start audio (Safari needs that).
export function preloadAudio() { if (!Tone) import("tone").then(m => { Tone = m; }).catch(() => {}); }
function setupGraph() {
  actx = Tone.getContext().rawContext;
  filter = new Tone.Filter({ type: "lowpass", frequency: P.cutoff, Q: P.q, rolloff: -12 });
  const comp = new Tone.Compressor({ threshold: -16, ratio: 4, attack: 0.003, release: 0.25 });
  const out = new Tone.Gain(0.85);
  filter.chain(comp, out, Tone.getDestination());
  bus = actx.createGain();
  Tone.connect(bus, filter);
  fmPoly = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3.01, modulationIndex: 12,
    oscillator: { type: "sine" }, modulation: { type: "sine" },
    envelope: { attack: 0.002, decay: 2, sustain: 0, release: 1 },
    modulationEnvelope: { attack: 0.002, decay: 0.6, sustain: 0, release: 0.5 },
  });
  fmPoly.maxPolyphony = 24;
  fmPoly.volume.value = -10;
  fmPoly.connect(filter);
}
// Must be called from a click/tap handler. Resolves to the new on/off state.
export async function toggleSound() {
  if (soundOn) { soundOn = false; if (unlockEl) unlockEl.pause(); return false; }
  soundOn = true;
  if (!Tone) Tone = await import("tone");
  if (!filter) setupGraph();
  // start and resume synchronously inside the tap, then wait for them
  unlockAudio();
  const started = Promise.resolve(Tone.start()).catch(() => {});
  const resumed = Promise.resolve(actx.resume()).catch(() => {});
  await Promise.all([started, resumed]);
  ring(0, 90); setTimeout(() => ring(2, 80), 180); setTimeout(() => ring(4, 80), 360);
  return true;
}
function applyFilter() {
  if (!filter) return;
  filter.frequency.rampTo(P.cutoff, 0.04);
  filter.Q.rampTo(P.q, 0.04);
}

let muted = false;
// Silence the browser's own sound (for example while a MIDI device plays the notes) without stopping the simulation.
export function setMuted(m) { muted = !!m; }
export function ring(i, vel) {
  if (muted || !soundOn || !actx || actx.state !== "running") return;
  const n = noteOf(i), t = actx.currentTime + 0.005;
  if (sfRegions) return playSF(n, vel, t);
  if (voice.fm) {
    fmPoly.set({ envelope: { decay: P.decay, release: P.decay * 0.3 }, modulationEnvelope: { decay: Math.min(1.5, P.decay * 0.25) } });
    fmPoly.triggerAttackRelease(mtof(n), P.decay, Tone.now() + 0.005, vel / 127);
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
function playSF(n, vel, t) {
  const hits = sfRegions.filter(r => n >= r.kl && n <= r.kh && vel >= r.vl && vel <= r.vh);
  for (const r of hits) {
    const src = actx.createBufferSource(), g = actx.createGain();
    src.buffer = sampleBuffer(r);
    src.playbackRate.value = Math.pow(2, ((n - r.root) * 100 + r.tune + r.s.corr) / 1200);
    if (r.loop && r.s.le > r.s.ls) { src.loop = true; src.loopStart = (r.s.ls - r.s.start) / src.buffer.sampleRate; src.loopEnd = (r.s.le - r.s.start) / src.buffer.sampleRate; }
    const a = Math.pow(vel / 127, 2) * Math.pow(10, -r.att * 0.4 / 200) * 0.7, T = P.decay;
    g.gain.setValueAtTime(a, t);
    g.gain.setTargetAtTime(0, t + 0.02, T / 6.91);
    let last = g;
    if (r.pan && actx.createStereoPanner) { const p = actx.createStereoPanner(); p.pan.value = r.pan / 500; g.connect(p); last = p; }
    src.connect(g); last.connect(bus);
    src.start(t); src.stop(t + T + 0.5);
  }
}

// ---------- recording ----------
let rec = null;
const listeners = new Set();
export function onHit(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function liveHit(i, vel, t) {
  ring(i, vel);
  if (rec) rec.hits.push({ t: t - rec.t0, n: noteOf(i), v: vel });
  listeners.forEach(fn => fn(i, vel));
}
export function recording() { return rec ? { secs: sim.t - rec.t0, notes: rec.hits.length } : null; }
export function startRec() { rec = { t0: sim.t, hits: [], cc: [{ t: 0, x: P.cutX, q: P.q }] }; }
export function stopRec() {
  if (!rec) return null;
  const take = { kind: "LIVE", hits: rec.hits, dur: sim.t - rec.t0, decay: P.decay, cc: rec.cc, ...midiProgram() };
  rec = null;
  return take;
}
export function renderTake(DUR = 120) {
  const off = makeSim((Math.random() * 2 ** 32) >>> 0), hits = [];
  for (let k = 0; k < 2 * 240; k++) step(off, DT, () => {});   // let the clapper settle into the wind first
  const t0 = off.t;
  for (let k = 0; k < DUR * 240; k++) step(off, DT, (i, v, t) => hits.push({ t: t - t0, n: noteOf(i), v }));
  return { kind: "RENDER", hits, dur: DUR, decay: P.decay, cc: [{ t: 0, x: P.cutX, q: P.q }], ...midiProgram() };
}

// ---------- parameters ----------
export function setParams(p) {
  const filterMoved = (p.cutX !== undefined && p.cutX !== P.cutX) || (p.q !== undefined && p.q !== P.q);
  Object.assign(P, p);
  P.cutoff = cutoffHz(P.cutX);
  if (filterMoved) { applyFilter(); if (rec) rec.cc.push({ t: sim.t - rec.t0, x: P.cutX, q: P.q }); }
}

// ---------- loop ----------
const DT = 1 / 240;
let lastT = 0, acc = 0, raf = 0;
function tick(now) {
  const dt = Math.min(0.05, (now - (lastT || now)) / 1000); lastT = now; acc += dt;
  while (acc >= DT) { step(sim, DT, liveHit); acc -= DT; }
  const sp = sim.F.x * 0.18 * dt;
  for (const st of streaks) { st.x += sp + (sp >= 0 ? 6 : -6) * P.wind * dt * 4; if (st.x > W + 10) st.x = -10; if (st.x < -12) st.x = W + 8; }
  frame++;
  draw();
  raf = requestAnimationFrame(tick);
}
export function attach(canvas) {
  ctx2d = canvas.getContext("2d");
  img = ctx2d.createImageData(W, H);
  lastT = 0;
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); ctx2d = null; };
}
// x, y in canvas pixels (0..W, 0..H)
export function strikeAt(x, y) {
  let best = -1, bd = 14;
  sim.tubes.forEach((tb, i) => {
    const hx = CX + REST[i].x + tb.dx, hy = RING_Y + REST[i].z * Z + STR;
    const d = Math.abs(x - hx) + (y < hy - 6 || y > hy + tubeLen(i) + 6 ? 20 : 0);
    if (d < bd) { bd = d; best = i; }
  });
  if (best < 0) return;
  const tb = sim.tubes[best], dir = Math.sign(REST[best].x) || 1;
  tb.vx += dir * 30; tb.env = Math.max(tb.env, 0.75);
  liveHit(best, 96, sim.t);
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

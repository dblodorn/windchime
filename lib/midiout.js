// Web MIDI output: sends each chime strike to a hardware or virtual MIDI port.
// Browser support: Chrome, Edge, Opera and Firefox (with a permission prompt). Safari and iOS have no Web MIDI.

let access = null;
let pending = null;   // in-flight requestMIDIAccess, so a double click asks once
let output = null;    // the live port, written only by setLive()
let wanted = "";      // name of the port the user chose (or the remembered one); survives unplugging
let linkSeq = 0;      // bumps whenever the live port changes, so the UI can resend program/CC
let lastError = "";
// Every message takes its channel (1-16): each chime unit sends on its own.
const offTimers = new Map(); // "channel:note" -> timeout id
const listeners = new Set();

export const supported = () => typeof navigator !== "undefined" && typeof navigator.requestMIDIAccess === "function";

function emit() { listeners.forEach(fn => fn()); }
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

const liveOutputs = () => (access ? [...access.outputs.values()].filter(o => o.state === "connected") : []);

// The only place `output` changes. Opens the port so its state reads OPEN before the first note.
function setLive(port) {
  if (port === output) return;
  output = port;
  linkSeq++;
  lastError = "";
  if (port && typeof port.open === "function") {
    port.open().then(emit, err => {
      if (output !== port) return;
      lastError = `${port.name || "The port"} would not open${err && err.message ? ` (${err.message})` : ""}. Another app may be using it.`;
      emit();
    });
  }
  emit();
}

// Pick up the wanted port when it is present. On connect, fall back to the only port there is.
function adopt(first) {
  const outs = liveOutputs();
  const match = wanted && outs.find(o => o.name === wanted);
  if (match) {
    if (match !== output) { if (output) allNotesOff(); setLive(match); }
    return;
  }
  if (first && !output && outs.length === 1) {
    if (!wanted) wanted = outs[0].name;
    setLive(outs[0]);
  }
}

function onState(e) {
  const p = e.port;
  if (output && p && p.id === output.id && p.state === "disconnected") {
    // the port is gone: forget its sounding notes without sending, keep `wanted` for the reconnect
    offTimers.forEach(t => clearTimeout(t));
    offTimers.clear();
    setLive(null);
  }
  adopt(false);
  emit();
}

// Must follow a click: browsers show a permission prompt.
export async function connect() {
  if (!supported()) throw new Error("This browser has no Web MIDI. Use Chrome, Edge or Firefox on a computer.");
  if (!access) {
    pending = pending || navigator.requestMIDIAccess({ sysex: false });
    try {
      const a = await pending;
      a.onstatechange = onState;
      access = a;
    } finally {
      pending = null;
    }
  }
  adopt(true);
  emit();
  return listOutputs();
}
export const isConnected = () => !!access;

// Seed the remembered port name before connect().
export function setWanted(name) { wanted = name || ""; }

export function listOutputs() {
  return liveOutputs().map(o => ({ id: o.id, name: o.name || "Unnamed port", manufacturer: o.manufacturer || "" }));
}

export function selectOutput(id) {
  const port = (access && id && access.outputs.get(id)) || null;
  if (output && port !== output) allNotesOff();
  wanted = port ? port.name : "";
  setLive(port);
  emit();
  return !!output;
}
export const currentOutput = () => (output ? { id: output.id, name: output.name } : null);

// One snapshot for the UI.
export function status() {
  return {
    connected: !!access,
    wanted,
    linkSeq,
    error: lastError,
    port: output ? { id: output.id, name: output.name || "Unnamed port", manufacturer: output.manufacturer || "", state: output.state, connection: output.connection } : null,
  };
}

function send(bytes) {
  if (!output) return;
  try { output.send(bytes); } catch (e) { /* port closed mid-send */ }
}
const nib = ch => (Math.max(1, Math.min(16, ch | 0)) - 1);

// One strike: note-on now, note-off after `seconds`. A re-strike of a note sounding on the same channel ends it first.
export function note(ch, n, vel, seconds) {
  if (!output) return;
  const c = nib(ch), key = `${c}:${n}`;
  if (offTimers.has(key)) { clearTimeout(offTimers.get(key)); send([0x80 | c, n, 0]); }
  send([0x90 | c, n, Math.max(1, Math.min(127, vel | 0))]);
  const t = setTimeout(() => { send([0x80 | c, n, 0]); offTimers.delete(key); }, Math.max(20, seconds * 1000));
  offTimers.set(key, t);
}

export const testNote = (ch, n) => note(ch, n, 100, 0.5);

export function program(ch, bank, prog) {
  if (!output) return;
  const c = nib(ch);
  send([0xb0 | c, 0, bank & 127]);
  send([0xb0 | c, 32, 0]);
  send([0xc0 | c, prog & 127]);
}

export function cc(ch, num, value) {
  send([0xb0 | nib(ch), num & 127, Math.max(0, Math.min(127, Math.round(value)))]);
}

// End the notes sounding on one channel (a unit changing channel, or being removed).
export function endNotes(ch) {
  const c = nib(ch);
  offTimers.forEach((t, key) => {
    const [kc, n] = key.split(":").map(Number);
    if (kc !== c) return;
    clearTimeout(t); send([0x80 | c, n, 0]); offTimers.delete(key);
  });
}

// PANIC: a note-off for every sounding note, then All Notes Off and All Sound Off on each listed channel
// (and on any channel that still had notes sounding).
export function allNotesOff(channels = []) {
  const cs = new Set(channels.map(nib));
  offTimers.forEach((t, key) => {
    const [c, n] = key.split(":").map(Number);
    clearTimeout(t); send([0x80 | c, n, 0]); cs.add(c);
  });
  offTimers.clear();
  cs.forEach(c => {
    send([0xb0 | c, 123, 0]); // All Notes Off
    send([0xb0 | c, 120, 0]); // All Sound Off
  });
}

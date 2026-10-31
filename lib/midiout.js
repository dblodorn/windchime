// Web MIDI output: sends each chime strike to a hardware or virtual MIDI port.
// Browser support: Chrome, Edge, Opera and Firefox (with a permission prompt). Safari and iOS have no Web MIDI.

let access = null;
let output = null;
let channel = 0; // 0-15
const offTimers = new Map(); // note -> timeout id
const listeners = new Set();

export const supported = () => typeof navigator !== "undefined" && typeof navigator.requestMIDIAccess === "function";

function emit() { listeners.forEach(fn => fn()); }
export function onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// Must follow a click: browsers show a permission prompt.
export async function connect() {
  if (!supported()) throw new Error("This browser has no Web MIDI. Use Chrome, Edge or Firefox on a computer.");
  if (!access) {
    access = await navigator.requestMIDIAccess({ sysex: false });
    access.onstatechange = e => {
      if (output && e.port && e.port.id === output.id && e.port.state === "disconnected") output = null;
      emit();
    };
  }
  emit();
  return listOutputs();
}
export const isConnected = () => !!access;

export function listOutputs() {
  if (!access) return [];
  return [...access.outputs.values()]
    .filter(o => o.state !== "disconnected")
    .map(o => ({ id: o.id, name: o.name || "Unnamed port", manufacturer: o.manufacturer || "" }));
}

export function selectOutput(id) {
  if (output) allNotesOff();
  output = (access && id && access.outputs.get(id)) || null;
  emit();
  return !!output;
}
export const currentOutput = () => (output ? { id: output.id, name: output.name } : null);

export function setChannel(ch) {
  const next = Math.max(0, Math.min(15, ch | 0));
  if (next !== channel && output) allNotesOff();
  channel = next;
}

function send(bytes) {
  if (!output) return;
  try { output.send(bytes); } catch (e) { /* port closed mid-send */ }
}

// One strike: note-on now, note-off after `seconds`. A re-strike of a sounding note ends it first.
export function note(n, vel, seconds) {
  if (!output) return;
  const st = 0x90 | channel, off = 0x80 | channel;
  if (offTimers.has(n)) { clearTimeout(offTimers.get(n)); send([off, n, 0]); }
  send([st, n, Math.max(1, Math.min(127, vel | 0))]);
  const t = setTimeout(() => { send([off, n, 0]); offTimers.delete(n); }, Math.max(20, seconds * 1000));
  offTimers.set(n, t);
}

export function program(bank, prog) {
  if (!output) return;
  send([0xb0 | channel, 0, bank & 127]);
  send([0xb0 | channel, 32, 0]);
  send([0xc0 | channel, prog & 127]);
}

export function cc(num, value) {
  send([0xb0 | channel, num & 127, Math.max(0, Math.min(127, Math.round(value)))]);
}

export function allNotesOff() {
  offTimers.forEach((t, n) => { clearTimeout(t); send([0x80 | channel, n, 0]); });
  offTimers.clear();
  send([0xb0 | channel, 123, 0]); // All Notes Off
  send([0xb0 | channel, 120, 0]); // All Sound Off
}

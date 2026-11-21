// External synths: emulated hardware a unit can choose as its SOUND (openspec/specs/external-synths). A unit on one
// has the voice `x:<id>` and a `patch`: null for the synth's bundled INIT, or the 24-hex id of a patch in its dmbk
// library. That pair is the only way a patch is referred to, in storage, links and saved compositions alike.
//
// Each synth is an engine package `@dblodorn/<manufacturer>-<model>-engine` (the vz10m repo's engine-package
// convention), and its id is that name without `@dblodorn/` and `-engine`. Entries are only ever appended: a
// link stores 1 + an entry's index as its synth code, so reordering or removing one breaks links.
//
// No React, no Relay and no browser globals here: lib/engine.ts and lib/share.ts import it, in Node too. The
// engine itself is a dynamic import, so its code (and its inlined worklet) loads only when a unit sounds with it.
import { casioVzInit } from "./synths/casio-vz-init.ts";

// the common surface every engine package's `createSynth` returns
export interface SynthLike {
  readonly output: AudioNode;
  loadVoice(patch: Uint8Array): void;
  noteOn(note: number, velocity?: number): void;
  noteOff(note: number): void;
  allNotesOff(): void;
  dispose(): void;
}

export interface ExternalSynth {
  id: string; // the voice is "x:" + id
  name: string; // the SOUND option and the sound line
  initName: string; // the PATCH row for a null patch
  init: () => Uint8Array; // the bundled INIT patch, a fresh copy
  patchType: string; // the library's GraphQL type (implements SynthPatch), for global ids
  patchBytes: number; // a patch's length, checked on every fetch
  engine: () => Promise<{ createSynth(ctx: BaseAudioContext): Promise<SynthLike> }>;
}

export const EXTERNAL_SYNTHS: readonly ExternalSynth[] = [
  {
    id: "casio-vz",
    name: "CASIO VZ-10M",
    initName: "INIT",
    init: casioVzInit,
    patchType: "VzVoice",
    patchBytes: 336,
    engine: () => import("@dblodorn/casio-vz-engine"),
  },
];

export const PATCH_ID = /^[0-9a-f]{24}$/;

// "x:casio-vz" → its entry, or undefined for any other voice (including an unknown synth)
export function synthOf(voice: string | null | undefined): ExternalSynth | undefined {
  if (!voice || !voice.startsWith("x:")) return undefined;
  return EXTERNAL_SYNTHS.find(s => s.id === voice.slice(2));
}

export const isExternalVoice = (voice: string | null | undefined): boolean => !!synthOf(voice);

// The CASIO VZ-10M's INIT patch: the 336 decoded voice bytes of the vz10m editor's `initVoice("INIT")`
// (apps/editor/lib/vz/codec.ts in dblodorn/vz10m, at 491a38c) with M2 and M3 also on (`m2.off`, `m3.off` = 0):
// three in-phase sines, an organ-style envelope. One module peaks at 0.1 (the engine's OUTPUT_GAIN), a third of
// the built-in voices; three match them. Bundled so a unit on the VZ-10M sounds with no network. Checked with the
// engine's `readVoice` (it accepts it, `getName` is INIT); regenerate the same way rather than editing the bytes.
const INIT_B64 =
  "AAAAAAAAgACAAIAAgACAAIAAgACAY2NjY2NjY2MA//////////9APDw8PDw8PDwAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAA" +
  "AAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAICAgICAgICBw" +
  "AAAAAICAgICAAAwAIQA2AEsAYAB1AAwAIQA2AEsAYAB1AAwAIQA2AEsAYAB1AAwAIQA2AEsAYAB1AAwAIQA2AEsAYAB1AAwAIQA2AEsAYAB1AAwAIQA2" +
  "AEsAYAB1AAwAIQA2AEsAYAB1AAw/IT82P0s/YD91PwwAIQA2AEsAYAB1AAAAAAAAAAAAAAAAAAAAAAAAAElOSVQgICAgICAgIAAA";

// a fresh copy each call, so no caller can change the bundled patch
export const casioVzInit = (): Uint8Array => Uint8Array.from(atob(INIT_B64), c => c.charCodeAt(0));

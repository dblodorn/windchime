// The CASIO VZ-10M's INIT patch: the 336 decoded voice bytes the vz10m editor's `initVoice("INIT")` makes
// (apps/editor/lib/vz/codec.ts in dblodorn/vz10m, at 491a38c): M1 sine on, the other seven modules off, an
// organ-style envelope. Bundled so a unit on the VZ-10M sounds with no network. Checked with the engine's
// `readVoice` (it accepts it, `getName` is INIT); regenerate the same way rather than editing the bytes.
const INIT_B64 =
  "AAAAAAAAgACAAIAAgACAAIAAgACAY2NjY2NjY2MA//////////9APDw8PDw8PDwAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAA" +
  "AAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAICAgICAgICBw" +
  "AACAgICAgICAAAwAIQA2AEsAYAB1AAwAIQA2AEsAYAB1AAwAIQA2AEsAYAB1AAwAIQA2AEsAYAB1AAwAIQA2AEsAYAB1AAwAIQA2AEsAYAB1AAwAIQA2" +
  "AEsAYAB1AAwAIQA2AEsAYAB1AAw/IT82P0s/YD91PwwAIQA2AEsAYAB1AAAAAAAAAAAAAAAAAAAAAAAAAElOSVQgICAgICAgIAAA";

// a fresh copy each call, so no caller can change the bundled patch
export const casioVzInit = (): Uint8Array => Uint8Array.from(atob(INIT_B64), c => c.charCodeAt(0));

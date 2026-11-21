// The YAMAHA DX7's INIT patch for windchime: the 155 VCED bytes of the dx7 editor's `initVoice()` (INIT VOICE,
// apps/editor/lib/dx7/codec.ts in dblodorn/dx7) on algorithm 32 with OP1, OP2 and OP3 sounding: three in-phase sines
// at output levels 99, 99 and 90. The DX7's own INIT VOICE has only OP1, which peaks at 0.125 in the engine (carriers
// add up, unnormalised); this peaks at 0.307, as loud as the built-in voices. Checked with the engine's `readVoice`
// (`getName` is INIT VOICE); regenerate the same way rather than editing the bytes.
const INIT_B64 =
  "Y2NjY2NjYwAnAAAAAAAAAAAAAQAHY2NjY2NjYwAnAAAAAAAAAAAAAQAHY2NjY2NjYwAnAAAAAAAAAAAAAQAHY2NjY2NjYwAnAAAAAAAAAFoAAQ" +
  "AHY2NjY2NjYwAnAAAAAAAAAGMAAQAHY2NjY2NjYwAnAAAAAAAAAGMAAQAHY2NjYzIyMjIfAAEjAAAAAQADGElOSVQgVk9JQ0U=";

// a fresh copy each call, so no caller can change the bundled patch
export const yamahaDx7Init = (): Uint8Array => Uint8Array.from(atob(INIT_B64), c => c.charCodeAt(0));

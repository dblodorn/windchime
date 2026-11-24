// The ROLAND JUNO-60's INIT patch for windchime: the 42 bytes of the juno60 editor's `initVoice()` (INIT,
// apps/editor/lib/juno60/codec.ts in dblodorn/juno60: a saw at 8', the filter open, no modulation, full sustain, the
// chorus off) with VCA LEVEL at 95 (+2.5) instead of 64 (0). At 0 one note peaks at 0.180 in the engine; at +2.5 it
// peaks at 0.315, as loud as the built-in voices. Checked with the engine's `readVoice` (`getName` is INIT);
// regenerate the same way rather than editing the bytes.
const INIT_B64 = "QAAAAAAAfwAAAABfAAB/GQABAAEAAQAAAABJTklUICAgICAgICAgICAg";

// a fresh copy each call, so no caller can change the bundled patch
export const rolandJuno60Init = (): Uint8Array => Uint8Array.from(atob(INIT_B64), c => c.charCodeAt(0));

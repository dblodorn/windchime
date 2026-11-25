// The device key: what makes a saved or shared composition "yours" without an account, as in the dx7, vz10m and
// juno60 editors. 32 random bytes, base64url (43 characters), made by this browser the first time it saves or
// shares and kept in localStorage (windchime.deviceKey). The API stores only its hash, on the compositions it
// created; whoever holds the key sees them marked YOURS. Copying it to another browser (DEVICE KEY in the
// COMPOSITIONS panel) moves that too. Never in links, saved units or the address bar. Browser-only.
const KEY = "windchime.deviceKey";
export const KEY_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/** Fired on window whenever this browser's key is made or replaced, so every part of the page reads the new one. */
export const KEY_EVENT = "windchime:devicekey";

export const isDeviceKey = (s: string): boolean => KEY_PATTERN.test(s);

function generate(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function write(k: string) {
  try { localStorage.setItem(KEY, k); } catch (e) { /* storage blocked: the key lasts for this visit only */ }
  remembered = k;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(KEY_EVENT));
}
// the key for this visit even where storage is blocked
let remembered: string | null = null;

/** The stored key, or null before the first save or share. */
export function readKey(): string | null {
  let k: string | null = remembered;
  try { k = localStorage.getItem(KEY) ?? k; } catch (e) { /* blocked */ }
  return k && isDeviceKey(k) ? k : null;
}

/** The stored key, made and stored now if there is none. */
export function ensureKey(): string {
  const k = readKey();
  if (k) return k;
  const made = generate();
  write(made);
  return made;
}

/** Replace this browser's key with one copied from another. False (and nothing changed) if it isn't a key. */
export function useKey(k: string): boolean {
  const key = k.trim();
  if (!isDeviceKey(key)) return false;
  write(key);
  return true;
}

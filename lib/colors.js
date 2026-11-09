// Channel inks: each MIDI channel draws its chime units in one color on white, like patch cables. Channel 1 is
// black; 2–16 are from Sanzo Wada's A Dictionary of Color Combinations (slugs as on https://sanzo-wada.dmbk.io),
// each at least 3:1 against white and at least 14.6 CIEDE2000 from every other. Indexed by channel, never stored.
export const CHANNEL_INKS = [
  { name: "BLACK", slug: "black", hex: "#000000" },
  { name: "CARMINE", slug: "carmine", hex: "#d60036" },
  { name: "BLUE", slug: "blue", hex: "#0d75ff" },
  { name: "KHAKI", slug: "khaki", hex: "#b68400" },
  { name: "DIAMINE GREEN", slug: "diamine-green", hex: "#1b8e13" },
  { name: "ORANGE", slug: "orange", hex: "#ff5200" },
  { name: "VIOLET", slug: "violet", hex: "#2619d1" },
  { name: "INDIAN LAKE", slug: "indian-lake", hex: "#cc1a97" },
  { name: "ANTWARP BLUE", slug: "antwarp-blue", hex: "#008aa1" },
  { name: "RAW SIENNA", slug: "raw-sienna", hex: "#b85e00" },
  { name: "LIGHT MAUVE", slug: "light-mauve", hex: "#9161f2" },
  { name: "BUFFY CITRINE", slug: "buffy-citrine", hex: "#888d2a" },
  { name: "VERONIA PURPLE", slug: "veronia-purple", hex: "#7e3075" },
  { name: "RED", slug: "red", hex: "#a10045" },
  { name: "VANDAR POEL'S BLUE", slug: "vandar-poels-blue", hex: "#003e83" },
  { name: "BROWN", slug: "brown", hex: "#6c2b11" },
];

export const inkOf = channel => CHANNEL_INKS[channel - 1] ?? CHANNEL_INKS[0];

// every black theme token (app/globals.css), so a unit's subtree, and its portaled popups, draw in the ink
const TOKENS = ["--foreground", "--card-foreground", "--popover-foreground", "--primary", "--secondary-foreground",
  "--muted-foreground", "--accent", "--destructive", "--border", "--ring"];
const styles = new Map();
export function inkStyle(hex) {
  if (hex === "#000000") return undefined;
  if (!styles.has(hex)) styles.set(hex, Object.fromEntries([...TOKENS.map(t => [t, hex]), ["color", hex]]));
  return styles.get(hex);
}

#!/usr/bin/env node
// Print the scale and voice catalog that dmbk-graphql-api validates saved compositions against
// (its src/lib/chime/catalog.json). Scales and presets travel as names and ids that may only be appended to,
// so after adding a scale or changing the bundled font, run `pnpm catalog` and copy the output to the API.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCALE_LIST, VOICES, addFont, fonts } from "../lib/engine.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const sf2 = readFileSync(path.join(root, "public/TimGM6mb.sf2"));
addFont(sf2.buffer.slice(sf2.byteOffset, sf2.byteOffset + sf2.length), "TimGM6mb", true);

const voices = {};
VOICES.forEach((v, i) => { voices[`v${i}`] = v.name; });
fonts[0].presets.forEach((p, i) => { voices[`s0:${i}`] = p.name.toUpperCase(); });

process.stdout.write(JSON.stringify({ scales: SCALE_LIST.map(s => s.name), voices }, null, 2) + "\n");

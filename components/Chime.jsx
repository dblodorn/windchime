"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CopyPlus, EighthNote, Settings2, Volume2, VolumeX } from "lucide-react";
import { motion, useDragControls, useMotionValue } from "motion/react";
import * as E from "../lib/engine";
import * as M from "../lib/midiout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const hz = f => (f >= 1000 ? (f / 1000).toFixed(2) + " KHZ" : Math.round(f) + " HZ");
const ROOTS = Array.from({ length: 37 }, (_, k) => 48 + k);
const SCALE_GROUPS = E.SCALES.map(([group]) => group);
const SCALE_BY_NAME = Object.fromEntries(E.SCALE_LIST.map(s => [s.name, s]));
const CHANNELS = Array.from({ length: 16 }, (_, k) => k + 1);
const MAX_UNITS = 16;
const store = {
  get(k, d) { try { const v = localStorage.getItem("windchime." + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("windchime." + k, JSON.stringify(v)); } catch (e) {} },
  remove(k) { try { localStorage.removeItem("windchime." + k); } catch (e) {} },
};

const rootText = m => `${E.noteName(m)}   ${E.mtof(m).toFixed(1)} HZ`;
const channelText = c => `CHANNEL ${c}${c === 10 ? "  (GM DRUMS)" : ""}`;
const portName = p => p.name.toUpperCase() + (p.manufacturer ? "   " + p.manufacturer.toUpperCase() : "");

const NOTE = "m-0 max-w-[60ch] text-[13px]";
const ROW = "mt-2 flex flex-wrap items-center gap-2.5";
const ROUND = "absolute size-[30px] rounded-[50%] p-0";

// LABEL ....... value, with the control beneath. Controls are named by `${id}-label`, the label text alone.
function Param({ id, label, value, children }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 tabular-nums">
        <span id={`${id}-label`} className="tracking-[.08em]">{label}</span>
        <span className="lead" />
        <span className="whitespace-nowrap">{value}</span>
      </div>
      {children}
    </div>
  );
}

function ParamSlider({ id, value, onChange, ...range }) {
  return <Slider id={id} value={[value]} onValueChange={([v]) => onChange(v)} aria-labelledby={`${id}-label`} {...range} />;
}

// `display` is the current choice's text: Radix only fills SelectValue on the client, so pass it in for the server render
function ParamSelect({ id, value, display, onChange, children }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} aria-labelledby={`${id}-label`}><SelectValue>{display}</SelectValue></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

// MIDI Manufacturers Association "MIDI" wordmark, cropped to its ink.
// Source: https://commons.wikimedia.org/wiki/File:MIDI_LOGO.svg (PD-textlogo; MIDI is a trademark of the MMA)
function MidiLogo(props) {
  return (
    <svg viewBox="137 96 712 266" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true" focusable="false" {...props}>
      <path d="M137,96h233c19.6,0,31,16.9,31,37v229h-65V163h-38v199h-59V163h-37v199h-65V96z" />
      <rect x="433" y="96" width="65" height="266" />
      <path d="M529,96h193c19.6,0,31,16.9,31,37v196c0,24.9-10.4,33-33,33H529V193h66v104h93V156H529V96z" />
      <rect x="783" y="96" width="66" height="266" />
    </svg>
  );
}

function voiceGroups() {
  const groups = [];
  E.fonts.forEach((f, fi) => {
    const list = f.presets.map((p, i) => ({ p, i })).sort((a, b) => a.p.bank - b.p.bank || a.p.preset - b.p.preset);
    const opt = ({ p, i }) => ({ value: `s${fi}:${i}`, text: `${String(p.preset + 1).padStart(3, " ")}  ${p.name.toUpperCase()}` });
    const optBank = ({ p, i }) => ({ value: `s${fi}:${i}`, text: `${p.bank}:${p.preset + 1}  ${p.name.toUpperCase()}` });
    E.GM_FAMILIES.forEach((fam, k) => groups.push({ label: fam, items: list.filter(x => x.p.bank === 0 && x.p.preset >> 3 === k).map(opt) }));
    groups.push({ label: "DRUM KITS", items: list.filter(x => x.p.bank === 128).map(opt) });
    groups.push({ label: "OTHER BANKS", items: list.filter(x => x.p.bank !== 0 && x.p.bank !== 128).map(optBank) });
  });
  groups.push({ label: "BUILT-IN SYNTH", items: E.VOICES.map((v, i) => ({ value: `v${i}`, text: v.name })) });
  return groups.filter(g => g.items.length);
}
const voiceExists = v => {
  if (v[0] !== "s") return true;
  const [fi, pi] = v.slice(1).split(":").map(Number);
  return !!(E.fonts[fi] && E.fonts[fi].presets[pi]);
};
// null voice: the default, GM tubular bells once the soundfont has loaded, the built-in tubular bells before
const defaultVoice = () => (E.fonts.length ? "s0:" + E.findPreset(0, 0, 14) : "v0");

// ---------- units ----------
// A unit is plain data; SOUND is kept for the visit only and never stored (browser audio starts only from a tap).
const newId = () => "u" + Math.random().toString(36).slice(2, 10);
const defaultUnit = (id = "u1") => ({
  id, volume: 1, wind: 0.45, decay: 4, cutX: 0.78, q: 3, root: 72, scale: E.SCALE_LIST[0].name, voice: null,
  channel: 1, notes: false, sound: false, x: 0, y: 0, z: 1,
});
const clampNum = (v, lo, hi, d) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
// Stored records are checked field by field: anything unknown or out of range falls back to the default.
function readUnit(raw, seen) {
  const d = defaultUnit(), r = raw && typeof raw === "object" ? raw : {};
  let id = typeof r.id === "string" && /^u[\w-]{1,24}$/.test(r.id) ? r.id : newId();
  if (seen.has(id)) id = newId();
  seen.add(id);
  return {
    id,
    volume: clampNum(r.volume, 0, 1, d.volume), wind: clampNum(r.wind, 0, 1, d.wind), decay: clampNum(r.decay, 0.3, 12, d.decay),
    cutX: clampNum(r.cutX, 0, 1, d.cutX), q: clampNum(r.q, 0.5, 18, d.q), root: Math.round(clampNum(r.root, 48, 84, d.root)),
    scale: SCALE_BY_NAME[r.scale] ? r.scale : d.scale,
    voice: typeof r.voice === "string" && /^(v\d+|s\d+:\d+)$/.test(r.voice) ? r.voice : null,
    channel: Math.round(clampNum(r.channel, 1, 16, d.channel)), notes: r.notes === true, sound: false,
    x: Math.round(clampNum(r.x, -1e5, 1e5, 0)), y: Math.round(clampNum(r.y, -1e5, 1e5, 0)), z: Math.round(clampNum(r.z, 1, 1e6, 1)),
  };
}
function loadUnits() {
  const saved = store.get("units", null);
  if (saved && Array.isArray(saved.units) && saved.units.length) {
    const seen = new Set();
    return saved.units.slice(0, MAX_UNITS).map(r => readUnit(r, seen));
  }
  // carried over from the single-unit version (those keys are removed after the first save)
  const pos = store.get("pos", null), ch = store.get("midiCh", null);
  return [readUnit({ ...defaultUnit(), x: pos && pos.x, y: pos && pos.y, channel: ch }, new Set())];
}
const lowestFreeChannel = units => CHANNELS.find(c => !units.some(u => u.channel === c)) || 1;

// One chime: drawing, round buttons, settings popover and notes drawer, with its own engine instance.
const ChimeUnit = memo(function ChimeUnit({ unit, index, count, mainRef, fontsVersion, groups, midiLink, sendProg, sendCC, onChange, onCopy, onRemove, onFront }) {
  const { id } = unit;
  const name = `CHIME ${index + 1}`;
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const cellRefs = useRef([]);
  const dragControls = useDragControls();
  const x = useMotionValue(unit.x);
  const y = useMotionValue(unit.y);
  const [canvasPx, setCanvasPx] = useState(E.W * 2);
  const [fitted, setFitted] = useState(false);
  const chimeRef = useRef(null);
  if (!chimeRef.current) chimeRef.current = E.createChime();
  const chime = chimeRef.current;
  const set = useCallback(patch => onChange(id, patch), [id, onChange]);

  const scale = useMemo(() => E.sixOf(SCALE_BY_NAME[unit.scale].deg), [unit.scale]);
  const cutoff = E.cutoffHz(unit.cutX);
  const voice = unit.voice || defaultVoice();
  const channelRef = useRef(unit.channel);
  const decayRef = useRef(unit.decay);
  decayRef.current = unit.decay;

  // push parameters into the engine
  useEffect(() => { chime.setParams({ volume: unit.volume, wind: unit.wind, decay: unit.decay, cutX: unit.cutX, q: unit.q, root: unit.root, scale }); },
    [chime, unit.volume, unit.wind, unit.decay, unit.cutX, unit.q, unit.root, scale]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prog = useMemo(() => { chime.chooseVoice(voice); return chime.midiProgram(); }, [chime, voice, fontsVersion]);
  useEffect(() => { chime.setSound(unit.sound); }, [chime, unit.sound]);

  // canvas + animation; the instance is torn down with the unit
  useEffect(() => {
    const detach = chime.attach(canvasRef.current);
    return () => { detach(); chime.destroy(); };
  }, [chime]);

  // flash the tube cell on every strike, and send it to the MIDI port on this unit's channel
  useEffect(() => chime.onHit((i, vel) => {
    if (M.currentOutput()) M.note(channelRef.current, chime.noteOf(i), vel, decayRef.current);
    const el = cellRefs.current[i];
    if (!el) return;
    el.classList.add("hit");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("hit"), 140);
  }), [chime]);

  // MIDI: a channel change ends this channel's sounding notes first; program change and CCs follow the unit's
  // voice, filter and channel, and are resent whenever a port becomes live (linkSeq) or the unit is created
  useEffect(() => {
    if (channelRef.current !== unit.channel) { M.endNotes(channelRef.current); channelRef.current = unit.channel; }
  }, [unit.channel]);
  useEffect(() => { if (sendProg && M.currentOutput()) M.program(unit.channel, prog.bank, prog.prog); }, [prog, sendProg, midiLink, unit.channel]);
  useEffect(() => {
    if (sendCC && M.currentOutput()) { M.cc(unit.channel, 74, unit.cutX * 127); M.cc(unit.channel, 71, (unit.q - 0.5) / 17.5 * 127); }
  }, [unit.cutX, unit.q, sendCC, midiLink, unit.channel]);

  // size the canvas to whole-pixel multiples where there is room (its 1px border sits outside this)
  useEffect(() => {
    const fit = () => {
      const avail = (stageRef.current ? stageRef.current.clientWidth : E.W) - 2;
      const maxByH = Math.max(320, window.innerHeight - 110) * E.W / E.H;
      const w = Math.min(avail, maxByH, E.W * 2);
      setCanvasPx(w >= E.W * 2 ? Math.floor(w / E.W) * E.W : w);
      setFitted(true);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener("resize", fit);
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
  }, []);

  // place the unit at its stored offset from the center, clamped to the viewport the page has now.
  // Waits for the canvas to settle to its size; while dragging, motion keeps it inside.
  useEffect(() => {
    if (!fitted || !stageRef.current || !mainRef.current) return;
    const m = mainRef.current.getBoundingClientRect(), r = stageRef.current.getBoundingClientRect();
    const left = r.left - x.get(), top = r.top - y.get();
    x.set(Math.round(Math.min(Math.max(unit.x, m.left - left), m.right - left - r.width)));
    y.set(Math.round(Math.min(Math.max(unit.y, m.top - top), m.bottom - top - r.height)));
  }, [fitted, canvasPx, unit.x, unit.y, x, y, mainRef]);

  const onSound = async () => {
    if (unit.sound) { set({ sound: false }); return; }
    try {
      await E.startAudio(); // unlocks inside this tap
      set({ sound: true });
    } catch (err) {
      console.error("could not start audio", err);
    }
  };

  // map through the content box, inside the canvas's 1px border
  const onCanvasDown = e => {
    const c = canvasRef.current, r = c.getBoundingClientRect();
    // a press near a tube strikes it; anywhere else on the paper starts dragging the unit
    if (chime.strikeAt((e.clientX - r.left - c.clientLeft) / c.clientWidth * E.W, (e.clientY - r.top - c.clientTop) / c.clientHeight * E.H) < 0) dragControls.start(e);
  };

  const p = id; // per-unit prefix for element ids
  const voiceText = (groups.flatMap(g => g.items).find(it => it.value === voice) || {}).text || "";
  const voiceTag = voice[0] === "s" ? (prog.bank === 128 ? "GM DRUMS" : "GM " + (prog.prog + 1)) : "SYNTH";

  return (
    <motion.section
      ref={stageRef}
      aria-label={name}
      drag
      dragListener={false}
      dragControls={dragControls}
      dragConstraints={mainRef}
      dragElastic={0}
      dragMomentum={false}
      onDragEnd={() => set({ x: Math.round(x.get()), y: Math.round(y.get()) })}
      onPointerDownCapture={() => onFront(id)}
      style={{ x, y, zIndex: unit.z }}
      className="grid w-[min(402px,100%)] min-w-0 justify-items-start [grid-area:1/1]"
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={E.W}
          height={E.H}
          className="box-content touch-none border border-foreground"
          style={{ width: canvasPx, height: canvasPx * E.H / E.W }}
          onPointerDown={onCanvasDown}
          aria-label="Wind chime: six tubes hanging from a ring, a disc clapper and a wind sail. Tap a tube to strike it."
        />
        {/* the four round controls and the only icons on the page, by request: Lucide icons drawn without anti-aliasing */}
        <Button aria-label="COPY" disabled={count >= MAX_UNITS} onClick={() => onCopy(id, { x: Math.round(x.get()), y: Math.round(y.get()) })} className={`${ROUND} top-2.5 left-2.5`}>
          <CopyPlus size={16} aria-hidden="true" shapeRendering="crispEdges" />
        </Button>
        <Button aria-label="SOUND" aria-pressed={unit.sound} onClick={onSound} className={`${ROUND} top-2.5 right-2.5`}>
          {unit.sound
            ? <Volume2 size={16} aria-hidden="true" shapeRendering="crispEdges" />
            : <VolumeX size={16} aria-hidden="true" shapeRendering="crispEdges" />}
        </Button>
        <Button aria-label="NOTES" aria-pressed={unit.notes} aria-controls={`${p}-notes`} onClick={() => set({ notes: !unit.notes })} className={`${ROUND} bottom-2.5 left-2.5`}>
          <EighthNote size={16} aria-hidden="true" shapeRendering="crispEdges" />
        </Button>
        {/* the parameter rows; their state lives in the unit record, so values survive the popover closing */}
        <Popover>
          <PopoverTrigger asChild>
            <Button aria-label="SETTINGS" className={`${ROUND} right-2.5 bottom-2.5 data-[state=open]:bg-foreground data-[state=open]:text-background`}>
              <Settings2 size={16} aria-hidden="true" shapeRendering="crispEdges" />
            </Button>
          </PopoverTrigger>
          <PopoverContent aria-label={`SETTINGS ${name}`}>
            <div className="grid gap-3.5">
              <Param id={`${p}-p-volume`} label="VOLUME" value={unit.volume.toFixed(2)}>
                <ParamSlider id={`${p}-p-volume`} min={0} max={1} step={0.01} value={unit.volume} onChange={v => set({ volume: v })} />
              </Param>
              <Param id={`${p}-p-wind`} label="WIND" value={unit.wind.toFixed(2)}>
                <ParamSlider id={`${p}-p-wind`} min={0} max={1} step={0.01} value={unit.wind} onChange={v => set({ wind: v })} />
              </Param>
              <Param id={`${p}-p-decay`} label="DECAY" value={unit.decay.toFixed(1) + " S"}>
                <ParamSlider id={`${p}-p-decay`} min={0.3} max={12} step={0.1} value={unit.decay} onChange={v => set({ decay: v })} />
              </Param>
              <Param id={`${p}-p-freq`} label="FREQUENCY" value={hz(cutoff)}>
                <ParamSlider id={`${p}-p-freq`} min={0} max={1} step={0.001} value={unit.cutX} onChange={v => set({ cutX: v })} />
              </Param>
              <Param id={`${p}-p-res`} label="RESONANCE" value={"Q " + unit.q.toFixed(1)}>
                <ParamSlider id={`${p}-p-res`} min={0.5} max={18} step={0.1} value={unit.q} onChange={v => set({ q: v })} />
              </Param>
              <Param id={`${p}-p-root`} label="ROOT" value={E.noteName(unit.root)}>
                <ParamSelect id={`${p}-p-root`} value={String(unit.root)} display={rootText(unit.root)} onChange={v => set({ root: +v })}>
                  {ROOTS.map(m => <SelectItem key={m} value={String(m)}>{rootText(m)}</SelectItem>)}
                </ParamSelect>
              </Param>
              <Param id={`${p}-p-scale`} label="SCALE" value={scale.map(s => "+" + s).join(" ").replace(/\+0/, "0")}>
                <ParamSelect id={`${p}-p-scale`} value={unit.scale} display={unit.scale} onChange={v => set({ scale: v })}>
                  {SCALE_GROUPS.map(g => (
                    <SelectGroup key={g}>
                      <SelectLabel>{g.toUpperCase()}</SelectLabel>
                      {E.SCALE_LIST.map(s => s.group === g && <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>)}
                    </SelectGroup>
                  ))}
                </ParamSelect>
              </Param>
              <Param id={`${p}-p-voice`} label="SOUNDFONT" value={voiceTag}>
                <ParamSelect id={`${p}-p-voice`} value={voice} display={voiceText} onChange={v => set({ voice: v })}>
                  {groups.map(g => (
                    <SelectGroup key={g.label}>
                      <SelectLabel>{g.label}</SelectLabel>
                      {g.items.map(it => <SelectItem key={it.value} value={it.value}>{it.text}</SelectItem>)}
                    </SelectGroup>
                  ))}
                </ParamSelect>
              </Param>
              <Param id={`${p}-p-ch`} label="CHANNEL" value={unit.channel === 10 ? "10  GM DRUMS" : String(unit.channel)}>
                <ParamSelect id={`${p}-p-ch`} value={String(unit.channel)} display={channelText(unit.channel)} onChange={v => set({ channel: +v })}>
                  {CHANNELS.map(c => <SelectItem key={c} value={String(c)}>{channelText(c)}</SelectItem>)}
                </ParamSelect>
              </Param>
              {count > 1 && <div className={ROW}><Button onClick={() => onRemove(id)}>REMOVE</Button></div>}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      {/* tube notes drawer: hidden until NOTES is on, then shown flush under the drawing, sharing its bottom border */}
      <div id={`${p}-notes`} hidden={!unit.notes}>
        <div role="group" aria-label="TUBES" className="tubes grid max-w-full grid-cols-6 border border-t-0 border-foreground tabular-nums *:cursor-pointer *:border-l *:border-foreground *:py-2 *:text-center *:text-[12px] *:leading-[1.3] *:outline-none *:select-none *:first:border-l-0 *:hover:bg-foreground *:hover:text-background *:focus-visible:outline-1 *:focus-visible:-outline-offset-4 *:focus-visible:outline-dashed *:focus-visible:outline-current [&_b]:block [&_b]:text-[15px]" style={{ width: canvasPx + 2 }}>
          {scale.map((s, i) => {
            const m = unit.root + s;
            return (
              // each pad strikes its tube: on pointer down like the drawing, or Enter/Space (click with no pointer)
              <button type="button" key={i} ref={el => (cellRefs.current[i] = el)}
                onPointerDown={() => chime.strikeTube(i)} onClick={e => { if (!e.detail) chime.strikeTube(i); }}>
                <b>{E.noteName(m)}</b>{Math.round(E.mtof(m))}
              </button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
});

export default function Chime() {
  const mainRef = useRef(null);
  // the server renders one default unit; the stored list replaces it on mount
  const [units, setUnits] = useState(() => [defaultUnit()]);
  const loaded = useRef(false);
  const [fontsVersion, setFontsVersion] = useState(0);

  // MIDI out
  // null until mounted: the server has no navigator, so support is only known in the browser
  const [midiSupported, setMidiSupported] = useState(null);
  const [midi, setMidi] = useState(() => M.status());
  const [midiPorts, setMidiPorts] = useState([]);
  const [sendProg, setSendProg] = useState(true);
  const [sendCC, setSendCC] = useState(true);
  const [localSound, setLocalSound] = useState(true);
  const [midiMsg, setMidiMsg] = useState("");
  const [midiOpen, setMidiOpen] = useState(false);

  // fetch the audio library in the background; restore the units
  useEffect(() => {
    E.preloadAudio();
    setUnits(loadUnits());
    loaded.current = true;
  }, []);
  // save the units (without SOUND) a moment after the last change, and right away when the page goes away;
  // the single-unit keys go once they're carried over
  const unitsRef = useRef(units);
  unitsRef.current = units;
  const save = useCallback(() => {
    store.set("units", { v: 1, units: unitsRef.current.map(({ sound, ...u }) => u) });
    store.remove("pos"); store.remove("midiCh");
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(save, 250);
    window.addEventListener("pagehide", save);
    return () => { clearTimeout(t); window.removeEventListener("pagehide", save); };
  }, [units, save]);

  const change = useCallback((id, patch) => setUnits(us => us.map(u => (u.id === id ? { ...u, ...patch } : u))), []);
  // a copy takes the source's state, the lowest free channel, sits 24 px right and down, and goes on top
  const copy = useCallback((id, at) => setUnits(us => {
    const src = us.find(u => u.id === id);
    if (!src || us.length >= MAX_UNITS) return us;
    const z = Math.max(...us.map(u => u.z)) + 1;
    return [...us, { ...src, id: newId(), channel: lowestFreeChannel(us), x: at.x + 24, y: at.y + 24, z }];
  }), []);
  const remove = useCallback(id => {
    const us = unitsRef.current, u = us.find(v => v.id === id);
    if (!u || us.length <= 1) return;
    M.endNotes(u.channel); // end its sounding notes
    setUnits(cur => cur.filter(v => v.id !== id));
  }, []);
  // the pressed unit goes on top; z values are renumbered 1..n before they grow large
  const front = useCallback(id => setUnits(us => {
    const max = Math.max(...us.map(u => u.z)), u = us.find(v => v.id === id);
    if (!u || (u.z === max && us.filter(v => v.z === max).length === 1)) return us;
    const next = us.map(v => (v.id === id ? { ...v, z: max + 1 } : v));
    if (max + 1 <= 1000) return next;
    const order = [...next].sort((a, b) => a.z - b.z).map(v => v.id);
    return next.map(v => ({ ...v, z: order.indexOf(v.id) + 1 }));
  }), []);

  // bundled General MIDI soundfont
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const res = await fetch("/TimGM6mb.sf2");
        if (!res.ok) throw new Error("HTTP " + res.status);
        const ab = await res.arrayBuffer();
        if (dead || E.fonts.some(f => f.gm)) return;
        E.addFont(ab, "TimGM6mb", true);
        // a stored voice the font doesn't have goes back to the default (tubular bells)
        setUnits(us => us.map(u => (u.voice && !voiceExists(u.voice) ? { ...u, voice: null } : u)));
        setFontsVersion(n => n + 1);
      } catch (err) {
        // the built-in synth voices still work without it
        if (!dead) console.error("General MIDI soundfont did not load", err);
      }
    })();
    return () => { dead = true; };
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const groups = useMemo(() => voiceGroups(), [fontsVersion]);

  // ---------- MIDI out ----------
  useEffect(() => {
    setSendProg(store.get("sendProg", true));
    setSendCC(store.get("sendCC", true));
    setMidiSupported(M.supported());
    if (!M.supported()) setMidiMsg("This browser has no Web MIDI. Use Chrome, Edge or Firefox on a computer.");
    const sync = () => { setMidi(M.status()); setMidiPorts(M.listOutputs()); };
    sync();
    return M.onChange(sync);
  }, []);
  // remember the chosen port by name, so it is picked again on the next connect or replug
  useEffect(() => { if (midi.connected) store.set("midiOutName", midi.wanted); }, [midi.connected, midi.wanted]);
  useEffect(() => { store.set("sendProg", sendProg); store.set("sendCC", sendCC); }, [sendProg, sendCC]);
  useEffect(() => { E.setMuted(!localSound); }, [localSound]);

  const onMidiConnect = async () => {
    setMidiMsg("asking the browser for MIDI access");
    try {
      M.setWanted(store.get("midiOutName", ""));
      await M.connect();
      setMidiMsg("");
    } catch (err) {
      const blocked = err && (err.name === "NotAllowedError" || err.name === "SecurityError");
      setMidiMsg(blocked
        ? "MIDI access was blocked. Open the site settings (the icon left of the address bar), allow MIDI devices for this site, then press CONNECT MIDI again. In Firefox, accept the site permission prompt."
        : (err && err.message) || "MIDI access failed.");
    }
  };
  // program change and CCs follow from each unit's linkSeq effects
  const choosePort = id => { M.selectOutput(id); };
  // one test note per unit: its first tube, on its channel
  const onTestNote = () => { units.forEach(u => M.testNote(u.channel, u.root + E.sixOf(SCALE_BY_NAME[u.scale].deg)[0])); };
  const onPanic = () => { M.allNotesOff(units.map(u => u.channel)); };

  const midiReady = midi.connected;
  const midiLive = !!(midi.port && midi.port.state === "connected");
  const midiOut = midi.port ? midi.port.id : midi.wanted ? "wanted" : "";
  const livePort = midi.port && midiPorts.find(p => p.id === midi.port.id);
  const portText = livePort ? portName(livePort) : midi.wanted && !midi.port ? `${midi.wanted.toUpperCase()}   DISCONNECTED` : "NONE";

  return (
    <main ref={mainRef} className="fixed inset-0 grid place-items-center overflow-hidden pt-[max(16px,env(safe-area-inset-top,0px))] pr-[max(16px,env(safe-area-inset-right,0px))] pb-[max(16px,env(safe-area-inset-bottom,0px))] pl-[max(16px,env(safe-area-inset-left,0px))]">
      {/* every unit sits in the same centered cell, placed by its offset from the center; `isolate` keeps
          their stacking below the MIDI button */}
      <div className="isolate grid size-full place-items-center">
        {units.map((u, i) => (
          <ChimeUnit key={u.id} unit={u} index={i} count={units.length} mainRef={mainRef} fontsVersion={fontsVersion} groups={groups}
            midiLink={midi.linkSeq} sendProg={sendProg} sendCC={sendCC} onChange={change} onCopy={copy} onRemove={remove} onFront={front} />
        ))}
      </div>

      {/* MIDI OUT lives in a dialog; its state stays in Chime, so MIDI keeps running while the dialog is closed */}
      <Dialog open={midiOpen} onOpenChange={setMidiOpen}>
        <DialogTrigger asChild>
          <Button
            aria-label="MIDI"
            data-live={midiLive || undefined}
            className="fixed right-[calc(16px+env(safe-area-inset-right,0px))] bottom-[calc(16px+env(safe-area-inset-bottom,0px))] z-40 h-11 px-2.5 data-[live]:bg-foreground data-[live]:text-background"
          >
            <MidiLogo className="h-[18px] w-12" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-baseline gap-2">
              <DialogTitle>MIDI OUT</DialogTitle>
              <span className="lead" />
              <DialogClose asChild><Button>CLOSE</Button></DialogClose>
            </div>
            <DialogDescription className={NOTE}>Send every strike to a MIDI device or another app.</DialogDescription>
          </DialogHeader>
            <div className="grid gap-3.5">
              <Param id="m-out" label="MIDI OUT" value={midiReady ? (midiPorts.length + " PORT" + (midiPorts.length === 1 ? "" : "S")) : "OFF"}>
                {!midiReady ? (
                  <div className={ROW}>
                    <Button onClick={onMidiConnect} disabled={midiSupported === false}>CONNECT MIDI</Button>
                  </div>
                ) : (
                  // Radix Select values cannot be empty, so NONE is the "none" sentinel
                  <ParamSelect id="m-out" value={midiOut || "none"} display={portText} onChange={v => choosePort(v === "none" ? "" : v)}>
                    <SelectItem value="none">NONE</SelectItem>
                    {!midi.port && midi.wanted && <SelectItem value="wanted" disabled>{midi.wanted.toUpperCase()}   DISCONNECTED</SelectItem>}
                    {midiPorts.map(p => <SelectItem key={p.id} value={p.id}>{portName(p)}</SelectItem>)}
                  </ParamSelect>
                )}
              </Param>
              {midiReady && (
                <>
                  <div className="grid gap-1.5 text-[13px] tracking-[.04em] *:flex *:cursor-pointer *:items-center *:gap-2">
                    <label><Checkbox checked={sendProg} onCheckedChange={v => setSendProg(v === true)} /> SEND PROGRAM CHANGE</label>
                    <label><Checkbox checked={sendCC} onCheckedChange={v => setSendCC(v === true)} /> SEND FILTER AS CC74 / CC71</label>
                    <label><Checkbox checked={localSound} onCheckedChange={v => setLocalSound(v === true)} /> PLAY SOUND IN BROWSER TOO</label>
                  </div>
                  <div className={ROW}>
                    <Button disabled={!midi.port} onClick={onTestNote}>TEST NOTE</Button>
                    <Button onClick={onPanic}>PANIC</Button>
                    <span className={`${NOTE} min-w-0 [overflow-wrap:anywhere]`}>Each chime sends on the channel in its settings. Note length follows its DECAY. TEST NOTE plays every chime&apos;s first tube. PANIC sends All Notes Off on every chime&apos;s channel.</span>
                  </div>
                </>
              )}
              {midiMsg && <p className={NOTE}>{midiMsg}</p>}
              {midi.error && <p className={NOTE}>{midi.error}</p>}
              {midiReady && !midiPorts.length && <p className={NOTE}>No MIDI outputs found. Plug in an interface or start a virtual port (IAC Driver on a Mac, loopMIDI on Windows).</p>}
            </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

"use client";

import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CopyPlus, EighthNote, Menu, Settings2, Volume2, VolumeX } from "lucide-react";
import dynamic from "next/dynamic";
import { motion, useDragControls, useMotionValue } from "motion/react";
import * as E from "../lib/engine";
import * as C from "../lib/colors";
import * as M from "../lib/midiout";
import * as Sh from "../lib/share";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchSelect } from "@/components/ui/search-select";
import { Slider } from "@/components/ui/slider";

const hz = f => (f >= 1000 ? (f / 1000).toFixed(2) + " KHZ" : Math.round(f) + " HZ");
const SCALE_GROUPS = E.SCALES.map(([group]) => group);
const SCALE_BY_NAME = Object.fromEntries(E.SCALE_LIST.map(s => [s.name, s]));
// SCALE's options for SearchSelect: by group, in catalog order
const SCALE_OPTIONS = SCALE_GROUPS.map(g => ({ label: g.toUpperCase(), items: E.SCALE_LIST.filter(s => s.group === g).map(s => ({ value: s.name, name: s.name, text: s.name })) }));
const CHANNELS = Array.from({ length: 16 }, (_, k) => k + 1);
const MAX_UNITS = Sh.MAX_UNITS;
const store = {
  get(k, d) { try { const v = localStorage.getItem("windchime." + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("windchime." + k, JSON.stringify(v)); } catch (e) {} },
  remove(k) { try { localStorage.removeItem("windchime." + k); } catch (e) {} },
};

// ROOT picks the note, OCTAVE the octave (−1 to 8, octave 4 holds middle C); the unit keeps one MIDI note
const octaveOf = m => Math.floor(m / 12) - 1;
const rootOf = (note, octave) => 12 * (octave + 1) + note;
const channelText = c => `CHANNEL ${c}${c === 10 ? "  (GM DRUMS)" : ""}`;
const portName = p => p.name.toUpperCase() + (p.manufacturer ? "   " + p.manufacturer.toUpperCase() : "");
// OUTPUT "3-4" shows as "3–4"; the options are the pairs, then the single channels, up to the device's count
const outputText = o => o.replace("-", "–");
const outputFits = (o, n) => { const { first, count } = E.outputOf(o); return first + count <= n; };
const outputOptions = n => [
  ...Array.from({ length: n >> 1 }, (_, k) => `${2 * k + 1}-${2 * k + 2}`),
  ...Array.from({ length: n }, (_, k) => String(k + 1)),
];
const deviceName = d => d.label.toUpperCase();

const NOTE = "m-0 max-w-[60ch] text-[11px]";
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

// a unit's ink style (C.inkStyle), for popups that portal out of the unit and so don't inherit its tokens
const InkContext = createContext(undefined);

// `display` is the current choice's text: Radix only fills SelectValue on the client, so pass it in for the server render
function ParamSelect({ id, value, display, onChange, disabled, children }) {
  const ink = useContext(InkContext);
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} aria-labelledby={`${id}-label`}><SelectValue>{display}</SelectValue></SelectTrigger>
      <SelectContent style={ink}>{children}</SelectContent>
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
    const opt = ({ p, i }) => ({ value: `s${fi}:${i}`, name: p.name.toUpperCase(), text: `${String(p.preset + 1).padStart(3, " ")}  ${p.name.toUpperCase()}` });
    const optBank = ({ p, i }) => ({ value: `s${fi}:${i}`, name: p.name.toUpperCase(), text: `${p.bank}:${p.preset + 1}  ${p.name.toUpperCase()}` });
    E.GM_FAMILIES.forEach((fam, k) => groups.push({ label: fam, items: list.filter(x => x.p.bank === 0 && x.p.preset >> 3 === k).map(opt) }));
    groups.push({ label: "DRUM KITS", items: list.filter(x => x.p.bank === 128).map(opt) });
    groups.push({ label: "OTHER BANKS", items: list.filter(x => x.p.bank !== 0 && x.p.bank !== 128).map(optBank) });
  });
  groups.push({ label: "BUILT-IN SYNTH", items: E.VOICES.map((v, i) => ({ value: `v${i}`, name: v.name, text: v.name })) });
  return groups.filter(g => g.items.length);
}
const voiceExists = v => {
  if (v[0] !== "s") return true;
  const [fi, pi] = v.slice(1).split(":").map(Number);
  return !!(E.fonts[fi] && E.fonts[fi].presets[pi]);
};
// null voice: the instrument's default. A furin's is the built-in FURIN (v6); a tube chime's is GM tubular bells once
// the soundfont has loaded, the built-in tubular bells before.
const defaultVoice = instrument => (instrument === "furin" ? "v6" : E.fonts.length ? "s0:" + E.findPreset(0, 0, 14) : "v0");
const INSTRUMENT_TEXT = { chime: "TUBE CHIME", furin: "FURIN BELL" };

// ---------- units ----------
// A unit is plain data; SOUND is kept for the visit only and never stored (browser audio starts only from a tap).
const newId = () => "u" + Math.random().toString(36).slice(2, 10);
const defaultUnit = (id = "u1") => ({ id, ...Sh.DEFAULTS });
const TUBE_WORDS = { 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight" };
// Stored and linked records are checked field by field (Sh.UnitSchema): anything unknown or out of range falls back
// to the default. Ids are checked here.
function readUnit(raw, seen) {
  const r = raw && typeof raw === "object" ? raw : {};
  let id = typeof r.id === "string" && /^u[\w-]{1,24}$/.test(r.id) ? r.id : newId();
  if (seen.has(id)) id = newId();
  seen.add(id);
  return { id, ...Sh.UnitSchema.parse(r) };
}
// Checked unit records (from a link or a saved composition) as page units, with fresh ids.
function freshUnits(records) {
  const seen = new Set();
  return records.map(r => readUnit(r, seen));
}
// A composition from a share link in the fragment ("#c=..."), or null when there is none.
function linkedUnits(hash) {
  const code = Sh.codeFromHash(hash), units = code && Sh.decode(code);
  return units ? freshUnits(units) : null;
}
// The COMPOSITIONS panel's content, with Relay; nothing of it loads until MENU is first pressed.
const Compositions = dynamic(() => import("./Compositions"), {
  ssr: false,
  loading: () => <p className="m-0 text-[11px] tracking-[.08em] uppercase">LOADING…</p>,
});
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
const ChimeUnit = memo(function ChimeUnit({ unit, index, count, mainRef, fontsVersion, groups, outChannels, midiLink, sendProg, sendCC, onChange, onCopy, onRemove, onFront, faded }) {
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
  // the unit draws in its MIDI channel's ink: the canvas through the engine, everything else through the theme tokens
  // while another channel is focused the unit draws in a 25% tint of its ink, still opaque on white
  const inkHex = faded ? C.tint(C.inkOf(unit.channel).hex, 0.25) : C.inkOf(unit.channel).hex;
  const ink = C.inkStyle(inkHex);
  useEffect(() => chime.setInk(inkHex), [chime, inkHex]);

  const scale = useMemo(() => E.tubeNotes(SCALE_BY_NAME[unit.scale].deg, unit.tubes), [unit.scale, unit.tubes]);
  const cutoff = E.cutoffHz(unit.cutX);
  const furin = unit.instrument === "furin";
  const voice = unit.voice || defaultVoice(unit.instrument);
  const channelRef = useRef(unit.channel);
  const monoRef = useRef(false);
  monoRef.current = unit.midiMode === "mono";
  const decayRef = useRef(unit.decay);
  decayRef.current = unit.decay;

  // push parameters into the engine
  useEffect(() => { chime.setParams({ instrument: unit.instrument, volume: unit.volume, tubes: unit.tubes, wind: unit.wind, decay: unit.decay, cutX: unit.cutX, q: unit.q, root: unit.root, scale }); },
    [chime, unit.instrument, unit.volume, unit.tubes, unit.wind, unit.decay, unit.cutX, unit.q, unit.root, scale]);
  // where it is heard; the engine plays it on 1-2 while the device lacks those channels
  useEffect(() => { chime.setParams({ output: E.outputOf(unit.output) }); }, [chime, unit.output]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const prog = useMemo(() => { chime.chooseVoice(voice); return chime.midiProgram(); }, [chime, voice, fontsVersion]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { chime.setSound(unit.sound, { quiet: unit.soundQuiet }); }, [chime, unit.sound]);

  // canvas + animation; the instance is torn down with the unit
  useEffect(() => {
    const detach = chime.attach(canvasRef.current);
    return () => { detach(); chime.destroy(); };
  }, [chime]);

  // flash the tube cell on every strike, and send it to the MIDI port on this unit's channel, tagged with its tube
  // (in POLY a key sounding from another tube stacks; in MONO it is ended first)
  useEffect(() => chime.onHit((i, vel) => {
    if (M.currentOutput()) M.note(channelRef.current, chime.noteOf(i), vel, decayRef.current, `${id}:${i}`, monoRef.current);
    const el = cellRefs.current[i];
    if (!el) return;
    el.classList.add("hit");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("hit"), 140);
  }), [chime, id]);

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
      // narrow screens (the max-sm breakpoint): at most 298 px, so the unit with its border is 300 px wide
      const cap = window.matchMedia("(width < 40rem)").matches ? 298 : E.W * 2;
      const w = Math.min(avail, maxByH, cap);
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
      set({ sound: true, soundQuiet: false });
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
  const voiceItem = groups.flatMap(g => g.items).find(it => it.value === voice) || { name: "", text: "" };
  const voiceText = voiceItem.text;
  const voiceTag = voice[0] === "s" ? (prog.bank === 128 ? "GM DRUMS" : "GM " + (prog.prog + 1)) : "SYNTH";
  const outputOk = outputFits(unit.output, outChannels);
  const outputLabel = outputText(unit.output) + (outputOk ? "" : "   UNAVAILABLE");

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
      style={{ x, y, zIndex: unit.z, ...ink }}
      className="grid w-[min(402px,100%)] max-sm:w-[min(300px,100%)] min-w-0 justify-items-start [grid-area:1/1]"
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={E.W}
          height={E.H}
          className="box-content touch-none border border-foreground"
          style={{ width: canvasPx, height: canvasPx * E.H / E.W }}
          onPointerDown={onCanvasDown}
          aria-label={furin
            ? "Furin bell: a bell on a hook, with a clapper inside and a paper strip that catches the wind. Tap the bell to strike it."
            : `Wind chime: ${TUBE_WORDS[unit.tubes]} tubes hanging from a ring, a disc clapper and a wind sail. Tap a tube to strike it.`}
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
          <PopoverContent aria-label={`SETTINGS ${name}`} style={ink}>
            <InkContext.Provider value={ink}>
            <div className="grid gap-3.5">
              <Param id={`${p}-p-inst`} label="INSTRUMENT" value={furin ? "ONE NOTE" : `${unit.tubes} TUBES`}>
                <ParamSelect id={`${p}-p-inst`} value={unit.instrument} display={INSTRUMENT_TEXT[unit.instrument]} onChange={v => set({ instrument: v })}>
                  <SelectItem value="chime">TUBE CHIME</SelectItem>
                  <SelectItem value="furin">FURIN BELL</SelectItem>
                </ParamSelect>
              </Param>
              <Param id={`${p}-p-volume`} label="VOLUME" value={unit.volume.toFixed(2)}>
                <ParamSlider id={`${p}-p-volume`} min={0} max={1} step={0.01} value={unit.volume} onChange={v => set({ volume: v })} />
              </Param>
              {/* a furin plays its root alone: no tubes or scale (their values are kept for switching back) */}
              {!furin && (
                <Param id={`${p}-p-tubes`} label="TUBES" value={String(unit.tubes)}>
                  <ParamSlider id={`${p}-p-tubes`} min={E.MIN_TUBES} max={E.MAX_TUBES} step={1} ticks value={unit.tubes} onChange={v => set({ tubes: v })} />
                </Param>
              )}
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
                <ParamSelect id={`${p}-p-root`} value={String(unit.root % 12)} display={E.NOTE_NAMES[unit.root % 12]} onChange={v => set({ root: rootOf(+v, octaveOf(unit.root)) })}>
                  {E.NOTE_NAMES.map((n, k) => <SelectItem key={n} value={String(k)}>{n}</SelectItem>)}
                </ParamSelect>
              </Param>
              <Param id={`${p}-p-octave`} label="OCTAVE" value={String(octaveOf(unit.root))}>
                <ParamSlider id={`${p}-p-octave`} min={-1} max={8} step={1} ticks value={octaveOf(unit.root)} onChange={v => set({ root: rootOf(unit.root % 12, v) })} />
              </Param>
              {!furin && (
                <Param id={`${p}-p-scale`} label="SCALE" value={scale.map(s => "+" + s).join(" ").replace(/\+0/, "0")}>
                  <SearchSelect id={`${p}-p-scale`} value={unit.scale} display={unit.scale} groups={SCALE_OPTIONS} byGroup contentStyle={ink} onChange={v => set({ scale: v })} />
                </Param>
              )}
              <Param id={`${p}-p-voice`} label="SOUNDFONT" value={voiceTag}>
                <SearchSelect id={`${p}-p-voice`} value={voice} display={voiceText} groups={groups} contentStyle={ink} onChange={v => set({ voice: v })} />
              </Param>
              {/* not on phones and tablets, which play through their own output */}
              <div className="touch:hidden">
                <Param id={`${p}-p-out`} label="OUTPUT" value={outputLabel}>
                  <ParamSelect id={`${p}-p-out`} value={unit.output} display={outputLabel} onChange={v => set({ output: v })}>
                    {!outputOk && <SelectItem value={unit.output} disabled>{outputLabel}</SelectItem>}
                    {outputOptions(outChannels).map(o => <SelectItem key={o} value={o}>{outputText(o)}</SelectItem>)}
                  </ParamSelect>
                </Param>
              </div>
              <Param id={`${p}-p-ch`} label="CHANNEL" value={unit.channel === 10 ? "10  GM DRUMS" : String(unit.channel)}>
                <ParamSelect id={`${p}-p-ch`} value={String(unit.channel)} display={channelText(unit.channel)} onChange={v => set({ channel: +v })}>
                  {CHANNELS.map(c => <SelectItem key={c} value={String(c)}>{channelText(c)}</SelectItem>)}
                </ParamSelect>
              </Param>
              <Param id={`${p}-p-mode`} label="MIDI MODE" value={unit.midiMode.toUpperCase()}>
                <ParamSelect id={`${p}-p-mode`} value={unit.midiMode} display={unit.midiMode.toUpperCase()} onChange={v => set({ midiMode: v })}>
                  <SelectItem value="poly">POLY</SelectItem>
                  <SelectItem value="mono">MONO</SelectItem>
                </ParamSelect>
              </Param>
              {count > 1 && <div className={ROW}><Button onClick={() => onRemove(id)}>REMOVE</Button></div>}
            </div>
            </InkContext.Provider>
          </PopoverContent>
        </Popover>
      </div>
      {/* tube notes drawer: hidden until NOTES is on, then shown flush under the drawing, sharing its bottom border */}
      <div id={`${p}-notes`} hidden={!unit.notes}>
        <div role="group" aria-label="TUBES" className="tubes grid max-w-full bg-background border border-t-0 border-foreground tabular-nums *:cursor-pointer *:border-l *:border-foreground *:py-2 *:text-center *:text-[10px] *:leading-[1.3] *:outline-none *:select-none *:first:border-l-0 *:hover:bg-foreground *:hover:text-background *:focus-visible:outline-1 *:focus-visible:-outline-offset-4 *:focus-visible:outline-dashed *:focus-visible:outline-current [&_b]:block [&_b]:text-[13px]" style={{ width: canvasPx + 2, gridTemplateColumns: `repeat(${furin ? 1 : unit.tubes}, minmax(0, 1fr))` }}>
          {(furin ? [0] : scale).map((s, i) => {
            const m = E.foldNote(unit.root + s);
            return (
              // each pad strikes its tube: on pointer down like the drawing, or Enter/Space (click with no pointer)
              <button type="button" key={i} ref={el => (cellRefs.current[i] = el)}
                onPointerDown={() => chime.strikeTube(i)} onClick={e => { if (!e.detail) chime.strikeTube(i); }}>
                <b>{E.noteName(m)}</b>{Math.round(E.mtof(m))}
              </button>
            );
          })}
        </div>
        {/* what the pads play: the voice (no program number) and the scale, or FURIN BELL */}
        <p className="m-0 max-w-full truncate border border-t-0 border-foreground bg-background px-2 py-1 text-[10px] leading-[1.3]" style={{ width: canvasPx + 2 }}>
          {voiceItem.name} · {furin ? "FURIN BELL" : unit.scale}
        </p>
      </div>
    </motion.section>
  );
});

export default function Chime() {
  const mainRef = useRef(null);
  // the server renders one default unit; the stored list replaces it on mount
  const [units, setUnits] = useState(() => [defaultUnit()]);
  const usedChannels = useMemo(() => new Set(units.map(u => u.channel)), [units]);
  // channel focus (the lower-left strip): a channel number or null, never stored. `focused` drops a focus whose
  // channel is gone or that the hidden strip (one channel) can no longer show, and the effect forgets it
  const [focus, setFocus] = useState(null);
  const focused = focus != null && usedChannels.size > 1 && usedChannels.has(focus) ? focus : null;
  useEffect(() => { if (focused == null && focus != null) setFocus(null); }, [focus, focused]);
  const focusRef = useRef(null);
  focusRef.current = focused;
  const loaded = useRef(false);
  const ownHash = useRef(null);
  const [shared, setShared] = useState(false);
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
  // AUDIO OUT: the chosen device is remembered by id and name (ids reset when site data is cleared), with the last
  // channel count seen on it, so OUTPUT has its options before audio starts. Never in links or saved compositions.
  const [audioOpen, setAudioOpen] = useState(false);
  const [audioSupported, setAudioSupported] = useState(null); // null until mounted (SSR)
  const [audioDevices, setAudioDevices] = useState([]);
  const [audioWanted, setAudioWanted] = useState({ id: "", label: "", channels: 2 });
  const [liveChannels, setLiveChannels] = useState(null);
  const [audioMsg, setAudioMsg] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuOpenings, setMenuOpenings] = useState(0);
  const onMenuOpenChange = useCallback(open => { setMenuOpen(open); if (open) setMenuOpenings(n => n + 1); }, []);

  // fetch the audio library in the background; restore the units
  useEffect(() => {
    E.preloadAudio();
    // a share link replaces the saved units (the save effect writes it over them); the fragment then goes, so a
    // reload shows the composition as edited since. A fragment that isn't a composition is dropped too.
    const fromLink = () => {
      if (!location.hash) return null;
      const us = linkedUnits(location.hash);
      history.replaceState(null, "", location.pathname + location.search);
      return us;
    };
    setUnits(fromLink() || loadUnits());
    loaded.current = true;
    // a link pasted into an open tab
    const onHash = () => {
      if (location.hash === ownHash.current) return; // SHARE's own fallback, not a link to open
      const us = fromLink();
      if (us) replaceComposition(us);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  // save the units (without SOUND) a moment after the last change, and right away when the page goes away;
  // the single-unit keys go once they're carried over
  const unitsRef = useRef(units);
  unitsRef.current = units;
  const save = useCallback(() => {
    store.set("units", { v: 1, units: unitsRef.current.map(({ sound, soundQuiet, ...u }) => u) });
    store.remove("pos"); store.remove("midiCh");
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(save, 250);
    window.addEventListener("pagehide", save);
    return () => { clearTimeout(t); window.removeEventListener("pagehide", save); };
  }, [units, save]);

  // a link or a saved composition replaces every unit: the old units' MIDI notes end, the new ones start muted
  // (SOUND is never carried), and the save effect writes them over the stored units
  const replaceComposition = useCallback(us => {
    unitsRef.current.forEach(u => M.endNotes(u.channel));
    setUnits(us);
  }, []);
  // RESET: one default unit, as on a first visit, with a fresh id so it starts from rest
  const reset = useCallback(() => replaceComposition([defaultUnit(newId())]), [replaceComposition]);
  // A saved composition is picked with a tap, so its units start sounding: audio starts inside the click, the units
  // load muted at once, and the ones still on the page turn on when audio is running (quietly: no arpeggio each)
  const openSaved = useCallback(records => {
    const started = E.startAudio();
    const us = freshUnits(records), ids = new Set(us.map(u => u.id));
    replaceComposition(us);
    setMenuOpen(false);
    started.then(
      () => setUnits(cur => cur.map(u => (ids.has(u.id) ? { ...u, sound: true, soundQuiet: true } : u))),
      err => console.error("could not start audio", err),
    );
  }, [replaceComposition]);
  const getUnits = useCallback(() => unitsRef.current, []);

  const change = useCallback((id, patch) => setUnits(us => us.map(u => (u.id === id ? { ...u, ...patch } : u))), []);
  // a copy takes the source's state, the lowest free channel, sits 24 px right and down, and goes on top
  const copy = useCallback((id, at) => setUnits(us => {
    const src = us.find(u => u.id === id);
    if (!src || us.length >= MAX_UNITS) return us;
    const z = Math.max(...us.map(u => u.z)) + 1;
    return [...us, { ...src, soundQuiet: false, id: newId(), channel: lowestFreeChannel(us), x: at.x + 24, y: at.y + 24, z }];
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

  // any press inside a unit brings it to the front; a press on a faded unit also ends channel focus
  const pressUnit = useCallback(id => {
    front(id);
    const f = focusRef.current, u = unitsRef.current.find(v => v.id === id);
    if (f != null && u && u.channel !== f) setFocus(null);
  }, [front]);

  // bundled General MIDI soundfont
  useEffect(() => {
    // only the font's tables load now (about 205 KB); a preset's samples load when a unit sounds with it.
    // Leaving the page cancels the downloads, which is not an error.
    let dead = false;
    const ctl = new AbortController(), leave = () => ctl.abort();
    window.addEventListener("pagehide", leave);
    (async () => {
      try {
        if (E.fonts.some(f => f.gm)) return;
        await E.loadFont("/TimGM6mb.sf2", "TimGM6mb", { signal: ctl.signal });
        if (dead) return;
        // a stored voice the font doesn't have goes back to the default (tubular bells)
        setUnits(us => us.map(u => (u.voice && !voiceExists(u.voice) ? { ...u, voice: null } : u)));
        setFontsVersion(n => n + 1);
      } catch (err) {
        // the built-in synth voices still work without it
        if (!dead && !ctl.signal.aborted) console.error("General MIDI soundfont did not load", err);
      }
    })();
    return () => { dead = true; window.removeEventListener("pagehide", leave); ctl.abort(); };
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

  // ---------- audio out ----------
  const listDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      // "default" and "communications" are aliases Chrome adds for the system's own choices
      setAudioDevices(all.filter(d => d.kind === "audiooutput" && !["default", "communications"].includes(d.deviceId))
        .map(d => ({ id: d.deviceId, label: d.label })));
    } catch (e) { setAudioDevices([]); }
  }, []);
  useEffect(() => {
    setAudioSupported(E.audioOutSupported() && !!(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices));
    const w = store.get("audioOut", null);
    if (w && typeof w.id === "string") setAudioWanted({ id: w.id, label: typeof w.label === "string" ? w.label : "", channels: Math.max(1, Math.min(Sh.MAX_OUTPUT_CHANNELS, Math.round(+w.channels) || 2)) });
    const offOut = E.onOutputChange(n => setLiveChannels(n));
    if (E.outputChannels()) setLiveChannels(E.outputChannels());
    if (!navigator.mediaDevices || !navigator.mediaDevices.addEventListener) return offOut;
    listDevices();
    navigator.mediaDevices.addEventListener("devicechange", listDevices);
    return () => { offOut(); navigator.mediaDevices.removeEventListener("devicechange", listDevices); };
  }, [listDevices]);
  // the device to play on: the wanted one by id, else by name; the system default while it is unplugged. While the
  // browser hides device names (no media permission yet) the list can't be read, so the remembered id is tried as is.
  const namesHidden = audioSupported && audioDevices.every(d => !d.label);
  const wantedDevice = audioWanted.id
    ? audioDevices.find(d => d.id === audioWanted.id) || (audioWanted.label && audioDevices.find(d => d.label === audioWanted.label))
    : null;
  const audioDisconnected = !!audioSupported && !!audioWanted.id && !namesHidden && !wantedDevice;
  const sinkId = !audioSupported || !audioWanted.id ? "" : wantedDevice ? wantedDevice.id : namesHidden ? audioWanted.id : "";
  const sinkListed = !!wantedDevice;
  useEffect(() => { if (audioSupported) E.setAudioDevice(sinkId, { listed: sinkListed }); }, [audioSupported, sinkId, sinkListed]);
  // the count seen on the wanted device is kept for the next visit
  useEffect(() => {
    if (liveChannels && !audioDisconnected) setAudioWanted(w => (w.channels === liveChannels ? w : { ...w, channels: liveChannels }));
  }, [liveChannels, audioDisconnected]);
  useEffect(() => { if (audioSupported !== null) store.set("audioOut", { v: 1, ...audioWanted }); }, [audioWanted, audioSupported]);
  const outChannels = liveChannels || audioWanted.channels || 2;
  const chooseDevice = v => {
    if (v === "default") setAudioWanted(w => ({ id: "", label: "", channels: w.id ? 2 : w.channels }));
    else {
      const d = audioDevices.find(x => x.id === v);
      if (d) setAudioWanted(w => ({ id: d.id, label: d.label, channels: w.id === d.id ? w.channels : 2 }));
    }
  };
  // names need a media permission, asked only from this button; the input it opens is closed at once
  const onShowNames = async () => {
    setAudioMsg("");
    try {
      if (typeof navigator.mediaDevices.selectAudioOutput === "function") {
        const d = await navigator.mediaDevices.selectAudioOutput();
        await listDevices();
        setAudioWanted({ id: d.deviceId, label: d.label, channels: 2 });
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      await listDevices();
    } catch (err) {
      setAudioMsg("DEVICE NAMES NOT AVAILABLE");
    }
  };
  const deviceValue = audioDisconnected ? "wanted" : sinkId && (wantedDevice || namesHidden) ? (wantedDevice ? wantedDevice.id : "wanted") : "default";
  const deviceText = audioDisconnected ? `${audioWanted.label.toUpperCase() || "DEVICE"}   DISCONNECTED`
    : wantedDevice ? deviceName(wantedDevice)
    : sinkId ? audioWanted.label.toUpperCase() || "CHOSEN DEVICE" : "SYSTEM DEFAULT";

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
  const onTestNote = () => { units.forEach(u => M.testNote(u.channel, E.foldNote(u.root + (u.instrument === "furin" ? 0 : E.tubeNotes(SCALE_BY_NAME[u.scale].deg, 1)[0])))); };
  const onPanic = () => { M.allNotesOff(units.map(u => u.channel)); };

  const midiReady = midi.connected;
  const shareTimer = useRef(0);
  useEffect(() => () => clearTimeout(shareTimer.current), []);
  const onShare = async () => {
    const hash = "#c=" + Sh.encode(unitsRef.current);
    const url = location.origin + location.pathname + hash;
    const done = () => { setShared(true); clearTimeout(shareTimer.current); shareTimer.current = setTimeout(() => setShared(false), 1500); };
    try { await navigator.clipboard.writeText(url); done(); return; } catch (e) { /* blocked or missing */ }
    if (typeof navigator.share === "function") {
      try { await navigator.share({ url }); } catch (e) { /* dismissed */ }
      return;
    }
    ownHash.current = hash;
    location.hash = hash;
  };
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
          <ChimeUnit key={u.id} unit={u} index={i} count={units.length} mainRef={mainRef} fontsVersion={fontsVersion} groups={groups} outChannels={outChannels}
            midiLink={midi.linkSeq} sendProg={sendProg} sendCC={sendCC} onChange={change} onCopy={copy} onRemove={remove} onFront={pressUnit}
            faded={focused != null && u.channel !== focused} />
        ))}
      </div>

      {/* the active channels, lower left, while units use two or more: one ink square each, packed down the columns
          (1 top left, 2 under it, 3 top of the next column), up to 8 columns; a square focuses its channel (other units
          pale to a 25% tint of their ink), again to end it. Below sm it turns upright, 2 wide and up to 8 tall, packed left to right and up
          from the lower left (flex wrap-reverse), and the button row narrows to leave it room. */}
      {usedChannels.size > 1 && (
        <div
          role="group"
          aria-label="ACTIVE CHANNELS"
          className="fixed left-[calc(16px+env(safe-area-inset-left,0px))] bottom-[calc(16px+env(safe-area-inset-bottom,0px))] z-40 grid h-11 grid-flow-col grid-rows-[repeat(2,22px)] auto-cols-[22px] max-sm:flex max-sm:h-auto max-sm:w-11 max-sm:flex-wrap-reverse"
        >
          {[...usedChannels].sort((a, b) => a - b).map(ch => {
            const ink = C.inkOf(ch), on = focused === ch;
            return (
              <button
                key={ch}
                type="button"
                aria-label={`${ch} ${ink.name}`}
                aria-pressed={on}
                onClick={() => setFocus(on ? null : ch)}
                style={{ background: ink.hex }}
                className="relative grid size-[22px] cursor-pointer place-items-center border-0 p-0 text-[10px] leading-none text-white tabular-nums focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-foreground focus-visible:outline-offset-3"
              >
                {ch}
                {on && <span aria-hidden="true" className="absolute inset-[2px] border border-white" />}
              </button>
            );
          })}
        </div>
      )}

      {/* MENU (upper right) opens the COMPOSITIONS panel: SAVE and the public list of saved compositions. The one icon
          outside the units' round buttons, by request; square like SHARE and MIDI. */}
      <Sheet open={menuOpen} onOpenChange={onMenuOpenChange}>
        <SheetTrigger asChild>
          <Button
            aria-label="MENU"
            className="fixed top-[calc(16px+env(safe-area-inset-top,0px))] right-[calc(16px+env(safe-area-inset-right,0px))] z-40 h-11 w-11 p-0"
          >
            <Menu size={20} aria-hidden="true" shapeRendering="crispEdges" />
          </Button>
        </SheetTrigger>
        <SheetContent aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>COMPOSITIONS</SheetTitle>
            <SheetClose asChild><Button className="h-8 px-2.5">CLOSE</Button></SheetClose>
          </SheetHeader>
          <Compositions opening={menuOpenings} getUnits={getUnits} onOpen={openSaved} />
        </SheetContent>
      </Sheet>

      {/* the lower-right row: SHARE, RESET, AUDIO, MIDI, 8 px apart and equal in width (narrower on the narrowest
          screens); phones and tablets have no AUDIO, so their row is SHARE, RESET, MIDI */}
      {/* beside the upright channel strip (44 px and an 8 px gap) the narrow row gives up 52 px */}
      <div className={`fixed right-[calc(16px+env(safe-area-inset-right,0px))] bottom-[calc(16px+env(safe-area-inset-bottom,0px))] z-40 flex gap-2 *:h-11 *:w-[min(76px,calc((100vw-56px)/4))] *:px-1 touch:*:w-[76px]${usedChannels.size > 1 ? " max-sm:*:w-[min(76px,calc((100vw-108px)/4))] max-sm:touch:*:w-[min(76px,calc((100vw-100px)/3))]" : ""}`}>
      {/* SHARE copies a link to the composition; where the clipboard is blocked it offers the share sheet, and failing
          that leaves the link in the address bar */}
      <Button onClick={onShare}>
        {shared ? "COPIED" : "SHARE"}
      </Button>

      {/* RESET goes back to one default unit at once, with no confirmation */}
      <Button onClick={reset}>
        RESET
      </Button>

      {/* AUDIO OUT: the output device for the browser's sound; each unit's OUTPUT is in its settings */}
      <Dialog open={audioOpen} onOpenChange={setAudioOpen}>
        <DialogTrigger asChild>
          <Button className="touch:hidden">AUDIO</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-baseline gap-2">
              <DialogTitle>AUDIO OUT</DialogTitle>
              <span className="lead" />
              <DialogClose asChild><Button>CLOSE</Button></DialogClose>
            </div>
            <DialogDescription className={NOTE}>Play the browser&apos;s sound through any audio device. Each chime picks its channels in its settings (OUTPUT).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3.5">
            <Param id="a-dev" label="DEVICE" value={audioDisconnected ? "DISCONNECTED" : sinkId ? "CHOSEN" : "DEFAULT"}>
              <ParamSelect id="a-dev" value={deviceValue} display={deviceText} onChange={chooseDevice} disabled={!audioSupported}>
                <SelectItem value="default">SYSTEM DEFAULT</SelectItem>
                {deviceValue === "wanted" && <SelectItem value="wanted" disabled>{deviceText}</SelectItem>}
                {!namesHidden && audioDevices.map(d => <SelectItem key={d.id} value={d.id}>{deviceName(d)}</SelectItem>)}
              </ParamSelect>
            </Param>
            <Param id="a-ch" label="CHANNELS" value={String(outChannels)} />
            {namesHidden && (
              <div className={ROW}>
                <Button onClick={onShowNames}>SHOW DEVICE NAMES</Button>
                <span className={`${NOTE} min-w-0`}>The browser shows device names only after you allow the microphone once. Nothing is recorded.</span>
              </div>
            )}
            {audioSupported === false && <p className={NOTE}>THIS BROWSER PLAYS THROUGH THE SYSTEM OUTPUT. CHOOSE THE DEVICE IN YOUR SYSTEM SETTINGS.</p>}
            {audioMsg && <p className={NOTE}>{audioMsg}</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* MIDI OUT lives in a dialog; its state stays in Chime, so MIDI keeps running while the dialog is closed */}
      <Dialog open={midiOpen} onOpenChange={setMidiOpen}>
        <DialogTrigger asChild>
          <Button
            aria-label="MIDI"
            data-live={midiLive || undefined}
            className="data-[live]:bg-foreground data-[live]:text-background"
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
                  <div className="grid gap-1.5 text-[11px] tracking-[.04em] *:flex *:cursor-pointer *:items-center *:gap-2">
                    <label><Checkbox checked={sendProg} onCheckedChange={v => setSendProg(v === true)} /> SEND PROGRAM CHANGE</label>
                    <label><Checkbox checked={sendCC} onCheckedChange={v => setSendCC(v === true)} /> SEND FILTER AS CC74 / CC71</label>
                    <label><Checkbox checked={localSound} onCheckedChange={v => setLocalSound(v === true)} /> PLAY SOUND IN BROWSER TOO</label>
                  </div>
                  <div className={ROW}>
                    <Button disabled={!midi.port} onClick={onTestNote}>TEST NOTE</Button>
                    <Button onClick={onPanic}>PANIC</Button>
                    <span className={`${NOTE} min-w-0 [overflow-wrap:anywhere]`}>Each chime sends on the channel in its settings. Note length follows its DECAY. TEST NOTE plays every chime&apos;s first tube (a furin&apos;s root). PANIC sends All Notes Off on every chime&apos;s channel.</span>
                  </div>
                </>
              )}
              {midiMsg && <p className={NOTE}>{midiMsg}</p>}
              {midi.error && <p className={NOTE}>{midi.error}</p>}
              {midiReady && !midiPorts.length && <p className={NOTE}>No MIDI outputs found. Plug in an interface or start a virtual port (IAC Driver on a Mac, loopMIDI on Windows).</p>}
              {/* each channel's ink, as the units draw it; the channels units are on are underlined */}
              <Param id="m-ch" label="CHANNELS" value={`${usedChannels.size} IN USE`}>
                <ul aria-labelledby="m-ch-label" className="m-0 mt-2 grid list-none grid-cols-8 gap-1.5 p-0">
                  {C.CHANNEL_INKS.map((ink, i) => {
                    const used = usedChannels.has(i + 1);
                    return (
                      <li key={i} aria-label={`${i + 1} ${ink.name}${used ? " IN USE" : ""}`} className="grid justify-items-center gap-0.5 text-[10px] tabular-nums">
                        <span aria-hidden="true" className="block aspect-square w-full" style={{ background: ink.hex }} />
                        <span aria-hidden="true" className={used ? "underline underline-offset-2" : undefined}>{i + 1}</span>
                      </li>
                    );
                  })}
                </ul>
              </Param>
            </div>
        </DialogContent>
      </Dialog>
      </div>
    </main>
  );
}

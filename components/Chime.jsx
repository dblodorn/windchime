"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EighthNote, Settings2, Volume2, VolumeX } from "lucide-react";
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
const CHANNELS = Array.from({ length: 16 }, (_, k) => k + 1);
const store = {
  get(k, d) { try { const v = localStorage.getItem("windchime." + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("windchime." + k, JSON.stringify(v)); } catch (e) {} },
};

const rootText = m => `${E.noteName(m)}   ${E.mtof(m).toFixed(1)} HZ`;
const channelText = c => `CHANNEL ${c}${c === 10 ? "  (GM DRUMS)" : ""}`;
const portName = p => p.name.toUpperCase() + (p.manufacturer ? "   " + p.manufacturer.toUpperCase() : "");

const NOTE = "m-0 max-w-[60ch] text-[13px]";
const ROW = "mt-2 flex flex-wrap items-center gap-2.5";

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

export default function Chime() {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const cellRefs = useRef([]);

  const [wind, setWind] = useState(0.45);
  const [decay, setDecay] = useState(4);
  const [cutX, setCutX] = useState(0.78);
  const [q, setQ] = useState(3);
  const [root, setRoot] = useState(72);
  const [scaleIdx, setScaleIdx] = useState(0);
  const [voice, setVoice] = useState("v0");
  const [fontsVersion, setFontsVersion] = useState(0);
  const [sound, setSound] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [canvasPx, setCanvasPx] = useState(E.W * 2);

  // MIDI out
  // null until mounted: the server has no navigator, so support is only known in the browser
  const [midiSupported, setMidiSupported] = useState(null);
  const [midi, setMidi] = useState(() => M.status());
  const [midiPorts, setMidiPorts] = useState([]);
  const [midiCh, setMidiCh] = useState(1);
  const [sendProg, setSendProg] = useState(true);
  const [sendCC, setSendCC] = useState(true);
  const [localSound, setLocalSound] = useState(true);
  const [midiMsg, setMidiMsg] = useState("");
  const [midiOpen, setMidiOpen] = useState(false);
  const decayRef = useRef(decay);
  decayRef.current = decay;

  const scale = useMemo(() => E.sixOf(E.SCALE_LIST[scaleIdx].deg), [scaleIdx]);
  const cutoff = E.cutoffHz(cutX);

  // push parameters into the engine
  useEffect(() => { E.setParams({ wind, decay, cutX, q, root, scale }); }, [wind, decay, cutX, q, root, scale]);
  useEffect(() => { E.chooseVoice(voice); }, [voice, fontsVersion]);

  // canvas + animation loop; fetch the audio library in the background
  useEffect(() => { E.preloadAudio(); return E.attach(canvasRef.current); }, []);

  // flash the tube cell on every strike, and send it to the MIDI port
  useEffect(() => E.onHit((i, vel) => {
    if (M.currentOutput()) { M.note(E.noteOf(i), vel, decayRef.current); }
    const el = cellRefs.current[i];
    if (!el) return;
    el.classList.add("hit");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("hit"), 140);
  }), []);

  // size the canvas to whole-pixel multiples where there is room (its 1px border sits outside this)
  useEffect(() => {
    const fit = () => {
      const avail = (stageRef.current ? stageRef.current.clientWidth : E.W) - 2;
      const maxByH = Math.max(320, window.innerHeight - 110) * E.W / E.H;
      const w = Math.min(avail, maxByH, E.W * 2);
      setCanvasPx(w >= E.W * 2 ? Math.floor(w / E.W) * E.W : w);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener("resize", fit);
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
  }, []);

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
        setVoice(v => (v === "v0" ? "s0:" + E.findPreset(0, 0, 14) : v));
        setFontsVersion(n => n + 1);
      } catch (err) {
        // the built-in synth voices still work without it
        if (!dead) console.error("General MIDI soundfont did not load", err);
      }
    })();
    return () => { dead = true; };
  }, []);

  // ---------- MIDI out ----------
  useEffect(() => {
    setMidiCh(store.get("midiCh", 1));
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
  useEffect(() => { M.setChannel(midiCh - 1); store.set("midiCh", midiCh); }, [midiCh]);
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
  // program change and CCs follow from the linkSeq effects below
  const choosePort = id => { M.selectOutput(id); };
  const onTestNote = () => { M.testNote(E.noteOf(0)); };

  const onSound = useCallback(async () => {
    try {
      const on = await E.toggleSound();
      setSound(on);
    } catch (err) {
      console.error("could not start audio", err);
    }
  }, []);

  // map through the content box, inside the canvas's 1px border
  const onCanvasDown = e => {
    const c = canvasRef.current, r = c.getBoundingClientRect();
    E.strikeAt((e.clientX - r.left - c.clientLeft) / c.clientWidth * E.W, (e.clientY - r.top - c.clientTop) / c.clientHeight * E.H);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const groups = useMemo(() => voiceGroups(), [fontsVersion]);
  const prog = useMemo(() => { E.chooseVoice(voice); return E.midiProgram(); }, [voice, fontsVersion]);
  // linkSeq bumps each time a port becomes live (chosen, auto-picked or plugged back in)
  const link = midi.linkSeq;
  useEffect(() => { if (sendProg && M.currentOutput()) M.program(prog.bank, prog.prog); }, [prog, sendProg, link, midiCh]);
  useEffect(() => { if (sendCC && M.currentOutput()) { M.cc(74, cutX * 127); M.cc(71, (q - 0.5) / 17.5 * 127); } }, [cutX, q, sendCC, link, midiCh]);

  const midiReady = midi.connected;
  const midiLive = !!(midi.port && midi.port.state === "connected");
  const midiOut = midi.port ? midi.port.id : midi.wanted ? "wanted" : "";
  const voiceText = (groups.flatMap(g => g.items).find(it => it.value === voice) || {}).text || "";
  const livePort = midi.port && midiPorts.find(p => p.id === midi.port.id);
  const portText = livePort ? portName(livePort) : midi.wanted && !midi.port ? `${midi.wanted.toUpperCase()}   DISCONNECTED` : "NONE";
  const voiceTag = voice[0] === "s" ? (prog.bank === 128 ? "GM DRUMS" : "GM " + (prog.prog + 1)) : "SYNTH";

  return (
    <main className="mx-auto grid w-full max-w-[402px] justify-items-center">
      <section className="grid w-full min-w-0 justify-items-start" ref={stageRef}>
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={E.W}
            height={E.H}
            className="box-content border border-foreground"
            style={{ width: canvasPx, height: canvasPx * E.H / E.W }}
            onPointerDown={onCanvasDown}
            aria-label="Wind chime: six tubes hanging from a ring, a disc clapper and a wind sail. Tap a tube to strike it."
          />
          {/* the three round controls and the only icons on the page, by request: Lucide icons drawn without anti-aliasing */}
          <Button aria-label="SOUND" aria-pressed={sound} onClick={onSound} className="absolute top-2.5 right-2.5 size-[30px] rounded-[50%] p-0">
            {sound
              ? <Volume2 size={16} aria-hidden="true" shapeRendering="crispEdges" />
              : <VolumeX size={16} aria-hidden="true" shapeRendering="crispEdges" />}
          </Button>
          <Button aria-label="NOTES" aria-pressed={showNotes} aria-controls="tube-notes" onClick={() => setShowNotes(v => !v)} className="absolute bottom-2.5 left-2.5 size-[30px] rounded-[50%] p-0">
            <EighthNote size={16} aria-hidden="true" shapeRendering="crispEdges" />
          </Button>
          {/* the parameter rows; their state stays in Chime, so values survive the popover closing */}
          <Popover>
            <PopoverTrigger asChild>
              <Button aria-label="SETTINGS" className="absolute right-2.5 bottom-2.5 size-[30px] rounded-[50%] p-0 data-[state=open]:bg-foreground data-[state=open]:text-background">
                <Settings2 size={16} aria-hidden="true" shapeRendering="crispEdges" />
              </Button>
            </PopoverTrigger>
            <PopoverContent aria-label="SETTINGS">
              <div className="grid gap-3.5">
                <Param id="p-wind" label="WIND" value={wind.toFixed(2)}>
                  <ParamSlider id="p-wind" min={0} max={1} step={0.01} value={wind} onChange={setWind} />
                </Param>
                <Param id="p-decay" label="DECAY" value={decay.toFixed(1) + " S"}>
                  <ParamSlider id="p-decay" min={0.3} max={12} step={0.1} value={decay} onChange={setDecay} />
                </Param>
                <Param id="p-freq" label="FREQUENCY" value={hz(cutoff)}>
                  <ParamSlider id="p-freq" min={0} max={1} step={0.001} value={cutX} onChange={setCutX} />
                </Param>
                <Param id="p-res" label="RESONANCE" value={"Q " + q.toFixed(1)}>
                  <ParamSlider id="p-res" min={0.5} max={18} step={0.1} value={q} onChange={setQ} />
                </Param>
                <Param id="p-root" label="ROOT" value={E.noteName(root)}>
                  <ParamSelect id="p-root" value={String(root)} display={rootText(root)} onChange={v => setRoot(+v)}>
                    {ROOTS.map(m => <SelectItem key={m} value={String(m)}>{rootText(m)}</SelectItem>)}
                  </ParamSelect>
                </Param>
                <Param id="p-scale" label="SCALE" value={scale.map(s => "+" + s).join(" ").replace(/\+0/, "0")}>
                  <ParamSelect id="p-scale" value={String(scaleIdx)} display={E.SCALE_LIST[scaleIdx].name} onChange={v => setScaleIdx(+v)}>
                    {SCALE_GROUPS.map(g => (
                      <SelectGroup key={g}>
                        <SelectLabel>{g.toUpperCase()}</SelectLabel>
                        {E.SCALE_LIST.map((s, i) => s.group === g && <SelectItem key={i} value={String(i)}>{s.name}</SelectItem>)}
                      </SelectGroup>
                    ))}
                  </ParamSelect>
                </Param>
                <Param id="p-voice" label="SOUNDFONT" value={voiceTag}>
                  <ParamSelect id="p-voice" value={voice} display={voiceText} onChange={setVoice}>
                    {groups.map(g => (
                      <SelectGroup key={g.label}>
                        <SelectLabel>{g.label}</SelectLabel>
                        {g.items.map(it => <SelectItem key={it.value} value={it.value}>{it.text}</SelectItem>)}
                      </SelectGroup>
                    ))}
                  </ParamSelect>
                </Param>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        {/* tube notes drawer: hidden until NOTES is on, then slides down from under the drawing, flush with its bottom border */}
        <div id="tube-notes" inert={!showNotes} aria-hidden={!showNotes} data-open={showNotes || undefined}
          className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 ease-out data-[open]:grid-rows-[1fr] motion-reduce:transition-none">
          <div className="min-h-0 overflow-hidden">
            <div className="tubes grid -translate-y-full transition-transform duration-200 ease-out in-data-[open]:translate-y-0 motion-reduce:transition-none max-w-full grid-cols-6 border border-t-0 border-foreground tabular-nums *:border-l *:py-1 *:text-center *:text-[12px] *:leading-[1.3] *:first:border-l-0 [&_b]:block [&_b]:text-[15px]" style={{ width: canvasPx + 2 }}>
              {scale.map((s, i) => {
                const m = root + s;
                return (
                  <div key={i} ref={el => (cellRefs.current[i] = el)}>
                    T{i + 1}<b>{E.noteName(m)}</b>{Math.round(E.mtof(m))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

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
                  <Param id="m-ch" label="CHANNEL" value={midiCh === 10 ? "10  GM DRUMS" : String(midiCh)}>
                    <ParamSelect id="m-ch" value={String(midiCh)} display={channelText(midiCh)} onChange={v => setMidiCh(+v)}>
                      {CHANNELS.map(c => <SelectItem key={c} value={String(c)}>{channelText(c)}</SelectItem>)}
                    </ParamSelect>
                  </Param>
                  <div className="grid gap-1.5 text-[13px] tracking-[.04em] *:flex *:cursor-pointer *:items-center *:gap-2">
                    <label><Checkbox checked={sendProg} onCheckedChange={v => setSendProg(v === true)} /> SEND PROGRAM CHANGE</label>
                    <label><Checkbox checked={sendCC} onCheckedChange={v => setSendCC(v === true)} /> SEND FILTER AS CC74 / CC71</label>
                    <label><Checkbox checked={localSound} onCheckedChange={v => setLocalSound(v === true)} /> PLAY SOUND IN BROWSER TOO</label>
                  </div>
                  <div className={ROW}>
                    <Button disabled={!midi.port} onClick={onTestNote}>TEST NOTE</Button>
                    <Button onClick={() => M.allNotesOff()}>PANIC</Button>
                    <span className={`${NOTE} min-w-0 [overflow-wrap:anywhere]`}>Note length follows DECAY. TEST NOTE plays the first tube. PANIC sends All Notes Off on the chosen channel.</span>
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

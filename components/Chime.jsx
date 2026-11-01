"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as E from "../lib/engine";
import * as M from "../lib/midiout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

const fmt = s => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
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
const STATUS = "m-0 text-[13px] whitespace-pre-wrap tabular-nums";
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
    const tag = E.fonts.length > 1 ? f.fileName.toUpperCase().slice(0, 24) + " / " : "";
    const opt = ({ p, i }) => ({ value: `s${fi}:${i}`, text: `${String(p.preset + 1).padStart(3, " ")}  ${p.name.toUpperCase()}` });
    const optBank = ({ p, i }) => ({ value: `s${fi}:${i}`, text: `${p.bank}:${p.preset + 1}  ${p.name.toUpperCase()}` });
    if (f.gm) {
      E.GM_FAMILIES.forEach((fam, k) => groups.push({ label: tag + fam, items: list.filter(x => x.p.bank === 0 && x.p.preset >> 3 === k).map(opt) }));
      groups.push({ label: tag + "DRUM KITS", items: list.filter(x => x.p.bank === 128).map(opt) });
      groups.push({ label: tag + "OTHER BANKS", items: list.filter(x => x.p.bank !== 0 && x.p.bank !== 128).map(optBank) });
    } else {
      groups.push({ label: f.fileName.toUpperCase().slice(0, 40), items: list.map(optBank) });
    }
  });
  groups.push({ label: "BUILT-IN SYNTH", items: E.VOICES.map((v, i) => ({ value: `v${i}`, text: v.name })) });
  return groups.filter(g => g.items.length);
}

export default function Chime() {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const cellRefs = useRef([]);
  const fileRef = useRef(null);

  const [wind, setWind] = useState(0.45);
  const [decay, setDecay] = useState(4);
  const [cutX, setCutX] = useState(0.78);
  const [q, setQ] = useState(3);
  const [root, setRoot] = useState(72);
  const [scaleIdx, setScaleIdx] = useState(0);
  const [voice, setVoice] = useState("v0");
  const [fontsVersion, setFontsVersion] = useState(0);
  const [sfMsg, setSfMsg] = useState("loading General MIDI soundfont");
  const [sound, setSound] = useState(false);
  const [audioMsg, setAudioMsg] = useState("off");
  const [recInfo, setRecInfo] = useState(null);
  const [take, setTake] = useState(null);
  const [saveMsg, setSaveMsg] = useState("");
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
  const [midiCount, setMidiCount] = useState(0);
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
    if (M.currentOutput()) { M.note(E.noteOf(i), vel, decayRef.current); setMidiCount(n => n + 1); }
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
      const w = Math.min(avail, maxByH, E.W * 3);
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
        const f = E.addFont(ab, "TimGM6mb", true);
        setVoice(v => {
          if (v === "v0") return "s0:" + E.findPreset(0, 0, 14);
          if (v[0] === "s") { const [fi, pi] = v.slice(1).split(":").map(Number); return `s${fi + 1}:${pi}`; }
          return v;
        });
        setFontsVersion(n => n + 1);
        setSfMsg(`GENERAL MIDI   TimGM6mb   ${f.presets.length} PRESETS`);
      } catch (err) {
        if (!dead) setSfMsg(`The General MIDI soundfont did not load (${err.message || "network error"}). Built-in voices and your own .sf2 files still work.`);
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
  const onTestNote = () => { M.testNote(E.noteOf(0)); setMidiCount(n => n + 1); };

  // recording readout
  useEffect(() => {
    if (!recInfo) return;
    const id = setInterval(() => setRecInfo(E.recording()), 250);
    return () => clearInterval(id);
  }, [recInfo !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // audio state readout
  useEffect(() => {
    const id = setInterval(() => setAudioMsg(E.audioState()), 500);
    return () => clearInterval(id);
  }, []);

  const onSound = useCallback(async () => {
    try {
      const on = await E.toggleSound();
      setSound(on);
      setAudioMsg(E.audioState());
    } catch (err) {
      setAudioMsg("could not start audio: " + (err.message || err));
    }
  }, []);

  const onRec = () => {
    if (recInfo) { setTake(E.stopRec()); setRecInfo(null); }
    else { E.startRec(); setRecInfo(E.recording()); }
    setSaveMsg("");
  };
  const onRender = () => { setTake(E.renderTake(120)); setSaveMsg(""); };
  const onSave = () => {
    if (!take) return;
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, "");
    const name = `wind-chime-${take.kind.toLowerCase()}-${stamp}.mid`;
    const url = URL.createObjectURL(new Blob([E.buildMidi(take)], { type: "audio/midi" }));
    const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    setSaveMsg("SAVED   " + name);
  };

  const onFile = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setSfMsg(`reading ${file.name} (${(file.size / 1048576).toFixed(1)} MB)`);
    try {
      const f = E.addFont(await file.arrayBuffer(), file.name.replace(/\.sf2$/i, ""));
      const fi = E.fonts.length - 1;
      let idx = -1;
      for (const [b, pr] of [[0, 14], [0, 9], [0, 11], [0, 10], [0, 8]]) { idx = E.findPreset(fi, b, pr); if (idx >= 0) break; }
      if (idx < 0) idx = f.presets.findIndex(p => /bell|chime|glock|celest|vib/i.test(p.name));
      setFontsVersion(n => n + 1);
      setVoice(`s${fi}:${idx >= 0 ? idx : 0}`);
      setSfMsg(`${file.name}   ${f.presets.length} PRESETS ADDED`);
    } catch (err) {
      setSfMsg(err.message || "Could not read that file as a SoundFont.");
    }
    e.target.value = "";
  };

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
  const midiLine = !midiReady ? "MIDI    not connected"
    : midi.port ? `MIDI    ${midi.port.name.toUpperCase()}   ${midi.port.state === "connected" ? "CONNECTED" : "DISCONNECTED"} · ${(midi.port.connection || "closed").toUpperCase()}   CH ${midiCh}   ${midiCount} NOTES SENT`
    : midi.wanted ? `MIDI    ${midi.wanted.toUpperCase()}   DISCONNECTED`
    : "MIDI    choose an interface";
  const voiceText = (groups.flatMap(g => g.items).find(it => it.value === voice) || {}).text || "";
  const livePort = midi.port && midiPorts.find(p => p.id === midi.port.id);
  const portText = livePort ? portName(livePort) : midi.wanted && !midi.port ? `${midi.wanted.toUpperCase()}   DISCONNECTED` : "NONE";
  const voiceTag = voice[0] === "s" ? (E.fonts[+voice.slice(1).split(":")[0]]?.gm ? (prog.bank === 128 ? "GM DRUMS" : "GM " + (prog.prog + 1)) : "SF2") : "SYNTH";

  const audioLine = !sound ? "AUDIO   off"
    : audioMsg === "running" ? `AUDIO   running   LOW-PASS ${hz(cutoff)}  Q ${q.toFixed(1)}`
    : `AUDIO   ${audioMsg}, tap SOUND again`;
  const takeLine = recInfo ? `REC     ${fmt(recInfo.secs)}   ${recInfo.notes} NOTES`
    : take ? `TAKE    ${take.kind}   ${fmt(take.dur)}   ${take.hits.length} NOTES` : "TAKE    none yet";

  return (
    <main className="mx-auto grid max-w-[1060px] gap-7 min-[860px]:grid-cols-[minmax(0,480px)_minmax(0,1fr)] min-[860px]:items-start">
      <section className="grid min-w-0 justify-items-start gap-3 min-[860px]:sticky min-[860px]:top-[max(20px,env(safe-area-inset-top,0px))]" ref={stageRef}>
        <canvas
          ref={canvasRef}
          width={E.W}
          height={E.H}
          className="box-content border border-foreground"
          style={{ width: canvasPx, height: canvasPx * E.H / E.W }}
          onPointerDown={onCanvasDown}
          aria-label="Wind chime: six tubes hanging from a ring, a disc clapper and a wind sail. Tap a tube to strike it."
        />
        <div className="tubes grid max-w-full grid-cols-6 border border-foreground tabular-nums *:border-l *:py-1 *:text-center *:text-[12px] *:leading-[1.3] *:first:border-l-0 [&_b]:block [&_b]:text-[15px]" style={{ width: canvasPx + 2 }}>
          {scale.map((s, i) => {
            const m = root + s;
            return (
              <div key={i} ref={el => (cellRefs.current[i] = el)}>
                T{i + 1}<b>{E.noteName(m)}</b>{Math.round(E.mtof(m))}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid max-w-[520px] min-w-0 gap-[22px]">
        <header>
          <h1 className="m-0 text-[22px] font-bold tracking-[.08em] text-balance">SIX TUBE CHIME</h1>
          <p className="mt-1.5 max-w-[60ch]">Wind pushes the sail, the sail swings the clapper, the clapper strikes the tubes. Every strike is a MIDI note. Tap a tube to strike it by hand.</p>
        </header>
        <hr className="border-foreground" />
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
            <div className={ROW}>
              <Button onClick={() => fileRef.current && fileRef.current.click()}>ADD .SF2 FILE</Button>
              <input type="file" ref={fileRef} accept=".sf2" hidden onChange={onFile} />
              <span className={`${NOTE} min-w-0 [overflow-wrap:anywhere]`}>{sfMsg}</span>
            </div>
          </Param>
        </div>
        <hr className="border-foreground" />
        <div className="flex flex-wrap gap-2">
          <Button aria-pressed={sound} onClick={onSound}>{sound ? "SOUND ON" : "SOUND OFF"}</Button>
          <Button aria-pressed={!!recInfo} onClick={onRec}>{recInfo ? "STOP" : "REC"}</Button>
          <Button onClick={onRender}>RENDER 2:00</Button>
          <Button disabled={!take || !take.hits.length} onClick={onSave}>SAVE MIDI</Button>
        </div>
        <p className={STATUS}>{audioLine}</p>
        <p className={STATUS}>{midiLine}</p>
        <p className={STATUS}>{takeLine}{saveMsg ? "\n" + saveMsg : ""}</p>
        <p className={NOTE}>
          MIDI: format 0, 480 PPQ, 120 BPM, channel {prog.bank === 128 ? 10 : 1}, bank {prog.bank & 127}, program {prog.prog + 1} {prog.name.toUpperCase()}.
          CC74 carries FREQUENCY and CC71 carries RESONANCE. Note length follows DECAY.
        </p>
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

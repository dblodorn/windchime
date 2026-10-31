"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as E from "../lib/engine";
import * as M from "../lib/midiout";

const fmt = s => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
const hz = f => (f >= 1000 ? (f / 1000).toFixed(2) + " KHZ" : Math.round(f) + " HZ");
const ROOTS = Array.from({ length: 37 }, (_, k) => 48 + k);
const SCALE_GROUPS = E.SCALES.map(([group]) => group);
const CHANNELS = Array.from({ length: 16 }, (_, k) => k + 1);
const store = {
  get(k, d) { try { const v = localStorage.getItem("windchime." + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("windchime." + k, JSON.stringify(v)); } catch (e) {} },
};

function Param({ id, label, value, children }) {
  return (
    <div className="param">
      <label htmlFor={id}>
        <span className="k">{label}</span>
        <span className="lead" />
        <span className="v">{value}</span>
      </label>
      {children}
    </div>
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
  const [midiReady, setMidiReady] = useState(false);
  const [midiPorts, setMidiPorts] = useState([]);
  const [midiOut, setMidiOut] = useState("");
  const [midiCh, setMidiCh] = useState(1);
  const [sendProg, setSendProg] = useState(true);
  const [sendCC, setSendCC] = useState(true);
  const [localSound, setLocalSound] = useState(true);
  const [midiMsg, setMidiMsg] = useState("");
  const [midiCount, setMidiCount] = useState(0);
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

  // size the canvas to whole-pixel multiples where there is room
  useEffect(() => {
    const fit = () => {
      const avail = stageRef.current ? stageRef.current.clientWidth : E.W;
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
    if (!M.supported()) setMidiMsg("This browser has no Web MIDI. Use Chrome, Edge or Firefox on a computer.");
    return M.onChange(() => {
      const ports = M.listOutputs();
      setMidiPorts(ports);
      const cur = M.currentOutput();
      setMidiOut(cur ? cur.id : "");
    });
  }, []);
  useEffect(() => { M.setChannel(midiCh - 1); store.set("midiCh", midiCh); }, [midiCh]);
  useEffect(() => { store.set("sendProg", sendProg); store.set("sendCC", sendCC); }, [sendProg, sendCC]);
  useEffect(() => { E.setMuted(!localSound); }, [localSound]);

  const onMidiConnect = async () => {
    setMidiMsg("asking the browser for MIDI access");
    try {
      const ports = await M.connect();
      setMidiReady(true);
      setMidiPorts(ports);
      const savedName = store.get("midiOutName", "");
      const pick = ports.find(p => p.name === savedName) || (ports.length === 1 ? ports[0] : null);
      if (pick) choosePort(pick.id);
      setMidiMsg(ports.length ? "" : "No MIDI outputs found. Plug in an interface or start a virtual port (IAC Driver on a Mac, loopMIDI on Windows).");
    } catch (err) {
      setMidiMsg(err && err.name === "SecurityError" ? "MIDI access was blocked. Allow it in the browser's site settings and try again." : (err.message || "MIDI access failed."));
    }
  };
  const choosePort = id => {
    M.selectOutput(id);
    setMidiOut(id);
    const port = M.currentOutput();
    if (port) {
      store.set("midiOutName", port.name);
      M.setChannel(midiCh - 1);
      if (sendProg) M.program(prog.bank, prog.prog);
      if (sendCC) { M.cc(74, cutX * 127); M.cc(71, (q - 0.5) / 17.5 * 127); }
    }
  };

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

  const onCanvasDown = e => {
    const r = canvasRef.current.getBoundingClientRect();
    E.strikeAt((e.clientX - r.left) / r.width * E.W, (e.clientY - r.top) / r.height * E.H);
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const groups = useMemo(() => voiceGroups(), [fontsVersion]);
  const prog = useMemo(() => { E.chooseVoice(voice); return E.midiProgram(); }, [voice, fontsVersion]);
  useEffect(() => { if (sendProg && M.currentOutput()) M.program(prog.bank, prog.prog); }, [prog, sendProg, midiOut, midiCh]);
  useEffect(() => { if (sendCC && M.currentOutput()) { M.cc(74, cutX * 127); M.cc(71, (q - 0.5) / 17.5 * 127); } }, [cutX, q, sendCC, midiOut, midiCh]);

  const midiLine = !midiReady ? "MIDI    not connected"
    : midiOut ? `MIDI    ${(midiPorts.find(p => p.id === midiOut) || {}).name || "port"}   CH ${midiCh}   ${midiCount} NOTES SENT`
    : "MIDI    choose an interface";
  const voiceTag = voice[0] === "s" ? (E.fonts[+voice.slice(1).split(":")[0]]?.gm ? (prog.bank === 128 ? "GM DRUMS" : "GM " + (prog.prog + 1)) : "SF2") : "SYNTH";

  const audioLine = !sound ? "AUDIO   off"
    : audioMsg === "running" ? `AUDIO   running   LOW-PASS ${hz(cutoff)}  Q ${q.toFixed(1)}`
    : `AUDIO   ${audioMsg}, tap SOUND again`;
  const takeLine = recInfo ? `REC     ${fmt(recInfo.secs)}   ${recInfo.notes} NOTES`
    : take ? `TAKE    ${take.kind}   ${fmt(take.dur)}   ${take.hits.length} NOTES` : "TAKE    none yet";

  return (
    <main>
      <section className="stage" ref={stageRef}>
        <canvas
          ref={canvasRef}
          width={E.W}
          height={E.H}
          style={{ width: canvasPx, height: canvasPx * E.H / E.W }}
          onPointerDown={onCanvasDown}
          aria-label="Wind chime: six tubes hanging from a ring, a disc clapper and a wind sail. Tap a tube to strike it."
        />
        <div className="tubes" style={{ width: canvasPx }}>
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

      <section className="sheet">
        <header>
          <h1>SIX TUBE CHIME</h1>
          <p className="lede">Wind pushes the sail, the sail swings the clapper, the clapper strikes the tubes. Every strike is a MIDI note. Tap a tube to strike it by hand.</p>
        </header>
        <hr />
        <div className="params">
          <Param id="p-wind" label="WIND" value={wind.toFixed(2)}>
            <input type="range" id="p-wind" min="0" max="1" step="0.01" value={wind} onChange={e => setWind(+e.target.value)} />
          </Param>
          <Param id="p-decay" label="DECAY" value={decay.toFixed(1) + " S"}>
            <input type="range" id="p-decay" min="0.3" max="12" step="0.1" value={decay} onChange={e => setDecay(+e.target.value)} />
          </Param>
          <Param id="p-freq" label="FREQUENCY" value={hz(cutoff)}>
            <input type="range" id="p-freq" min="0" max="1" step="0.001" value={cutX} onChange={e => setCutX(+e.target.value)} />
          </Param>
          <Param id="p-res" label="RESONANCE" value={"Q " + q.toFixed(1)}>
            <input type="range" id="p-res" min="0.5" max="18" step="0.1" value={q} onChange={e => setQ(+e.target.value)} />
          </Param>
          <Param id="p-root" label="ROOT" value={E.noteName(root)}>
            <select id="p-root" value={root} onChange={e => setRoot(+e.target.value)}>
              {ROOTS.map(m => <option key={m} value={m}>{E.noteName(m)}   {E.mtof(m).toFixed(1)} HZ</option>)}
            </select>
          </Param>
          <Param id="p-scale" label="SCALE" value={scale.map(s => "+" + s).join(" ").replace(/\+0/, "0")}>
            <select id="p-scale" value={scaleIdx} onChange={e => setScaleIdx(+e.target.value)}>
              {SCALE_GROUPS.map(g => (
                <optgroup key={g} label={g.toUpperCase()}>
                  {E.SCALE_LIST.map((s, i) => s.group === g && <option key={i} value={i}>{s.name}</option>)}
                </optgroup>
              ))}
            </select>
          </Param>
          <Param id="p-voice" label="SOUNDFONT" value={voiceTag}>
            <select id="p-voice" value={voice} onChange={e => setVoice(e.target.value)}>
              {groups.map(g => (
                <optgroup key={g.label} label={g.label}>
                  {g.items.map(it => <option key={it.value} value={it.value}>{it.text}</option>)}
                </optgroup>
              ))}
            </select>
            <div className="sfrow">
              <button onClick={() => fileRef.current && fileRef.current.click()}>ADD .SF2 FILE</button>
              <input type="file" ref={fileRef} accept=".sf2" hidden onChange={onFile} />
              <span className="note">{sfMsg}</span>
            </div>
          </Param>
        </div>
        <hr />
        <div className="params">
          <Param id="m-out" label="MIDI OUT" value={midiReady ? (midiPorts.length + " PORT" + (midiPorts.length === 1 ? "" : "S")) : "OFF"}>
            {!midiReady ? (
              <div className="sfrow">
                <button onClick={onMidiConnect} disabled={!M.supported()}>CONNECT MIDI</button>
                <span className="note">Send every strike to a MIDI device or another app.</span>
              </div>
            ) : (
              <select id="m-out" value={midiOut} onChange={e => choosePort(e.target.value)}>
                <option value="">NONE</option>
                {midiPorts.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}{p.manufacturer ? "   " + p.manufacturer.toUpperCase() : ""}</option>)}
              </select>
            )}
          </Param>
          {midiReady && (
            <>
              <Param id="m-ch" label="CHANNEL" value={midiCh === 10 ? "10  GM DRUMS" : String(midiCh)}>
                <select id="m-ch" value={midiCh} onChange={e => setMidiCh(+e.target.value)}>
                  {CHANNELS.map(c => <option key={c} value={c}>CHANNEL {c}{c === 10 ? "  (GM DRUMS)" : ""}</option>)}
                </select>
              </Param>
              <div className="checks">
                <label><input type="checkbox" checked={sendProg} onChange={e => setSendProg(e.target.checked)} /> SEND PROGRAM CHANGE</label>
                <label><input type="checkbox" checked={sendCC} onChange={e => setSendCC(e.target.checked)} /> SEND FILTER AS CC74 / CC71</label>
                <label><input type="checkbox" checked={localSound} onChange={e => setLocalSound(e.target.checked)} /> PLAY SOUND IN BROWSER TOO</label>
              </div>
              <div className="sfrow">
                <button onClick={() => M.allNotesOff()}>PANIC</button>
                <span className="note">Note length follows DECAY. PANIC sends All Notes Off on the chosen channel.</span>
              </div>
            </>
          )}
          {midiMsg && <p className="note">{midiMsg}</p>}
        </div>
        <hr />
        <div className="transport">
          <button aria-pressed={sound} onClick={onSound}>{sound ? "SOUND ON" : "SOUND OFF"}</button>
          <button aria-pressed={!!recInfo} onClick={onRec}>{recInfo ? "STOP" : "REC"}</button>
          <button onClick={onRender}>RENDER 2:00</button>
          <button disabled={!take || !take.hits.length} onClick={onSave}>SAVE MIDI</button>
        </div>
        <p className="status">{audioLine}</p>
        <p className="status">{midiLine}</p>
        <p className="status">{takeLine}{saveMsg ? "\n" + saveMsg : ""}</p>
        <p className="note">
          MIDI: format 0, 480 PPQ, 120 BPM, channel {prog.bank === 128 ? 10 : 1}, bank {prog.bank & 127}, program {prog.prog + 1} {prog.name.toUpperCase()}.
          CC74 carries FREQUENCY and CC71 carries RESONANCE. Note length follows DECAY.
        </p>
      </section>
    </main>
  );
}

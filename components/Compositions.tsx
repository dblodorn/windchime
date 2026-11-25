"use client";

// The COMPOSITIONS panel's content: the public list of saved compositions (and SaveButton, for the panel's footer, and
// shareComposition, for SHARE), through Relay and the dmbk GraphQL API (lib/relay/environment.ts → app/api/graphql).
// Loaded with next/dynamic or import() when MENU is first pressed or SAVE/SHARE used, so Relay and every request stay
// off the page until then. Picking a row hands its units and id to `onOpen`. "Yours" means saved or shared with this
// browser's device key (lib/device.ts); the API marks them with `yours(creatorKey)`.
import { Component, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { ConnectionHandler, RelayEnvironmentProvider, commitMutation, graphql, useFragment, useLazyLoadQuery, useMutation, usePaginationFragment } from "react-relay";
import type { RecordSourceSelectorProxy } from "relay-runtime";
import { relayEnvironment } from "../lib/relay/environment";
import * as Sh from "../lib/share";
import * as D from "../lib/device";
import { Badge, Button, TextField } from "@dblodorn/sound-ui";
import type { CompositionsQuery } from "./__generated__/CompositionsQuery.graphql";
import type { CompositionsPaginationQuery } from "./__generated__/CompositionsPaginationQuery.graphql";
import type { Compositions_list$key } from "./__generated__/Compositions_list.graphql";
import type { Compositions_row$data, Compositions_row$key } from "./__generated__/Compositions_row.graphql";
import type { CompositionsSaveMutation, CompositionsSaveMutation$data } from "./__generated__/CompositionsSaveMutation.graphql";

// a saved composition's units as the API returns them; Sh.fromSaved checks them
type SavedUnits = Compositions_row$data["units"];

const PAGE = 20;
// The API stores UTC and not the saver's zone, so a save time is shown in the viewer's own zone, labelled with it.
const STAMP = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short" });
const savedAt = (iso: string) => {
  const p = Object.fromEntries(STAMP.formatToParts(new Date(iso)).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} ${p.timeZoneName}`;
};
const CONNECTION_KEY = "Compositions_dmbkSoundChimeCompositions";


const ListQuery = graphql`
  query CompositionsQuery($count: Int, $cursor: String, $creatorKey: String, $yoursKey: String!) {
    ...Compositions_list @arguments(count: $count, cursor: $cursor, creatorKey: $creatorKey, yoursKey: $yoursKey)
  }
`;

const ListFragment = graphql`
  fragment Compositions_list on Query
  @refetchable(queryName: "CompositionsPaginationQuery")
  @argumentDefinitions(count: { type: "Int", defaultValue: 20 }, cursor: { type: "String" }, creatorKey: { type: "String" }, yoursKey: { type: "String!" }) {
    dmbkSoundChimeCompositions(first: $count, after: $cursor, creatorKey: $creatorKey)
    @connection(key: "Compositions_dmbkSoundChimeCompositions", filters: ["creatorKey"]) {
      edges {
        node {
          ...Compositions_row @arguments(yoursKey: $yoursKey)
        }
      }
    }
  }
`;

const RowFragment = graphql`
  fragment Compositions_row on ChimeComposition @argumentDefinitions(yoursKey: { type: "String!" }) {
    id
    title
    yours(creatorKey: $yoursKey)
    unitCount
    createdAt
    units { instrument volume tubes wind decay cutoff resonance root scale voice patch channel midiMode notes x y rank }
  }
`;

const SaveMutation = graphql`
  mutation CompositionsSaveMutation($input: DmbkSoundSaveChimeCompositionInput!, $yoursKey: String!) {
    dmbkSoundSaveChimeComposition(input: $input) {
      created
      chimeCompositionEdge {
        cursor
        node {
          id
          ...Compositions_row @arguments(yoursKey: $yoursKey)
        }
      }
    }
  }
`;

const Line = ({ children }: { children: ReactNode }) => <p className="m-0 text-[11px] tracking-[.08em] uppercase">{children}</p>;
const NOTE = "m-0 max-w-[60ch] text-[11px]";

// The saved composition goes on top of the list (ALL), and of YOURS when this key made it, unless the list already
// shows it (a duplicate save). Each filter is its own connection (filters: creatorKey).
const prependSaved = (key: string) => (store: RecordSourceSelectorProxy<CompositionsSaveMutation$data>) => {
  const payload = store.getRootField("dmbkSoundSaveChimeComposition");
  const edge = payload && payload.getLinkedRecord("chimeCompositionEdge");
  const node = edge && edge.getLinkedRecord("node");
  if (!edge || !node) return;
  const yours = node.getValue("yours", { creatorKey: key }) === true;
  for (const creatorKey of yours ? [null, key] : [null]) {
    const conn = ConnectionHandler.getConnection(store.getRoot(), CONNECTION_KEY, { creatorKey });
    if (!conn) continue;
    const edges = conn.getLinkedRecords("edges") || [];
    if (edges.some(e => e && e.getLinkedRecord("node")?.getDataID() === node.getDataID())) continue;
    const built = ConnectionHandler.buildConnectionEdge(store, conn, edge);
    if (built) ConnectionHandler.insertEdgeBefore(conn, built);
  }
};
const saveVariables = (units: Sh.Unit[], key: string) => ({ input: { units: Sh.toSaved(units), creatorKey: key }, yoursKey: key });

/** SHARE's save: the composition's 24-hex id, or null when the save failed (SHARE then copies a fragment link). */
export function shareComposition(units: Sh.Unit[]): Promise<string | null> {
  const key = D.ensureKey();
  return new Promise(resolve => {
    commitMutation<CompositionsSaveMutation>(relayEnvironment(), {
      mutation: SaveMutation,
      variables: saveVariables(units, key),
      updater: prependSaved(key),
      onCompleted: (data, errors) => {
        const edge = !errors?.length && data.dmbkSoundSaveChimeComposition?.chimeCompositionEdge;
        resolve(edge ? Sh.compositionHex(edge.node.id) : null);
      },
      onError: () => resolve(null),
    });
  });
}

function Save({ getUnits }: { getUnits: () => Sh.Unit[] }) {
  const [commit, saving] = useMutation<CompositionsSaveMutation>(SaveMutation);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onSave = () => {
    setMsg("");
    const key = D.ensureKey();
    commit({
      variables: saveVariables(getUnits(), key),
      updater: prependSaved(key),
      onCompleted: () => { setSaved(true); clearTimeout(timer.current); timer.current = setTimeout(() => setSaved(false), 1500); },
      onError: err => setMsg(err && "code" in err && err.code === "RATE_LIMITED" ? "TOO MANY SAVES, TRY LATER" : "COULD NOT SAVE"),
    });
  };
  return (
    <div className="grid gap-2">
      <Button className="h-11 w-full" onClick={onSave} disabled={saving}>{saving ? "SAVING…" : saved ? "SAVED" : "SAVE"}</Button>
      {msg && <Line>{msg}</Line>}
    </div>
  );
}

type OpenRow = (units: SavedUnits, id: string) => void;

function Row({ row, onOpen }: { row: Compositions_row$data; onOpen: OpenRow }) {
  return (
    <li>
      <button
        type="button"
        className="grid w-full gap-0.5 border border-foreground bg-background px-2.5 py-2 text-left text-foreground hover:bg-foreground hover:text-background focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-foreground focus-visible:outline-offset-3"
        onClick={() => onOpen(row.units, row.id)}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="text-[13px]">{row.title}</span>
          {row.yours && <Badge title="SAVED FROM THIS DEVICE">YOURS</Badge>}
        </span>{" "}
        <time dateTime={row.createdAt} className="text-[10px] tracking-[.08em]">{savedAt(row.createdAt)}</time>
      </button>
    </li>
  );
}

function RowItem({ node, onOpen }: { node: Compositions_row$key; onOpen: OpenRow }) {
  // fragment data is read here so each row only re-renders on its own changes
  return <Row row={useFragment<Compositions_row$key>(RowFragment, node)} onOpen={onOpen} />;
}

function List({ fetchKey, creatorKey, yoursKey, onOpen }: { fetchKey: string; creatorKey: string | null; yoursKey: string; onOpen: OpenRow }) {
  const query = useLazyLoadQuery<CompositionsQuery>(ListQuery, { count: PAGE, creatorKey, yoursKey }, { fetchKey, fetchPolicy: "store-and-network" });
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment<CompositionsPaginationQuery, Compositions_list$key>(ListFragment, query);
  const [nextFailed, setNextFailed] = useState(false);
  const edges = data.dmbkSoundChimeCompositions.edges;
  const more = () => { setNextFailed(false); loadNext(PAGE, { onComplete: err => { if (err) setNextFailed(true); } }); };
  return (
    <>
      {edges.length === 0 ? <Line>{creatorKey ? "NOTHING SAVED FROM THIS DEVICE YET" : "NOTHING SAVED YET"}</Line> : (
        <ul className="m-0 grid list-none gap-2 p-0">
          {edges.map((e, i) => <RowItem key={i} node={e.node} onOpen={onOpen} />)}
        </ul>
      )}
      {nextFailed && <Line>COULD NOT LOAD</Line>}
      {hasNext && <Button className="h-11 w-full" onClick={more} disabled={isLoadingNext}>{isLoadingNext ? "LOADING…" : nextFailed ? "RETRY" : "MORE"}</Button>}
    </>
  );
}

// SAVE for the panel's footer: its own provider on the same store, so a save still lands on top of the list
export function SaveButton({ getUnits }: { getUnits: () => Sh.Unit[] }) {
  return <RelayEnvironmentProvider environment={relayEnvironment()}><Save getUnits={getUnits} /></RelayEnvironmentProvider>;
}

class LoadFailed extends Component<{ children: ReactNode; onRetry: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="grid gap-2">
        <Line>COULD NOT LOAD</Line>
        <Button className="h-11 w-full" onClick={this.props.onRetry}>RETRY</Button>
      </div>
    );
  }
}

// This browser's device key, kept current when a save, a share or DEVICE KEY makes or replaces it.
function useDeviceKey(): string {
  const [key, setKey] = useState("");
  useEffect(() => {
    const read = () => setKey(D.readKey() ?? "");
    read();
    window.addEventListener(D.KEY_EVENT, read);
    return () => window.removeEventListener(D.KEY_EVENT, read);
  }, []);
  return key;
}

// The same key and wording as the dx7, vz10m and juno60 editors' DEVICE KEY.
function DeviceKey({ yoursKey }: { yoursKey: string }) {
  const [shown, setShown] = useState(false);
  const [paste, setPaste] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <details className="border-t border-foreground pt-2">
      <summary className="cursor-pointer text-[11px] tracking-[.08em]">DEVICE KEY</summary>
      <div className="mt-2 grid gap-2">
        <p className={NOTE}>
          This key is what makes a saved composition yours: compositions you save or share with it are marked YOURS. It
          is kept only in this browser, and the server stores only a hash of it. Copy it to another browser to see your
          compositions there too. Clearing this site&apos;s data without a copy loses it, and your compositions stay public.
        </p>
        {yoursKey ? (
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-[11px]">{shown ? yoursKey : "•".repeat(20)}</code>
            <Button onClick={() => setShown(s => !s)}>{shown ? "HIDE" : "SHOW"}</Button>
            <Button onClick={() => navigator.clipboard.writeText(yoursKey).then(() => setMsg("KEY COPIED."), () => setMsg("COULD NOT COPY. SHOW IT AND COPY BY HAND."))}>COPY</Button>
          </div>
        ) : <p className={NOTE}>No key yet: one is made the first time you save or share.</p>}
        <form className="flex flex-wrap items-center gap-2" onSubmit={e => {
          e.preventDefault();
          if (!D.useKey(paste)) { setMsg("THAT ISN'T A DEVICE KEY (43 LETTERS, DIGITS, - AND _)."); return; }
          setPaste(""); setMsg("THIS BROWSER NOW USES THAT KEY.");
        }}>
          <TextField
            aria-label="PASTE A DEVICE KEY" placeholder="PASTE A KEY FROM ANOTHER BROWSER" value={paste} onChange={e => setPaste(e.target.value)}
            className="h-8 min-w-0 flex-1 text-[11px] touch:text-[16px]"
          />
          <Button type="submit" disabled={!paste.trim()}>USE KEY</Button>
        </form>
        {yoursKey && <p className={NOTE}>Using another key replaces this one here. Copy this one first if you still need it.</p>}
        {msg && <p role="status" className={NOTE}>{msg}</p>}
      </div>
    </details>
  );
}

// `opening` counts the panel's openings, so each one fetches the list again; RETRY adds a fetch of its own.
export default function Compositions({ opening, onOpen }: { opening: number; onOpen: (units: Sh.UnitFields[], id: string) => void }) {
  const [retries, setRetries] = useState(0);
  const fetchKey = `${opening}:${retries}`;
  const [openFailed, setOpenFailed] = useState(false);
  const yoursKey = useDeviceKey();
  const [mine, setMine] = useState(false);
  const open = (saved: SavedUnits, id: string) => {
    const units = Sh.fromSaved(saved), hex = Sh.compositionHex(id);
    if (!units || !hex) { setOpenFailed(true); return; }
    setOpenFailed(false);
    onOpen(units, hex);
  };
  const creatorKey = mine && yoursKey ? yoursKey : null;
  return (
    <RelayEnvironmentProvider environment={relayEnvironment()}>
      <div role="group" aria-label="SHOW" className="flex gap-1.5">
        <Button aria-pressed={!creatorKey} className="aria-pressed:bg-foreground aria-pressed:text-background" onClick={() => setMine(false)}>ALL</Button>
        <Button aria-pressed={!!creatorKey} className="aria-pressed:bg-foreground aria-pressed:text-background" disabled={!yoursKey} onClick={() => setMine(true)}>YOURS</Button>
      </div>
      {openFailed && <Line>COULD NOT OPEN</Line>}
      <LoadFailed key={fetchKey} onRetry={() => setRetries(n => n + 1)}>
        <Suspense fallback={<Line>LOADING…</Line>}>
          <List fetchKey={fetchKey} creatorKey={creatorKey} yoursKey={yoursKey} onOpen={open} />
        </Suspense>
      </LoadFailed>
      <DeviceKey yoursKey={yoursKey} />
    </RelayEnvironmentProvider>
  );
}

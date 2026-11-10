"use client";

// The COMPOSITIONS panel's content: the public list of saved compositions (and SaveButton, for the panel's footer), through Relay and the dmbk
// GraphQL API (lib/relay/environment.js → app/api/graphql). Loaded with next/dynamic when MENU is first pressed,
// so Relay and every request stay off the page until then. Picking a row hands its units to `onOpen`.
import { Component, Suspense, useRef, useState } from "react";
import { ConnectionHandler, RelayEnvironmentProvider, graphql, useFragment, useLazyLoadQuery, useMutation, usePaginationFragment } from "react-relay";
import { createRelayEnvironment } from "../lib/relay/environment";
import * as Sh from "../lib/share";
import { Button } from "@/components/ui/button";

const PAGE = 20;
// The API stores UTC and not the saver's zone, so a save time is shown in the viewer's own zone, labelled with it.
const STAMP = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZoneName: "short" });
const savedAt = iso => {
  const p = Object.fromEntries(STAMP.formatToParts(new Date(iso)).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute} ${p.timeZoneName}`;
};
const CONNECTION_KEY = "Compositions_dmbkSoundChimeCompositions";

// one store for the page's lifetime, so reopening the panel shows the list at once (and refetches it: `opening`)
let environment = null;
const relayEnvironment = () => (environment ??= createRelayEnvironment());

const ListQuery = graphql`
  query CompositionsQuery($count: Int, $cursor: String) {
    ...Compositions_list @arguments(count: $count, cursor: $cursor)
  }
`;

const ListFragment = graphql`
  fragment Compositions_list on Query
  @refetchable(queryName: "CompositionsPaginationQuery")
  @argumentDefinitions(count: { type: "Int", defaultValue: 20 }, cursor: { type: "String" }) {
    dmbkSoundChimeCompositions(first: $count, after: $cursor) @connection(key: "Compositions_dmbkSoundChimeCompositions") {
      edges {
        node {
          ...Compositions_row
        }
      }
    }
  }
`;

const RowFragment = graphql`
  fragment Compositions_row on ChimeComposition {
    id
    title
    unitCount
    createdAt
    units { instrument volume tubes wind decay cutoff resonance root scale voice channel midiMode notes x y rank }
  }
`;

const SaveMutation = graphql`
  mutation CompositionsSaveMutation($input: DmbkSoundSaveChimeCompositionInput!) {
    dmbkSoundSaveChimeComposition(input: $input) {
      created
      chimeCompositionEdge {
        cursor
        node {
          id
          ...Compositions_row
        }
      }
    }
  }
`;

const Line = ({ children }) => <p className="m-0 text-[11px] tracking-[.08em] uppercase">{children}</p>;

// The saved composition goes on top of the list unless the list already shows it (a duplicate save).
function prependSaved(store) {
  const payload = store.getRootField("dmbkSoundSaveChimeComposition");
  const edge = payload && payload.getLinkedRecord("chimeCompositionEdge");
  const node = edge && edge.getLinkedRecord("node");
  const conn = ConnectionHandler.getConnection(store.getRoot(), CONNECTION_KEY);
  if (!node || !conn) return;
  const edges = conn.getLinkedRecords("edges") || [];
  if (edges.some(e => e && e.getLinkedRecord("node")?.getDataID() === node.getDataID())) return;
  ConnectionHandler.insertEdgeBefore(conn, ConnectionHandler.buildConnectionEdge(store, conn, edge));
}

function Save({ getUnits }) {
  const [commit, saving] = useMutation(SaveMutation);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState("");
  const timer = useRef(0);
  const onSave = () => {
    setMsg("");
    commit({
      variables: { input: { units: Sh.toSaved(getUnits()) } },
      updater: prependSaved,
      onCompleted: () => { setSaved(true); clearTimeout(timer.current); timer.current = setTimeout(() => setSaved(false), 1500); },
      onError: err => setMsg(err && err.code === "RATE_LIMITED" ? "TOO MANY SAVES, TRY LATER" : "COULD NOT SAVE"),
    });
  };
  return (
    <div className="grid gap-2">
      <Button className="h-11 w-full" onClick={onSave} disabled={saving}>{saving ? "SAVING…" : saved ? "SAVED" : "SAVE"}</Button>
      {msg && <Line>{msg}</Line>}
    </div>
  );
}

function Row({ row, onOpen }) {
  return (
    <li>
      <button
        type="button"
        className="grid w-full gap-0.5 border border-foreground bg-background px-2.5 py-2 text-left text-foreground hover:bg-foreground hover:text-background focus-visible:outline-1 focus-visible:outline-dashed focus-visible:outline-foreground focus-visible:outline-offset-3"
        onClick={() => onOpen(row.units)}
      >
        <span className="text-[13px]">{row.title}</span>{" "}
        <time dateTime={row.createdAt} className="text-[10px] tracking-[.08em]">{savedAt(row.createdAt)}</time>
      </button>
    </li>
  );
}

function RowItem({ node, onOpen }) {
  // fragment data is read here so each row only re-renders on its own changes
  return <Row row={useFragment(RowFragment, node)} onOpen={onOpen} />;
}

function List({ fetchKey, onOpen }) {
  const query = useLazyLoadQuery(ListQuery, { count: PAGE }, { fetchKey, fetchPolicy: "store-and-network" });
  const { data, loadNext, hasNext, isLoadingNext } = usePaginationFragment(ListFragment, query);
  const [nextFailed, setNextFailed] = useState(false);
  const edges = data.dmbkSoundChimeCompositions.edges;
  const more = () => { setNextFailed(false); loadNext(PAGE, { onComplete: err => { if (err) setNextFailed(true); } }); };
  return (
    <>
      {edges.length === 0 ? <Line>NOTHING SAVED YET</Line> : (
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
export function SaveButton({ getUnits }) {
  return <RelayEnvironmentProvider environment={relayEnvironment()}><Save getUnits={getUnits} /></RelayEnvironmentProvider>;
}

class LoadFailed extends Component {
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

// `opening` counts the panel's openings, so each one fetches the list again; RETRY adds a fetch of its own.
export default function Compositions({ opening, onOpen }) {
  const [retries, setRetries] = useState(0);
  const fetchKey = `${opening}:${retries}`;
  const [openFailed, setOpenFailed] = useState(false);
  const open = saved => {
    const units = Sh.fromSaved(saved);
    if (!units) { setOpenFailed(true); return; }
    setOpenFailed(false);
    onOpen(units);
  };
  return (
    <RelayEnvironmentProvider environment={relayEnvironment()}>
      {openFailed && <Line>COULD NOT OPEN</Line>}
      <LoadFailed key={fetchKey} onRetry={() => setRetries(n => n + 1)}>
        <Suspense fallback={<Line>LOADING…</Line>}>
          <List fetchKey={fetchKey} onOpen={open} />
        </Suspense>
      </LoadFailed>
    </RelayEnvironmentProvider>
  );
}

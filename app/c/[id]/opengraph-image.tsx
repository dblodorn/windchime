import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { loadComposition } from "./CompositionPage";

export const alt = "chime";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The site's card (app/opengraph-image.tsx) with the composition's title under "chime". A composition that can't be
// loaded gets the plain card.
// `params` is a plain object for image routes in Next 15 (a promise for pages); awaiting works for both.
export default async function Image({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const [font, head, c] = await Promise.all([
    readFile(join(process.cwd(), "node_modules/@dblodorn/sound-tokens/dist/fonts/AA_Knif-mono.woff")),
    readFile(join(process.cwd(), "app/og-head.png")),
    Promise.resolve(params).then(p => loadComposition(p.id)),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#000000",
          fontFamily: "Knif Mono",
        }}
      >
        <img src={`data:image/png;base64,${head.toString("base64")}`} width={245} height={230} />
        <div style={{ fontSize: 72, lineHeight: 1, marginTop: 24, position: "relative", top: -10 }}>chime</div>
        {c.kind === "found" && <div style={{ fontSize: 36, lineHeight: 1, marginTop: 20 }}>{c.title}</div>}
      </div>
    ),
    { ...size, fonts: [{ name: "Knif Mono", data: font, weight: 400, style: "normal" }] },
  );
}

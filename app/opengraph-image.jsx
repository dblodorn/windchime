import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "windchime";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// og-head.png is already a 1-bit bitmap at 2× (each pixel a 2×2 block), drawn at its own size so it isn't resampled.
export default async function Image() {
  const [font, head] = await Promise.all([
    readFile(join(process.cwd(), "app/fonts/AA_Knif-mono.woff")),
    readFile(join(process.cwd(), "app/og-head.png")),
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
        <img src={`data:image/png;base64,${head.toString("base64")}`} width={490} height={460} />
        <div style={{ fontSize: 72, lineHeight: 1, marginTop: 24 }}>windchime</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Knif Mono", data: font, weight: 400, style: "normal" }] },
  );
}

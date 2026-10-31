import { Courier_Prime } from "next/font/google";
import "./globals.css";

const mono = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono", display: "swap" });

export const metadata = {
  title: "Six Tube Chime",
  description: "A six-tube wind chime simulation in 1-bit raster art. Plays through Tone.js and SoundFont samples and exports MIDI.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={mono.variable}>
      <body>{children}</body>
    </html>
  );
}

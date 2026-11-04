import localFont from "next/font/local";
import "./globals.css";

const mono = localFont({ src: "./fonts/AA_Knif-mono.woff", weight: "400", variable: "--font-ui", display: "swap" });

export const metadata = {
  title: "Chime",
  description: "A six-tube wind chime simulation in 1-bit raster art. Plays through Tone.js and SoundFont samples and sends live MIDI.",
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

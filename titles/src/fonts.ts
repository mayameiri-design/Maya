import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";

// Every family ships a Hebrew subset and a Latin subset (same split Google
// Fonts uses). unicode-range lets the browser pick the right file per glyph,
// so mixed Hebrew + English lines always render in ONE typeface.
const HEBREW =
  "U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F";
const LATIN =
  "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";

const family = (name: string, file: string, weight: string) => [
  loadFont({
    family: name,
    url: staticFile(`fonts/${file}-hebrew.woff2`),
    weight,
    unicodeRange: HEBREW,
  }),
  loadFont({
    family: name,
    url: staticFile(`fonts/${file}-latin.woff2`),
    weight,
    unicodeRange: LATIN,
  }),
];

const fontsPromise = Promise.all([
  ...family("Heebo", "Heebo", "100 900"),
  ...family("Frank Ruhl Libre", "FrankRuhlLibre", "300 900"),
  ...family("Bellefair", "Bellefair", "400"),
  ...family("Secular One", "SecularOne", "400"),
]);

export const FONT = {
  sans: "Heebo, sans-serif",
  serif: "'Frank Ruhl Libre', serif",
  display: "Bellefair, serif",
  heavy: "'Secular One', Heebo, sans-serif",
} as const;

/** Blocks the render until every font is loaded. Returns true when ready. */
export const useFontsReady = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("Loading Hebrew + Latin fonts"));
  useEffect(() => {
    fontsPromise.then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return ready;
};

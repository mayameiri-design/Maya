// Usage: node scripts/stills.mjs <outDir> <comp1,comp2|all> <frame1,frame2,...>
// Renders PNG stills of several compositions/frames from ONE bundle (fast QA).
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const [outDir, compArg = "all", frameArg = "100"] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const SYSTEM_CHROME = "/opt/pw-browsers/chromium";
const browserOpts = existsSync(SYSTEM_CHROME)
  ? { browserExecutable: SYSTEM_CHROME, chromeMode: "chrome-for-testing" }
  : {};

const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browser = await openBrowser("chrome", { ...browserOpts });

const ids =
  compArg === "all"
    ? ["MaskRise", "Tracking", "Extrude3D", "ColorWipe", "KineticStack"].flatMap((s) => [`${s}-HE`, `${s}-EN`])
    : compArg.split(",");
const frames = frameArg.split(",").map(Number);

for (const id of ids) {
  const composition = await selectComposition({ serveUrl, id, puppeteerInstance: browser });
  for (const frame of frames) {
    const output = path.join(outDir, `${id}_f${String(frame).padStart(3, "0")}.png`);
    await renderStill({ composition, serveUrl, frame, output, puppeteerInstance: browser });
    console.log("ok", output);
  }
}
await browser.close({ silent: true });

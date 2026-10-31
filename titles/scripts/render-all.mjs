// Renders every title (5 styles × HE/EN) + the showreel to out/*.mp4
// Usage: node scripts/render-all.mjs [concurrency=1]
// concurrency=1 is deliberate: CSS-3D scenes can stall under parallel tabs
// in software-rendered environments (see README).
import { execFileSync } from "node:child_process";
const c = process.argv[2] ?? "1";
const ids = ["MaskRise", "Tracking", "Extrude3D", "ColorWipe", "KineticStack"].flatMap((s) => [`${s}-HE`, `${s}-EN`]);
for (const id of [...ids, "Showreel"]) {
  execFileSync("npx", ["remotion", "render", id, `out/${id}.mp4`, "--codec=h264", "--crf=16",
    "--pixel-format=yuv420p", `--concurrency=${c}`, "--timeout=120000"], { stdio: "inherit" });
}

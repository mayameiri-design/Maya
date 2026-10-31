# Motion Title System — vertical 9:16, Hebrew + English

Premium kinetic-typography titles for ads and Instagram Reels. 1080×1920, 30fps,
H.264 MP4. Built with Remotion; every title is a React component driven by props,
so a new campaign = new text + theme, not new animation work.

## The 5 styles
| # | Style | Look | Techniques |
|---|-------|------|-----------|
| 1 | **MaskRise** | Editorial serif (Frank Ruhl Libre) | per-word masked reveal, velocity motion blur, hairline, slow push-in |
| 2 | **Tracking** | Thin cinematic sans (Heebo 300) | animated letter-spacing tracking, rack-focus blur, light sweep, letterbox hairlines |
| 3 | **Extrude3D** | Heavy 3D sans | real CSS-3D extrusion (24 depth slices), camera swing, perspective, specular sweep |
| 4 | **ColorWipe** | Bold sans + accent block | directional colour wipe mask reveal, highlight label, horizontal motion blur |
| 5 | **KineticStack** | Poster-scale heavy type | on-beat spring slams, solid/outline alternation, camera shake, velocity blur |

Themes: `noir` (gold), `ember` (vermillion), `ice` (blue), `paper` (light editorial).
Transitions (Showreel): `inkWipe`, `blurPush`, `slats` — custom, in `src/transitions`.

## Props (editable in Studio)
`lines: string[]` · `sub: string` · `theme` · `exit: boolean` · `delay: number` · `guides: boolean`
(`guides` overlays the Instagram UI safe-zones; keep it off for export.)

## Hebrew / RTL
- Direction is chosen by counting words, so a Hebrew line starting with a Latin
  brand name is still RTL (`src/lib/text.ts`). `dir="rtl"` + `lang="he"` go on every text block.
- Animation is per **word / line / block**, never per Latin-style letter box in a
  way that reorders text. Wipes, drift and sweeps mirror for RTL.
- Hebrew + Latin ship as one family (unicode-range split), so mixed lines never
  fall back to a system font. Fonts: Heebo, Frank Ruhl Libre, Secular One, Bellefair (OFL).
- Tracking cancels the trailing letter-space so centred text stays centred.

## Commands
```bash
npm run dev                 # Remotion Studio (interactive preview)
npm run render:reel         # Showreel → out/showreel.mp4
npm run render:all          # all 10 titles + reel → out/
npm run stills -- out/qa MaskRise-HE,Extrude3D-EN 30,60,110   # QA stills
```

## Cloud / sandbox notes
- Remotion's own Chrome download (`remotion.media`) can be blocked; `remotion.config.ts`
  falls back to `/opt/pw-browsers/chromium` when present.
- Render with `--concurrency=1` there. With 3–4 parallel tabs the 3D scene
  intermittently stalled (`delayRender` timeout); one tab is stable (~4 min for the reel).
- Instagram: export is converted to limited-range `yuv420p` + `faststart`.

import React from "react";
import { Composition, Folder } from "remotion";
import { FPS, H, W } from "./config";
import { titleSchema } from "./titleProps";
import { MaskRise } from "./styles/MaskRise";
import { Tracking } from "./styles/Tracking";
import { Extrude3D } from "./styles/Extrude3D";
import { ColorWipe } from "./styles/ColorWipe";
import { KineticStack } from "./styles/KineticStack";
import { SHOWREEL_FRAMES, Showreel } from "./Showreel";

// Each composition is its own JSX node with inline defaultProps, so it can be
// edited independently in the Studio (text, theme, timing) and written back.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="Showreel" component={Showreel} durationInFrames={SHOWREEL_FRAMES} fps={FPS} width={W} height={H} />

      <Folder name="1-MaskRise">
        <Composition id="MaskRise-HE" component={MaskRise} schema={titleSchema} durationInFrames={150} fps={FPS} width={W} height={H}
          defaultProps={{ lines: ["עיצוב שמרגיש", "כמו קולנוע"], sub: "סטודיו לתנועה", theme: "noir", exit: true, delay: 0, guides: false }} />
        <Composition id="MaskRise-EN" component={MaskRise} schema={titleSchema} durationInFrames={150} fps={FPS} width={W} height={H}
          defaultProps={{ lines: ["Design that moves", "like cinema"], sub: "Motion studio · 2026", theme: "noir", exit: true, delay: 0, guides: false }} />
      </Folder>

      <Folder name="2-Tracking">
        <Composition id="Tracking-HE" component={Tracking} schema={titleSchema} durationInFrames={150} fps={FPS} width={W} height={H}
          defaultProps={{ lines: ["הכל מתחיל", "ברגע אחד"], sub: "סיפור חדש", theme: "ice", exit: true, delay: 0, guides: false }} />
        <Composition id="Tracking-EN" component={Tracking} schema={titleSchema} durationInFrames={150} fps={FPS} width={W} height={H}
          defaultProps={{ lines: ["Every story", "begins here"], sub: "Motion studio · 2026", theme: "ice", exit: true, delay: 0, guides: false }} />
      </Folder>

      <Folder name="3-Extrude3D">
        <Composition id="Extrude3D-HE" component={Extrude3D} schema={titleSchema} durationInFrames={150} fps={FPS} width={W} height={H}
          defaultProps={{ lines: ["עידן", "חדש"], sub: "הקולקציה החדשה", theme: "ember", exit: true, delay: 0, guides: false }} />
        <Composition id="Extrude3D-EN" component={Extrude3D} schema={titleSchema} durationInFrames={150} fps={FPS} width={W} height={H}
          defaultProps={{ lines: ["New", "era"], sub: "The new collection", theme: "ember", exit: true, delay: 0, guides: false }} />
      </Folder>

      <Folder name="4-ColorWipe">
        <Composition id="ColorWipe-HE" component={ColorWipe} schema={titleSchema} durationInFrames={150} fps={FPS} width={W} height={H}
          defaultProps={{ lines: ["מבצע מיוחד", "רק השבוע"], sub: "להזמנה עכשיו", theme: "paper", exit: true, delay: 0, guides: false }} />
        <Composition id="ColorWipe-EN" component={ColorWipe} schema={titleSchema} durationInFrames={150} fps={FPS} width={W} height={H}
          defaultProps={{ lines: ["Limited offer", "this week only"], sub: "Shop the drop", theme: "paper", exit: true, delay: 0, guides: false }} />
      </Folder>

      <Folder name="5-KineticStack">
        <Composition id="KineticStack-HE" component={KineticStack} schema={titleSchema} durationInFrames={150} fps={FPS} width={W} height={H}
          defaultProps={{ lines: ["תחשבו", "גדול", "תזוזו", "מהר"], sub: "הכל מתחיל עכשיו", theme: "noir", exit: true, delay: 0, guides: false }} />
        <Composition id="KineticStack-EN" component={KineticStack} schema={titleSchema} durationInFrames={150} fps={FPS} width={W} height={H}
          defaultProps={{ lines: ["Think", "big", "move", "fast"], sub: "It starts now", theme: "noir", exit: true, delay: 0, guides: false }} />
      </Folder>
    </>
  );
};

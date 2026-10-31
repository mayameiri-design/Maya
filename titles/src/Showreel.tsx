import React from "react";
import { Easing } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { THEMES } from "./config";
import { blurPush, inkWipe, slats } from "./transitions";
import { MaskRise } from "./styles/MaskRise";
import { Tracking } from "./styles/Tracking";
import { Extrude3D } from "./styles/Extrude3D";
import { ColorWipe } from "./styles/ColorWipe";
import { KineticStack } from "./styles/KineticStack";
import type { TitleProps } from "./titleProps";

export const SCENE = 150;
export const TRANSITION = 22;
export const SHOWREEL_FRAMES = SCENE * 5 - TRANSITION * 4; // 662

const timing = linearTiming({
  durationInFrames: TRANSITION,
  easing: Easing.bezier(0.76, 0, 0.24, 1),
});

// While a transition plays the incoming scene is only partly visible, so its
// animation is delayed by most of the transition to land on a clean frame.
const IN = 16;

const base = { guides: false } as const;

/** All five styles, alternating Hebrew / English, joined by custom transitions. */
export const Showreel: React.FC = () => {
  const a: TitleProps = { ...base, lines: ["עיצוב שמרגיש", "כמו קולנוע"], sub: "סטודיו לתנועה", theme: "noir", exit: false, delay: 0 };
  const b: TitleProps = { ...base, lines: ["Every story", "begins here"], sub: "Motion studio · 2026", theme: "ice", exit: false, delay: IN };
  const c: TitleProps = { ...base, lines: ["עידן", "חדש"], sub: "הקולקציה החדשה", theme: "ember", exit: false, delay: IN };
  const d: TitleProps = { ...base, lines: ["Limited offer", "this week only"], sub: "Shop the drop", theme: "paper", exit: false, delay: IN };
  const e: TitleProps = { ...base, lines: ["תחשבו", "גדול", "תזוזו", "מהר"], sub: "הכל מתחיל עכשיו", theme: "noir", exit: true, delay: IN };

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence name="1 · Mask Rise (HE)" durationInFrames={SCENE}>
        <MaskRise {...a} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={inkWipe(THEMES.ice.accent)} timing={timing} />
      <TransitionSeries.Sequence name="2 · Tracking (EN)" durationInFrames={SCENE}>
        <Tracking {...b} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={blurPush()} timing={timing} />
      <TransitionSeries.Sequence name="3 · Extrude 3D (HE)" durationInFrames={SCENE}>
        <Extrude3D {...c} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={slats()} timing={timing} />
      <TransitionSeries.Sequence name="4 · Color Wipe (EN)" durationInFrames={SCENE}>
        <ColorWipe {...d} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={inkWipe(THEMES.noir.accent)} timing={timing} />
      <TransitionSeries.Sequence name="5 · Kinetic Stack (HE)" durationInFrames={SCENE}>
        <KineticStack {...e} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};

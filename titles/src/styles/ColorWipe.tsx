import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { fitText } from "@remotion/layout-utils";
import { CONTENT_W, THEMES, type Theme } from "../config";
import { FONT, useFontsReady } from "../fonts";
import { dirAttrs, isRtlText } from "../lib/text";
import { EXPO_OUT, POWER_IN_OUT, prog } from "../lib/motion";
import { MotionBlur } from "../components/MotionBlur";
import { SafeArea, Stage } from "../components/Stage";
import { Sub } from "../components/Sub";
import type { TitleProps } from "../titleProps";

/**
 * STYLE 4 — COLOR WIPE
 * An accent block sweeps across each line from the reading-start edge, text
 * is revealed behind it and slides in with horizontal motion blur. The last
 * line keeps its block and becomes a highlight label. Direction mirrors for
 * Hebrew (starts at the right edge).
 */
const WipeLine: React.FC<{
  text: string;
  index: number;
  last: boolean;
  size: number;
  rtl: boolean;
  exit: boolean;
  delay: number;
  theme: Theme;
}> = ({ text, index, last, size, rtl, exit, delay, theme }) => {
  const frame = useCurrentFrame() - delay;
  const { durationInFrames } = useVideoConfig();
  const s = 6 + index * 11;
  const revealAt = s + 15;
  const startEdge = rtl ? "right" : "left";
  const endEdge = rtl ? "left" : "right";

  const grow = prog(frame, s, 16, POWER_IN_OUT);
  const retreat = last ? 0 : prog(frame, revealAt, 20, POWER_IN_OUT);
  const growing = frame < revealAt;
  const scale = growing ? grow : 1 - retreat;

  const txAt = (f: number) =>
    (1 - prog(f, revealAt, 28, EXPO_OUT)) * (rtl ? 80 : -80);
  const tx = txAt(frame);

  const exitP = exit
    ? prog(frame, durationInFrames - delay - 24 + index * 3, 18, POWER_IN_OUT)
    : 0;
  const clip = rtl
    ? `inset(0 0 0 ${exitP * 100}%)`
    : `inset(0 ${exitP * 100}% 0 0)`;

  return (
    <div
      {...dirAttrs(rtl)}
      style={{
        position: "relative",
        display: "inline-flex",
        overflow: "hidden",
        paddingInline: size * 0.28,
        paddingBlock: size * 0.1,
        clipPath: clip,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: theme.accent,
          transformOrigin: growing ? startEdge : endEdge,
          transform: `scaleX(${scale})`,
          display: scale < 0.01 ? "none" : undefined, // no sub-pixel sliver left behind
          zIndex: last ? 0 : 2,
        }}
      />
      <MotionBlur
        vx={txAt(frame - 1) - tx}
        style={{
          position: "relative",
          zIndex: 1,
          opacity: frame >= revealAt ? 1 : 0,
          transform: `translateX(${tx}px)`,
          fontFamily: FONT.sans,
          fontWeight: 800,
          fontSize: size,
          lineHeight: 1.12,
          letterSpacing: rtl ? "-0.01em" : "-0.025em",
          whiteSpace: "nowrap",
          color: last ? theme.onAccent : theme.text,
        }}
      >
        {text}
      </MotionBlur>
    </div>
  );
};

export const ColorWipe: React.FC<TitleProps> = ({
  lines,
  sub,
  theme: themeName,
  exit,
  delay,
  guides,
}) => {
  const frame = useCurrentFrame() - delay;
  const { durationInFrames } = useVideoConfig();
  const ready = useFontsReady();
  const theme = THEMES[themeName];
  const rtl = isRtlText(lines);

  const size = useMemo(() => {
    if (!ready) return 90;
    return Math.min(
      128,
      ...lines.map(
        (l) =>
          fitText({
            text: l,
            withinWidth: CONTENT_W * 0.9,
            fontFamily: FONT.sans,
            fontWeight: 800,
            validateFontIsLoaded: false,
          }).fontSize,
      ),
    );
  }, [ready, lines]);

  if (!ready) return null;

  const exitP = exit
    ? prog(frame, durationInFrames - delay - 24, 18, POWER_IN_OUT)
    : 0;
  const subIn = prog(frame, 6 + lines.length * 11 + 22, 28);

  return (
    <Stage theme={theme} guides={guides}>
      <SafeArea>
        <div
          style={{
            width: CONTENT_W,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start", // logical start: right edge in RTL
            gap: size * 0.1,
          }}
          {...dirAttrs(rtl)}
        >
          {lines.map((l, i) => (
            <WipeLine
              key={i}
              text={l}
              index={i}
              last={i === lines.length - 1}
              size={size}
              rtl={rtl}
              exit={exit}
              delay={delay}
              theme={theme}
            />
          ))}
          <div style={{ marginTop: size * 0.34, paddingInline: size * 0.06 }}>
            <Sub
              text={sub}
              rtl={rtl}
              theme={theme}
              size={36}
              opacity={subIn * (1 - exitP)}
              y={(1 - subIn) * 16}
            />
          </div>
        </div>
      </SafeArea>
    </Stage>
  );
};

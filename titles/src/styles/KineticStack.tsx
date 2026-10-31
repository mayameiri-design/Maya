import React, { useMemo } from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fitText } from "@remotion/layout-utils";
import { THEMES, type Theme } from "../config";
import { FONT, useFontsReady } from "../fonts";
import { dirAttrs, isRtlText } from "../lib/text";
import { EXPO_IN_OUT, lerp, prog } from "../lib/motion";
import { MotionBlur } from "../components/MotionBlur";
import { SafeArea, Stage } from "../components/Stage";
import { Sub } from "../components/Sub";
import type { TitleProps } from "../titleProps";

/**
 * STYLE 5 — KINETIC STACK
 * Poster-scale words slam in on a beat from alternating sides with spring
 * overshoot, velocity motion blur and a camera shake on every hit. Solid and
 * outlined lines alternate; the last line lights up in the accent colour.
 */
const BEAT = 8; // frames between hits (≈ 225 bpm at 30fps)
const FIT_W = 840; // leaves room for the lateral drift

const SLAM = { damping: 13, stiffness: 150, mass: 0.75 } as const;

const Slam: React.FC<{
  text: string;
  index: number;
  last: boolean;
  size: number;
  rtl: boolean;
  delay: number;
  theme: Theme;
}> = ({ text, index, last, size, rtl, delay, theme }) => {
  const frame = useCurrentFrame() - delay;
  const { fps } = useVideoConfig();
  const s = 4 + index * BEAT;
  const side = index % 2 === 0 ? -1 : 1;

  const state = (f: number) => {
    const sp = spring({ frame: f - s, fps, config: SLAM });
    const drift = Math.max(0, f - s) * 0.32 * -side;
    return {
      x: (1 - sp) * side * 520 + drift,
      scale: lerp(1.9, 1, sp),
      sp,
    };
  };
  const now = state(frame);
  const prev = state(frame - 1);
  const opacity = prog(frame, s, 4, (t) => t);
  const outline = index % 2 === 1 && !last;

  return (
    <MotionBlur
      vx={prev.x - now.x}
      vy={0}
      style={{
        transform: `translateX(${now.x}px) scale(${now.scale})`,
        opacity,
        willChange: "transform",
      }}
    >
      <div
        {...dirAttrs(rtl)}
        style={{
          fontFamily: FONT.heavy,
          fontWeight: 400,
          fontSize: size,
          lineHeight: 0.9,
          letterSpacing: rtl ? "-0.015em" : "-0.04em",
          textTransform: rtl ? "none" : "uppercase",
          whiteSpace: "nowrap",
          textAlign: "center",
          color: outline ? "transparent" : last ? theme.accent : theme.text,
          WebkitTextStroke: outline ? `${Math.max(3, size * 0.014)}px ${theme.text}` : undefined,
          paintOrder: "stroke fill",
        }}
      >
        {text}
      </div>
    </MotionBlur>
  );
};

export const KineticStack: React.FC<TitleProps> = ({
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

  const sizes = useMemo(() => {
    if (!ready) return lines.map(() => 100);
    return lines.map((l) =>
      Math.min(
        300,
        fitText({
          text: l,
          withinWidth: FIT_W,
          fontFamily: FONT.heavy,
          fontWeight: 400,
          textTransform: rtl ? "none" : "uppercase",
          validateFontIsLoaded: false,
        }).fontSize,
      ),
    );
  }, [ready, lines, rtl]);

  if (!ready) return null;

  // camera shake: a damped oscillation kicked off by every hit
  let shakeY = 0;
  let shakeX = 0;
  lines.forEach((_, i) => {
    const t = frame - (4 + i * BEAT) - 3;
    if (t > 0) {
      const a = 9 * Math.exp(-t / 3.5);
      shakeY += a * Math.sin(t * 2.1);
      shakeX += a * 0.5 * Math.cos(t * 1.7);
    }
  });

  const exitP = exit
    ? prog(frame, durationInFrames - delay - 22, 18, EXPO_IN_OUT)
    : 0;
  const subIn = prog(frame, 4 + lines.length * BEAT + 12, 26);

  return (
    <Stage theme={theme} guides={guides}>
      <SafeArea>
        <MotionBlur
          vy={0}
          vx={0}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            transform: `translate(${shakeX}px, ${shakeY}px) scale(${lerp(1, 1.16, exitP)})`,
            opacity: 1 - exitP,
            filter: exitP > 0 ? `blur(${exitP * 18}px)` : undefined,
          }}
        >
          {lines.map((l, i) => (
            <Slam
              key={i}
              text={l}
              index={i}
              last={i === lines.length - 1}
              size={sizes[i]}
              rtl={rtl}
              delay={delay}
              theme={theme}
            />
          ))}
          <div style={{ marginTop: 40 }}>
            <Sub
              text={sub}
              rtl={rtl}
              theme={theme}
              size={36}
              opacity={subIn}
              y={(1 - subIn) * 16}
            />
          </div>
        </MotionBlur>
      </SafeArea>
    </Stage>
  );
};

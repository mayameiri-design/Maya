import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { measureText } from "@remotion/layout-utils";
import { CONTENT_W, THEMES } from "../config";
import { FONT, useFontsReady } from "../fonts";
import { dirAttrs, graphemes, isRtlText } from "../lib/text";
import { EXPO_IN_OUT, lerp, prog } from "../lib/motion";
import { SafeArea, Stage } from "../components/Stage";
import { Sub } from "../components/Sub";
import type { TitleProps } from "../titleProps";

/**
 * STYLE 2 — CINEMATIC TRACKING
 * A film-title feel: wide letter-spacing slowly contracts while the text
 * resolves from a deep blur, then a specular light band sweeps across.
 * Hairlines open above and below like a letterbox.
 */
const END_LS = 0.14; // em, resting tracking
const WEIGHT = 300;

const TrackedLine: React.FC<{
  text: string;
  index: number;
  size: number;
  startLs: number;
  rtl: boolean;
  exit: boolean;
  delay: number;
  theme: (typeof THEMES)[keyof typeof THEMES];
}> = ({ text, index, size, startLs, rtl, exit, delay, theme }) => {
  const frame = useCurrentFrame() - delay;
  const { durationInFrames } = useVideoConfig();
  const s = 4 + index * 10;
  const slow = Easing.bezier(0.18, 0.85, 0.2, 1);
  const p = prog(frame, s, 105, slow);
  const outP = exit
    ? prog(frame, durationInFrames - delay - 26, 22, EXPO_IN_OUT)
    : 0;

  const ls = lerp(startLs, END_LS, p) + outP * 0.1;
  const opacity = prog(frame, s, 42, Easing.bezier(0.22, 1, 0.36, 1)) * (1 - outP);
  const blur = (1 - prog(frame, s, 62, slow)) * 24 + outP * 16;

  // light band: left→right for LTR, right→left for RTL
  const sweep = prog(frame, 70 + index * 8, 46, Easing.bezier(0.4, 0, 0.2, 1));
  const pos = rtl ? sweep * 100 : (1 - sweep) * 100;

  return (
    <div
      {...dirAttrs(rtl)}
      style={{
        fontFamily: FONT.sans,
        fontWeight: WEIGHT,
        fontSize: size,
        lineHeight: 1.18,
        letterSpacing: `${ls}em`,
        marginInlineEnd: `${-ls}em`,
        textTransform: rtl ? "none" : "uppercase",
        whiteSpace: "nowrap",
        opacity,
        filter: `blur(${blur}px)`,
        color: "transparent",
        backgroundImage: `linear-gradient(100deg, ${theme.text} 0%, ${theme.text} 38%, ${theme.accentLight} 50%, ${theme.text} 62%, ${theme.text} 100%)`,
        backgroundSize: "250% 100%",
        backgroundPosition: `${pos}% 0`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        textShadow: "none",
      }}
    >
      {text}
    </div>
  );
};

export const Tracking: React.FC<TitleProps> = ({
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

  // One size for all lines, chosen so the RESTING tracking fits; the starting
  // tracking is limited so even the widest frame stays inside the safe area.
  const { size, startLs } = useMemo(() => {
    if (!ready) return { size: 80, startLs: 0.4 };
    const tt = rtl ? "none" : "uppercase";
    let fs = 118;
    const widthAt = (text: string, fontSize: number, ls: number) => {
      const w0 = measureText({
        text,
        fontFamily: FONT.sans,
        fontWeight: WEIGHT,
        fontSize,
        textTransform: tt,
        validateFontIsLoaded: false,
      }).width;
      return w0 + graphemes(text).length * ls * fontSize;
    };
    for (let i = 0; i < 40; i++) {
      if (lines.every((l) => widthAt(l, fs, END_LS) <= CONTENT_W)) break;
      fs -= 4;
    }
    const maxLs = Math.min(
      ...lines.map((l) => {
        const w0 = widthAt(l, fs, 0);
        return (CONTENT_W - w0) / (graphemes(l).length * fs);
      }),
    );
    return { size: fs, startLs: Math.max(END_LS, Math.min(0.62, maxLs)) };
  }, [ready, lines, rtl]);

  if (!ready) return null;

  const exitP = exit
    ? prog(frame, durationInFrames - delay - 26, 22, EXPO_IN_OUT)
    : 0;
  const hair = prog(frame, 8, 54, Easing.bezier(0.65, 0, 0.35, 1)) * (1 - exitP);
  const subIn = prog(frame, 56, 34);
  const push = lerp(1.05, 1, prog(frame, 0, 120, Easing.bezier(0.2, 0.7, 0.3, 1)));

  const Hair = () => (
    <div
      style={{
        height: 2,
        width: 560,
        background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
        transform: `scaleX(${hair})`,
        opacity: 0.9,
      }}
    />
  );

  return (
    <Stage theme={theme} guides={guides}>
      <SafeArea>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: size * 0.5,
            transform: `scale(${push})`,
          }}
        >
          <Hair />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {lines.map((l, i) => (
              <TrackedLine
                key={i}
                text={l}
                index={i}
                size={size}
                startLs={startLs}
                rtl={rtl}
                exit={exit}
                delay={delay}
                theme={theme}
              />
            ))}
          </div>
          <Hair />
          <Sub
            text={sub}
            rtl={rtl}
            theme={theme}
            size={36}
            opacity={subIn * (1 - exitP)}
            y={(1 - subIn) * 18}
          />
        </div>
      </SafeArea>
    </Stage>
  );
};

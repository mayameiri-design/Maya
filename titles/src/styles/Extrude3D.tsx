import React, { useMemo } from "react";
import { interpolateColors, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { fitText } from "@remotion/layout-utils";
import { CONTENT_W, THEMES, type Theme } from "../config";
import { FONT, useFontsReady } from "../fonts";
import { dirAttrs, isRtlText } from "../lib/text";
import { EXPO_IN_OUT, EXPO_OUT, lerp, prog } from "../lib/motion";
import { SafeArea, Stage } from "../components/Stage";
import { Sub } from "../components/Sub";
import type { TitleProps } from "../titleProps";

/**
 * STYLE 3 — DEPTH EXTRUDE (true 3D text)
 * The word is stacked into ~24 slices in real CSS 3D space, so it has genuine
 * depth, perspective and parallax as the camera swings in. Built from live
 * text (not a mesh), which is why Hebrew shapes and RTL order stay perfect.
 */
const LAYERS = 24;

const Extruded: React.FC<{
  text: string;
  size: number;
  depth: number;
  rtl: boolean;
  theme: Theme;
  shine: number;
}> = ({ text, size, depth, rtl, theme, shine }) => {
  const base: React.CSSProperties = {
    fontFamily: FONT.sans,
    fontWeight: 900,
    fontSize: size,
    lineHeight: 1.02,
    whiteSpace: "nowrap",
    textTransform: rtl ? "none" : "uppercase",
    letterSpacing: rtl ? "-0.01em" : "-0.02em",
  };
  const step = depth / LAYERS;
  const s = shine * 160 - 30;

  return (
    <div
      {...dirAttrs(rtl)}
      style={{ position: "relative", display: "inline-block", transformStyle: "preserve-3d" }}
    >
      {Array.from({ length: LAYERS }, (_, i) => {
        const k = (i + 1) / LAYERS;
        const color = interpolateColors(
          k,
          [0, 0.06, 1],
          [theme.accentLight, theme.accent, theme.accentDeep],
        );
        return (
          <div
            key={i}
            style={{
              ...base,
              position: "absolute",
              insetBlockStart: 0,
              insetInlineStart: 0,
              color,
              transform: `translateZ(${-(i + 1) * step}px)`,
            }}
          >
            {text}
          </div>
        );
      })}
      <div
        style={{
          ...base,
          color: "transparent",
          backgroundImage: `linear-gradient(105deg, transparent ${s - 14}%, rgba(255,255,255,0.95) ${s}%, transparent ${s + 14}%), linear-gradient(180deg, ${theme.text} 0%, ${theme.accentLight} 58%, ${theme.accent} 100%)`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Extrude3D: React.FC<TitleProps> = ({
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
    if (!ready) return 100;
    return Math.min(
      290,
      ...lines.map(
        (l) =>
          fitText({
            text: l,
            withinWidth: CONTENT_W - 40,
            fontFamily: FONT.sans,
            fontWeight: 900,
            textTransform: rtl ? "none" : "uppercase",
            validateFontIsLoaded: false,
          }).fontSize,
      ),
    );
  }, [ready, lines, rtl]);

  if (!ready) return null;

  const dir = rtl ? -1 : 1;
  const exitP = exit
    ? prog(frame, durationInFrames - delay - 26, 22, EXPO_IN_OUT)
    : 0;
  const swing = prog(frame, 0, 84, Easing.bezier(0.16, 0.9, 0.25, 1));
  const drift = Math.sin(frame / 26) * 2.4;
  const ry = dir * (lerp(-46, -14, swing) + drift + exitP * 38);
  const rx = lerp(16, 7, swing) + Math.cos(frame / 31) * 1.2;
  const z = lerp(-520, 0, swing) - exitP * 160;
  const opacity = prog(frame, 0, 18, EXPO_OUT) * (1 - exitP);
  const subIn = prog(frame, 60, 30);

  return (
    <Stage theme={theme} guides={guides}>
      <SafeArea>
        <div
          style={{
            perspective: 1500,
            perspectiveOrigin: "50% 42%",
            opacity,
            // blur lives on the wrapper: a filter on the preserve-3d element
            // itself would flatten the extrusion into 2D.
            filter: `blur(${(1 - prog(frame, 0, 30)) * 12}px)`,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: size * 0.02,
              transformStyle: "preserve-3d",
              transform: `translateZ(${z}px) rotateX(${rx}deg) rotateY(${ry}deg)`,
            }}
          >
            {lines.map((l, i) => {
              const depth = prog(frame, 8 + i * 7, 46, EXPO_OUT) * size * 0.3 * (1 - exitP * 0.8);
              return (
                <Extruded
                  key={i}
                  text={l}
                  size={size}
                  depth={depth}
                  rtl={rtl}
                  theme={theme}
                  shine={prog(frame, 62 + i * 6, 44, Easing.bezier(0.4, 0, 0.2, 1))}
                />
              );
            })}
          </div>
        </div>
        <div style={{ marginTop: size * 0.5 }}>
          <Sub
            text={sub}
            rtl={rtl}
            theme={theme}
            opacity={subIn * (1 - exitP)}
            y={(1 - subIn) * 20}
          />
        </div>
      </SafeArea>
    </Stage>
  );
};

import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { fitText } from "@remotion/layout-utils";
import { CONTENT_W, THEMES } from "../config";
import { FONT, useFontsReady } from "../fonts";
import { dirAttrs, isRtlText, splitWords } from "../lib/text";
import { EXPO_IN_OUT, EXPO_OUT, lerp, prog } from "../lib/motion";
import { MotionBlur } from "../components/MotionBlur";
import { SafeArea, Stage } from "../components/Stage";
import { Sub } from "../components/Sub";
import type { TitleProps } from "../titleProps";

/**
 * STYLE 1 — MASK RISE
 * Editorial serif. Every word rises out of an invisible mask line with a
 * velocity-driven vertical motion blur and a tiny rotation, then a hairline
 * draws and the subtitle settles. Exits the same way, upward.
 */
const Rise: React.FC<{
  index: number;
  h: number;
  rtl: boolean;
  exit: boolean;
  delay: number;
  children: React.ReactNode;
}> = ({ index, h, rtl, exit, delay, children }) => {
  const frame = useCurrentFrame() - delay;
  const { durationInFrames } = useVideoConfig();
  const inStart = 6 + index * 5;
  const outStart = durationInFrames - delay - 26 + Math.min(index * 2, 8);
  const yAt = (f: number) =>
    (1 - prog(f, inStart, 40, EXPO_OUT)) * h * 1.25 -
    (exit ? prog(f, outStart, 20, EXPO_IN_OUT) * h * 1.25 : 0);
  const y = yAt(frame);
  const rot = (1 - prog(frame, inStart, 40, EXPO_OUT)) * (rtl ? -6 : 6);

  return (
    <MotionBlur
      vy={yAt(frame - 1) - y}
      style={{
        display: "inline-block",
        transform: `translateY(${y}px) rotate(${rot}deg)`,
        transformOrigin: rtl ? "right bottom" : "left bottom",
      }}
    >
      {children}
    </MotionBlur>
  );
};

export const MaskRise: React.FC<TitleProps> = ({
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
      172,
      ...lines.map(
        (l) =>
          fitText({
            text: l,
            withinWidth: CONTENT_W,
            fontFamily: FONT.serif,
            fontWeight: 500,
            validateFontIsLoaded: false,
          }).fontSize,
      ),
    );
  }, [ready, lines]);

  if (!ready) return null;

  const h = size * 1.06;
  const exitP = exit
    ? prog(frame, durationInFrames - delay - 26, 20, EXPO_IN_OUT)
    : 0;
  const ruleP = prog(frame, 30, 34, EXPO_OUT) * (1 - exitP);
  const subIn = prog(frame, 44, 30, EXPO_OUT);
  const push = lerp(1, 1.035, frame / durationInFrames);

  let wordIndex = 0;

  return (
    <Stage theme={theme} guides={guides}>
      <SafeArea>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: `scale(${push})`,
          }}
        >
          {lines.map((line, li) => (
            <div
              key={li}
              {...dirAttrs(rtl)}
              style={{
                overflow: "hidden",
                display: "flex",
                justifyContent: "center",
                columnGap: size * 0.26,
                whiteSpace: "nowrap",
                paddingBlock: size * 0.16,
                marginBlock: -size * 0.16,
                fontFamily: FONT.serif,
                fontWeight: 500,
                fontSize: size,
                lineHeight: 1.06,
                letterSpacing: rtl ? "0em" : "-0.015em",
                color: theme.text,
              }}
            >
              {splitWords(line).map((w, k) => (
                <Rise
                  key={k}
                  index={wordIndex++}
                  h={h}
                  rtl={rtl}
                  exit={exit}
                  delay={delay}
                >
                  {w}
                </Rise>
              ))}
            </div>
          ))}

          <div
            style={{
              marginTop: size * 0.46,
              width: 230,
              height: 2,
              background: theme.accent,
              transform: `scaleX(${ruleP})`,
              opacity: 0.95,
            }}
          />
          <div style={{ marginTop: size * 0.3 }}>
            <Sub
              text={sub}
              rtl={rtl}
              theme={theme}
              opacity={subIn * (1 - exitP)}
              y={(1 - subIn) * 26}
            />
          </div>
        </div>
      </SafeArea>
    </Stage>
  );
};

import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { noise2D } from "@remotion/noise";
import { H, SAFE, W, type Theme } from "../config";

/** Content area that stays clear of the Instagram UI. */
export const SafeArea: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <AbsoluteFill
    style={{
      paddingTop: SAFE.top,
      paddingBottom: SAFE.bottom,
      paddingInline: SAFE.side,
      justifyContent: "center",
      alignItems: "center",
      ...style,
    }}
  >
    {children}
  </AbsoluteFill>
);

const Guides: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        left: SAFE.side,
        right: SAFE.side,
        top: SAFE.top,
        bottom: SAFE.bottom,
        border: "2px dashed rgba(0,255,170,.7)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: SAFE.bottom,
        background: "rgba(255,0,80,.12)",
      }}
    />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        height: SAFE.top,
        background: "rgba(255,0,80,.12)",
      }}
    />
  </AbsoluteFill>
);

/**
 * The "studio" around every title: graded gradient, slow-drifting light,
 * film grain and a vignette. This is most of what separates an ad from a
 * template — flat backgrounds read as software, light + grain reads as film.
 */
export const Stage: React.FC<{
  theme: Theme;
  guides?: boolean;
  children: React.ReactNode;
}> = ({ theme, guides, children }) => {
  const frame = useCurrentFrame();
  const t = frame * 0.006;

  const gx = 50 + noise2D("gx", t, 0) * 22;
  const gy = 36 + noise2D("gy", 0, t) * 10;
  const hx = 50 + noise2D("hx", t, 3) * 30;
  const hy = 72 + noise2D("hy", 3, t) * 8;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(130% 85% at 50% 40%, ${theme.bgMid} 0%, ${theme.bg} 72%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 34% at ${gx}% ${gy}%, ${theme.accent}${theme.light ? "26" : "30"} 0%, transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(48% 26% at ${hx}% ${hy}%, ${theme.accentLight}${theme.light ? "20" : "16"} 0%, transparent 72%)`,
        }}
      />
      {children}
      <svg
        width={W}
        height={H}
        style={{
          position: "absolute",
          inset: 0,
          opacity: theme.light ? 0.2 : 0.17,
          mixBlendMode: theme.light ? "multiply" : "overlay",
          pointerEvents: "none",
        }}
      >
        <filter id="grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="2"
            seed={Math.floor(frame / 2)}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 62% at 50% 46%, transparent 52%, rgba(0,0,0,${theme.light ? 0.28 : 0.6}) 100%)`,
          pointerEvents: "none",
        }}
      />
      {guides ? <Guides /> : null}
    </AbsoluteFill>
  );
};

import React from "react";
import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from "@remotion/transitions";
import { H, W } from "../config";

/**
 * Three custom presentations. All are driven by `presentationProgress`
 * (0 → 1) so they stay frame-accurate in preview and in render.
 */

// 1 ── INK WIPE: the next scene is revealed from the bottom with a soft,
//      feathered edge and a thin accent line riding the edge.
type InkProps = { accent: string };
const InkWipe: React.FC<TransitionPresentationComponentProps<InkProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  if (presentationDirection === "exiting") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateY(${-p * 70}px) scale(${1 + p * 0.05})`,
          filter: `brightness(${1 - p * 0.45})`,
        }}
      >
        {children}
      </div>
    );
  }
  const soft = 14;
  const pos = p * (100 + soft);
  const mask = `linear-gradient(to top, #000 ${pos - soft}%, transparent ${pos}%)`;
  const edge = 100 - (pos - soft / 2);
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${edge}%`,
          height: 3,
          background: passedProps.accent,
          opacity: p > 0.02 && p < 0.97 ? 0.9 : 0,
          boxShadow: `0 0 28px 6px ${passedProps.accent}`,
        }}
      />
    </div>
  );
};
export const inkWipe = (accent: string): TransitionPresentation<InkProps> => ({
  component: InkWipe,
  props: { accent },
});

// 2 ── BLUR PUSH: outgoing scene pushes past camera into blur, incoming
//      resolves out of blur — a soft "rack focus" cut.
const BlurPush: React.FC<
  TransitionPresentationComponentProps<Record<string, never>>
> = ({ children, presentationDirection, presentationProgress: p }) => {
  const entering = presentationDirection === "entering";
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: entering ? p : 1 - Math.max(0, p - 0.35) * 1.5,
        transform: `scale(${entering ? 0.9 + p * 0.1 : 1 + p * 0.16})`,
        filter: `blur(${(entering ? 1 - p : p) * 26}px)`,
      }}
    >
      {children}
    </div>
  );
};
export const blurPush = (): TransitionPresentation<Record<string, never>> => ({
  component: BlurPush,
  props: {},
});

// 3 ── SLATS: seven horizontal blinds open in a staggered cascade.
const Slats: React.FC<
  TransitionPresentationComponentProps<Record<string, never>>
> = ({ children, presentationDirection, presentationProgress: p }) => {
  if (presentationDirection === "exiting") {
    return (
      <div style={{ position: "absolute", inset: 0, transform: `scale(${1 - p * 0.04})` }}>
        {children}
      </div>
    );
  }
  const N = 7;
  const h = H / N;
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const d = Array.from({ length: N }, (_, k) => {
    const q = Math.min(1, Math.max(0, p * 1.6 - k * 0.1));
    const y0 = k * h;
    return `M0 ${y0} H${W} V${y0 + h * ease(q)} H0 Z`;
  }).join(" ");
  return (
    <div style={{ position: "absolute", inset: 0, clipPath: `path('${d}')` }}>
      {children}
    </div>
  );
};
export const slats = (): TransitionPresentation<Record<string, never>> => ({
  component: Slats,
  props: {},
});

import React, { useId } from "react";

type Props = {
  /** Horizontal speed in px/frame (any sign). */
  vx?: number;
  /** Vertical speed in px/frame (any sign). */
  vy?: number;
  /** 0.5 = a 180° shutter, the classic filmic look. */
  shutter?: number;
  max?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/**
 * Real directional motion blur, driven by velocity: the faster the element
 * moves this frame, the longer the smear — and only along its direction of
 * travel. It is an SVG anisotropic Gaussian blur, so it is deterministic
 * (renders identically on every frame) and does not touch RTL layout.
 */
export const MotionBlur: React.FC<Props> = ({
  vx = 0,
  vy = 0,
  shutter = 0.5,
  max = 56,
  style,
  children,
}) => {
  const id = "mb" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const bx = Math.min(Math.abs(vx) * shutter, max);
  const by = Math.min(Math.abs(vy) * shutter, max);
  const active = bx > 0.25 || by > 0.25;

  return (
    <>
      {active ? (
        <svg
          width="0"
          height="0"
          style={{ position: "absolute" }}
          aria-hidden="true"
        >
          <defs>
            <filter
              id={id}
              filterUnits="userSpaceOnUse"
              x="-1500"
              y="-1500"
              width="4000"
              height="4000"
              colorInterpolationFilters="sRGB"
            >
              <feGaussianBlur stdDeviation={`${bx} ${by}`} />
            </filter>
          </defs>
        </svg>
      ) : null}
      <div style={{ ...style, filter: active ? `url(#${id})` : undefined }}>
        {children}
      </div>
    </>
  );
};

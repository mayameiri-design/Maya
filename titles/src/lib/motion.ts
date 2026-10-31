import { Easing, interpolate } from "remotion";

// Studio-grade curves. Linear motion is what makes templates look cheap.
export const EXPO_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const SOFT_OUT = Easing.bezier(0.22, 1, 0.36, 1);
export const POWER_IN_OUT = Easing.bezier(0.76, 0, 0.24, 1);
export const EXPO_IN_OUT = Easing.bezier(0.87, 0, 0.13, 1);

export const prog = (
  frame: number,
  start: number,
  duration: number,
  easing: (t: number) => number = EXPO_OUT,
) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

import React from "react";
import { FONT } from "../fonts";
import type { Theme } from "../config";
import { dirAttrs } from "../lib/text";

/** Small supporting line. Latin gets wide-tracked caps; Hebrew stays natural. */
export const Sub: React.FC<{
  text: string;
  rtl: boolean;
  theme: Theme;
  size?: number;
  opacity: number;
  y: number;
}> = ({ text, rtl, theme, size = 40, opacity, y }) => {
  const ls = rtl ? 0.1 : 0.36;
  return (
    <div
      {...dirAttrs(rtl)}
      style={{
        fontFamily: FONT.sans,
        fontWeight: 400,
        fontSize: size,
        letterSpacing: `${ls}em`,
        marginInlineEnd: `${-ls}em`, // cancel the trailing space so it stays centred
        textTransform: rtl ? "none" : "uppercase",
        color: theme.dim,
        opacity,
        transform: `translateY(${y}px)`,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </div>
  );
};

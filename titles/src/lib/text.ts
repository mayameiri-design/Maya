const RTL_CHARS = /[֐-ࣿיִ-﷿ﹰ-﻿]/;

/**
 * Decide direction by counting WORDS, not by looking at the first letter —
 * a Hebrew line that starts with a Latin brand name is still an RTL line.
 */
export const isRtlText = (input: string | string[]): boolean => {
  const words = (Array.isArray(input) ? input.join(" ") : input)
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return false;
  return words.filter((w) => RTL_CHARS.test(w)).length > words.length / 2;
};

export const splitWords = (line: string): string[] =>
  line.trim().split(/\s+/).filter(Boolean);

/** Grapheme clusters keep niqqud/cantillation marks attached to their letter. */
export const graphemes = (s: string): string[] => {
  const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(seg.segment(s), (x) => x.segment);
};

/** Props to put on any element that holds a line of text. */
export const dirAttrs = (rtl: boolean) =>
  ({ dir: rtl ? "rtl" : "ltr", lang: rtl ? "he" : "en" }) as const;

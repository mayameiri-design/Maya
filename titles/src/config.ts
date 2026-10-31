// Vertical 9:16 canvas for Instagram Reels / Stories / TikTok.
export const W = 1080;
export const H = 1920;
export const FPS = 30;

// Instagram Reels UI covers the top (~220px), the bottom caption/profile area
// (~400px) and a right-hand icon column (~120px). Titles live inside this box.
export const SAFE = { top: 230, bottom: 420, side: 90 } as const;
export const CONTENT_W = W - SAFE.side * 2; // 900

export type Theme = {
  bg: string;
  bgMid: string;
  text: string;
  dim: string;
  accent: string;
  accentLight: string;
  accentDeep: string;
  onAccent: string;
  light: boolean;
};

export const THEMES = {
  noir: {
    bg: "#07070a", bgMid: "#18151d", text: "#f3ede2", dim: "#b4aa99",
    accent: "#c9a46b", accentLight: "#f1d9a8", accentDeep: "#4a3820",
    onAccent: "#0a0907", light: false,
  },
  ember: {
    bg: "#0b0405", bgMid: "#2d0f0e", text: "#fff1e8", dim: "#d8a38d",
    accent: "#ff5a36", accentLight: "#ffb48c", accentDeep: "#4d1107",
    onAccent: "#140503", light: false,
  },
  ice: {
    bg: "#04070d", bgMid: "#102038", text: "#eaf2ff", dim: "#8ba4c8",
    accent: "#7fb0ff", accentLight: "#d9e8ff", accentDeep: "#122a52",
    onAccent: "#04070d", light: false,
  },
  paper: {
    bg: "#e4ddd0", bgMid: "#f7f2e8", text: "#121212", dim: "#5c564c",
    accent: "#b3261e", accentLight: "#e9604f", accentDeep: "#3d0c09",
    onAccent: "#fff6ee", light: true,
  },
} as const satisfies Record<string, Theme>;

export type ThemeName = keyof typeof THEMES;

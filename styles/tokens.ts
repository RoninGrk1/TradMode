/**
 * TradMode design tokens (TS mirror of styles/tokens.css).
 * Use for programmatic theming and Figma variable sync docs.
 * Keep in sync with styles/tokens.css — same names without the --tm- prefix nesting.
 */

export const tokens = {
  color: {
    bgDeep: "#050a14",
    bgBase: "#0a1220",
    bgElevated: "#0f1a2e",
    bgGlass: "rgba(15, 28, 52, 0.55)",
    bgGlassStrong: "rgba(12, 24, 48, 0.78)",
    chrome: "#c8d4e8",
    chromeBright: "#e8eef8",
    chromeDim: "#7a8ba8",
    blue50: "#e8f1ff",
    blue100: "#c5dbff",
    blue200: "#8fb8ff",
    blue300: "#5a96ff",
    blue400: "#3b82f6",
    blue500: "#2563eb",
    blue600: "#1d4ed8",
    blue700: "#1e3a8a",
    blueGlow: "rgba(59, 130, 246, 0.45)",
    yes: "#22c55e",
    yesBg: "rgba(34, 197, 94, 0.15)",
    no: "#ef4444",
    noBg: "rgba(239, 68, 68, 0.15)",
    warn: "#f59e0b",
    warnBg: "rgba(245, 158, 11, 0.15)",
    text: "#e8eef8",
    textMuted: "#8fa0b8",
    textDim: "#5c6d88",
    border: "rgba(200, 212, 232, 0.12)",
    borderStrong: "rgba(200, 212, 232, 0.28)",
    focus: "#3b82f6",
  },
  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },
  blur: {
    sm: 8,
    md: 16,
    lg: 28,
    xl: 40,
  },
  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
  },
} as const;

export type Tokens = typeof tokens;

/** Figma Variable collection mapping notes */
export const figmaSyncNotes = {
  collections: [
    "Color / TradMode",
    "Radius / TradMode",
    "Blur / TradMode",
    "Spacing / TradMode",
  ],
  cssFile: "styles/tokens.css",
  tsFile: "styles/tokens.ts",
  convention: "CSS vars use --tm-{collection}-{name}; Figma vars use tm/{collection}/{name}",
} as const;

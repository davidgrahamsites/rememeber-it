// Minimal shared design tokens. (A full packages/ui design system is a later phase.)
export const theme = {
  color: {
    bg: "#0f1020",
    surface: "#1b1d36",
    surfaceAlt: "#26294a",
    primary: "#6c5ce7",
    primaryText: "#ffffff",
    accent: "#00d2a8",
    text: "#f4f5ff",
    textDim: "#a6a9c8",
    correct: "#2ecc71",
    wrong: "#ff6b6b",
    border: "#33375f",
    locked: "#3a3d5c",
  },
  radius: { sm: 8, md: 14, lg: 22, pill: 999 },
  space: (n: number) => n * 8,
  font: { title: 30, h2: 22, body: 16, small: 13, prompt: 64 },
} as const;

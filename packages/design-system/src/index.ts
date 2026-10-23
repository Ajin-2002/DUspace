export const designTokens = {
  color: {
    canvas: "#f4f4f5",
    surface: "#ffffff",
    surfaceMuted: "#f8fafc",
    ink: "#111827",
    muted: "#64748b",
    border: "#e2e8f0",
    graphite: "#111827",
    blue: "#2563eb",
    violet: "#7c3aed",
    success: "#059669",
    warning: "#d97706",
    danger: "#dc2626",
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
    size: { xs: "0.75rem", sm: "0.875rem", md: "1rem", lg: "1.125rem", xl: "1.5rem", display: "2rem" },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  },
  spacing: { 0: "0", 1: "0.25rem", 2: "0.5rem", 3: "0.75rem", 4: "1rem", 5: "1.25rem", 6: "1.5rem", 8: "2rem", 10: "2.5rem", 12: "3rem" },
  radius: { sm: "0.5rem", md: "0.75rem", lg: "1rem", xl: "1.25rem", pill: "9999px" },
  shadow: { card: "0 1px 3px rgb(15 23 42 / 0.08)", elevated: "0 16px 40px rgb(15 23 42 / 0.12)" },
  breakpoint: { mobile: "640px", tablet: "768px", desktop: "1024px", wide: "1280px" },
  state: { focusRing: "0 0 0 3px rgb(59 130 246 / 0.28)", transition: "160ms ease" },
  theme: { modes: ["light", "dark"] as const, default: "light" as const },
} as const;

export type DesignTokens = typeof designTokens;
export type DesignAccent = "graphite" | "blue" | "violet";
export type DesignDensity = "comfortable" | "compact";

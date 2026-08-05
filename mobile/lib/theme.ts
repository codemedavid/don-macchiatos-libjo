/**
 * Design tokens for the mobile app, mirrored from the website's Tailwind
 * palette (tailwind.config.js) and typography so both products share one
 * brand. Keep values in sync with the web `cream` / `beige` / `espresso`
 * scales; the theme contract test guards the key brand colors.
 */

export const colors = {
  // Surfaces
  screenBg: "#faf8f5", // cream-50
  card: "#ffffff",
  cardMuted: "#f5f0ea", // cream-100
  border: "#e8e4dd", // beige-200

  // Text
  textPrimary: "#3d2e24", // espresso-900
  textSecondary: "#654c3b", // espresso-700
  textMuted: "#817464", // beige-700
  textFaint: "#9c8f7a", // beige-600

  // Actions
  primary: "#1a1a1a", // black CTA, matching the website
  onPrimary: "#ffffff",
  accent: "#7a5f4a", // espresso-600 for links / secondary accents

  // Status / feedback
  danger: "#b91c1c",
  dangerBg: "#fee2e2",
  success: "#3d2e24", // prices render in espresso, like the website
  warning: "#a07a56", // cream-600
} as const;

/**
 * Status pill colors, warmed to sit on the cream palette instead of the old
 * cold blue/indigo set.
 */
export const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#f5e6c8", text: "#7a5320" },
  confirmed: { bg: "#e8e0f0", text: "#4a3b66" },
  preparing: { bg: "#e6ddf5", text: "#3730a3" },
  ready: { bg: "#d8ecd8", text: "#1f5f2e" },
  completed: { bg: "#ede8e3", text: "#503c2f" },
  cancelled: { bg: "#fde0e0", text: "#991b1b" },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  pill: 999,
  card: 16,
  button: 14,
  badge: 12,
} as const;

export const fonts = {
  headline: "PlayfairDisplay_600SemiBold",
  headlineRegular: "PlayfairDisplay_400Regular",
  body: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodySemiBold: "Manrope_600SemiBold",
} as const;

export const shadow = {
  card: {
    shadowColor: "#3d2e24",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

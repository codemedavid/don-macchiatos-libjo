import { colors, spacing, radius, fonts } from "../lib/theme";

/**
 * Contract test: the mobile theme must mirror the website's Tailwind palette
 * (tailwind.config.js) so the two products look like one brand.
 */
describe("theme brand tokens", () => {
  it("uses the website cream-50 as the screen background", () => {
    expect(colors.screenBg).toBe("#faf8f5");
  });

  it("uses white cards like the website", () => {
    expect(colors.card).toBe("#ffffff");
  });

  it("uses beige-200 for card borders like the website header", () => {
    expect(colors.border).toBe("#e8e4dd");
  });

  it("uses espresso-900 for primary text", () => {
    expect(colors.textPrimary).toBe("#3d2e24");
  });

  it("uses beige-700 for muted text", () => {
    expect(colors.textMuted).toBe("#817464");
  });

  it("uses a black primary CTA with white text like the website", () => {
    expect(colors.primary).toBe("#1a1a1a");
    expect(colors.onPrimary).toBe("#ffffff");
  });

  it("exposes a consistent spacing scale", () => {
    expect(spacing.md).toBe(16);
  });

  it("exposes a card radius", () => {
    expect(radius.card).toBe(16);
  });

  it("names the website serif + body font families", () => {
    expect(fonts.headline).toBe("PlayfairDisplay_600SemiBold");
    expect(fonts.body).toBe("Manrope_400Regular");
  });
});

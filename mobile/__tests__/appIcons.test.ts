import path from "path";

// jimp-compact ships no type declarations; it is pulled in via @expo/image-utils.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Jimp = require("jimp-compact");

/**
 * Contract test: the launcher/splash assets must carry the Don Macchiatos brand
 * mark, not Expo's stock placeholder, and must satisfy the platform rules that
 * are otherwise only discovered after a 20-minute EAS build.
 *
 * These run in CI before the APK build (see .github/workflows/android-apk.yml),
 * so a placeholder icon can never ship again.
 */

const ASSETS = path.join(__dirname, "..", "assets");

/** Android adaptive icons are 108dp; only the centre 66dp circle is safe from masking. */
const ADAPTIVE_SAFE_RATIO = 66 / 108;

/** Below this luminance a pixel counts as the logo's black line art. */
const INK_LUMINANCE_MAX = 100;

/** The mark is line art, so it covers a small but non-trivial share of the canvas. */
const MIN_INK_RATIO = 0.015;

type Analysis = {
  width: number;
  height: number;
  hasTransparency: boolean;
  isFullyOpaque: boolean;
  inkRatio: number;
  /** Distance from centre of the furthest visible pixel, as a fraction of width. */
  contentRadiusRatio: number;
};

async function analyze(file: string): Promise<Analysis> {
  const img = await Jimp.read(path.join(ASSETS, file));
  const { width, height, data } = img.bitmap;

  const cx = width / 2;
  const cy = height / 2;

  let transparent = 0;
  let ink = 0;
  let maxRadius = 0;

  img.scan(0, 0, width, height, (x: number, y: number, idx: number) => {
    const [r, g, b, a] = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];

    if (a < 255) transparent += 1;
    if (a === 0) return;

    // Rec. 601 luma — good enough to separate black line art from cream/grey.
    if (0.299 * r + 0.587 * g + 0.114 * b <= INK_LUMINANCE_MAX) ink += 1;

    const radius = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (radius > maxRadius) maxRadius = radius;
  });

  const pixels = width * height;
  return {
    width,
    height,
    hasTransparency: transparent > 0,
    isFullyOpaque: transparent === 0,
    inkRatio: ink / pixels,
    contentRadiusRatio: maxRadius / width,
  };
}

describe("app icon assets carry the brand mark", () => {
  it("renders the logo's black line art in the launcher icon", async () => {
    const icon = await analyze("icon.png");

    expect(icon.inkRatio).toBeGreaterThan(MIN_INK_RATIO);
  });

  it("renders the logo's black line art in the Android adaptive icon", async () => {
    const adaptive = await analyze("adaptive-icon.png");

    expect(adaptive.inkRatio).toBeGreaterThan(MIN_INK_RATIO);
  });

  it("renders the logo's black line art in the splash icon", async () => {
    const splash = await analyze("splash-icon.png");

    expect(splash.inkRatio).toBeGreaterThan(MIN_INK_RATIO);
  });
});

describe("app icon assets satisfy platform requirements", () => {
  it("ships a 1024x1024 launcher icon", async () => {
    const icon = await analyze("icon.png");

    expect([icon.width, icon.height]).toEqual([1024, 1024]);
  });

  it("keeps the launcher icon fully opaque, as the App Store requires", async () => {
    const icon = await analyze("icon.png");

    expect(icon.isFullyOpaque).toBe(true);
  });

  it("ships a 1024x1024 adaptive icon", async () => {
    const adaptive = await analyze("adaptive-icon.png");

    expect([adaptive.width, adaptive.height]).toEqual([1024, 1024]);
  });

  it("leaves the adaptive icon transparent so the configured background shows through", async () => {
    const adaptive = await analyze("adaptive-icon.png");

    expect(adaptive.hasTransparency).toBe(true);
  });

  it("keeps every adaptive icon pixel inside Android's 66dp safe circle", async () => {
    const adaptive = await analyze("adaptive-icon.png");

    expect(adaptive.contentRadiusRatio).toBeLessThanOrEqual(ADAPTIVE_SAFE_RATIO / 2);
  });

  it("ships a square favicon", async () => {
    const favicon = await analyze("favicon.png");

    expect(favicon.width).toBe(favicon.height);
  });
});

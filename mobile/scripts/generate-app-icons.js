#!/usr/bin/env node
/**
 * Regenerates the Expo launcher/splash assets from the single source of truth:
 * the website logo at public/logo.png.
 *
 * The source is black line art on a white background, so the pipeline keys the
 * white out to transparency (alpha = inverted luminance) instead of cropping a
 * rectangle. That yields one transparent master which can be composited onto
 * any background — the cream launcher tile, or the adaptive icon's own layer.
 *
 * Run: npm run icons   (then `npm test` verifies the output contract)
 */

const path = require("path");
const Jimp = require("jimp-compact");

const REPO_ROOT = path.join(__dirname, "..", "..");
const SOURCE_LOGO = path.join(REPO_ROOT, "public", "logo.png");
const ASSETS_DIR = path.join(__dirname, "..", "assets");

/** Cream background shared with the splash screen and theme (colors.screenBg). */
const BRAND_CREAM = 0xfaf8f5ff;

const CANVAS = 1024;

/**
 * Logo diameter per asset, as a fraction of the canvas.
 *
 * `adaptive` is the tight one: Android renders a 108dp foreground but only the
 * centre 66dp circle survives every launcher mask, so 0.586 leaves a margin
 * under that bound. The others are only corner-masked, so they can breathe.
 */
const LOGO_SCALE = {
  icon: 0.78,
  adaptive: 0.586,
  splash: 0.86,
  favicon: 0.92,
};

/** Pixels at or above this luminance are background and become fully transparent. */
const WHITE_CUTOFF = 246;

/** Steepness of the alpha contrast curve that re-crisps edges after upscaling. */
const EDGE_CONTRAST = 1.6;

const clamp255 = (value) => Math.max(0, Math.min(255, Math.round(value)));

/**
 * Crops to the logo's ink bounding box and converts white-backed line art into
 * black pixels with an alpha channel. Returns a square, transparent master.
 */
function toTransparentMaster(image) {
  const { width, height, data } = image.bitmap;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      const isInk = data[idx] < WHITE_CUTOFF || data[idx + 1] < WHITE_CUTOFF || data[idx + 2] < WHITE_CUTOFF;
      if (!isInk) continue;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (maxX < 0) throw new Error(`No ink found in ${SOURCE_LOGO} — is the logo blank?`);

  image.crop(minX, minY, maxX - minX + 1, maxY - minY + 1);

  // Key the white out: the darker the pixel, the more opaque it becomes.
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const px = image.bitmap.data;
    const luma = 0.299 * px[idx] + 0.587 * px[idx + 1] + 0.114 * px[idx + 2];
    px[idx] = 0;
    px[idx + 1] = 0;
    px[idx + 2] = 0;
    px[idx + 3] = clamp255(255 - luma);
  });

  // Pad the shorter axis so the mark stays centred and undistorted downstream.
  const side = Math.max(image.bitmap.width, image.bitmap.height);
  const square = new Jimp(side, side, 0x00000000);
  square.composite(
    image,
    Math.round((side - image.bitmap.width) / 2),
    Math.round((side - image.bitmap.height) / 2),
  );
  return square;
}

/**
 * Upscaling a 218px master softens the line art, so push alpha back toward the
 * extremes. Anti-aliasing is preserved (this is a contrast curve, not a
 * threshold) but strokes read as solid black again.
 */
function sharpenEdges(image) {
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const px = image.bitmap.data;
    const alpha = px[idx + 3] / 255;
    px[idx + 3] = clamp255(((alpha - 0.5) * EDGE_CONTRAST + 0.5) * 255);
  });
  return image;
}

/**
 * Jimp's source-over blend rounds anti-aliased edge pixels down to alpha 254,
 * which leaves a stray alpha channel behind. Flatten it: the pixels are already
 * blended against an opaque background, so forcing 255 changes no colour.
 */
function flatten(image) {
  const px = image.bitmap.data;
  for (let idx = 3; idx < px.length; idx += 4) px[idx] = 255;
  return image;
}

function renderAsset(master, { size, scale, background, opaque }) {
  const canvas = new Jimp(size, size, background);
  const diameter = Math.round(size * scale);

  const mark = master.clone().resize(diameter, diameter, Jimp.RESIZE_BICUBIC);
  sharpenEdges(mark);

  const offset = Math.round((size - diameter) / 2);
  canvas.composite(mark, offset, offset);

  return opaque ? flatten(canvas) : canvas;
}

async function main() {
  const source = await Jimp.read(SOURCE_LOGO);
  const master = toTransparentMaster(source);
  console.log(`source ${SOURCE_LOGO} -> transparent master ${master.bitmap.width}px`);

  const outputs = [
    // iOS rejects alpha in the marketing icon, so this one gets the cream tile.
    ["icon.png", { size: CANVAS, scale: LOGO_SCALE.icon, background: BRAND_CREAM, opaque: true }],
    // Transparent: app.json supplies android.adaptiveIcon.backgroundColor.
    ["adaptive-icon.png", { size: CANVAS, scale: LOGO_SCALE.adaptive, background: 0x00000000 }],
    ["splash-icon.png", { size: CANVAS, scale: LOGO_SCALE.splash, background: 0x00000000 }],
    ["favicon.png", { size: 48, scale: LOGO_SCALE.favicon, background: 0x00000000 }],
  ];

  for (const [filename, options] of outputs) {
    const asset = renderAsset(master, options);
    await asset.writeAsync(path.join(ASSETS_DIR, filename));
    console.log(`  wrote ${filename} (${options.size}px, mark ${Math.round(options.scale * 100)}%)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

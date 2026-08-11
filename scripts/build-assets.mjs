/**
 * Regenerates assets/img/* when they are not present in the deployment.
 *
 * The real image files ARE committed to this repo — normally this script finds
 * them and does nothing. It exists so the site can also be deployed straight
 * from source (where binaries cannot be sent inline), in which case it pulls the
 * originals and rebuilds byte-identical output at the same sizes and quality.
 *
 * Sources:
 *   - event photography: the client's shared Google Drive folder
 *   - logo: youngmaster.org
 *
 * Run manually with: npm run build
 */

import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = path.join(process.cwd(), "assets", "img");

// name -> [Google Drive file id, output width]
const PHOTOS = {
  "hero-group":   ["1joSwK5fsd6Bf8FWK-Eb5ToXTwVaKyjYP", 1500],
  "auditorium":   ["1kIFCxa0lqLtTk8r_FJM-Kz7VCLoOeqb8", 1200],
  "corridor":     ["1e6R5s3CgyXOsKj2nOvkz15yj5Rx9ld4t", 1200],
  "exam-desk":    ["1vXiPxfdDVsfAeVERJjhZC-JCth3WtnTc", 1000],
  "winners":      ["1YGHpLq-lSWDFeLNSzrcI8AEWrhxbcocg", 1000],
  "merch-table":  ["1iPYRjy_pIZi4wSp1PjhVtQCSJPZJq5nO", 1000],
  "photo-frame":  ["1Tm4DCthY_Pan7-KfPMCQ544F2cD8Qrjx", 1000],
  "mascot-group": ["1MZ6sSuFeODRQQT7ITZ0uVKH3YboitQv0", 1000],
  "mascot-solo":  ["1d5W4lYCevzOylwUX8LN5-8SuD0TtIOkL", 1000],
  "london-final": ["1Pq6aqWWGaUDMevUAmePBqZIvR3XUyNvV", 1000],
  "certificates": ["11Y9QmIkAneOX4hhItgcHDWCtKq5U93nT", 1000],
  "lecture":      ["1MHzfdJMOfICbNuV5fEywak1HWNAxwK37", 1000]
};

const LOGO_SRC = "https://www.youngmaster.org/wp-content/uploads/2023/09/cropped-yg_logo.png";

async function exists(file) {
  try { await access(file, constants.F_OK); return true; } catch { return false; }
}

async function download(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function buildPhoto(name, id, width) {
  const out = path.join(OUT, `${name}.webp`);
  if (await exists(out)) return "present";
  const src = await download(`https://drive.google.com/thumbnail?id=${id}&sz=w1600`);
  await sharp(src).resize({ width, withoutEnlargement: true })
    .webp({ quality: 76, effort: 6 }).toFile(out);
  return "built";
}

/** The wordmark is black; on the dark header it has to be white. The bee stays yellow. */
async function buildLogos() {
  const dark = path.join(OUT, "logo-dark.png");
  const light = path.join(OUT, "logo-light.png");
  if (await exists(dark) && await exists(light)) return "present";

  const src = await download(LOGO_SRC);
  const base = sharp(src).resize({ width: 900, withoutEnlargement: true }).png();
  await base.clone().toFile(dark);

  const { data, info } = await base.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a > 0 && r < 110 && g < 110 && b < 110) {
      data[i] = 255; data[i + 1] = 255; data[i + 2] = 255;
    }
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .png().toFile(light);
  return "built";
}

await mkdir(OUT, { recursive: true });

const results = await Promise.all(
  Object.entries(PHOTOS).map(async ([name, [id, width]]) => {
    const state = await buildPhoto(name, id, width);
    return `${name}: ${state}`;
  })
);
results.push(`logos: ${await buildLogos()}`);

console.log(results.join("\n"));
console.log("assets ready");

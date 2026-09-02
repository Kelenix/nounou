// Génère des icônes PWA placeholder (carré vert #2E9E1F avec un cercle clair)
// sans dépendance externe. Remplacer par le vrai logo plus tard.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function png(size, draw) {
  const bytesPerPixel = 4;
  const raw = Buffer.alloc(size * (size * bytesPerPixel + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * bytesPerPixel + 1)] = 0; // filtre none
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = draw(x, y, size);
      const off = y * (size * bytesPerPixel + 1) + 1 + x * bytesPerPixel;
      raw[off] = r; raw[off + 1] = g; raw[off + 2] = b; raw[off + 3] = a;
    }
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const GREEN = [46, 158, 31, 255];
const SOFT = [232, 245, 228, 255];

function drawIcon(x, y, size) {
  const cx = size / 2, cy = size / 2;
  const d = Math.hypot(x - cx, y - cy);
  // cercle clair central sur fond vert
  return d < size * 0.28 ? SOFT : GREEN;
}

for (const [name, size] of [["icon-192", 192], ["icon-512", 512], ["maskable-512", 512]]) {
  writeFileSync(join(outDir, `${name}.png`), png(size, drawIcon));
  console.log("écrit", `${name}.png`);
}

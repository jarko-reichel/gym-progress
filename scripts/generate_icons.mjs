// Generates simple PWA icons (192/512) and favicon as solid teal squares with a "GP" monogram.
// Uses a tiny PNG encoder so it has zero native deps.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function writePng(filePath, width, height, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8);
  ihdr.writeUInt8(6, 9);
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);
  const rowSize = width * 4;
  const raw = Buffer.alloc((rowSize + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowSize + 1)] = 0;
    pixels.copy(raw, y * (rowSize + 1) + 1, y * rowSize, y * rowSize + rowSize);
  }
  const idatData = zlib.deflateSync(raw);
  const png = Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(filePath, png);
}

function makeIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  const teal = [15, 118, 110, 255]; // #0f766e
  const orange = [249, 115, 22, 255]; // #f97316
  const white = [255, 255, 255, 255];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      // background
      let c = teal;
      // simple bar chart shapes
      const margin = Math.floor(size * 0.18);
      const barW = Math.floor(size * 0.12);
      const gap = Math.floor(size * 0.06);
      const baseY = size - margin;
      const xs = [margin, margin + barW + gap, margin + 2 * (barW + gap), margin + 3 * (barW + gap)];
      const heights = [0.25, 0.45, 0.65, 0.85];
      for (let i = 0; i < xs.length; i++) {
        const bx = xs[i];
        const bh = Math.floor(size * heights[i]);
        if (x >= bx && x < bx + barW && y >= baseY - bh && y <= baseY) {
          c = i === xs.length - 1 ? orange : white;
        }
      }
      buf[idx] = c[0];
      buf[idx + 1] = c[1];
      buf[idx + 2] = c[2];
      buf[idx + 3] = c[3];
    }
  }
  return buf;
}

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });
[192, 512].forEach((s) => {
  writePng(path.join(outDir, `icon-${s}.png`), s, s, makeIcon(s));
  console.log(`wrote icon-${s}.png`);
});
// favicon.svg
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0f766e"/><g fill="#fff"><rect x="12" y="40" width="6" height="14"/><rect x="22" y="32" width="6" height="22"/><rect x="32" y="22" width="6" height="32"/></g><rect x="42" y="12" width="6" height="42" fill="#f97316"/></svg>`;
fs.writeFileSync(path.resolve(here, '..', 'public', 'favicon.svg'), svg);
console.log('wrote favicon.svg');

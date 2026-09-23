const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function createPNG(w, h, getPixel) {
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const toCrc = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, toCrc, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawRows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(1 + w * 4);
    row[0] = 0; // Filter: None
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = getPixel(x, y, w, h);
      const idx = 1 + x * 4;
      row[idx] = r;
      row[idx + 1] = g;
      row[idx + 2] = b;
      row[idx + 3] = a;
    }
    rawRows.push(row);
  }
  const uncompressed = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(uncompressed, { level: 9 });
  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

// Helper: signed distance to rounded box
function sdRoundRect(px, py, bx, by, bw, bh, r) {
  const cx = bx + bw / 2;
  const cy = by + bh / 2;
  const dx = Math.abs(px - cx) - (bw / 2 - r);
  const dy = Math.abs(py - cy) - (bh / 2 - r);
  const outside = Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
  const inside = Math.min(Math.max(dx, dy), 0);
  return outside + inside - r;
}

// Letter rasterizers for 'A' and 'O'
function inLetterA(px, py, bx, by, bw, bh) {
  const relX = (px - bx) / bw;
  const relY = (py - by) / bh;
  if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return false;
  // Left leg
  const leftCenter = 0.5 - (1 - relY) * 0.35;
  if (Math.abs(relX - leftCenter) < 0.11) return true;
  // Right leg
  const rightCenter = 0.5 + (1 - relY) * 0.35;
  if (Math.abs(relX - rightCenter) < 0.11) return true;
  // Crossbar
  if (relY >= 0.54 && relY <= 0.72 && relX >= leftCenter && relX <= rightCenter) return true;
  // Top apex
  if (relY <= 0.22 && Math.abs(relX - 0.5) <= 0.16) return true;
  return false;
}

function inLetterO(px, py, bx, by, bw, bh) {
  const relX = (px - bx) / bw;
  const relY = (py - by) / bh;
  if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return false;
  const dx = (relX - 0.5) / 0.44;
  const dy = (relY - 0.5) / 0.48;
  const dist = Math.hypot(dx, dy);
  return dist <= 1.0 && dist >= 0.55;
}

function getIconPixel(isMaskable) {
  return function (x, y, w, h) {
    const nx = x / w;
    const ny = y / h;

    // Corner radius for standard app icon
    if (!isMaskable) {
      const cornerR = w * 0.22;
      const dOut = sdRoundRect(x, y, 0, 0, w, h, cornerR);
      if (dOut > 1.0) return [0, 0, 0, 0];
      if (dOut > 0.0) {
        const alpha = Math.floor(255 * (1 - dOut));
        return [28, 25, 23, alpha];
      }
    }

    // Base background gradient: dark slate (#1c1917 -> #09090b)
    let bgR = Math.floor(28 - ny * 18);
    let bgG = Math.floor(25 - ny * 16);
    let bgB = Math.floor(23 - ny * 13);

    // Subtle radial purple ambient glow from top-right
    const glowDist = Math.hypot(nx - 0.8, ny - 0.2);
    if (glowDist < 0.9) {
      const glowFactor = (1 - glowDist / 0.9) * 0.35;
      bgR = Math.min(255, Math.floor(bgR + 147 * glowFactor));
      bgG = Math.min(255, Math.floor(bgG + 51 * glowFactor));
      bgB = Math.min(255, Math.floor(bgB + 234 * glowFactor));
    }

    // Scale coordinates for inner components
    const scale = isMaskable ? 0.82 : 1.0;
    const offX = isMaskable ? (w * (1 - scale)) / 2 : 0;
    const offY = isMaskable ? (h * (1 - scale)) / 2 : 0;
    const lx = (x - offX) / scale;
    const ly = (y - offY) / scale;

    // 1. Backing Carousel Card (tilted background slide)
    const backCardD = sdRoundRect(lx, ly, w * 0.34, h * 0.16, w * 0.44, h * 0.54, w * 0.05);
    if (backCardD <= 0) {
      bgR = 45;
      bgG = 40;
      bgB = 52;
    }

    // 2. Primary 4:5 Carousel Slide Card
    const cardX = w * 0.27;
    const cardY = h * 0.2;
    const cardW = w * 0.46;
    const cardH = h * 0.58;
    const cardD = sdRoundRect(lx, ly, cardX, cardY, cardW, cardH, w * 0.045);

    if (cardD <= 0) {
      // Inside main card: dark surface #27272a
      let cR = 39;
      let cG = 39;
      let cB = 42;

      // Card Header Purple pill
      const pillD = sdRoundRect(lx, ly, cardX + cardW * 0.1, cardY + cardH * 0.07, cardW * 0.35, cardH * 0.045, 6);
      if (pillD <= 0) {
        cR = 168;
        cG = 85;
        cB = 247;
      }

      // Card Media Box (Instagram 4:5 image container)
      const mediaX = cardX + cardW * 0.1;
      const mediaY = cardY + cardH * 0.16;
      const mediaW = cardW * 0.8;
      const mediaH = cardH * 0.46;
      const mediaD = sdRoundRect(lx, ly, mediaX, mediaY, mediaW, mediaH, 8);
      if (mediaD <= 0) {
        cR = 24;
        cG = 24;
        cB = 27;

        // Image sun/accent circle inside media
        const sunDist = Math.hypot(lx - (mediaX + mediaW * 0.3), ly - (mediaY + mediaH * 0.38));
        if (sunDist <= w * 0.04) {
          cR = 147;
          cG = 51;
          cB = 234;
        }
      }

      // Card text placeholder lines
      const line1D = sdRoundRect(lx, ly, cardX + cardW * 0.1, cardY + cardH * 0.68, cardW * 0.7, cardH * 0.035, 4);
      if (line1D <= 0) {
        cR = 244;
        cG = 244;
        cB = 245;
      }
      const line2D = sdRoundRect(lx, ly, cardX + cardW * 0.1, cardY + cardH * 0.76, cardW * 0.48, cardH * 0.03, 3);
      if (line2D <= 0) {
        cR = 161;
        cG = 161;
        cB = 170;
      }
      const line3D = sdRoundRect(lx, ly, cardX + cardW * 0.1, cardY + cardH * 0.83, cardW * 0.6, cardH * 0.03, 3);
      if (line3D <= 0) {
        cR = 113;
        cG = 113;
        cB = 122;
      }

      // Border outline of card
      if (cardD >= -2) {
        cR = 113;
        cG = 113;
        cB = 122;
      }

      bgR = cR;
      bgG = cG;
      bgB = cB;
    }

    // 3. Foreground Floating "AO" Monogram Badge
    const badgeX = w * 0.14;
    const badgeY = h * 0.54;
    const badgeW = w * 0.34;
    const badgeH = badgeW;
    const badgeD = sdRoundRect(lx, ly, badgeX, badgeY, badgeW, badgeH, badgeW * 0.28);

    if (badgeD <= 0) {
      // Purple gradient #9333ea -> #6366f1
      const bRelY = (ly - badgeY) / badgeH;
      let bR = Math.floor(147 * (1 - bRelY) + 99 * bRelY);
      let bG = Math.floor(51 * (1 - bRelY) + 102 * bRelY);
      let bB = Math.floor(234 * (1 - bRelY) + 241 * bRelY);

      // Inner subtle border
      if (badgeD >= -2) {
        bR = 216;
        bG = 180;
        bB = 254;
      }

      // Letters "A" and "O"
      const letterBoxW = badgeW * 0.38;
      const letterBoxH = badgeH * 0.52;
      const letterBoxY = badgeY + badgeH * 0.24;

      // Letter 'A' on left
      const aBoxX = badgeX + badgeW * 0.11;
      if (inLetterA(lx, ly, aBoxX, letterBoxY, letterBoxW, letterBoxH)) {
        bR = 255;
        bG = 255;
        bB = 255;
      }

      // Letter 'O' on right
      const oBoxX = badgeX + badgeW * 0.51;
      if (inLetterO(lx, ly, oBoxX, letterBoxY, letterBoxW, letterBoxH)) {
        bR = 255;
        bG = 255;
        bB = 255;
      }

      bgR = bR;
      bgG = bG;
      bgB = bB;
    }

    // Carousel dots indicator at bottom
    const dotsY = h * 0.88;
    const d1 = Math.hypot(lx - w * 0.44, ly - dotsY);
    const d2 = Math.hypot(lx - w * 0.5, ly - dotsY);
    const d3 = Math.hypot(lx - w * 0.56, ly - dotsY);
    if (d1 <= w * 0.016) {
      bgR = 168;
      bgG = 85;
      bgB = 247;
    } else if (d2 <= w * 0.016 || d3 <= w * 0.016) {
      bgR = 113;
      bgG = 113;
      bgB = 122;
    }

    return [bgR, bgG, bgB, 255];
  };
}

const publicDir = path.resolve(__dirname, '../public');

console.log('Generating PWA icons into:', publicDir);

// 1. pwa-192x192.png
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, getIconPixel(false)));
console.log('Generated pwa-192x192.png');

// 2. pwa-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, getIconPixel(false)));
console.log('Generated pwa-512x512.png');

// 3. pwa-maskable-512x512.png
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, getIconPixel(true)));
console.log('Generated pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180)
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, getIconPixel(false)));
console.log('Generated apple-touch-icon.png');

// 5. favicon.ico (32x32 PNG container)
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(32, 32, getIconPixel(false)));
console.log('Generated favicon.ico');

console.log('All PWA icons generated successfully!');

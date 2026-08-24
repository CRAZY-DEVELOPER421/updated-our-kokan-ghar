/**
 * Generate simple PWA PNG icons with Kokan Ghar branding.
 * Run: node scripts/generate-icons.js
 * Outputs: public/icons/icon-192x192.png and public/icons/icon-512x512.png
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function createPNG(width, height, r, g, b) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT - image data (all pixels = brand color)
  const rawRow = Buffer.alloc(1 + width * 3); // filter byte + RGB pixels
  rawRow[0] = 0; // no filter
  for (let x = 0; x < width; x++) {
    const offset = 1 + x * 3;
    rawRow[offset] = r;
    rawRow[offset + 1] = g;
    rawRow[offset + 2] = b;
  }
  const rawData = Buffer.alloc(height * rawRow.length);
  for (let y = 0; y < height; y++) {
    rawRow.copy(rawData, y * rawRow.length);
  }
  const compressed = zlib.deflateSync(rawData);

  // Build chunks
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const crcInput = Buffer.concat([typeBuf, data]);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(crcInput), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  // IEND chunk
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    iend,
  ]);
}

// Kokan Ghar brand green: #2D6A4F
const R = 0x2D, G = 0x6A, B = 0x4F;

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// Generate 192x192
const icon192 = createPNG(192, 192, R, G, B);
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.png'), icon192);
console.log(`✅ icon-192x192.png (${icon192.length} bytes)`);

// Generate 512x512
const icon512 = createPNG(512, 512, R, G, B);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.png'), icon512);
console.log(`✅ icon-512x512.png (${icon512.length} bytes)`);

console.log('\nDone! Update manifest.js to reference .png files.');

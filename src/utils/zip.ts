// src/utils/zip.ts
// Minimal ZIP builder (store only, no compression).
// Usage: const blob = makeZip([{ name: "a.txt", data: "hello" }]); // -> Blob "application/zip"

type ZipFile = { name: string; data: string | Uint8Array; date?: Date };

const te = new TextEncoder();

function toBytes(data: string | Uint8Array): Uint8Array {
  return typeof data === "string" ? te.encode(data) : data;
}

function dosTimeDate(d: Date) {
  const time =
    (d.getHours() << 11) |
    (d.getMinutes() << 5) |
    Math.floor(d.getSeconds() / 2);
  const date =
    ((d.getFullYear() - 1980) << 9) |
    ((d.getMonth() + 1) << 5) |
    d.getDate();
  return { time, date };
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function u16(n: number) {
  const b = new Uint8Array(2);
  const v = new DataView(b.buffer);
  v.setUint16(0, n, true);
  return b;
}
function u32(n: number) {
  const b = new Uint8Array(4);
  const v = new DataView(b.buffer);
  v.setUint32(0, n, true);
  return b;
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const len = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(len);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

export function makeZip(files: ZipFile[]): Blob {
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  files.forEach((f) => {
    const nameBytes = te.encode(f.name);
    const data = toBytes(f.data);
    const crc = crc32(data);
    const size = data.length;
    const dt = dosTimeDate(f.date ?? new Date());

    // Local file header
    const localHeader = concat([
      u32(0x04034b50), // signature
      u16(20),         // version needed
      u16(0),          // flags
      u16(0),          // method: 0 = store
      u16(dt.time),    // time
      u16(dt.date),    // date
      u32(crc),        // CRC-32
      u32(size),       // compressed size
      u32(size),       // uncompressed size
      u16(nameBytes.length),
      u16(0),          // extra length
      nameBytes,
    ]);

    chunks.push(localHeader, data);
    const localHeaderOffset = offset;
    offset += localHeader.length + data.length;

    // Central directory header
    const centralHeader = concat([
      u32(0x02014b50), // signature
      u16(20),         // version made by
      u16(20),         // version needed
      u16(0),          // flags
      u16(0),          // method
      u16(dt.time),
      u16(dt.date),
      u32(crc),
      u32(size),
      u32(size),
      u16(nameBytes.length),
      u16(0),          // extra length
      u16(0),          // file comment length
      u16(0),          // disk number start
      u16(0),          // internal attrs
      u32(0),          // external attrs
      u32(localHeaderOffset),
      nameBytes,
    ]);
    central.push(centralHeader);
  });

  const centralDir = concat(central);
  const end = concat([
    u32(0x06054b50), // EOCD signature
    u16(0),          // disk number
    u16(0),          // disk with central directory
    u16(files.length),
    u16(files.length),
    u32(centralDir.length),
    u32(offset),     // offset of start of central directory
    u16(0),          // comment length
  ]);

  const all = concat([...chunks, centralDir, end]);
  return new Blob([all], { type: "application/zip" });
}

// THE WORLD TODAY — Tuesday 17 November 2026.
// A one-page newspaper front page drawn pixel by pixel with the Node
// standard library only. No network, no randomness, no timestamps:
// the same run always writes the same bytes.
// Writes /output/entry.png (1024 x 1024, RGB PNG, under 1 MiB).
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const PAPER: RGB = [246, 241, 227];
const INK: RGB = [25, 25, 25];
const RED: RGB = [168, 35, 28];
const BLUE: RGB = [31, 78, 121];
const GREEN: RGB = [76, 122, 63];
const LAND: RGB = [111, 158, 87];
const SEA: RGB = [169, 201, 222];
const GREY: RGB = [107, 107, 107];
const RULE: RGB = [201, 194, 174];
const WHITE: RGB = [255, 255, 255];
const SKY: RGB = [58, 96, 140];
const SAND: RGB = [233, 220, 188];

type RGB = [number, number, number];

// ------------------------------------------------------------------- font
// A 5x7 pixel font, drawn from scratch for this page. Each glyph is seven
// rows of five cells. Only the characters the page needs are defined.
const FONT: Record<string, string[]> = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["###..", "#..#.", "#...#", "#...#", "#...#", "#..#.", "###.."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#..##", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", ".##..", ".#..."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", ".###.", ".....", ".....", "....."],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "(": ["...##", "..#..", ".#...", ".#...", ".#...", "..#..", "...##"],
  ")": ["##...", "..#..", "...#.", "...#.", "...#.", "..#..", "##..."],
  "%": ["#...#", "#..#.", "...#.", "..#..", ".#...", ".#..#", "#...#"],
  "&": [".##..", "#..#.", "#..#.", ".#...", "#.#.#", "#..#.", ".##.#"],
  "+": [".....", "..#..", "..#..", ".###.", "..#..", "..#..", "....."],
  "=": [".....", ".....", "#####", ".....", "#####", ".....", "....."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  $: ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
};

// ------------------------------------------------------------------ canvas
class Canvas {
  data: Buffer;
  constructor() {
    this.data = Buffer.alloc(W * H * 3);
    this.fill(PAPER);
  }
  fill(c: RGB): void {
    for (let i = 0; i < W * H; i++) {
      this.data[i * 3] = c[0];
      this.data[i * 3 + 1] = c[1];
      this.data[i * 3 + 2] = c[2];
    }
  }
  px(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) this.px(i, j, c);
    }
  }
  hline(x: number, y: number, w: number, c: RGB, t = 1): void {
    for (let k = 0; k < t; k++) this.rect(x, y + k, w, 1, c);
  }
  vline(x: number, y: number, h: number, c: RGB, t = 1): void {
    for (let k = 0; k < t; k++) this.rect(x + k, y, 1, h, c);
  }
  frame(x: number, y: number, w: number, h: number, c: RGB, t = 1): void {
    this.hline(x, y, w, c, t);
    this.hline(x, y + h - t, w, c, t);
    this.vline(x, y, h, c, t);
    this.vline(x + w - t, y, h, c, t);
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.px(x, y, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  disc(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) this.px(cx + x, cy + y, c);
      }
    }
  }
  ring(cx: number, cy: number, r: number, c: RGB): void {
    for (let a = 0; a < 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      this.px(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
    }
  }
  // Scanline fill for a simple polygon given as [x, y] points.
  poly(pts: Array<[number, number]>, c: RGB): void {
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }
    for (let y = Math.max(0, Math.ceil(minY)); y <= Math.min(H - 1, Math.floor(maxY)); y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
          const t = (y - a[1]) / (b[1] - a[1]);
          xs.push(a[0] + t * (b[0] - a[0]));
        }
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const x0 = Math.max(0, Math.ceil(xs[k]));
        const x1 = Math.min(W - 1, Math.floor(xs[k + 1]));
        for (let x = x0; x <= x1; x++) this.px(x, y, c);
      }
    }
  }
}

// ------------------------------------------------------------- text drawing
function textWidth(s: string, scale: number, bold: boolean): number {
  const adv = bold ? 7 : 6;
  return s.length * adv * scale - scale;
}

function drawText(
  cv: Canvas,
  s: string,
  x: number,
  y: number,
  scale: number,
  c: RGB,
  bold = false,
): void {
  const adv = (bold ? 7 : 6) * scale;
  let cx = x;
  const up = s.toUpperCase();
  for (const ch of up) {
    const g = FONT[ch] ?? FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "#") {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              cv.px(cx + col * scale + dx, y + r * scale + dy, c);
              if (bold) cv.px(cx + col * scale + dx + 1, y + r * scale + dy, c);
            }
          }
        }
      }
    }
    cx += adv;
  }
}

function drawTextCentered(
  cv: Canvas,
  s: string,
  cx: number,
  y: number,
  scale: number,
  c: RGB,
  bold = false,
): void {
  drawText(cv, s, cx - Math.floor(textWidth(s, scale, bold) / 2), y, scale, c, bold);
}

// Greedy word wrap. Returns lines that fit maxW pixels at the given scale.
function wrap(s: string, maxW: number, scale: number, bold = false): string[] {
  const adv = (bold ? 7 : 6) * scale;
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur === "" ? w : cur + " " + w;
    if (trial.length * adv - scale <= maxW || cur === "") {
      cur = trial;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------- PNG writer
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter none
    cv.data.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------- photo panels
// Small drawn illustrations for the three lead stories. Each panel is a
// fixed 320x120 scene made of flat shapes: no two are alike.
function photoBridge(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 320, 120, SKY);
  cv.rect(x, y + 78, 320, 42, [38, 52, 66]); // water
  cv.rect(x, y + 58, 320, 6, [20, 20, 20]); // deck
  cv.rect(x + 70, y + 18, 8, 46, [20, 20, 20]); // tower 1
  cv.rect(x + 240, y + 18, 8, 46, [20, 20, 20]); // tower 2
  cv.line(x + 74, y + 22, x + 160, y + 58, [20, 20, 20]);
  cv.line(x + 244, y + 22, x + 160, y + 58, [20, 20, 20]);
  cv.line(x + 74, y + 22, x + 20, y + 58, [20, 20, 20]);
  cv.line(x + 244, y + 22, x + 300, y + 58, [20, 20, 20]);
  // drones
  const drones: Array<[number, number]> = [[40, 26], [120, 14], [200, 30], [280, 18], [160, 8]];
  for (const d of drones) {
    cv.disc(x + d[0], y + d[1], 3, INK);
    cv.px(x + d[0] - 5, y + d[1], INK);
    cv.px(x + d[0] + 5, y + d[1], INK);
  }
  // blasts on the deck
  cv.disc(x + 150, y + 52, 7, [255, 176, 32]);
  cv.disc(x + 150, y + 52, 4, [255, 90, 20]);
  cv.disc(x + 262, y + 54, 5, [255, 176, 32]);
  cv.disc(x + 262, y + 54, 3, [255, 90, 20]);
}

function photoMarkets(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 320, 120, WHITE);
  cv.frame(x, y, 320, 120, RULE, 1);
  for (let gx = 40; gx < 320; gx += 40) cv.vline(x + gx, y + 8, 104, [232, 232, 232]);
  for (let gy = 24; gy < 120; gy += 24) cv.hline(x + 8, y + gy, 304, [232, 232, 232]);
  // falling line
  const pts: Array<[number, number]> = [
    [16, 22], [60, 30], [104, 26], [148, 48], [192, 44], [236, 72], [280, 68], [308, 96],
  ];
  for (let i = 0; i + 1 < pts.length; i++) {
    cv.line(x + pts[i][0], y + pts[i][1], x + pts[i + 1][0], y + pts[i + 1][1], RED);
    cv.line(x + pts[i][0], y + pts[i][1] + 1, x + pts[i + 1][0], y + pts[i + 1][1] + 1, RED);
  }
  // arrow head at the end
  cv.line(x + 308, y + 96, x + 296, y + 90, RED);
  cv.line(x + 308, y + 96, x + 300, y + 82, RED);
  drawText(cv, "-2.49%", x + 16, y + 82, 2, RED, true);
  drawText(cv, "NASDAQ", x + 16, y + 100, 1, GREY);
  // bars
  const bars = [18, 26, 22, 34, 30, 46, 40, 58];
  for (let i = 0; i < bars.length; i++) {
    cv.rect(x + 200 + i * 14, y + 112 - bars[i], 9, bars[i], i % 2 ? [120, 160, 120] : RED);
  }
}

function photoSummit(cv: Canvas, x: number, y: number): void {
  cv.rect(x, y, 320, 120, SAND);
  // three banners: China, United States, Russia, drawn as flat flags
  // banner 1: red field, one large star and four small stars
  cv.rect(x + 22, y + 14, 82, 92, [222, 41, 16]);
  cv.disc(x + 44, y + 34, 7, [255, 222, 0]);
  for (const s of [[70, 26], [78, 36], [72, 48], [58, 50]] as Array<[number, number]>) {
    cv.disc(x + s[0], y + s[1], 3, [255, 222, 0]);
  }
  // banner 2: stripes with a blue canton
  for (let s = 0; s < 7; s++) {
    cv.rect(x + 120, y + 14 + s * 13, 82, 7, s % 2 ? WHITE : [178, 34, 52]);
  }
  cv.rect(x + 120, y + 14, 34, 46, BLUE);
  for (const s of [[128, 24], [140, 24], [128, 36], [140, 36], [134, 48]] as Array<[number, number]>) {
    cv.disc(x + s[0], y + s[1], 2, WHITE);
  }
  // banner 3: white, blue, red horizontal tricolour
  cv.rect(x + 218, y + 14, 82, 31, WHITE);
  cv.rect(x + 218, y + 45, 82, 30, [0, 57, 166]);
  cv.rect(x + 218, y + 75, 82, 31, [213, 0, 50]);
  // poles
  cv.vline(x + 22, y + 8, 104, INK, 2);
  cv.vline(x + 120, y + 8, 104, INK, 2);
  cv.vline(x + 218, y + 8, 104, INK, 2);
}

// ------------------------------------------------------------------ map
// Coarse continent outlines in longitude/latitude, drawn equirectangular.
const CONTINENTS: Array<Array<[number, number]>> = [
  // North America
  [[-168, 66], [-140, 70], [-120, 72], [-95, 80], [-80, 73], [-60, 60], [-55, 47], [-70, 42], [-75, 35], [-80, 26], [-90, 21], [-97, 16], [-92, 14], [-83, 9], [-79, 8], [-90, 13], [-105, 20], [-114, 28], [-125, 40], [-124, 48], [-135, 58], [-155, 58], [-165, 60]],
  // Greenland
  [[-45, 60], [-40, 65], [-32, 68], [-25, 70], [-20, 74], [-30, 76], [-45, 74], [-55, 70], [-53, 65]],
  // South America
  [[-79, 9], [-72, 11], [-62, 10], [-52, 5], [-50, 0], [-44, -3], [-35, -8], [-40, -20], [-48, -28], [-57, -38], [-65, -45], [-68, -52], [-70, -55], [-73, -44], [-73, -30], [-70, -18], [-77, -12], [-80, -5], [-81, 0]],
  // Asia
  [[30, 62], [40, 68], [50, 69], [60, 69], [70, 72], [80, 73], [90, 75], [100, 77], [110, 74], [120, 73], [130, 72], [140, 72], [150, 70], [158, 66], [162, 60], [158, 52], [150, 45], [142, 40], [140, 35], [135, 33], [130, 31], [127, 35], [122, 38], [120, 32], [115, 23], [110, 20], [108, 15], [105, 9], [100, 8], [98, 12], [95, 16], [92, 21], [90, 22], [86, 20], [80, 13], [77, 8], [75, 12], [72, 20], [66, 25], [61, 25], [57, 26], [53, 27], [50, 29], [48, 30], [44, 29], [40, 28], [38, 22], [35, 28], [34, 31], [36, 36], [33, 41], [30, 41], [28, 40], [26, 38], [23, 36], [22, 37], [26, 40], [30, 45], [28, 50], [30, 55], [32, 60]],
  // Europe
  [[-10, 36], [-9, 43], [-2, 48], [-4, 50], [0, 51], [3, 53], [8, 57], [10, 59], [18, 56], [21, 55], [24, 59], [28, 60], [30, 62], [23, 65], [18, 69], [12, 70], [5, 60], [5, 58], [-2, 57], [-5, 50], [-9, 48], [-10, 43], [-9, 37], [-6, 36]],
  // Africa
  [[-17, 15], [-16, 20], [-10, 30], [0, 36], [10, 37], [20, 32], [30, 31], [32, 31], [35, 28], [37, 22], [40, 15], [43, 11], [48, 11], [51, 12], [44, 5], [40, -2], [40, -10], [36, -18], [33, -26], [28, -33], [20, -35], [17, -29], [14, -22], [12, -12], [13, -5], [9, 4], [4, 6], [-8, 5], [-13, 8], [-17, 12]],
  // Australia
  [[113, -22], [114, -30], [115, -35], [120, -34], [124, -33], [129, -32], [132, -32], [135, -35], [138, -35], [140, -38], [145, -38], [150, -37], [153, -32], [153, -27], [150, -23], [146, -19], [142, -15], [142, -11], [137, -12], [135, -15], [132, -12], [130, -13], [126, -14], [122, -17], [118, -20]],
  // New Zealand
  [[167, -45], [170, -42], [174, -39], [176, -38], [178, -37], [175, -40], [171, -43], [168, -46]],
  // United Kingdom
  [[-5, 50], [-3, 53], [-5, 56], [-2, 58], [0, 53], [1, 51]],
  // Japan
  [[130, 31], [133, 34], [137, 35], [140, 38], [141, 41], [142, 44], [144, 44], [141, 40], [139, 37], [136, 33]],
  // New Guinea
  [[131, -1], [136, -2], [141, -4], [141, -8], [136, -8], [131, -4]],
  // Borneo
  [[109, 1], [113, 4], [117, 2], [118, -2], [114, -4], [110, -3]],
  // Sumatra
  [[95, 5], [100, 0], [104, -3], [106, -5], [102, -4], [98, 2]],
  // Java
  [[105, -6], [110, -7], [114, -8], [114, -7], [108, -6]],
];

// Pins: story number, longitude, latitude.
// Display nudges keep close pins legible: [pin, dx, dy] moves the disc
// away from its true spot and a leader line points back to it.
const NUDGES: Record<number, [number, number]> = {
  2: [18, -10], // New York away from Washington
  5: [10, -8], // Moscow away from Kyiv
  7: [-14, -6], // Tehran away from Hormuz
  17: [16, 12], // Paris away from London
};
const PINS: Array<[number, number, number]> = [
  [1, 30.5, 50.4], // Kyiv
  [2, -74, 40.7], // New York
  [3, 114, 22.5], // Shenzhen
  [4, 56.5, 26.5], // Strait of Hormuz
  [5, 37.6, 55.7], // Moscow
  [7, 51.4, 35.7], // Tehran
  [11, 30, -1.9], // Kigali
  [13, 100.5, 13.7], // Bangkok
  [14, -77, 38.9], // Washington
  [16, 115.2, -8.6], // Bali
  [17, 2.35, 48.85], // Paris
  [18, 139.7, 35.7], // Tokyo
  [19, 45, 12.8], // Aden
  [20, -0.1, 51.5], // London
  [22, 90.4, 23.8], // Dhaka
  [40, 151.2, -33.9], // Sydney
];

// ------------------------------------------------------------- the news
// Real stories from Tuesday 17 November 2026, gathered from wire and
// newspaper reporting of the day. Three leads, twenty full stories and
// eighteen more in the numbered list: 41 stories from six continents.
interface Story {
  h: string;
  d: string;
}

const LEADS: Story[] = [
  {
    h: "UKRAINE HITS CRIMEA BRIDGE IN 1300-DRONE BARRAGE",
    d: "Kyiv fires hundreds of drones overnight toward Moscow and the symbolic span to annexed Crimea. Russia answers with strikes on two bridges in Kyiv that cut water and power.",
  },
  {
    h: "MARKETS PLUNGE AS OIL AND GOLD TUMBLE",
    d: "Brent crude falls 3.6 percent to 92.44 dollars and gold slips to 3848 dollars. The Nasdaq enters correction after a 10 percent fall from its October peak.",
  },
  {
    h: "TRUMP XI PUTIN SUMMIT SET FOR SHENZHEN",
    d: "China confirms the first trilateral summit on 19 November. Trump says he might also meet North Korea's Kim Jong Un while in China.",
  },
];

const GRID: Story[] = [
  { h: "TANKER ATTACKED IN STRAIT OF HORMUZ", d: "A fire breaks out in the engine room after an attack reported at 2am. The crew is safe, maritime authorities say." },
  { h: "RUSSIA BARS EUROPE FROM UKRAINE TALKS", d: "Moscow has not agreed to European seats at the next round of negotiations, aide Yuri Ushakov says." },
  { h: "HACK HITS 178 TOP SITES TO STEAL CRYPTO", d: "Malicious code spread through Optimizely targets BBC, CNN, Zoom and HSBC visitors and infects iPhones." },
  { h: "IRAN REFUSES UN NUCLEAR INSPECTIONS", d: "Tehran will not allow access to damaged nuclear sites until the Middle East war ends permanently." },
  { h: "IRAN DRONES HIT US RADAR IN BAHRAIN", d: "Iran attacks a US military radar system in Bahrain with drones, reports say." },
  { h: "VULCAN ROCKET FAILS AND 40 SATELLITES LOST", d: "The ULA rocket fails about 10 minutes after liftoff from Florida. All 40 Amazon Leo satellites are lost." },
  { h: "US AIR TRAVEL MELTDOWN STRANDS 1M", d: "More than a million people are stranded at airports as questions remain over the cause of the shutdown." },
  { h: "FIVE NATIONS PLAN RWANDA DEPORTEE CENTRE", d: "Austria, Germany, the Netherlands, Denmark and Greece open talks on a centre for rejected asylum seekers." },
  { h: "ECUADOR FISHERMEN SUE US OVER DRONE STRIKE", d: "Sixteen fishermen seek damages in Pittsburgh after a US drone sank their boat in the Pacific in March." },
  { h: "US AND THAILAND SIGN TRADE DEAL AT ASEAN", d: "Thailand will scrap tariffs on US exports and remove non-tariff barriers, Trump says in Manila." },
  { h: "QUAD STRIKES CRITICAL MINERALS DEALS", d: "Trump hails pacts with Quad partners to guarantee supplies of critical minerals." },
  { h: "COP31 DRAFT URGES FAST EXIT FROM FOSSIL FUELS", d: "The draft deal calls for accelerated action to quit fossil fuels, negotiators report." },
  { h: "JAY SHAH RE-ELECTED ICC CHAIR UNOPPOSED", d: "The ICC board elects the former BCCI secretary for a second term at meetings in Bali." },
  { h: "DEPARDIEU ADMITS SEXUAL ASSAULT CHARGE", d: "The French actor drops his appeal before a Paris court and admits the charge." },
  { h: "JAPAN SCRAMBLES JETS AS RUSSIAN PLANES INTRUDE", d: "Tokyo protests after two suspected Russian aircraft violate its airspace." },
  { h: "HOUTHIS SEIZE GROUND ON YEMEN COAST", d: "Government forces pull back from the Red Sea coast as Houthi fighters advance toward Aden." },
  { h: "UK SANCTIONS ISRAELI FIRMS OVER SETTLEMENTS", d: "Britain sanctions firms helping build settlements in the West Bank." },
  { h: "CHINA CONDEMNS US CHIP CURBS ON FIVE NATIONS", d: "Beijing hits back at US chip curbs ahead of Trump's visit to China." },
  { h: "DHAKA GARMENT WORKERS PROTEST FOR HIGHER PAY", d: "Fresh unrest in Dhaka as garment workers demand higher wages." },
  { h: "ROBERT PATTINSON NAMED NEW JAMES BOND", d: "The British actor is named as the new 007, reports say." },
];

const ALSO: string[] = [
  "THAILAND BUILDING FIRE KILLS 11",
  "IEA: OIL SUPPLY TO TOP DEMAND BY 1.7M BARRELS",
  "SENSEX UP 512; NIFTY UP 147",
  "RUPEE CLOSES AT 93.92 TO THE DOLLAR",
  "HONG KONG PUTS AI FACE SCANS ON CCTV",
  "SAUDI ENERGY EYES $30B PAKISTAN DEAL",
  "WILLIAM AND KATE RIDE E-RICKSHAW IN MUMBAI",
  "JAPAN PROPOSES ASIA OIL SECURITY TASK FORCE",
  "TRUMP MAY MEET KIM JONG UN IN CHINA",
  "MEXICO PRESIDENT ASKS XI FOR A PANDA",
  "SCIENTIST FIRED AFTER GENE TRIAL DEATH",
  "ISRAEL TO ELECT NETANYAHU RIVAL AS SPEAKER",
  "PHILIPPINES ENDS ASEAN CHAIRMANSHIP",
  "ASEAN AND INDIA REAFFIRM TIES",
  "US DATA CENTRES BURN NEARLY 100 TWH",
  "EXPERT DOUBTS EPSTEIN SUICIDE FINDING",
  "WEST URGES ISRAEL TO OPEN GAZA AID ROUTES",
  "SOUTH KOREA TO CHECK GLASSES IN EXAM CRACKDOWN",
];

// ---------------------------------------------------------------- layout
function drawMasthead(cv: Canvas): void {
  cv.frame(8, 8, W - 16, H - 16, INK, 2);
  drawTextCentered(cv, "THE WORLD TODAY", 512, 22, 6, INK, true);
  cv.hline(20, 74, 984, INK, 2);
  drawText(cv, "TUESDAY 17 NOVEMBER 2026", 20, 84, 2, INK, true);
  const right = "41 STORIES FROM SIX CONTINENTS";
  drawText(cv, right, 1004 - textWidth(right, 2, true), 84, 2, RED, true);
  cv.hline(20, 108, 984, INK, 1);
}

function drawLeads(cv: Canvas): void {
  const photos = [photoBridge, photoMarkets, photoSummit];
  for (let i = 0; i < 3; i++) {
    const x = 20 + i * 332;
    const y = 120;
    photos[i](cv, x, y);
    cv.frame(x, y, 320, 120, INK, 1);
    let ty = y + 130;
    const hl = wrap(LEADS[i].h, 320, 2, true);
    for (const ln of hl.slice(0, 3)) {
      drawText(cv, ln, x, ty, 2, INK, true);
      ty += 17;
    }
    const dl = wrap(LEADS[i].d, 320, 1);
    for (const ln of dl.slice(0, 4)) {
      drawText(cv, ln, x, ty, 1, INK);
      ty += 10;
    }
    // story number tag
    drawText(cv, String(i + 1), x + 306, y + 126, 1, RED, true);
  }
  cv.hline(20, 336, 984, INK, 1);
}

function drawGrid(cv: Canvas): void {
  const top = 348;
  const rowH = 42;
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 2; c++) {
      const idx = r * 2 + c;
      const s = GRID[idx];
      const x = 20 + c * 498;
      const y = top + r * rowH;
      const num = String(idx + 4);
      drawText(cv, num + ".", x, y + 2, 1, RED, true);
      const tx = x + 22;
      const hl = wrap(s.h, 486 - 22, 1, true);
      let ty = y + 2;
      for (const ln of hl.slice(0, 2)) {
        drawText(cv, ln, tx, ty, 1, INK, true);
        ty += 9;
      }
      const dl = wrap(s.d, 486 - 22, 1);
      for (const ln of dl.slice(0, 2)) {
        drawText(cv, ln, tx, ty, 1, [60, 60, 60]);
        ty += 9;
      }
      if (r < 9) cv.hline(x, y + rowH - 4, 486, RULE, 1);
    }
  }
  cv.vline(512, top, 10 * rowH - 4, RULE, 1);
  cv.hline(20, 772, 984, INK, 1);
}

function drawAlso(cv: Canvas): void {
  drawText(cv, "ALSO TODAY", 20, 784, 1, RED, true);
  for (let i = 0; i < ALSO.length; i++) {
    const col = Math.floor(i / 6);
    const row = i % 6;
    const x = 20 + col * 332;
    const y = 802 + row * 15;
    const num = String(i + 24);
    drawText(cv, num + ".", x, y, 1, RED, true);
    drawText(cv, ALSO[i], x + 24, y, 1, INK);
  }
  cv.hline(20, 898, 984, INK, 1);
}

function drawMap(cv: Canvas): void {
  drawText(cv, "THE WORLD TODAY IN 16 PLACES", 20, 908, 1, BLUE, true);
  const mx = 20;
  const my = 926;
  const mw = 984;
  const mh = 84;
  cv.rect(mx, my, mw, mh, SEA);
  cv.frame(mx, my, mw, mh, INK, 1);
  const toX = (lon: number): number => mx + Math.round(((lon + 180) / 360) * mw);
  const toY = (lat: number): number => my + Math.round(((84 - lat) / 144) * mh);
  for (const cont of CONTINENTS) {
    const pts = cont.map(([lo, la]) => [toX(lo), toY(la)] as [number, number]);
    cv.poly(pts, LAND);
  }
  for (const [n, lo, la] of PINS) {
    const px = toX(lo);
    const py = toY(la);
    const nd = NUDGES[n] ?? [0, 0];
    const dx = px + nd[0];
    const dy = py + nd[1];
    if (nd[0] !== 0 || nd[1] !== 0) {
      cv.line(px, py, dx, dy, RED);
      cv.disc(px, py, 2, RED);
    }
    cv.disc(dx, dy, 8, RED);
    cv.ring(dx, dy, 8, WHITE);
    const label = String(n);
    drawText(cv, label, dx - Math.floor(textWidth(label, 1, true) / 2), dy - 3, 1, WHITE, true);
  }
}

// ------------------------------------------------------------------- main
function main(): void {
  const cv = new Canvas();
  drawMasthead(cv);
  drawLeads(cv);
  drawGrid(cv);
  drawAlso(cv);
  drawMap(cv);
  const png = encodePNG(cv);
  mkdirSync("/output", { recursive: true });
  writeFileSync("/output/entry.png", png);
}

main();

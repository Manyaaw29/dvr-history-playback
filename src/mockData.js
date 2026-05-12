// Demo clips matching the real platform's filenames
const BD = (h, m, s = 0) =>
  `2026-05-10T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

// ── 5 distinct video sources (no crossOrigin needed — all direct-load fine) ──
// Rotating through these gives visual variety across clips.
export const RELIABLE_VIDEOS = [
  // V0 — Big Buck Bunny (W3Schools)
  'https://www.w3schools.com/html/mov_bbb.mp4',
  // V1 — Sintel short film trailer (W3 media)
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  // V2 — MDN Flower (WebM, very lightweight)
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
  // V3 — Subaru driving footage (Google CDN — dashcam-style)
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  // V4 — Big Buck Bunny full (Google CDN — different from W3Schools version)
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
];

// Helper: cycle through all 5 by clip index so consecutive clips look different
const v = (i) => RELIABLE_VIDEOS[i % RELIABLE_VIDEOS.length];

export const MOCK_CLIPS = [
  // ── Forward camera (channel 1) — 13 clips spread across the day ─────────
  { filename: '2026_05_10_08_00_00_01.ts', channel: 1, startTime: BD(8,0),   duration: 300, videoUrl: v(0) },
  { filename: '2026_05_10_08_05_00_01.ts', channel: 1, startTime: BD(8,5),   duration: 300, videoUrl: v(1) },
  { filename: '2026_05_10_08_10_00_01.ts', channel: 1, startTime: BD(8,10),  duration: 300, videoUrl: v(2) },
  { filename: '2026_05_10_09_15_00_01.ts', channel: 1, startTime: BD(9,15),  duration: 300, videoUrl: v(3) },
  { filename: '2026_05_10_09_20_00_01.ts', channel: 1, startTime: BD(9,20),  duration: 300, videoUrl: v(4) },
  { filename: '2026_05_10_10_30_00_01.ts', channel: 1, startTime: BD(10,30), duration: 300, videoUrl: v(0) },
  { filename: '2026_05_10_10_35_00_01.ts', channel: 1, startTime: BD(10,35), duration: 300, videoUrl: v(1) },
  { filename: '2026_05_10_11_45_00_01.ts', channel: 1, startTime: BD(11,45), duration: 300, videoUrl: v(2) },
  { filename: '2026_05_10_12_00_00_01.ts', channel: 1, startTime: BD(12,0),  duration: 300, videoUrl: v(3) },
  { filename: '2026_05_10_12_10_00_01.ts', channel: 1, startTime: BD(12,10), duration: 300, videoUrl: v(4) },
  { filename: '2026_05_10_14_20_00_01.ts', channel: 1, startTime: BD(14,20), duration: 300, videoUrl: v(0) },
  { filename: '2026_05_10_16_05_00_01.ts', channel: 1, startTime: BD(16,5),  duration: 300, videoUrl: v(1) },
  { filename: '2026_05_10_17_30_00_01.ts', channel: 1, startTime: BD(17,30), duration: 300, videoUrl: v(2) },

  // ── In-cabin camera (channel 2) — 7 clips ────────────────────────────────
  { filename: '2026_05_10_08_00_00_02.ts', channel: 2, startTime: BD(8,0),   duration: 300, videoUrl: v(3) },
  { filename: '2026_05_10_08_05_00_02.ts', channel: 2, startTime: BD(8,5),   duration: 300, videoUrl: v(4) },
  { filename: '2026_05_10_09_15_00_02.ts', channel: 2, startTime: BD(9,15),  duration: 300, videoUrl: v(0) },
  { filename: '2026_05_10_10_30_00_02.ts', channel: 2, startTime: BD(10,30), duration: 300, videoUrl: v(1) },
  { filename: '2026_05_10_11_45_00_02.ts', channel: 2, startTime: BD(11,45), duration: 300, videoUrl: v(2) },
  { filename: '2026_05_10_12_10_00_02.ts', channel: 2, startTime: BD(12,10), duration: 300, videoUrl: v(3) },
  { filename: '2026_05_10_14_20_00_02.ts', channel: 2, startTime: BD(14,20), duration: 300, videoUrl: v(4) },
];

// For live API mode: pool of demo videos to use when no stream URL is returned
export const DEMO_VIDEOS = [...RELIABLE_VIDEOS];

// Last-resort fallback — MDN Flower always works (has proper CORS + no restrictions)
export const FALLBACK_VIDEOS = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
];

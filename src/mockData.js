// Demo clips matching the real platform's filenames
const BD = (h, m, s = 0) =>
  `2026-05-10T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

export const MOCK_CLIPS = [
  { filename: '2026_05_10_08_00_00_01.ts', channel: 1, startTime: BD(8,0),     duration: 60 },
  { filename: '2026_05_10_08_01_00_01.ts', channel: 1, startTime: BD(8,1),     duration: 60 },
  { filename: '2026_05_10_08_02_00_01.ts', channel: 1, startTime: BD(8,2),     duration: 60 },
  { filename: '2026_05_10_09_15_00_01.ts', channel: 1, startTime: BD(9,15),    duration: 60 },
  { filename: '2026_05_10_09_16_00_01.ts', channel: 1, startTime: BD(9,16),    duration: 60 },
  { filename: '2026_05_10_10_30_00_01.ts', channel: 1, startTime: BD(10,30),   duration: 60 },
  { filename: '2026_05_10_10_31_00_01.ts', channel: 1, startTime: BD(10,31),   duration: 60 },
  { filename: '2026_05_10_11_45_00_01.ts', channel: 1, startTime: BD(11,45),   duration: 60 },
  { filename: '2026_05_10_12_00_00_01.ts', channel: 1, startTime: BD(12,0),    duration: 60 },
  { filename: '2026_05_10_12_09_35_03.ts', channel: 1, startTime: BD(12,9,35), duration: 60 },
  { filename: '2026_05_10_12_12_36_03.ts', channel: 1, startTime: BD(12,12,36),duration: 60 },
  { filename: '2026_05_10_14_20_00_01.ts', channel: 1, startTime: BD(14,20),   duration: 60 },
  { filename: '2026_05_10_16_05_00_01.ts', channel: 1, startTime: BD(16,5),    duration: 60 },
  // In-cabin
  { filename: '2026_05_10_08_00_00_02.ts', channel: 2, startTime: BD(8,0),     duration: 60 },
  { filename: '2026_05_10_08_01_00_02.ts', channel: 2, startTime: BD(8,1),     duration: 60 },
  { filename: '2026_05_10_09_15_00_02.ts', channel: 2, startTime: BD(9,15),    duration: 60 },
  { filename: '2026_05_10_10_30_00_02.ts', channel: 2, startTime: BD(10,30),   duration: 60 },
  { filename: '2026_05_10_11_45_00_02.ts', channel: 2, startTime: BD(11,45),   duration: 60 },
  { filename: '2026_05_10_12_09_35_02.ts', channel: 2, startTime: BD(12,9,35), duration: 60 },
  { filename: '2026_05_10_14_20_00_02.ts', channel: 2, startTime: BD(14,20),   duration: 60 },
];

// Reliable public-domain videos (dashcam/driving footage preferred)
// These are from the W3C and Mozilla MDN CDNs — guaranteed to work
export const DEMO_VIDEOS = [
  // Subarau driving footage — closest to dashcam look
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  // Fallbacks
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  // W3 / MDN always-available fallbacks
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
];

// Secondary fallback list — if primary fails
export const FALLBACK_VIDEOS = [
  'https://www.w3schools.com/html/mov_bbb.mp4',
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
];

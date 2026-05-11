// Demo clips using royalty-free Big Buck Bunny segments
// Used as fallback when the real API is unavailable

const BASE_DATE = (h, m, s = 0) => `2026-05-10T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;

export const MOCK_CLIPS = [
  { filename: '2026_05_10_08_00_00_01.ts', channel: 1, startTime: BASE_DATE(8,0),   duration: 60 },
  { filename: '2026_05_10_08_01_00_01.ts', channel: 1, startTime: BASE_DATE(8,1),   duration: 60 },
  { filename: '2026_05_10_08_02_00_01.ts', channel: 1, startTime: BASE_DATE(8,2),   duration: 60 },
  { filename: '2026_05_10_09_15_00_01.ts', channel: 1, startTime: BASE_DATE(9,15),  duration: 60 },
  { filename: '2026_05_10_09_16_00_01.ts', channel: 1, startTime: BASE_DATE(9,16),  duration: 60 },
  { filename: '2026_05_10_10_30_00_01.ts', channel: 1, startTime: BASE_DATE(10,30), duration: 60 },
  { filename: '2026_05_10_10_31_00_01.ts', channel: 1, startTime: BASE_DATE(10,31), duration: 60 },
  { filename: '2026_05_10_11_45_00_01.ts', channel: 1, startTime: BASE_DATE(11,45), duration: 60 },
  { filename: '2026_05_10_12_00_00_01.ts', channel: 1, startTime: BASE_DATE(12,0),  duration: 60 },
  { filename: '2026_05_10_12_09_35_03.ts', channel: 1, startTime: BASE_DATE(12,9,35), duration: 60 },
  { filename: '2026_05_10_12_12_36_03.ts', channel: 1, startTime: BASE_DATE(12,12,36), duration: 60 },
  { filename: '2026_05_10_14_20_00_01.ts', channel: 1, startTime: BASE_DATE(14,20), duration: 60 },
  { filename: '2026_05_10_16_05_00_01.ts', channel: 1, startTime: BASE_DATE(16,5),  duration: 60 },
  // In-cabin
  { filename: '2026_05_10_08_00_00_02.ts', channel: 2, startTime: BASE_DATE(8,0),   duration: 60 },
  { filename: '2026_05_10_08_01_00_02.ts', channel: 2, startTime: BASE_DATE(8,1),   duration: 60 },
  { filename: '2026_05_10_09_15_00_02.ts', channel: 2, startTime: BASE_DATE(9,15),  duration: 60 },
  { filename: '2026_05_10_10_30_00_02.ts', channel: 2, startTime: BASE_DATE(10,30), duration: 60 },
  { filename: '2026_05_10_11_45_00_02.ts', channel: 2, startTime: BASE_DATE(11,45), duration: 60 },
  { filename: '2026_05_10_12_09_35_02.ts', channel: 2, startTime: BASE_DATE(12,9,35), duration: 60 },
  { filename: '2026_05_10_14_20_00_02.ts', channel: 2, startTime: BASE_DATE(14,20), duration: 60 },
];

// Cycle through these public domain video URLs for demo playback
export const DEMO_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
];

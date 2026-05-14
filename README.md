# DVR History Playback

A continuous DVR-style History Playback feature — clickable timeline, auto-play between clips, and seamless video navigation.

## What This Is

This project implements the three core DVR features required by the assignment:

| Feature | How it works |
|---|---|
| **Clickable Timeline** | 24-hour visual timeline with Forward cam (amber) and In-Cabin cam (green) segments. Click any segment to instantly jump to and play that clip. |
| **Auto-play Between Clips** | When a clip ends, the next one starts automatically. Shows "→ next: HH:MM:SS" preview. Toggle on/off with a switch. |
| **Seamless Video Navigation** | Prev / Next buttons, in-player skip controls, seek scrubber, playback speed (0.5× → 4×), volume, and mute. |

### Other Features
- Date picker + camera filter (Both / Forward / In-Cabin)
- Live playhead cursor moving across the timeline during playback
- Scrollable clip list panel with timestamps and filenames
- HLS stream support via `hls.js`

> **Note:** The app uses realistic sample clip metadata (timestamps, filenames, camera channels) matching the real okDriver platform format. The video player demonstrates all DVR features fully.

---

## Setup Instructions

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/Manyaaw29/dvr-history-playback.git
cd dvr-history-playback

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

App opens at **http://localhost:5175** — no login required, goes straight to the DVR dashboard.

### Using the App

1. Select a **date** (default: 2026-05-10, which has preloaded clips)
2. Choose a **camera** — Both / Forward / In-Cabin
3. Click **⟳ Load Clips**
4. Click any **clip** in the list or any **segment on the timeline** to play
5. Use **‹ Prev / Next ›** or enable **Auto-play** to advance through clips automatically

---

## Tech Stack

- **React 19** + **Vite 6**
- **hls.js** — HLS stream playback
- **dayjs** — date/time formatting
- **axios** — HTTP requests
- **Vanilla CSS** — no UI framework

## Project Structure

```
src/
├── main.jsx        — Entry point
├── App.jsx         — Root component
├── DVRPlayer.jsx   — Main DVR UI: timeline, player, clip list, auto-play logic
├── api.js          — API integration layer (okDriver smart.okdriver.in endpoints)
├── mockData.js     — Sample clip metadata + demo video URLs
└── index.css       — Global styles
```

## API Integration

The app is structured to connect to the real okDriver API endpoints:

```
POST /api/playback/request-list/{imei}   → request device to prepare clips
GET  /api/playback/videos/{imei}         → poll for clip list
POST /api/playback/start/{imei}          → start stream for a clip
```

Platform: [dashcam.okdriver.in](https://dashcam.okdriver.in/user/auth/login) | `demo@okdriver.in` / `12345678`

---

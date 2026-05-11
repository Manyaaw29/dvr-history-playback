# okDriver — DVR History Playback

A continuous DVR-style History Playback feature for dashcam footage.  
Built with React + Vite as a standalone single-page application.

## Features

| Feature | Description |
|---|---|
| **Clickable Timeline** | 24-hour visual timeline with FWD (blue) and In-Cabin (purple) segments — click any segment to jump to that clip |
| **Auto-play Between Clips** | When a clip ends, the next clip starts automatically (toggle on/off) |
| **Seamless Navigation** | Prev / Next clip buttons, playback speed (0.5×–4×), volume, seek scrubber |
| **Date & Camera Filter** | Filter by date, Forward Cam, In-Cabin Cam, or Both |
| **Live Playhead Cursor** | Orange cursor on the timeline tracks current playback position in real time |
| **HLS Support** | Uses `hls.js` for adaptive bitrate `.m3u8` streams |
| **Demo Mode Fallback** | Loads sample clips if the device is offline, so the UI always works |

## Setup Instructions

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9

### Install & Run

```bash
git clone https://github.com/<your-username>/okdriver-dvr.git
cd okdriver-dvr
npm install
npm run dev
```

App opens at **http://localhost:5175** — no login required, goes straight to the DVR dashboard.

### Production Build

```bash
npm run build
```

## How to Use

1. Select a **date** from the date picker
2. Choose a **camera** (Both / Forward / In-Cabin)
3. Click **Load Clips** — clips appear in the sidebar and timeline
4. Click any **clip in the sidebar** or **segment on the timeline** to play
5. Use **Prev / Next** buttons or let **Auto-play** advance clips automatically
6. Adjust **speed** (0.5×–4×) with the speed button

## Architecture

```
src/
├── main.jsx        — React entry point
├── App.jsx         — Root (mounts DVRPlayer directly)
├── DVRPlayer.jsx   — Main DVR UI: timeline, player, sidebar, auto-play
├── api.js          — API layer for smart.okdriver.in endpoints
├── mockData.js     — Demo clips + video URLs for offline fallback
└── index.css       — Global design system (vanilla CSS)
```

### API Flow (when device is online)

1. `POST /api/playback/request-list/{imei}` — tells device to prepare clip list
2. Poll `GET /api/playback/videos/{imei}?parsed=true` — waits for clips (up to 60 s)
3. `POST /api/playback/start/{imei}` — starts stream for selected clip

## Tech Stack

- **React 19** + **Vite 6**
- **hls.js** — HLS stream playback
- **dayjs** — date/time formatting
- **axios** — HTTP requests
- **Vanilla CSS** — no UI framework

## Platform

Live dashcam platform: [dashcam.okdriver.in](https://dashcam.okdriver.in/user/auth/login)  
Demo credentials: `demo@okdriver.in` / `12345678`

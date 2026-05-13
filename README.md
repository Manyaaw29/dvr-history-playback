# DVR History Playback

A continuous DVR-style History Playback feature built for the okDriver dashcam platform.

## What This Is

This project implements a **DVR-style History Playback** feature that lets you browse, navigate, and play dashcam footage from any day — just like a security DVR system.

### Core Features

| Feature | Description |
|---|---|
| **Clickable Timeline** | A full 24-hour visual timeline showing Forward (amber) and In-Cabin (green) camera segments. Click any segment to instantly jump to and play that clip. |
| **Auto-play Between Clips** | When a clip ends, the next one starts automatically. A "→ next: HH:MM:SS" preview is shown while playing. Toggle on/off anytime. |
| **Seamless Video Navigation** | Prev / Next buttons, in-player clip skip controls, seek scrubber, playback speed (0.5× → 4×), and volume control. |

### Additional Features
- Date picker + camera filter (Both / Forward / In-Cabin)
- Live playhead cursor that moves across the timeline as video plays
- Clip list panel showing all recordings for the selected date
- HLS stream support via `hls.js`
- Automatic fallback to demo video if device is offline

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

App opens at **http://localhost:5175**

### Using the App

1. Select a **date** from the top toolbar
2. Choose a **camera** — Both, Forward, or In-Cabin
3. Click **⟳ Load Clips** to fetch recordings
4. Click any **clip in the list** or **segment on the timeline** to play
5. Use **‹ Prev / Next ›** or let **Auto-play** advance clips automatically

---

## Platform Access

Live dashcam platform: [dashcam.okdriver.in/user/auth/login](https://dashcam.okdriver.in/user/auth/login)

| Field | Value |
|---|---|
| Login | demo@okdriver.in |
| Password | 12345678 |

> The app connects to the real `smart.okdriver.in` API. If the device is offline, it automatically loads demo clips so the UI always works.

---

## Tech Stack

- **React 19** + **Vite 6**
- **hls.js** — adaptive bitrate HLS stream playback
- **dayjs** — date/time parsing and formatting
- **axios** — HTTP requests
- **Vanilla CSS** — no UI framework

## Project Structure

```
src/
├── main.jsx        — Entry point
├── App.jsx         — Root component
├── DVRPlayer.jsx   — Main DVR UI (timeline, player, clip list, auto-play)
├── api.js          — API layer (smart.okdriver.in endpoints)
├── mockData.js     — Demo clips + fallback video URLs
└── index.css       — Global styles and design tokens
```

## API Flow

```
1. POST /api/playback/request-list/{imei}   → tell device to prepare clips
2. GET  /api/playback/videos/{imei}         → poll until clip list is ready
3. POST /api/playback/start/{imei}          → start stream for selected clip
```

---

## Demo

> Screen recording: [Add your Loom / Google Drive link here]

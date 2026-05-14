import { useState, useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import Hls from 'hls.js';
import { requestClipList, getVideoList, startPlayback, login, DEMO_IMEI } from './api';
import { MOCK_CLIPS, DEMO_VIDEOS, FALLBACK_VIDEOS } from './mockData';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (s) => {
  if (!isFinite(s) || s < 0) return '0:00';
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};
const camLbl = (ch) => ch === 1 ? 'FWD' : 'IN';
const camCls = (ch) => ch === 1 ? 'fwd' : 'in';

// Timeline geometry — 2880 logical px = 24 hours (2px per minute → 5-min clips = 10 px)
const TL = 2880;
const toX  = (t) => { const d = dayjs(t); return ((d.hour()*60 + d.minute() + d.second()/60) / 1440) * TL; };
const segW = (dur) => Math.max(10, (dur / 86400) * TL);

const HOURS = Array.from({ length: 25 }, (_, i) => i);
const CAM_OPTS = [
  { label: 'Both',     val: 'both' },
  { label: 'Forward',  val: '1'    },
  { label: 'In-Cabin', val: '2'    },
];
const SPEEDS = [0.5, 1, 1.5, 2, 4];


// ── component ─────────────────────────────────────────────────────────────────
export default function DVRPlayer() {
  const [date,      setDate]      = useState(dayjs().format('YYYY-MM-DD'));
  const [cam,       setCam]       = useState('both');
  const [clips,     setClips]     = useState([]);      // all clips (for timeline)
  const [activeIdx, setActiveIdx] = useState(-1);      // index into visible[]
  const [loading,   setLoading]   = useState(false);
  const [status,    setStatus]    = useState('');
  const [autoPlay,  setAutoPlay]  = useState(true);
  const [isMock,    setIsMock]    = useState(false);
  const [toast,     setToast]     = useState(null);

  // video state
  const [hasStream, setHasStream] = useState(false);
  const fallbackIdxRef = useRef(0);
  const [loadingClip, setLoadingClip] = useState(false);
  const [playing,   setPlaying]   = useState(false);
  const [curTime,   setCurTime]   = useState(0);
  const [dur,       setDur]       = useState(0);
  const [vol,       setVol]       = useState(0.8);
  const [speedIdx,  setSpeedIdx]  = useState(1); // index into SPEEDS

  const videoRef = useRef(null);
  const hlsRef   = useRef(null);

  const listRef  = useRef(null);
  const tlRef    = useRef(null);

  // Silently try to auth on mount — ignore failure
  useEffect(() => { login('demo@okdriver.in', '12345678').catch(() => {}); }, []);

  const notify = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // clips filtered by selected camera
  const visible = clips.filter(c => cam === 'both' || String(c.channel) === cam);

  // ── fetch clips ────────────────────────────────────────────────────────────
  async function handleLoad() {
    setLoading(true);
    setClips([]);
    setActiveIdx(-1);
    setHasStream(false);
    setIsMock(false);
    setStatus('Fetching clips…');

    try {
      const chans = cam === 'both' ? [1, 2] : [parseInt(cam)];
      await Promise.all(chans.map(ch => requestClipList(DEMO_IMEI, date, ch).catch(() => {})));

      const raw = await getVideoList(DEMO_IMEI);
      const arr = Array.isArray(raw) ? raw : [];

      if (arr.length > 0) {
        const norm = arr
          .map(c => ({
            filename:  c.filename || c.name || '',
            channel:   c.channel ?? 1,
            startTime: c.startTime || c.start_time || null,
            duration:  c.duration ?? 60,
          }))
          .filter(c => c.filename)
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        setClips(norm);
        setLoading(false);
        setStatus('');
        notify(`${norm.length} clips loaded`, 'success');
      } else {
        loadMock();
      }
    } catch {
      loadMock();
    }
  }

  function loadMock() {
    setClips(MOCK_CLIPS);
    setIsMock(true);
    setLoading(false);
    setStatus('');
    notify('Demo mode — sample clips loaded', 'info');
  }

  // ── play a clip ────────────────────────────────────────────────────────────
  const playClip = useCallback(async (idx) => {
    const clip = visible[idx];
    if (!clip) return;
    setActiveIdx(idx);
    setLoadingClip(true);
    setPlaying(false);
    setCurTime(0);
    setDur(0);

    // scroll sidebar item into view
    setTimeout(() => {
      listRef.current?.querySelector(`[data-idx="${idx}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 80);

    // scroll timeline to active segment
    if (clip.startTime && tlRef.current) {
      setTimeout(() => {
        const x = toX(clip.startTime);
        tlRef.current.scrollLeft = Math.max(0, x - 160);
      }, 80);
    }

    let url = '';
    try {
      if (!isMock) {
        const res = await startPlayback(DEMO_IMEI, clip.filename);
        url = res?.streamUrl || res?.url || res?.hlsUrl ||
              res?.data?.url || res?.data?.streamUrl || '';
      }
    } catch { /* fallthrough */ }

    // In mock/demo mode each clip carries its own videoUrl — use it directly.
    // For live mode, use the API stream URL with a short fallback chain.
    const clipVideo = clip.videoUrl || '';
    const primary = url || clipVideo || DEMO_VIDEOS[idx % DEMO_VIDEOS.length];

    // Fallback: only 2 alternates so a bad URL never cascades to the same last video.
    const others = FALLBACK_VIDEOS.filter(u => u !== primary);

    setHasStream(true);
    setLoadingClip(false);
    attachStream(primary, others);
  }, [visible, isMock]);

  function attachStream(url, fallbackList) {
    const v = videoRef.current;
    if (!v) return;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    // Clear stale handlers
    v.onerror = null;

    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, () => v.play().catch(() => {}));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) { hls.destroy(); tryFallback(fallbackList); }
      });
    } else {
      v.src = url;
      v.load();
      v.onerror = () => tryFallback(fallbackList);
      v.play().catch(() => {});
    }
  }

  function tryFallback(list) {
    const remaining = list || [];
    if (remaining.length === 0) return;
    const [next, ...rest] = remaining;
    attachStream(next, rest);
  }

  // video event wiring
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const t = () => setCurTime(v.currentTime);
    const d = () => setDur(v.duration);
    const p = () => setPlaying(true);
    const pa= () => setPlaying(false);
    const e = () => {
      setPlaying(false);
      if (autoPlay && activeIdx + 1 < visible.length) playClip(activeIdx + 1);
    };
    v.addEventListener('timeupdate',    t);
    v.addEventListener('durationchange',d);
    v.addEventListener('play',          p);
    v.addEventListener('pause',         pa);
    v.addEventListener('ended',         e);
    return () => {
      v.removeEventListener('timeupdate',    t);
      v.removeEventListener('durationchange',d);
      v.removeEventListener('play',          p);
      v.removeEventListener('pause',         pa);
      v.removeEventListener('ended',         e);
    };
  }, [autoPlay, activeIdx, visible, playClip]);

  useEffect(() => { if (videoRef.current) videoRef.current.volume = vol; }, [vol]);
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = SPEEDS[speedIdx];
  }, [speedIdx]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    playing ? v.pause() : v.play().catch(() => {});
  };

  const seek = (e) => {
    const v = videoRef.current;
    if (!v || !dur) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - r.left) / r.width) * dur;
  };

  const activeClip = visible[activeIdx] ?? null;
  // playhead x
  const cursorX = activeClip?.startTime
    ? toX(activeClip.startTime) + (dur > 0 ? (curTime / dur) * segW(activeClip.duration) : 0)
    : null;

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div className="shell">

      {/* ── TOOLBAR ── */}
      <header className="toolbar">
        <div className="brand">
          <div>
            <div className="brand-name">ClipVault DVR</div>
            <div className="brand-sub">History Playback</div>
          </div>
        </div>

        <div className="tb-sep" />

        {/* Date */}
        <div className="tb-group">
          <span className="tb-lbl">Date</span>
          <input
            id="date-picker"
            className="tb-date"
            type="date"
            value={date}
            max={dayjs().format('YYYY-MM-DD')}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Camera */}
        <div className="tb-group">
          <span className="tb-lbl">Camera</span>
          <div className="cam-pills">
            {CAM_OPTS.map(o => (
              <button
                key={o.val}
                id={`cam-${o.val}`}
                className={`cam-pill${cam === o.val ? ' active' : ''}`}
                onClick={() => setCam(o.val)}
              >{o.label}</button>
            ))}
          </div>
        </div>

        {/* Load */}
        <button
          id="load-clips-btn"
          className="load-btn"
          onClick={handleLoad}
          disabled={loading}
        >
          {loading
            ? <><span className="spinner" />{status || 'Loading…'}</>
            : <>⟳ Load Clips</>}
        </button>

        <div className="tb-spacer" />

        {isMock && <span className="demo-badge">DEMO MODE</span>}

        <div className="vehicle-chip">
          <span className="dot" />
          DL5CJ7355 — OKD200
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="body-area">

        {/* ── VIDEO SECTION ── */}
        <div className="video-section">

          {/* Player */}
          <div className="video-wrap" id="video-wrap">
            <video
              ref={videoRef}
              id="main-video"
              className="video-el"
              playsInline
            />

            {/* Empty / loading state */}
            {!hasStream && !loadingClip && (
              <div className="v-overlay">
                <button
                  id="big-play-btn"
                  className="big-play"
                  onClick={() => visible.length > 0 && playClip(0)}
                  aria-label="Play first clip"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
                <span className="v-hint">
                  {visible.length > 0 ? 'Click a clip or a timeline segment to play' : 'Load clips to begin playback'}
                </span>
              </div>
            )}

            {loadingClip && (
              <div className="v-overlay">
                <span className="spinner light" style={{ width: 34, height: 34, borderWidth: 3 }} />
                <span className="v-hint">Starting stream…</span>
              </div>
            )}

            {/* Controls */}
            {hasStream && (
              <div className={`vcontrols${!playing ? ' show' : ''}`}>
                {/* Scrubber */}
                <div
                  id="seek-bar"
                  className="scrubber"
                  onClick={seek}
                  role="slider"
                  aria-label="Seek"
                >
                  <div
                    className="scrubber-fill"
                    style={{ width: `${dur > 0 ? (curTime / dur) * 100 : 0}%` }}
                  />
                </div>

                <div className="ctrl-row">
                  {/* ⏮ prev clip */}
                  <button id="prev-clip-btn" className="cbtn" title="Previous clip"
                    disabled={activeIdx <= 0}
                    onClick={() => playClip(activeIdx - 1)}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
                  </button>

                  {/* ▶ play/pause */}
                  <button id="play-pause-btn" className="cbtn" title={playing ? 'Pause' : 'Play'}
                    onClick={togglePlay}>
                    {playing
                      ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
                  </button>

                  {/* ⏭ next clip */}
                  <button id="next-clip-btn" className="cbtn" title="Next clip"
                    disabled={activeIdx >= visible.length - 1}
                    onClick={() => playClip(activeIdx + 1)}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                  </button>

                  {/* Volume */}
                  <button id="mute-btn" className="cbtn" title="Mute"
                    onClick={() => setVol(v => v > 0 ? 0 : 0.8)}>
                    {vol === 0
                      ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17 19.73l2 2L20.73 20 4.27 3zM12 4 9.91 6.09 12 8.18V4zm6.5 8A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71z"/></svg>
                      : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>}
                  </button>
                  <input id="vol-slider" className="vol-range" type="range"
                    min="0" max="1" step="0.05" value={vol}
                    onChange={e => setVol(+e.target.value)} aria-label="Volume" />

                  <span className="time-txt">{fmt(curTime)} / {fmt(dur)}</span>
                  <div className="cspacer" />

                  <button id="speed-btn" className="spd-btn" onClick={() => setSpeedIdx(i => (i + 1) % SPEEDS.length)} title="Speed">
                    {SPEEDS[speedIdx]}×
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── NOW PLAYING STRIP ── */}
          <div className="np-strip">
            <span className="np-lbl">Playing</span>
            {activeClip ? (
              <>
                <span className="np-time">
                  {activeClip.startTime ? dayjs(activeClip.startTime).format('YYYY-MM-DD HH:mm:ss') : activeClip.filename}
                </span>
                <span className={`cam-tag ${camCls(activeClip.channel)}`}>{camLbl(activeClip.channel)}</span>
                {autoPlay && visible[activeIdx + 1] && (
                  <span className="np-next-hint">
                    → next: {visible[activeIdx+1].startTime
                      ? dayjs(visible[activeIdx+1].startTime).format('HH:mm:ss')
                      : visible[activeIdx+1].filename}
                  </span>
                )}
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--txt3)' }}>No clip selected</span>
            )}

            <div className="np-spacer" />

            <div className="np-controls">
              {/* Auto-play toggle */}
              <label id="autoplay-label" className="ap-toggle">
                <div id="autoplay-toggle" className={`switch${autoPlay ? ' on' : ''}`}
                  onClick={() => setAutoPlay(a => !a)} />
                Auto-play
              </label>

              <button id="prev-btn" className="nav-btn" disabled={activeIdx <= 0}
                onClick={() => playClip(activeIdx - 1)}>‹ Prev</button>
              <button id="next-btn" className="nav-btn"
                disabled={activeIdx < 0 || activeIdx >= visible.length - 1}
                onClick={() => playClip(activeIdx + 1)}>Next ›</button>
            </div>
          </div>

          {/* ── TIMELINE ── */}
          <div className="tl-section">
            <div className="tl-header">
              <span className="tl-title">◈ 24-hr DVR Timeline — {date}</span>
              <div className="tl-legend">
                <span className="leg-item"><span className="leg-dot" style={{ background:'var(--amber)' }}/> Forward</span>
                <span className="leg-item"><span className="leg-dot" style={{ background:'var(--emerald)' }}/> In-Cabin</span>
              </div>
            </div>

            <div className="tl-scroll" id="timeline-scroll" ref={tlRef}>
              <div className="tl-inner" style={{ width: TL }}>

                {/* Hour labels */}
                <div className="tl-hours" style={{ width: TL }}>
                  {HOURS.map(h => (
                    <span key={h}>
                      <span className="h-lbl" style={{ left: (h/24)*TL }}>{String(h).padStart(2,'0')}:00</span>
                      <span className="h-tick" style={{ left: (h/24)*TL }} />
                    </span>
                  ))}
                </div>

                {/* Lanes */}
                <div className="tl-lanes" style={{ width: TL }}>
                  <span className="lane-lbl fwd">FWD</span>
                  <span className="lane-lbl in">IN</span>

                  {clips.map((c, i) => {
                    if (!c.startTime) return null;
                    const x    = toX(c.startTime);
                    const w    = segW(c.duration);
                    const cc   = camCls(c.channel);
                    const vIdx = visible.indexOf(c);
                    const isActive = vIdx !== -1 && vIdx === activeIdx;
                    return (
                      <div
                        key={c.filename + i}
                        id={`seg-${i}`}
                        className={`seg ${cc}${isActive ? ' playing' : ''}`}
                        style={{ left: x, width: w }}
                        title={`${dayjs(c.startTime).format('HH:mm:ss')} — ${camLbl(c.channel)}`}
                        onClick={() => { if (vIdx !== -1) playClip(vIdx); }}
                      />
                    );
                  })}

                  {/* Playhead */}
                  {cursorX !== null && (
                    <div id="playhead" className="playhead" style={{ left: cursorX }} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CLIP LIST (right panel) ── */}
        <div className="clip-panel">
          <div className="cp-header">
            <span className="cp-title">Clip List</span>
            <span id="clip-count" className="cp-count">{visible.length}</span>
          </div>

          {visible.length === 0 && !loading && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
                <path d="M15 10l4.553-2.369A1 1 0 0121 8.56v6.88a1 1 0 01-1.447.889L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
              <p>Select a date &amp; camera, then click <strong>Load Clips</strong></p>
            </div>
          )}

          <div className="cp-list" ref={listRef}>
            {visible.map((c, i) => {
              const ts = c.startTime ? dayjs(c.startTime).format('HH:mm:ss') : c.filename;
              const cc = camCls(c.channel);
              return (
                <div
                  key={c.filename + i}
                  data-idx={i}
                  id={`clip-${i}`}
                  className={`clip-card${activeIdx === i ? ' active' : ''}`}
                  onClick={() => playClip(i)}
                  title={c.filename}
                >
                  <div className={`clip-ico ${cc}`}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div className="clip-meta">
                    <div className="clip-t">{ts}</div>
                    <div className="clip-f">{c.filename}</div>
                  </div>
                  <span className={`cam-tag ${cc}`} style={{ fontSize: 9, padding: '1px 5px' }}>
                    {camLbl(c.channel)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className="toasts">
        {toast && (
          <div id="toast" className={`toast-card ${toast.type}`}>
            {toast.type === 'success' && '✓ '}{toast.type === 'error' && '✕ '}{toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

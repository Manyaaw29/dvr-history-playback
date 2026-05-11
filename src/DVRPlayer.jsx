import { useState, useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import Hls from 'hls.js';
import { requestClipList, getVideoList, startPlayback, login, DEMO_IMEI } from './api';
import { MOCK_CLIPS, DEMO_VIDEOS } from './mockData';

// ─── utils ───────────────────────────────────────────────────────────────────
function fmt(sec) {
  if (!isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
const camLabel = (ch) => ch === 1 ? 'FWD' : 'IN';
const camCls   = (ch) => ch === 1 ? 'fwd' : 'in';
const HOURS    = Array.from({ length: 25 }, (_, i) => i);
const TL_W     = 1440; // 1px per minute

function toX(timeStr) {
  const t = dayjs(timeStr);
  return ((t.hour() * 60 + t.minute() + t.second() / 60) / 1440) * TL_W;
}
function segW(dur) { return Math.max(3, (dur / 86400) * TL_W); }

const CHANNEL_OPTS = [
  { label: 'Both',    value: 'both' },
  { label: 'Forward', value: '1'    },
  { label: 'In-Cabin',value: '2'    },
];

const POLL_MS  = 3000;
const POLL_MAX = 20;

// ─── Component ────────────────────────────────────────────────────────────────
export default function DVRPlayer() {
  const today = dayjs().format('YYYY-MM-DD');
  const [date,     setDate]     = useState('2026-05-10');
  const [channel,  setChannel]  = useState('both');
  const [clips,    setClips]    = useState([]);
  const [activeIdx,setActiveIdx]= useState(-1);
  const [loading,  setLoading]  = useState(false);
  const [status,   setStatus]   = useState('');
  const [autoPlay, setAutoPlay] = useState(true);
  const [usingMock,setUsingMock]= useState(false);
  const [toast,    setToast]    = useState(null);

  // video
  const [playing,  setPlaying]  = useState(false);
  const [curTime,  setCurTime]  = useState(0);
  const [dur,      setDur]      = useState(0);
  const [vol,      setVol]      = useState(0.8);
  const [speed,    setSpeed]    = useState(1);
  const [hasStream,setHasStream]= useState(false);
  const [loadClip, setLoadClip] = useState(false);

  const videoRef = useRef(null);
  const hlsRef   = useRef(null);
  const pollRef  = useRef(null);
  const listRef  = useRef(null);
  const tlRef    = useRef(null);

  // silent auto-auth on mount
  useEffect(() => {
    login('demo@okdriver.in', '12345678').catch(() => {});
  }, []);

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── filtered clips ────────────────────────────────────────────────────────
  const visible = clips.filter(c =>
    channel === 'both' || String(c.channel) === channel
  );

  // ── LOAD CLIPS ────────────────────────────────────────────────────────────
  async function handleFetch() {
    setLoading(true);
    setClips([]);
    setActiveIdx(-1);
    setHasStream(false);
    setUsingMock(false);
    setStatus('Requesting clips from device…');

    try {
      const chans = channel === 'both' ? [1, 2] : [parseInt(channel)];
      await Promise.all(chans.map(ch => requestClipList(DEMO_IMEI, date, ch).catch(() => {})));
      setStatus('Waiting for device…');

      let polls = 0;
      clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        polls++;
        try {
          const raw = await getVideoList(DEMO_IMEI);
          const arr = Array.isArray(raw) ? raw : [];

          if (arr.length > 0) {
            clearInterval(pollRef.current);
            const normalized = arr
              .map(c => ({
                filename:  c.filename || c.name || c.file || '',
                channel:   c.channel ?? 1,
                startTime: c.startTime || c.start_time || null,
                duration:  c.duration ?? 60,
              }))
              .filter(c => c.filename)
              .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            setClips(normalized);
            setStatus('');
            setLoading(false);
            showToast(`${normalized.length} clips loaded`, 'success');
          } else if (polls >= POLL_MAX) {
            throw new Error('timeout');
          } else {
            setStatus(`Polling device… (${polls}/${POLL_MAX})`);
          }
        } catch {
          if (polls >= POLL_MAX) {
            clearInterval(pollRef.current);
            fallbackToMock();
          }
        }
      }, POLL_MS);
    } catch {
      fallbackToMock();
    }
  }

  function fallbackToMock() {
    const filtered = MOCK_CLIPS.filter(c => {
      if (channel === 'both') return true;
      return String(c.channel) === channel;
    });
    setClips(MOCK_CLIPS); // keep all for timeline
    setUsingMock(true);
    setLoading(false);
    setStatus('');
    showToast(`Demo mode — ${filtered.length} sample clips loaded`, 'info');
  }

  useEffect(() => () => clearInterval(pollRef.current), []);

  // ── PLAY CLIP ─────────────────────────────────────────────────────────────
  const playClip = useCallback(async (idx) => {
    const clip = visible[idx];
    if (!clip) return;
    setActiveIdx(idx);
    setLoadClip(true);
    setPlaying(false);
    setCurTime(0);
    setDur(0);

    // scroll list
    setTimeout(() => {
      listRef.current?.querySelector(`[data-idx="${idx}"]`)
        ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, 80);

    // scroll timeline to keep active segment visible
    setTimeout(() => {
      if (clip.startTime && tlRef.current) {
        const x = toX(clip.startTime);
        tlRef.current.scrollLeft = Math.max(0, x - 200);
      }
    }, 80);

    try {
      let url = '';
      if (!usingMock) {
        const res = await startPlayback(DEMO_IMEI, clip.filename);
        url = res?.streamUrl || res?.url || res?.hlsUrl ||
              res?.data?.url || res?.data?.streamUrl || '';
      }
      // Always fall back to demo video if no real URL
      if (!url) {
        const vidIdx = idx % DEMO_VIDEOS.length;
        url = DEMO_VIDEOS[vidIdx];
      }
      setHasStream(true);
      setLoadClip(false);
      attachStream(url);
    } catch {
      const vidIdx = idx % DEMO_VIDEOS.length;
      setHasStream(true);
      setLoadClip(false);
      attachStream(DEMO_VIDEOS[vidIdx]);
    }
  }, [visible, usingMock]); // eslint-disable-line

  function attachStream(url) {
    const v = videoRef.current;
    if (!v) return;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(v);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { v.play().catch(() => {}); });
    } else {
      v.src = url;
      v.load();
      v.play().catch(() => {});
    }
  }

  // video event bindings
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime  = () => setCurTime(v.currentTime);
    const onDur   = () => setDur(v.duration);
    const onPlay  = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      setPlaying(false);
      if (autoPlay) {
        const next = activeIdx + 1;
        if (next < visible.length) playClip(next);
      }
    };
    v.addEventListener('timeupdate',    onTime);
    v.addEventListener('durationchange',onDur);
    v.addEventListener('play',          onPlay);
    v.addEventListener('pause',         onPause);
    v.addEventListener('ended',         onEnded);
    return () => {
      v.removeEventListener('timeupdate',    onTime);
      v.removeEventListener('durationchange',onDur);
      v.removeEventListener('play',          onPlay);
      v.removeEventListener('pause',         onPause);
      v.removeEventListener('ended',         onEnded);
    };
  }, [autoPlay, activeIdx, visible, playClip]);

  useEffect(() => { if (videoRef.current) videoRef.current.volume = vol; }, [vol]);
  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = speed; }, [speed]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    playing ? v.pause() : v.play().catch(() => {});
  }

  function seek(e) {
    const v = videoRef.current;
    if (!v || !dur) return;
    const r = e.currentTarget.getBoundingClientRect();
    v.currentTime = ((e.clientX - r.left) / r.width) * dur;
  }

  function cycleSpeed() {
    const steps = [0.5, 1, 1.5, 2, 4];
    setSpeed(s => steps[(steps.indexOf(s) + 1) % steps.length]);
  }

  const activeClip = visible[activeIdx] ?? null;

  // cursor X = left-edge of active segment + progress into it
  const cursorX = activeClip?.startTime
    ? toX(activeClip.startTime) + (dur > 0 ? (curTime / dur) * segW(activeClip.duration) : 0)
    : null;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      {/* ── HEADER ── */}
      <header className="header">
        <span className="header-logo-text">okDriver</span>
        <div className="header-divider" />
        <span className="header-title">DVR History Playback</span>
        <div className="header-spacer" />
        {usingMock && (
          <span style={{ fontSize: 11, background: 'rgba(245,158,11,.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,.3)', borderRadius: 6, padding: '3px 10px' }}>
            Demo Mode
          </span>
        )}
        <div className="header-badge">
          <span className="dot" />
          DL5CJ7355 — OKD200
        </div>
      </header>

      <div className="main-content">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-filters">
            <div>
              <div className="filter-label">Date</div>
              <input
                id="date-picker"
                className="date-input"
                type="date"
                value={date}
                max={today}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div>
              <div className="filter-label">Camera</div>
              <div className="cam-tabs">
                {CHANNEL_OPTS.map(o => (
                  <button
                    key={o.value}
                    id={`cam-tab-${o.value}`}
                    className={`cam-tab${channel === o.value ? ' active' : ''}`}
                    onClick={() => setChannel(o.value)}
                  >{o.label}</button>
                ))}
              </div>
            </div>
            <button
              id="fetch-clips-btn"
              className="fetch-btn"
              onClick={handleFetch}
              disabled={loading}
            >
              {loading
                ? <><span className="spinner" />{status || 'Loading…'}</>
                : '⟳  Load Clips'}
            </button>
          </div>

          <div className="clip-list-header">
            <h3>Clips</h3>
            <span className="clip-count">{visible.length}</span>
          </div>

          {visible.length === 0 && !loading && (
            <div className="no-clips-msg">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
                <path d="M15 10l4.553-2.369A1 1 0 0121 8.56v6.88a1 1 0 01-1.447.889L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
              </svg>
              Select a date and load clips
            </div>
          )}

          <div className="clip-list" ref={listRef}>
            {visible.map((c, i) => {
              const ts  = c.startTime ? dayjs(c.startTime).format('HH:mm:ss') : c.filename;
              const cc  = camCls(c.channel);
              return (
                <div
                  key={c.filename + i}
                  data-idx={i}
                  id={`clip-item-${i}`}
                  className={`clip-item${activeIdx === i ? ' active' : ''}`}
                  onClick={() => playClip(i)}
                  title={c.filename}
                >
                  <div className={`clip-icon ${cc}`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div className="clip-info">
                    <div className="clip-time">{ts}</div>
                    <div className="clip-name">{c.filename}</div>
                  </div>
                  <span className={`clip-cam-tag ${cc}`}>{camLabel(c.channel)}</span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── VIDEO AREA ── */}
        <div className="video-area">

          {/* Player */}
          <div className="video-panel" id="video-panel">
            <video
              ref={videoRef}
              id="main-video"
              className="video-el"
              playsInline
              crossOrigin="anonymous"
            />

            {/* Empty state */}
            {!hasStream && !loadClip && (
              <div className="video-overlay">
                <button
                  id="overlay-play-btn"
                  className="overlay-play-btn"
                  onClick={() => visible.length > 0 && playClip(0)}
                  aria-label="Play first clip"
                >
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
                <span className="overlay-text">
                  {visible.length > 0 ? 'Click a clip or timeline segment to play' : 'Load clips to begin'}
                </span>
              </div>
            )}

            {/* Loading clip */}
            {loadClip && (
              <div className="video-overlay">
                <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
                <span className="overlay-text">Starting playback…</span>
              </div>
            )}

            {/* Controls */}
            {hasStream && (
              <div className={`video-controls${!playing ? ' always-show' : ''}`}>
                {/* Scrubber */}
                <div
                  id="progress-bar"
                  className="progress-bar-wrap"
                  onClick={seek}
                  role="slider"
                  aria-label="Seek"
                  aria-valuenow={Math.round(curTime)}
                  aria-valuemax={Math.round(dur)}
                >
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${dur > 0 ? (curTime / dur) * 100 : 0}%` }}
                  />
                </div>

                <div className="controls-row">
                  {/* ◀◀ prev */}
                  <button id="prev-clip-btn" className="ctrl-btn" title="Previous clip"
                    onClick={() => activeIdx > 0 && playClip(activeIdx - 1)}
                    disabled={activeIdx <= 0}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
                    </svg>
                  </button>

                  {/* ▶ play/pause */}
                  <button id="play-pause-btn" className="ctrl-btn" title={playing?'Pause':'Play'}
                    onClick={togglePlay}>
                    {playing
                      ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                      : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>}
                  </button>

                  {/* ▶▶ next */}
                  <button id="next-clip-btn" className="ctrl-btn" title="Next clip"
                    onClick={() => activeIdx < visible.length - 1 && playClip(activeIdx + 1)}
                    disabled={activeIdx >= visible.length - 1}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                    </svg>
                  </button>

                  {/* Volume */}
                  <button id="mute-btn" className="ctrl-btn" title="Mute"
                    onClick={() => setVol(v => v > 0 ? 0 : 0.8)}>
                    {vol === 0
                      ? <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0017 19.73l2 2L20.73 20 4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></svg>
                      : <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>}
                  </button>
                  <input id="volume-slider" className="vol-slider" type="range"
                    min="0" max="1" step="0.05" value={vol}
                    onChange={e => setVol(+e.target.value)} aria-label="Volume" />

                  <span className="time-display">{fmt(curTime)} / {fmt(dur)}</span>
                  <div className="ctrl-spacer" />

                  {/* Speed */}
                  <button id="speed-btn" className="speed-btn" onClick={cycleSpeed} title="Speed">
                    {speed}×
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── NOW PLAYING BAR ── */}
          <div className="now-playing">
            <span className="np-label">Now Playing</span>
            {activeClip ? (
              <>
                <span className="np-info">
                  {activeClip.startTime
                    ? dayjs(activeClip.startTime).format('YYYY-MM-DD HH:mm:ss')
                    : activeClip.filename}
                </span>
                <span className={`np-cam ${camCls(activeClip.channel)}`}>
                  {camLabel(activeClip.channel)}
                </span>
                {autoPlay && activeIdx + 1 < visible.length && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                    → Next: {visible[activeIdx+1].startTime
                      ? dayjs(visible[activeIdx+1].startTime).format('HH:mm:ss')
                      : visible[activeIdx+1].filename}
                  </span>
                )}
              </>
            ) : (
              <span className="np-info" style={{ color: 'var(--text-muted)' }}>No clip selected</span>
            )}
            <div className="np-nav">
              {/* Auto-play toggle */}
              <label id="autoplay-label" className="auto-play-toggle" style={{ marginRight: 10 }}>
                <div id="autoplay-toggle"
                  className={`toggle-switch${autoPlay ? ' on' : ''}`}
                  onClick={() => setAutoPlay(a => !a)} />
                Auto-play
              </label>
              <button id="prev-btn" className="np-nav-btn"
                disabled={activeIdx <= 0}
                onClick={() => playClip(activeIdx - 1)}>‹ Prev</button>
              <button id="next-btn" className="np-nav-btn"
                disabled={activeIdx < 0 || activeIdx >= visible.length - 1}
                onClick={() => playClip(activeIdx + 1)}>Next ›</button>
            </div>
          </div>

          {/* ── TIMELINE ── */}
          <div className="timeline-section">
            <div className="timeline-header">
              <span className="timeline-title">
                ◉ History Timeline
                <span style={{ color:'var(--text-muted)', fontWeight:400, textTransform:'none', letterSpacing:0 }}>
                  &nbsp;{date}
                </span>
              </span>
              <div className="timeline-legend">
                <span className="legend-item">
                  <span className="legend-dot" style={{ background:'var(--clip-fwd)' }}/> Forward
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ background:'var(--clip-in)' }}/> In-Cabin
                </span>
              </div>
            </div>

            <div className="timeline-scroll-wrap" id="timeline-scroll" ref={tlRef}>
              <div className="timeline-track" style={{ width: TL_W }}>

                {/* Hour labels */}
                <div className="timeline-hours" style={{ width: TL_W }}>
                  {HOURS.map(h => (
                    <span key={h}>
                      <span className="hour-label" style={{ left: (h/24)*TL_W }}>
                        {String(h).padStart(2,'0')}:00
                      </span>
                      <span className="hour-tick" style={{ left: (h/24)*TL_W }} />
                    </span>
                  ))}
                </div>

                {/* Lanes */}
                <div className="timeline-lanes" style={{ width: TL_W }}>
                  <span className="lane-label fwd">FWD</span>
                  <span className="lane-label in">IN</span>

                  {/* All clips — even filtered-out channels show on timeline */}
                  {clips.map((c, i) => {
                    if (!c.startTime) return null;
                    const x   = toX(c.startTime);
                    const w   = segW(c.duration);
                    const cc  = camCls(c.channel);
                    const vIdx = visible.indexOf(c);
                    const isActive = vIdx !== -1 && vIdx === activeIdx;
                    return (
                      <div
                        key={c.filename + i}
                        id={`tl-seg-${i}`}
                        className={`clip-segment ${cc}${isActive ? ' playing' : ''}`}
                        style={{ left: x, width: w }}
                        title={`${dayjs(c.startTime).format('HH:mm:ss')} — ${camLabel(c.channel)}`}
                        onClick={() => { if (vIdx !== -1) playClip(vIdx); }}
                      />
                    );
                  })}

                  {/* Live playhead */}
                  {cursorX !== null && (
                    <div
                      id="timeline-cursor"
                      className="timeline-cursor"
                      style={{ left: cursorX }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className="toast-wrap">
        {toast && (
          <div id="toast-msg" className={`toast ${toast.type}`}>
            {toast.type === 'success' && '✓ '}
            {toast.type === 'error'   && '✕ '}
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}

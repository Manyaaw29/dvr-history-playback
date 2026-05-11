import axios from 'axios';

// Proxied through Vite dev server to avoid CORS
const SMART = '/smart';
const DASHCAM = '/dashcam';

let _token = localStorage.getItem('okd_token') || null;

export function setToken(t) {
  _token = t;
  localStorage.setItem('okd_token', t);
}
export function getToken() { return _token; }
export function clearToken() {
  _token = null;
  localStorage.removeItem('okd_token');
}

function ah() {
  return _token ? { Authorization: `Bearer ${_token}` } : {};
}

/** Authenticate and store token */
export async function login(email, password) {
  const res = await axios.post(
    `${DASHCAM}/user/auth/login`,
    { email, password },
    { headers: { 'Content-Type': 'application/json' } }
  );
  const token =
    res.data?.data?.token ||
    res.data?.token ||
    res.data?.accessToken ||
    res.data?.data?.accessToken;
  if (token) setToken(token);
  return res.data;
}

/** Step 1 — request device to prepare clip list */
export async function requestClipList(imei, date, channel = 1) {
  const res = await axios.post(
    `${SMART}/api/playback/request-list/${imei}`,
    { channel, date },
    { headers: { ...ah(), 'Content-Type': 'application/json' } }
  );
  return res.data;
}

/** Step 2 — fetch clip list (poll until filled) */
export async function getVideoList(imei) {
  const res = await axios.get(
    `${SMART}/api/playback/videos/${imei}`,
    { headers: ah(), params: { parsed: true } }
  );
  return res.data?.data || res.data || [];
}

/** Step 3 — start a specific clip stream */
export async function startPlayback(imei, filename) {
  const res = await axios.post(
    `${SMART}/api/playback/start/${imei}`,
    { filename },
    { headers: { ...ah(), 'Content-Type': 'application/json' } }
  );
  return res.data;
}

/** Fetch vehicle list */
export async function fetchVehicles() {
  const res = await axios.get(`${DASHCAM}/api/vehicle/list`, {
    headers: ah(),
  });
  return res.data?.data || res.data || [];
}

export const DEMO_IMEI = '864993060968006';
export const DEMO_VEHICLE = 'DL5CJ7355 — OKD200';

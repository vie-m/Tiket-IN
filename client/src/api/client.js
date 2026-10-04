// ALL fetch calls live here. Adds the Authorization header automatically when logged in.
// In dev this is empty (Vite proxies /api). In production set VITE_API_URL to the deployed API, e.g. https://tiket-in-api.onrender.com
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// AuthContext registers a function here; we call it on any 401 so the user gets logged out.
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    // 401 on a protected call = expired/invalid token. (Login's own 401 is "wrong password", not a logout.)
    if (res.status === 401 && token) onUnauthorized();
    const err = new Error(data.error || 'Something went wrong');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  register: (fullName, email, password) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ fullName, email, password }) }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  getEvents: () => request('/events'),
  getEvent: (id) => request(`/events/${id}`),
  getSeats: (id) => request(`/events/${id}/seats`),
  createOrder: (eventId, seatIds) =>
    request('/orders', { method: 'POST', body: JSON.stringify({ eventId, seatIds }) }),
  myOrders: () => request('/orders/mine'),
  getOrder: (id) => request(`/orders/${id}`),
  salesReport: () => request('/reports/sales'),
};

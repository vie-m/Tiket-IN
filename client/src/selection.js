// Remembers the chosen seats in sessionStorage so they survive the trip to the login page.
const KEY = 'seatSelection';
export const loadSelection = () => {
  try { return JSON.parse(sessionStorage.getItem(KEY)) || null; } catch { return null; }
};
export const saveSelection = (eventId, seatIds) =>
  sessionStorage.setItem(KEY, JSON.stringify({ eventId, seatIds }));
export const clearSelection = () => sessionStorage.removeItem(KEY);

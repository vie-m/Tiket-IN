// Proves double booking is impossible:
// 10 users-worth of requests try to book the SAME seat at the SAME time.
// Expected: exactly 1 success (201) and 9 conflicts (409).
// Usage: start the server (npm start), then: npm run test:concurrency
const API = process.env.API_URL || 'http://localhost:4000/api';

async function call(path, options = {}) {
  const res = await fetch(API + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

// 1) log in as demo customer
const login = await call('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'sari@demo.com', password: 'Password123' }),
});
if (login.status !== 200) {
  console.error('Login failed:', login.body);
  process.exit(1);
}
const token = login.body.token;
const auth = { Authorization: `Bearer ${token}` };

// 2) pick one available seat for one event
const eventId = 2; // Jazz Night Bandung
const seats = await call(`/events/${eventId}/seats`);
const seat = seats.body.find((s) => s.status === 'available');
console.log(`Target: event ${eventId}, seat ${seat.rowLabel}${seat.seatNumber} (id ${seat.id})`);

// 3) fire 10 booking requests at once
const results = await Promise.all(
  Array.from({ length: 10 }, () =>
    call('/orders', {
      method: 'POST',
      headers: auth,
      body: JSON.stringify({ eventId, seatIds: [seat.id] }),
    })
  )
);

const success = results.filter((r) => r.status === 201).length;
const conflict = results.filter((r) => r.status === 409).length;
const other = results.length - success - conflict;

console.log(`Requests sent : ${results.length}`);
console.log(`Succeeded (201): ${success}`);
console.log(`Conflicts (409): ${conflict}`);
if (other) console.log(`Other statuses : ${other}`, results.filter((r) => ![201, 409].includes(r.status)).map((r) => r.status));
console.log(success === 1 && conflict === 9 ? 'PASS' : 'FAIL');
process.exit(success === 1 && conflict === 9 ? 0 : 1);

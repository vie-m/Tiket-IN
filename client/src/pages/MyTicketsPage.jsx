import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDate, formatPrice } from '../utils.js';
import Loading from '../components/Loading.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function MyTicketsPage() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.myOrders().then(setOrders).catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!orders) return <Loading />;
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">My Tickets</h1>
      {orders.length === 0 && <p>You have no orders yet.</p>}
      <div className="space-y-4">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border bg-white p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <h2 className="text-lg font-semibold">{o.event.title}</h2>
              <span className="text-sm text-slate-500">Order #{o.id}</span>
            </div>
            <p className="text-sm text-slate-500">{formatDate(o.event.startsAt)} - {o.venue.name}, {o.venue.city}</p>
            <p className="mt-2">Seats: <strong>{o.tickets.map((t) => t.seat).join(', ')}</strong></p>
            <p>Total: <strong>{formatPrice(o.totalAmount)}</strong></p>
          </div>
        ))}
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { formatDate, formatPrice } from '../utils.js';
import Loading from '../components/Loading.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function ReportsPage() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.salesReport().then(setRows).catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!rows) return <Loading />;
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Sales report</h1>
      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100">
            <tr><th className="p-3">Event</th><th className="p-3">Date</th><th className="p-3">Orders</th><th className="p-3">Tickets</th><th className="p-3">Revenue</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.eventId} className="border-t">
                <td className="p-3">{r.title}</td>
                <td className="p-3">{formatDate(r.startsAt)}</td>
                <td className="p-3">{r.ordersCount}</td>
                <td className="p-3">{r.ticketsSold}</td>
                <td className="p-3">{formatPrice(r.totalRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

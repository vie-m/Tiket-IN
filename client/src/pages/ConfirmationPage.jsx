import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { formatDate, formatPrice } from '../utils.js';
import Loading from '../components/Loading.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function ConfirmationPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getOrder(orderId).then(setOrder).catch((e) => setError(e.message));
  }, [orderId]);

  if (error) return <ErrorMessage message={error} />;
  if (!order) return <Loading />;
  return (
    <div className="mx-auto max-w-lg space-y-3 rounded-xl border bg-white p-6">
      <h1 className="text-2xl font-bold text-green-600">Booking confirmed!</h1>
      <p>Order number: <strong>#{order.id}</strong></p>
      <p><strong>{order.event.title}</strong><br />{formatDate(order.event.startsAt)} - {order.venue.name}, {order.venue.city}</p>
      <p>Seats: <strong>{order.tickets.map((t) => t.seat).join(', ')}</strong></p>
      <p>Total: <strong>{formatPrice(order.totalAmount)}</strong></p>
      <Link className="btn" to="/my-tickets">View my tickets</Link>
    </div>
  );
}

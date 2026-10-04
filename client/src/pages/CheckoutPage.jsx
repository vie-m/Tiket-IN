import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { clearSelection, loadSelection, saveSelection } from '../selection.js';
import { formatDate } from '../utils.js';
import OrderSummary from '../components/OrderSummary.jsx';
import Loading from '../components/Loading.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const selection = loadSelection();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!selection || selection.seatIds.length === 0) return;
    api.getEvent(selection.eventId).then(setEvent).catch((e) => setError(e.message));
    api.getSeats(selection.eventId).then(setSeats).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!selection || selection.seatIds.length === 0) {
    return <p>No seats selected. <Link className="text-indigo-600 underline" to="/">Browse events</Link></p>;
  }
  if (error && !event) return <ErrorMessage message={error} />;
  if (!event || !seats) return <Loading />;

  const chosen = seats.filter((s) => selection.seatIds.includes(s.id));

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      const order = await api.createOrder(selection.eventId, selection.seatIds);
      clearSelection();
      navigate(`/confirmation/${order.id}`, { replace: true });
    } catch (err) {
      if (err.status === 409) {
        // some seats were just taken: remove them from the selection and go back to the (refreshed) seat map
        const takenIds = (err.data.takenSeats || []).map((s) => s.id);
        const labels = (err.data.takenSeats || []).map((s) => s.label).join(', ');
        saveSelection(selection.eventId, selection.seatIds.filter((id) => !takenIds.includes(id)));
        navigate(`/events/${selection.eventId}`, {
          state: { conflict: `Sorry, these seats were just taken: ${labels || 'one or more seats'}. Please choose others.` },
        });
        return;
      }
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border bg-white p-6">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div>
        <p className="text-sm text-slate-500">Booking for</p>
        <p className="font-semibold">{user.fullName} ({user.email})</p>
      </div>
      <div>
        <p className="text-sm text-slate-500">Event</p>
        <p className="font-semibold">{event.title}</p>
        <p className="text-sm text-slate-500">{formatDate(event.startsAt)} - {event.venue.name}</p>
      </div>
      <OrderSummary seats={chosen} />
      <ErrorMessage message={error} />
      <button className="btn w-full" disabled={submitting} onClick={handleConfirm}>
        {submitting ? 'Booking...' : 'Confirm booking'}
      </button>
      <Link className="block text-center text-sm text-slate-500 underline" to={`/events/${selection.eventId}`}>Back to seat map</Link>
    </div>
  );
}

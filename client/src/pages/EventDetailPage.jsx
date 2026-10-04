import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../utils.js';
import { loadSelection, saveSelection } from '../selection.js';
import SeatMap from '../components/SeatMap.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import { formatPrice } from '../utils.js';
import Loading from '../components/Loading.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

const MAX_SEATS = 6;

export default function EventDetailPage() {
  const eventId = Number(useParams().id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => {
    // restore seats chosen before a login redirect / conflict
    const saved = loadSelection();
    return saved && saved.eventId === eventId ? saved.seatIds : [];
  });
  const [error, setError] = useState('');
  // set by CheckoutPage when booking returned 409
  const [conflict, setConflict] = useState(location.state?.conflict || '');

  const loadSeats = useCallback(
    () => api.getSeats(eventId).then(setSeats).catch((e) => setError(e.message)),
    [eventId]
  );

  useEffect(() => {
    api.getEvent(eventId).then(setEvent).catch((e) => setError(e.message));
    loadSeats();
    // refresh seat status every 15 seconds to show seats booked by others
    const timer = setInterval(loadSeats, 15000);
    return () => clearInterval(timer);
  }, [eventId, loadSeats]);

  // drop selected seats that became sold meanwhile; keep storage in sync
  useEffect(() => {
    if (!seats) return;
    const soldIds = new Set(seats.filter((s) => s.status === 'sold').map((s) => s.id));
    setSelectedIds((ids) => (ids.some((id) => soldIds.has(id)) ? ids.filter((id) => !soldIds.has(id)) : ids));
  }, [seats]);
  useEffect(() => { saveSelection(eventId, selectedIds); }, [eventId, selectedIds]);

  const toggleSeat = (seat) => {
    setError('');
    setSelectedIds((ids) => {
      if (ids.includes(seat.id)) return ids.filter((id) => id !== seat.id);
      if (ids.length >= MAX_SEATS) { setError(`You can select at most ${MAX_SEATS} seats`); return ids; }
      return [...ids, seat.id];
    });
  };

  const handleContinue = () => {
    if (!user) {
      // go to login, then come straight back here (selection is in sessionStorage)
      navigate('/login', { state: { from: { pathname: `/events/${eventId}` } } });
    } else {
      navigate('/checkout');
    }
  };

  if (error && !event) return <ErrorMessage message={error} />;
  if (!event || !seats) return <Loading />;

  const selectedSeats = seats.filter((s) => selectedIds.includes(s.id));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 pb-24 lg:grid-cols-[minmax(0,1fr)_280px] lg:pb-0">
      <div>
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <p className="text-slate-500">{formatDate(event.startsAt)} - {event.venue.name}, {event.venue.city}</p>
        <p className="my-3">{event.description}</p>
        {conflict && <div className="mb-3"><ErrorMessage message={conflict} /></div>}
        {error && <div className="mb-3"><ErrorMessage message={error} /></div>}
        <SeatMap seats={seats} selectedIds={selectedIds} onToggle={toggleSeat} />
      </div>

      <aside className="hidden h-fit space-y-4 rounded-xl border bg-white p-4 lg:sticky lg:top-4 lg:block">
        <OrderSummary seats={selectedSeats} />
        <button className="btn w-full" disabled={selectedSeats.length === 0} onClick={handleContinue}>
          Continue
        </button>
        <p className="text-xs text-slate-500">Max {MAX_SEATS} seats. Seat status refreshes every 15 seconds.</p>
      </aside>

      {/* Phone: fixed bottom bar so "Continue" is always reachable */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex items-center gap-3 border-t bg-white px-4 py-3 shadow-lg lg:hidden">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {selectedSeats.length ? selectedSeats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ') : 'No seats selected'}
          </p>
          <p className="text-sm text-slate-500">{formatPrice(selectedSeats.reduce((sum, s) => sum + s.price, 0))}</p>
        </div>
        <button className="btn" disabled={selectedSeats.length === 0} onClick={handleContinue}>Continue</button>
      </div>
    </div>
  );
}

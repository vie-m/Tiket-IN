import { Link } from 'react-router-dom';
import { formatDate, formatPrice } from '../utils.js';

export default function EventCard({ event }) {
  const soldOut = event.availableSeats === 0;
  return (
    <Link to={`/events/${event.id}`} className="block overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md">
      <div className="flex h-28 items-end bg-gradient-to-br from-indigo-500 to-purple-600 p-3">
        <span className="rounded bg-white/90 px-2 py-0.5 text-xs font-semibold text-indigo-700">{event.category}</span>
      </div>
      <div className="space-y-1 p-4">
        <h3 className="text-lg font-semibold">{event.title}</h3>
        <p className="text-sm text-slate-500">{formatDate(event.startsAt)}</p>
        <p className="text-sm text-slate-500">{event.venueName}, {event.city}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="font-medium">From {formatPrice(event.lowestPrice)}</span>
          <span className={`text-sm ${soldOut ? 'text-red-600' : 'text-green-600'}`}>
            {soldOut ? 'Sold out' : `${event.availableSeats} seats left`}
          </span>
        </div>
      </div>
    </Link>
  );
}

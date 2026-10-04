import { formatPrice } from '../utils.js';

// Shows chosen seats + running total. `seats` = array of seat objects.
export default function OrderSummary({ seats }) {
  const total = seats.reduce((sum, s) => sum + s.price, 0);
  const labels = seats.map((s) => `${s.rowLabel}${s.seatNumber}`).join(', ');
  return (
    <div className="space-y-1">
      <p className="text-sm text-slate-500">Selected seats</p>
      <p className="font-semibold">{labels || 'None yet'}</p>
      <p className="text-sm text-slate-500">Total</p>
      <p className="text-xl font-bold">{formatPrice(total)}</p>
    </div>
  );
}

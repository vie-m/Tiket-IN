import Seat from './Seat.jsx';
import SeatLegend from './SeatLegend.jsx';

// Draws seats row by row under a STAGE label. Scrolls sideways on small screens.
export default function SeatMap({ seats, selectedIds, onToggle }) {
  // group the flat seat list by row label
  const rows = {};
  for (const s of seats) (rows[s.rowLabel] ||= []).push(s);

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="overflow-x-auto">
        <div className="mx-auto w-max">
          <div className="mb-6 rounded bg-slate-800 py-2 text-center text-sm font-bold tracking-widest text-white">STAGE</div>
          {Object.entries(rows).map(([label, rowSeats]) => (
            <div key={label} className="mb-2 flex items-center gap-1">
              <span className="w-6 text-sm font-semibold text-slate-500">{label}</span>
              {rowSeats.map((s) => (
                <Seat key={s.id} seat={s} selected={selectedIds.includes(s.id)} onToggle={onToggle} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <SeatLegend />
    </div>
  );
}

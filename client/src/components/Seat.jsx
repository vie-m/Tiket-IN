// One seat button. Style depends on: sold / selected / VIP vs Regular.
export default function Seat({ seat, selected, onToggle }) {
  const sold = seat.status === 'sold';
  let style;
  if (sold) style = 'bg-slate-300 text-slate-400 cursor-not-allowed';
  else if (selected) style = 'bg-indigo-600 text-white ring-2 ring-indigo-300';
  else if (seat.section === 'VIP') style = 'bg-amber-200 text-amber-900 hover:bg-amber-300 border border-amber-400';
  else style = 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300';

  return (
    <button
      type="button"
      disabled={sold}
      onClick={() => onToggle(seat)}
      title={`${seat.rowLabel}${seat.seatNumber} (${seat.section})${sold ? ' - sold' : ''}`}
      aria-label={`Seat ${seat.rowLabel}${seat.seatNumber} ${sold ? 'sold' : seat.section}`}
      className={`h-10 w-10 sm:h-8 sm:w-8 shrink-0 rounded-t-lg text-sm sm:text-xs font-medium ${style}`}
    >
      {seat.seatNumber}
    </button>
  );
}

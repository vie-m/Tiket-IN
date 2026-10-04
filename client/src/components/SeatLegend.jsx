export default function SeatLegend() {
  const items = [
    ['bg-amber-200 border border-amber-400', 'VIP available'],
    ['bg-emerald-100 border border-emerald-300', 'Regular available'],
    ['bg-indigo-600', 'Selected'],
    ['bg-slate-300', 'Sold'],
  ];
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
      {items.map(([cls, label]) => (
        <span key={label} className="flex items-center gap-2">
          <span className={`inline-block h-4 w-4 rounded-t ${cls}`} />
          {label}
        </span>
      ))}
    </div>
  );
}

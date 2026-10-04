export default function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-red-700">
      {message}
    </div>
  );
}

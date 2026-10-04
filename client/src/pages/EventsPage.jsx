import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import EventCard from '../components/EventCard.jsx';
import Loading from '../components/Loading.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function EventsPage() {
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getEvents().then(setEvents).catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorMessage message={error} />;
  if (!events) return <Loading />;
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Upcoming events</h1>
      {events.length === 0 && <p>No upcoming events.</p>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => <EventCard key={e.id} event={e} />)}
      </div>
    </>
  );
}

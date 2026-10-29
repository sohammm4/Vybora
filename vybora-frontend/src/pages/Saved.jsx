import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Grid } from '../components';
import { useSaved } from '../saved';
import { fetchEventById, normalizeEvents } from '../services/api';

export default function Saved() {
  const savedIds = useSaved();
  const savedKey = savedIds.join('|');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(savedIds.length > 0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const ids = savedKey ? savedKey.split('|') : [];
    setLoading(ids.length > 0);
    setError('');
    setEvents([]);

    if (!ids.length) return () => { active = false; };

    Promise.allSettled(ids.map((id) => fetchEventById(id)))
      .then((results) => {
        if (!active) return;
        const liveEvents = results
          .filter((result) => result.status === 'fulfilled')
          .map((result) => result.value.event);
        const failedCount = results.filter((result) => result.status === 'rejected').length;
        setEvents(normalizeEvents(liveEvents));
        if (failedCount) {
          setError(`${failedCount} saved event${failedCount === 1 ? '' : 's'} could not be retrieved from Ticketmaster.`);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [savedKey]);

  return (
    <section className="sc">
      <h2>Saved concerts</h2>
      <p className="sub">Saved event IDs are stored in this browser; event details are retrieved live from Ticketmaster.</p>
      {loading ? <div className="empty">Loading saved event details...</div> : error ? <div className="empty">{error}</div> : null}
      {!loading && events.length > 0 && <Grid list={events} />}
      {!loading && events.length === 0 && (
        <div className="empty">
          {savedIds.length ? 'No saved events could be loaded from Ticketmaster.' : 'No concerts saved yet.'}
          <br />
          <br />
          <Link className="btn pr" to="/explore">Explore live concerts</Link>
        </div>
      )}
    </section>
  );
}

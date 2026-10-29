import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { art } from '../data';
import { Grid } from '../components';
import { toast } from '../saved';
import { fetchEvents, normalizeEvents } from '../services/api';

export default function Artist() {
  const { id } = useParams();
  const artistName = decodeURIComponent(id || '').replace(/-/g, ' ').trim();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(Boolean(artistName));
  const [error, setError] = useState('');
  const [followed, setFollowed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(Boolean(artistName));
    setError('');

    if (!artistName) return () => { active = false; };

    fetchEvents({ keyword: artistName, size: 12, page: 1 })
      .then(({ events: liveEvents = [] }) => {
        if (!active) return;
        setEvents(normalizeEvents(liveEvents));
      })
      .catch((requestError) => {
        if (!active) return;
        setEvents([]);
        setError(requestError.message || 'Unable to load events for this artist.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [artistName, id]);

  if (!artistName) {
    return (
      <div className="empty">
        <h2>Artist not found</h2>
        <Link className="btn pr" to="/">Home</Link>
      </div>
    );
  }

  return (
    <div className="det">
      <div className="dh" style={{ background: art(270) }}>
        <div>
          <h1>{artistName}</h1>
        </div>
      </div>
      <p className="mu">{loading ? 'Loading artist events...' : 'Upcoming results from Ticketmaster.'}</p>
      <button
        className="btn"
        onClick={() => {
          setFollowed(!followed);
          toast(followed ? 'Unfollowed' : 'Following');
        }}
      >
        {followed ? 'Following' : 'Follow artist'}
      </button>
      <h2>Upcoming concerts</h2>
      {loading ? <div className="empty">Loading upcoming concerts...</div> : error ? <div className="empty">{error}</div> : events.length ? <Grid list={events} /> : <div className="empty">Ticketmaster returned no upcoming events for this artist.</div>}
    </div>
  );
}

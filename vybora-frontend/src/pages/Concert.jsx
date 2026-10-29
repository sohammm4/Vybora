import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { art, fd, fp } from '../data';
import { useSaved, toggle } from '../saved';
import { fetchEventById, normalizeEvents } from '../services/api';
import EventMap from '../EventMap';

export default function Concert() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState('');
  const on = useSaved().includes(id);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchEventById(id)
      .then(({ event: liveEvent }) => {
        if (!active) return;
        setEvent(normalizeEvents([liveEvent])[0] || null);
      })
      .catch((requestError) => {
        if (!active) return;
        setEvent(null);
        setError(requestError.message || 'Could not load this event.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <div className="empty">Loading concert details...</div>;
  }

  if (!event) {
    return (
      <div className="empty">
        <h2>Event details unavailable</h2>
        <p>{error || 'This event could not be found in Ticketmaster.'}</p>
        <Link className="btn pr" to="/explore">Back to explore</Link>
      </div>
    );
  }

  return (
    <div className="det">
      <Link className="mu" to="/explore">Back to explore</Link>
      <div className="dh" style={{ background: art(event.hue), marginTop: 12 }}>
        {event.image && <img className="detail-hero-image" src={event.image} alt="" />}
        <div>
          {event.genre && <span className="tag">{event.genre}</span>}
          <h1>{event.title || 'Event title unavailable'}</h1>
        </div>
      </div>

      <div className="dg">
        <div>
          {event.artist && <h2 style={{ marginTop: 0 }}>{event.artist}</h2>}
          <p className="mu">{event.desc || 'The organizer has not provided additional event details.'}</p>
          <div className="box">
            <p><b>Date</b> {fd(event.date)}{event.time ? ` · ${event.time}` : ''}</p>
            <p><b>Venue</b> {event.venue || 'Venue details unavailable'}</p>
            <p><b>Address</b> {event.address || 'Address unavailable'}</p>
            <p><b>Location</b> {[event.city, event.country].filter(Boolean).join(', ') || 'Location unavailable'}</p>
            <p><b>Price</b> {fp(event)}</p>
            {event.status && <p><b>Ticket status</b> {event.status}</p>}
          </div>

          <h3>Venue location</h3>
          <EventMap events={[event]} selectedId={event.id} compact />
        </div>

        <div className="box" style={{ alignSelf: 'start' }}>
          <p>
            {event.ticket ? (
              <a className="btn pr" href={event.ticket} rel="noopener noreferrer" target="_blank">View tickets</a>
            ) : (
              <span className="mu">Ticket link unavailable from the provider.</span>
            )}
          </p>
          <button className="btn" onClick={() => toggle(id)}>{on ? 'Saved' : 'Save concert'}</button>
          {event.artist && (
            <p><Link className="pr2" to={`/artists/${encodeURIComponent(event.artist.replace(/\s+/g, '-'))}`}>More events by {event.artist}</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}

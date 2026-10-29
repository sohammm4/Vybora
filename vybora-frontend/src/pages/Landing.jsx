import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Grid } from '../components';
import { getSavedLocation } from '../location';
import { fetchEvents, fetchNearbyEvents, normalizeEvents } from '../services/api';

const HOW_IT_WORKS = [
  ['01', 'Explore the map', 'Pan and zoom to find real listed events by location.'],
  ['02', 'Search and filter', 'Find provider listings by artist, city, genre, dates, and price.'],
  ['03', 'Open the official listing', 'Check details and follow the provider ticket link.'],
];

export default function Landing() {
  const navigate = useNavigate();
  const location = getSavedLocation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const request = location
      ? fetchNearbyEvents({ ...location, radius: 200 })
      : fetchEvents({ size: 50, page: 1 });

    request
      .then(({ events: liveEvents = [] }) => {
        if (active) setEvents(normalizeEvents(liveEvents));
      })
      .catch((requestError) => {
        if (!active) return;
        setEvents([]);
        setError(requestError.message || 'Unable to load live events.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [location?.latitude, location?.longitude]);

  const destinations = useMemo(() => {
    const counts = new Map();
    events.forEach((event) => {
      if (!event.city) return;
      const key = `${event.city}, ${event.country || ''}`.trim();
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [events]);

  return (
    <>
      <div className="hero">
        <h1>Every vibe<br />has a <span>location.</span></h1>
        <p>Discover live music around the world using current event listings from Ticketmaster.</p>
        <form
          className="sb"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(`/explore?q=${encodeURIComponent(event.currentTarget.q.value)}`);
          }}
        >
          <input name="q" aria-label="Search" placeholder="Search artist, city, country or venue" />
          <button className="btn pr">Search</button>
        </form>
        <Link className="btn pr" to="/explore">Explore live concerts</Link>
        <div>
          <span className="live"><b />Ticketmaster event listings</span>
        </div>
      </div>

      <section className="sc">
        <h2>{location ? 'Concerts near you' : 'Upcoming concerts'}</h2>
        <p className="sub">{location ? 'Live Ticketmaster listings within 200 km of your saved location.' : 'Live listings provided by Ticketmaster; availability and event details may change at the source.'}</p>
        {loading ? <div className="empty">Loading live events...</div> : error ? <div className="empty">{error}</div> : events.length ? <Grid list={events.slice(0, 4)} /> : <div className="empty">Ticketmaster returned no upcoming events. Try Explore to search by artist or city.</div>}
      </section>

      <section className="sc">
        <h2>Event destinations</h2>
        <p className="sub">Cities derived from the current live event results.</p>
        {loading ? <div className="empty">Loading destinations...</div> : destinations.length ? (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))' }}>
            {destinations.map(([city, count]) => (
              <Link key={city} className="step" to={`/explore?q=${encodeURIComponent(city.split(',')[0])}`}>
                <b>{count} LIVE LISTING{count === 1 ? '' : 'S'}</b>
                <div style={{ fontWeight: 700 }}>{city}</div>
              </Link>
            ))}
          </div>
        ) : <div className="empty">No destination details are available from the provider right now.</div>}
      </section>

      <section className="sc" id="how">
        <h2>How it works</h2>
        <div className="steps" style={{ marginTop: 20 }}>
          {HOW_IT_WORKS.map(([number, title, description]) => (
            <div key={number} className="step">
              <b>{number}</b>
              <h3>{title}</h3>
              <p className="mu">{description}</p>
            </div>
          ))}
        </div>
      </section>
      <footer>
        <div>
          <div className="logo"><i />VYBORA</div>
          <div>Event information and ticket links are provided by Ticketmaster.</div>
        </div>
      </footer>
    </>
  );
}

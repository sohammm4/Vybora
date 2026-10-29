import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { art, fd, fp } from '../data';
import EventMap from '../EventMap';
import { fetchEvents, normalizeEvents } from '../services/api';

const EMPTY = { g: '', co: '', pay: '', from: '', to: '' };

export default function Explore() {
  const [sp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const [searchKeyword, setSearchKeyword] = useState(sp.get('q') || '');
  const [f, setF] = useState(EMPTY);
  const [sort, setSort] = useState('date');
  const [sel, setSel] = useState(null);
  const [focus, setFocus] = useState(null);
  const [m, setM] = useState('list');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSearchKeyword(q.trim()), 500);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const refreshTimer = setInterval(() => setRefreshCount((count) => count + 1), 5 * 60 * 1000);
    return () => clearInterval(refreshTimer);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    fetchEvents({
      keyword: searchKeyword || undefined,
      genre: f.g || undefined,
      size: 50,
      page: 1,
    })
      .then(({ events: liveEvents = [], fetchedAt }) => {
        if (!active) return;
        setEvents(normalizeEvents(liveEvents));
        setUpdatedAt(fetchedAt || new Date().toISOString());
      })
      .catch((err) => {
        if (!active) return;
        setEvents([]);
        setError(err.message || 'Unable to load live events.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [searchKeyword, f.g, refreshCount]);

  const list = useMemo(
    () =>
      events
        .filter((c) => {
          const s = (c.artist + c.title + c.city + c.country + c.venue).toLowerCase();
          return (
            (!q || s.includes(q.toLowerCase())) &&
            (!f.g || c.genre === f.g) &&
            (!f.co || c.country === f.co) &&
            (f.pay === 'free' ? c.price === 0 : f.pay === 'paid' ? typeof c.price === 'number' && c.price > 0 : true) &&
            (!f.from || c.date >= f.from) &&
            (!f.to || c.date <= f.to)
          );
        })
        .sort((a, b) => (sort === 'artist'
          ? (a.artist || '').localeCompare(b.artist || '')
          : (a.date || '').localeCompare(b.date || ''))),
    [events, q, f, sort],
  );

  const n = (q ? 1 : 0) + Object.values(f).filter(Boolean).length;
  const setField = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));
  const clear = () => {
    setQ('');
    setSearchKeyword('');
    setF(EMPTY);
  };
  const pick = (c) => {
    setSel(c.id);
    setFocus({ lon: c.lon, lat: c.lat, k: Math.random() });
    if (window.innerWidth <= 800) setM('map');
  };
  const opt = (k) => [...new Set(events.map((c) => c[k]))].filter(Boolean).sort();

  return (
    <>
      <div className={'ex' + (m === 'map' ? ' m' : '')}>
        <aside className="pn">
          <div className="ctl">
            <input className="w" type="search" aria-label="Search" placeholder="Artist, concert, city, country, venue" value={q} onChange={(e) => setQ(e.target.value)} list="sg" />
            <datalist id="sg">{[...opt('artist'), ...opt('city')].map((x) => <option key={x} value={x} />)}</datalist>
            <select aria-label="Genre" value={f.g} onChange={setField('g')}>
              <option value="">All genres</option>
              {opt('genre').map((x) => <option key={x}>{x}</option>)}
            </select>
            <select aria-label="Country" value={f.co} onChange={setField('co')}>
              <option value="">All countries</option>
              {opt('country').map((x) => <option key={x}>{x}</option>)}
            </select>
            <select aria-label="Price" value={f.pay} onChange={setField('pay')}>
              <option value="">Free &amp; paid</option>
              <option value="free">Free only</option>
              <option value="paid">Paid only</option>
            </select>
            <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="date">Sort: date</option>
              <option value="artist">Sort: artist</option>
            </select>
            <input type="date" aria-label="From date" value={f.from} onChange={setField('from')} />
            <input type="date" aria-label="To date" value={f.to} onChange={setField('to')} />
          </div>

          <div className="rb">
            <span>{loading ? 'Loading...' : `${list.length} concert${list.length === 1 ? '' : 's'}`}</span>
            <div className="rb-actions">
              <button onClick={() => setRefreshCount((count) => count + 1)} disabled={loading}>Refresh live data</button>
              <button onClick={clear} style={{ visibility: n ? 'visible' : 'hidden' }}>Clear all ({n})</button>
            </div>
          </div>
          {updatedAt && <div className="data-updated">Ticketmaster · Updated {new Date(updatedAt).toLocaleTimeString()}</div>}

          <div id="ls">
            {loading ? (
              <div className="empty">Loading live concerts...</div>
            ) : error && events.length === 0 ? (
              <div className="empty">
                {error}
                <br />
                <br />
                <button className="btn" onClick={() => window.location.reload()}>Retry</button>
              </div>
            ) : list.length ? (
              list.map((c) => (
                <div key={c.id} className={'row' + (sel === c.id ? ' sel' : '')} tabIndex="0" role="button" onClick={() => pick(c)} onKeyDown={(e) => e.key === 'Enter' && pick(c)}>
                  <div className="th" style={{ background: art(c.hue) }}>
                    {c.image && <img src={c.image} alt="" loading="lazy" />}
                  </div>
                  <div>
                    <h4>{c.title}</h4>
                    <div className="mu">{c.artist}</div>
                    <div className="mu">{[c.venue, c.city, c.country].filter(Boolean).join(' · ') || 'Venue details unavailable'}</div>
                    <div className="mu">{fd(c.date)} · <span className="pr2">{fp(c)}</span></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty">
                No concerts match these filters.
                <br />
                <br />
                <button className="btn" onClick={clear}>Clear filters</button>
              </div>
            )}
          </div>
        </aside>
        <EventMap events={list} selectedId={sel} onSelect={setSel} focus={focus} />
      </div>

      <div id="tg" style={{ display: undefined }}>
        {['list', 'map'].map((x) => (
          <button key={x} className={m === x ? 'on' : ''} onClick={() => setM(x)}>
            {x === 'list' ? 'List' : 'Map'}
          </button>
        ))}
      </div>
    </>
  );
}

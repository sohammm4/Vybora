import { Link } from 'react-router-dom';
import { useState } from 'react';
import { art, fd, fp } from './data';
import { useSaved, toggle } from './saved';

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <nav>
      <Link className="logo" to="/"><i />VYBORA</Link>
      <button id="bg" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
      <div className={`nl${open ? ' open' : ''}`} onClick={() => setOpen(false)}>
        <Link to="/explore">Explore</Link>
        <a href="/#artists">Discover Artists</a>
        <a href="/#how">How It Works</a>
        <Link to="/saved">Saved</Link>
        <Link className="btn pr" to="/explore" style={{ padding: '6px 14px' }}>Get Started</Link>
      </div>
    </nav>
  );
}

export function Card({ c }) {
  const on = useSaved().includes(c.id);
  return (
    <div className="cw">
      <button className={`sv${on ? ' on' : ''}`} aria-pressed={on} aria-label="Save concert" onClick={() => toggle(c.id)}>♥</button>
      <Link className="card" to={`/concert/${c.id}`}>
        <div className="art" style={{ background: art(c.hue) }}>
          {c.image && <img src={c.image} alt="" loading="lazy" />}
          <em>{c.artist?.[0] || '?'}</em>
          <span className="tag">{c.genre || 'Music'}</span>
        </div>
        <div className="cb">
          <h3>{c.title}</h3>
          <div className="mu">{c.artist}</div>
          <div className="mu">{[c.venue, c.city, c.country].filter(Boolean).join(' · ') || 'Venue details unavailable'}</div>
          <div className="card-meta"><span className="mu">{fd(c.date)}</span><span className="pr2">{fp(c)}</span></div>
        </div>
      </Link>
    </div>
  );
}

export const Grid = ({ list }) => <div className="grid">{list.map((event) => <Card key={event.id} c={event} />)}</div>;

import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { fd, fp } from './data';

const DEFAULT_CENTER = [20, 0];

const hasCoordinates = (event) =>
  Number.isFinite(event.lat) &&
  Number.isFinite(event.lon) &&
  event.lat >= -90 &&
  event.lat <= 90 &&
  event.lon >= -180 &&
  event.lon <= 180;

function MapViewport({ events, focus, compact }) {
  const map = useMap();
  const boundsKey = events.map((event) => `${event.lat},${event.lon}`).join('|');

  useEffect(() => {
    const updateViewport = () => {
      const container = map.getContainer();
      if (!container.clientWidth || !container.clientHeight) return;
      map.invalidateSize({ animate: false, pan: false });

      if (focus && Number.isFinite(focus.lat) && Number.isFinite(focus.lon)) {
        map.setView([focus.lat, focus.lon], compact ? 12 : 7, { animate: true });
      } else if (compact && events.length) {
        map.setView([events[0].lat, events[0].lon], 12);
      } else if (events.length > 1) {
        map.fitBounds(events.map((event) => [event.lat, event.lon]), {
          padding: [48, 48],
          maxZoom: 7,
        });
      } else if (events.length === 1) {
        map.setView([events[0].lat, events[0].lon], 7);
      }
    };

    const observer = new ResizeObserver(updateViewport);
    observer.observe(map.getContainer());
    requestAnimationFrame(updateViewport);
    return () => observer.disconnect();
  }, [map, boundsKey, compact, events, focus]);

  return null;
}

function EventSummary({ event, compact = false }) {
  return (
    <div className={compact ? 'event-map-summary compact' : 'event-map-summary'}>
      {event.image && <img src={event.image} alt="" loading="lazy" />}
      <div className="event-map-summary-copy">
        <strong>{event.title}</strong>
        <span>{event.artist}</span>
        <span>{[event.venue, event.city, event.country].filter(Boolean).join(' · ') || 'Venue details unavailable'}</span>
        <span>{fd(event.date)}{event.time ? ` · ${event.time}` : ''} · {fp(event)}</span>
        <div className="event-map-summary-actions">
          <Link className="btn pr" to={`/concert/${event.id}`}>Event details</Link>
          {event.ticket && (
            <a className="btn" href={event.ticket} target="_blank" rel="noopener noreferrer">
              Tickets
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EventMap({ events = [], selectedId, onSelect = () => {}, focus, compact = false }) {
  const mappableEvents = useMemo(() => events.filter(hasCoordinates), [events]);
  const groups = useMemo(() => {
    const byVenue = new Map();
    mappableEvents.forEach((event) => {
      const key = `${event.lat.toFixed(3)},${event.lon.toFixed(3)}`;
      const group = byVenue.get(key) || [];
      group.push(event);
      byVenue.set(key, group);
    });
    return [...byVenue.values()];
  }, [mappableEvents]);
  const selectedEvent = events.find((event) => event.id === selectedId);

  return (
    <section className={`event-map${compact ? ' compact' : ''}`} aria-label="Concert event map">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={2}
        minZoom={2}
        maxZoom={18}
        zoomControl={false}
        scrollWheelZoom
        worldCopyJump
      >
        <TileLayer
          attribution={'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains={['a', 'b', 'c']}
          maxZoom={19}
        />
        <ZoomControl position="topright" />
        <MapViewport events={mappableEvents} focus={focus} compact={compact} />
        {groups.map((group) => {
          const event = group.find((item) => item.id === selectedId) || group[0];
          const selected = group.some((item) => item.id === selectedId);
          return (
            <CircleMarker
              key={`${event.id}-${group.length}`}
              center={[event.lat, event.lon]}
              radius={selected ? 10 : group.length > 1 ? 9 : 7}
              pathOptions={{
                color: '#ede9fe',
                weight: 2,
                fillColor: selected ? '#ec4899' : '#8b5cf6',
                fillOpacity: 0.95,
              }}
              eventHandlers={{ click: () => onSelect(event.id) }}
            >
              <Popup>
                <div className="event-map-popup">
                  {group.map((item) => (
                    <button key={item.id} onClick={() => onSelect(item.id)}>
                      <strong>{item.title}</strong>
                      <span>{item.artist} · {fd(item.date)}</span>
                    </button>
                  ))}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      {!compact && (
        <div className="event-map-count">
          {mappableEvents.length} mapped event{mappableEvents.length === 1 ? '' : 's'}
          {mappableEvents.length !== events.length && ` · ${events.length - mappableEvents.length} without venue coordinates`}
        </div>
      )}
      {!compact && selectedEvent && <EventSummary event={selectedEvent} />}
      {compact && !mappableEvents.length && (
        <div className="event-map-empty">Ticketmaster did not provide venue coordinates for this event.</div>
      )}
    </section>
  );
}

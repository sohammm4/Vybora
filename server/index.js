import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT || 3001);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const FRONTEND_ORIGINS = [...new Set([
  FRONTEND_URL,
  FRONTEND_URL.replace('localhost', '127.0.0.1'),
  FRONTEND_URL.replace('127.0.0.1', 'localhost'),
])];
const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_BASE = 'https://app.ticketmaster.com/discovery/v2';

app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));
app.use(cors({ origin: FRONTEND_ORIGINS, credentials: true }));
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP.' },
});
app.use('/api', apiLimiter);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const safeNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const toTicketmasterDateTime = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
};

const formatDateValue = (event) => {
  const start = event?.dates?.start || {};
  if (start.localDate) return start.localDate;
  if (start.dateTime) return start.dateTime;
  return null;
};

const normalizeEvent = (event) => {
  if (!event) return null;

  const venue = Array.isArray(event._embedded?.venues) ? event._embedded.venues[0] : {};
  const attraction = Array.isArray(event._embedded?.attractions) ? event._embedded.attractions[0] : null;
  const location = venue.location || {};
  const images = Array.isArray(event.images) ? event.images : [];
  const bestImage = [...images].sort((a, b) => (b.width || 0) - (a.width || 0))[0];
  const classifications = Array.isArray(event.classifications) ? event.classifications : [];
  const primary = classifications.find((item) => item.primary) || classifications[0] || {};
  const priceRange = Array.isArray(event.priceRanges) ? event.priceRanges[0] : null;
  const start = event.dates?.start || {};

  return {
    id: event.id || null,
    artist: attraction?.name || null,
    title: event.name || null,
    genre: primary.genre?.name || primary.segment?.name || null,
    venue: venue.name || null,
    city: venue.city?.name || null,
    country: venue.country?.name || null,
    address: venue.address?.line1 || null,
    latitude: safeNumber(location.latitude),
    longitude: safeNumber(location.longitude),
    date: formatDateValue(event),
    time: start.localTime || null,
    price: safeNumber(priceRange?.min, null),
    currency: priceRange?.currency || null,
    priceRange: priceRange ? {
      min: safeNumber(priceRange.min, null),
      max: safeNumber(priceRange.max, null),
      currency: priceRange.currency || null,
      type: priceRange.type || null,
    } : null,
    ticketUrl: event.url || null,
    status: event.dates?.status?.code || null,
    description: event.info || event.pleaseNote || null,
    image: bestImage?.url || null,
    source: 'ticketmaster',
  };
};

const isEventUpcoming = (event) => {
  const status = event?.dates?.status?.code;
  if (status === 'cancelled' || status === 'canceled') return false;
  const start = event?.dates?.start || {};
  if (!start.dateTime && !start.localDate) return true;
  const eventDate = start.dateTime ? new Date(start.dateTime) : new Date(`${start.localDate}T00:00:00`);
  if (Number.isNaN(eventDate.getTime())) return true;
  return eventDate.getTime() >= Date.now() - 60 * 60 * 1000;
};

async function requestTicketmaster(pathname, params = {}) {
  if (!TICKETMASTER_API_KEY) {
    const error = new Error('Ticketmaster API key is not configured. Set TICKETMASTER_API_KEY in server/.env.');
    error.statusCode = 500;
    throw error;
  }

  const url = new URL(`${TICKETMASTER_BASE}${pathname}`);
  url.searchParams.set('apikey', TICKETMASTER_API_KEY);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) {
      const payload = await response.text();
      const message = payload ? `Ticketmaster request failed (${response.status}): ${payload.slice(0, 200)}` : `Ticketmaster request failed (${response.status}).`;
      const error = new Error(message);
      error.statusCode = response.status;
      throw error;
    }
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    status: 'healthy',
    provider: TICKETMASTER_API_KEY ? 'ticketmaster-configured' : 'ticketmaster-missing',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/events', async (req, res) => {
  try {
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : undefined;
    const city = req.query.city ? String(req.query.city).trim() : undefined;
    const countryCode = req.query.countryCode ? String(req.query.countryCode).trim() : undefined;
    const genre = req.query.genre ? String(req.query.genre).trim() : undefined;
    const size = clamp(Number(req.query.size || 20), 1, 50);
    const page = clamp(Number(req.query.page || 1), 1, 20);
    const startDateTime = req.query.startDateTime ? toTicketmasterDateTime(String(req.query.startDateTime)) : toTicketmasterDateTime(new Date());
    const endDateTime = req.query.endDateTime ? toTicketmasterDateTime(String(req.query.endDateTime)) : undefined;

    const payload = await requestTicketmaster('/events.json', {
      classificationName: 'music',
      sort: 'date,asc',
      page,
      size,
      startDateTime,
      ...(endDateTime ? { endDateTime } : {}),
      ...(keyword ? { keyword } : {}),
      ...(city ? { city } : {}),
      ...(countryCode ? { countryCode } : {}),
      ...(genre ? { genre } : {}),
    });

    const events = (payload?._embedded?.events || []).filter(isEventUpcoming).map(normalizeEvent).filter(Boolean);
    res.json({
      events,
      page,
      size,
      totalElements: payload?.page?.totalElements ?? events.length,
      totalPages: payload?.page?.totalPages ?? Math.max(1, Math.ceil(events.length / size)),
      source: 'ticketmaster',
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: error.message || 'Unable to fetch events.',
      source: 'ticketmaster',
      fetchedAt: new Date().toISOString(),
    });
  }
});

app.get('/api/events/nearby', async (req, res) => {
  try {
    const latitude = safeNumber(req.query.latitude);
    const longitude = safeNumber(req.query.longitude);
    const radius = safeNumber(req.query.radius, 25);

    if (latitude === null || longitude === null) {
      return res.status(400).json({ error: 'latitude and longitude are required.' });
    }
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'latitude must be between -90 and 90.' });
    }
    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'longitude must be between -180 and 180.' });
    }
    if (radius < 1 || radius > 200) {
      return res.status(400).json({ error: 'radius must be between 1 and 200 kilometers.' });
    }

    const payload = await requestTicketmaster('/events.json', {
      classificationName: 'music',
      sort: 'date,asc',
      geoPoint: `${latitude},${longitude}`,
      radius,
      unit: 'km',
      size: 20,
      page: 1,
    });

    const events = (payload?._embedded?.events || []).filter(isEventUpcoming).map(normalizeEvent).filter(Boolean);
    res.json({ events, page: 1, size: events.length, source: 'ticketmaster', fetchedAt: new Date().toISOString() });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Unable to fetch nearby events.', source: 'ticketmaster', fetchedAt: new Date().toISOString() });
  }
});

app.get('/api/events/map', async (req, res) => {
  try {
    const latitude = safeNumber(req.query.latitude);
    const longitude = safeNumber(req.query.longitude);
    const radius = safeNumber(req.query.radius, 50);

    if (latitude === null || longitude === null) {
      return res.status(400).json({ error: 'latitude and longitude are required to search the map area.' });
    }
    if (radius > 2000) {
      return res.status(400).json({ error: 'Map search radius is too large. Please zoom in to a smaller area and search again.' });
    }

    const payload = await requestTicketmaster('/events.json', {
      classificationName: 'music',
      sort: 'date,asc',
      geoPoint: `${latitude},${longitude}`,
      radius,
      unit: 'km',
      size: 20,
      page: 1,
    });

    const events = (payload?._embedded?.events || []).filter(isEventUpcoming).map(normalizeEvent).filter(Boolean);
    res.json({ events, page: 1, size: events.length, source: 'ticketmaster', fetchedAt: new Date().toISOString() });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Unable to fetch map events.', source: 'ticketmaster', fetchedAt: new Date().toISOString() });
  }
});

app.get('/api/events/related', async (req, res) => {
  try {
    const eventId = req.query.eventId || req.query.id;
    if (!eventId) {
      return res.json({ events: [], source: 'ticketmaster', fetchedAt: new Date().toISOString() });
    }

    const event = await requestTicketmaster(`/events/${eventId}.json`);
    const attraction = Array.isArray(event?._embedded?.attractions) ? event._embedded.attractions[0] : null;
    const artists = attraction ? attraction.name : null;
    const payload = artists ? await requestTicketmaster('/events.json', { classificationName: 'music', sort: 'date,asc', keyword: artists, size: 10, page: 1 }) : { _embedded: { events: [] } };
    const events = (payload?._embedded?.events || []).filter((item) => item.id !== eventId).filter(isEventUpcoming).map(normalizeEvent).filter(Boolean);
    res.json({ events, source: 'ticketmaster', fetchedAt: new Date().toISOString() });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Unable to fetch related events.', source: 'ticketmaster', fetchedAt: new Date().toISOString() });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const payload = await requestTicketmaster(`/events/${encodeURIComponent(req.params.id)}.json`);
    const event = normalizeEvent(payload);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.', source: 'ticketmaster', fetchedAt: new Date().toISOString() });
    }
    res.json({ event, source: 'ticketmaster', fetchedAt: new Date().toISOString() });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Unable to fetch event details.', source: 'ticketmaster', fetchedAt: new Date().toISOString() });
  }
});

app.get('/api/artists/search', async (req, res) => {
  try {
    const keyword = String(req.query.keyword || '').trim();
    if (!keyword) {
      return res.status(400).json({ error: 'keyword is required.' });
    }
    const payload = await requestTicketmaster('/events.json', { classificationName: 'music', keyword, sort: 'date,asc', size: 12, page: 1 });
    const artists = (payload?._embedded?.events || [])
      .map((event) => Array.isArray(event._embedded?.attractions) ? event._embedded.attractions : [])
      .flat()
      .filter((artist, index, collection) => artist?.name && collection.findIndex((item) => item.name === artist.name) === index)
      .map((artist) => ({ name: artist.name, url: artist.url || null, image: artist.images?.[0]?.url || null }));

    res.json({ keyword, results: artists, source: 'ticketmaster', fetchedAt: new Date().toISOString() });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Unable to search artists.', source: 'ticketmaster', fetchedAt: new Date().toISOString() });
  }
});

app.get('/api/saved', (_req, res) => {
  res.status(501).json({ error: 'Saved concerts are not configured without an authenticated Supabase setup.' });
});
app.post('/api/saved/:eventId', (_req, res) => {
  res.status(501).json({ error: 'Saved concerts are not configured without an authenticated Supabase setup.' });
});
app.delete('/api/saved/:eventId', (_req, res) => {
  res.status(501).json({ error: 'Saved concerts are not configured without an authenticated Supabase setup.' });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({ error: error.message || 'Internal server error', source: 'ticketmaster', fetchedAt: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`VYBORA backend listening on http://localhost:${PORT}`);
});

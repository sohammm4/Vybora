const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const objectFromEntries = (entries) => Object.fromEntries(entries.filter(([, value]) => value !== undefined && value !== null && value !== ''));

export const buildQueryString = (params) => {
  const query = new URLSearchParams(objectFromEntries(Object.entries(params)));
  return query.toString();
};

const parseJson = async (response) => {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_error) {
    return { message: text };
  }
};

const request = async (endpoint, params = {}, options = {}) => {
  const query = buildQueryString(params);
  const url = query ? `${API_BASE}${endpoint}?${query}` : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const data = await parseJson(response);
  if (!response.ok) {
    const error = new Error(data.error || data.message || 'Request failed.');
    error.status = response.status;
    throw error;
  }

  return data;
};

export const fetchEvents = (params = {}) => request('/events', params);
export const fetchEventById = (id) => request(`/events/${encodeURIComponent(id)}`);
export const fetchNearbyEvents = (params = {}) => request('/events/nearby', params);
export const fetchArtistSearch = (keyword) => request('/artists/search', { keyword });

export const normalizeFrontendEvent = (event) => {
  if (!event) return null;

  const price = typeof event.price === 'number' && Number.isFinite(event.price) ? event.price : null;
  const date = event.date || event.startDate || null;

  return {
    id: event.id,
    aid: event.artist || null,
    artist: event.artist || null,
    title: event.title || event.name || null,
    genre: event.genre || null,
    city: event.city || null,
    country: event.country || null,
    lat: typeof event.latitude === 'number' ? event.latitude : null,
    lon: typeof event.longitude === 'number' ? event.longitude : null,
    venue: event.venue || null,
    address: event.address || null,
    date,
    price,
    cur: event.currency || null,
    priceRange: event.priceRange || null,
    time: event.time || null,
    ticket: event.ticketUrl || null,
    desc: event.description || null,
    image: event.image || null,
    status: event.status || null,
    hue: Math.abs((event.artist || event.title || 'Concert').split('').reduce((sum, letter) => sum + letter.charCodeAt(0), 0)) % 360,
  };
};

export const normalizeEvents = (payload = []) => (Array.isArray(payload) ? payload.map(normalizeFrontendEvent).filter(Boolean) : []);

export default API_BASE;

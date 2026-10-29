export const art = (hue = 270) =>
  `linear-gradient(135deg,hsl(${hue} 70% 38%),hsl(${(hue + 70) % 360} 80% 16%))`;

export const fd = (value) => {
  if (!value) return 'Date unavailable';
  const parsed = new Date(`${String(value).split('T')[0]}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

export const fp = (event) => {
  const currency = event.priceRange?.currency || event.cur;
  const format = (amount) => currency
    ? new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
    : new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(amount);
  const range = event.priceRange;

  if (range?.min != null && range?.max != null && range.min !== range.max) {
    return `${format(range.min)} – ${format(range.max)}`;
  }
  if (event.price === 0) return 'Free';
  if (typeof event.price === 'number') return format(event.price);
  return 'Price unavailable';
};

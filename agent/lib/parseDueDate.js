const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(9, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function nextWeekday(from, weekdayIndex) {
  const d = startOfDay(from);
  const current = d.getDay();
  let delta = weekdayIndex - current;
  if (delta <= 0) delta += 7;
  return addDays(d, delta);
}

function parseRelativePhrase(raw, now = new Date()) {
  const text = raw.trim().toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ');

  if (!text || text === 'none' || text === 'null') return null;

  if (text === 'today' || text === 'tonight') return startOfDay(now);
  if (text === 'tomorrow') return startOfDay(addDays(now, 1));
  if (text === 'day after tomorrow') return startOfDay(addDays(now, 2));
  if (text === 'next week') return startOfDay(addDays(now, 7));

  const inDays = text.match(/^in (\d+) days?$/);
  if (inDays) return startOfDay(addDays(now, Number(inDays[1])));

  const nextDay = text.match(/^next (monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (nextDay) {
    const idx = WEEKDAYS.indexOf(nextDay[1]);
    return nextWeekday(now, idx);
  }

  const thisDay = text.match(/^(?:this )?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (thisDay) {
    const idx = WEEKDAYS.indexOf(thisDay[1]);
    const d = startOfDay(now);
    const current = d.getDay();
    let delta = idx - current;
    if (delta < 0) delta += 7;
    return addDays(d, delta);
  }

  return null;
}

function parseIsoDate(raw) {
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return null;
  return new Date(parsed);
}

/**
 * Resolve a due date from LLM/user input.
 * Prefer relative phrases (tomorrow, next friday) — parsed against server clock.
 */
export function parseDueDate(raw, now = new Date()) {
  if (raw == null || raw === '') return null;

  const text = String(raw).trim();
  if (!text) return null;

  const relative = parseRelativePhrase(text, now);
  if (relative) return relative.toISOString();

  const iso = parseIsoDate(text);
  if (!iso) return null;

  const todayStart = startOfDay(now);
  const isoStart = startOfDay(iso);

  // Reject stale ISO dates the model may hallucinate when the user meant a relative date.
  if (isoStart < todayStart) {
    return null;
  }

  return iso.toISOString();
}

export function formatDateContext(now = new Date()) {
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const date = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `${weekday}, ${date} (${now.toISOString()})`;
}

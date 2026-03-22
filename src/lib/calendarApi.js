const BASE = 'https://www.googleapis.com/calendar/v3';

async function req(url, token) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Calendar API ${res.status}`);
  return res.json();
}

export async function fetchEvents(token, days = 14) {
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    timeMin: now.toISOString(),
    timeMax: future.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  });
  const data = await req(`${BASE}/calendars/primary/events?${params}`, token);
  return (data.items || []).filter(
    ev => (ev.summary || '').trim().toLowerCase() !== 'hold'
  );
}

export function formatEventTime(event) {
  const start = event.start?.dateTime || event.start?.date;
  if (!start) return '';
  const isAllDay = !event.start?.dateTime;
  const d = new Date(start);
  if (isAllDay) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function groupEventsByDate(events) {
  const groups = {};
  events.forEach(ev => {
    const start = ev.start?.dateTime || ev.start?.date;
    if (!start) return;
    const dateKey = start.substring(0, 10);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(ev);
  });
  return groups;
}

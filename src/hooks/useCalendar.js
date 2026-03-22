import { useState, useEffect, useCallback } from 'react';
import { fetchEvents } from '../lib/calendarApi';

export function useCalendar(getToken) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEvents(token, 14);
      setEvents(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
    // Refresh every 15 minutes
    const interval = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  return { events, loading, error, refresh: load };
}

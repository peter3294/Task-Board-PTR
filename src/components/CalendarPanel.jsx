import { useCalendar } from '../hooks/useCalendar';
import { groupEventsByDate, formatEventTime } from '../lib/calendarApi';

function formatDateHeading(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isToday(dateStr) {
  return new Date(dateStr + 'T12:00:00').toDateString() === new Date().toDateString();
}

export default function CalendarPanel({ getToken }) {
  const { events, loading, error, refresh } = useCalendar(getToken);
  const groups = groupEventsByDate(events);
  const dates = Object.keys(groups).sort();

  return (
    <aside className="w-64 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Calendar</span>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors"
          title="Refresh"
        >
          <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-3 py-2">
        {error && (
          <p className="text-xs text-red-500 px-1 py-2">{error}</p>
        )}

        {!loading && dates.length === 0 && !error && (
          <p className="text-xs text-gray-400 px-1 py-3 text-center">No upcoming events</p>
        )}

        {dates.map(dateStr => (
          <div key={dateStr} className="mb-3">
            <div className={`text-xs font-semibold mb-1 px-1 ${isToday(dateStr) ? 'text-blue-600' : 'text-gray-500'}`}>
              {formatDateHeading(dateStr)}
            </div>
            <div className="space-y-1">
              {groups[dateStr].map(event => (
                <div
                  key={event.id}
                  className="rounded px-2 py-1.5 bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors"
                >
                  <p className="text-xs font-medium text-gray-800 leading-tight truncate" title={event.summary}>
                    {event.summary || '(No title)'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatEventTime(event)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

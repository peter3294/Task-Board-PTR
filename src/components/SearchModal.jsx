import { useState, useEffect, useRef } from 'react';

const STATUS_STYLES = {
  'Not Started':   'bg-gray-100 text-gray-600',
  'Working On It': 'bg-blue-100 text-blue-700',
  'Blocked':       'bg-orange-100 text-orange-700',
  'Done':          'bg-green-100 text-green-700',
};

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-gray-900">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function SearchModal({ allTasks, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef();

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const q = query.trim().toLowerCase();
  const results = q
    ? allTasks.filter(t =>
        t.item.toLowerCase().includes(q) ||
        t.link.toLowerCase().includes(q) ||
        stripHtml(t.notes).toLowerCase().includes(q)
      )
    : [];

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-20 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, notes, links…"
            className="flex-1 text-sm text-gray-900 focus:outline-none placeholder-gray-400"
          />
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 border border-gray-200 rounded">
            Esc
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {q && results.length === 0 && (
            <p className="text-sm text-gray-400 px-4 py-6 text-center">No results for "{query}"</p>
          )}

          {results.map(task => {
            const notesText = stripHtml(task.notes);
            const notesIdx = notesText.toLowerCase().indexOf(q);
            const notesSnippet = notesIdx !== -1
              ? notesText.slice(Math.max(0, notesIdx - 40), notesIdx + 80)
              : null;

            return (
              <div
                key={task.id}
                className="px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {highlight(task.item || 'Untitled', query)}
                    </p>
                    {notesSnippet && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        …{highlight(notesSnippet, query)}…
                      </p>
                    )}
                    {task.link && q && task.link.toLowerCase().includes(q) && (
                      <p className="text-xs text-blue-500 mt-0.5 truncate">
                        {highlight(task.link, query)}
                      </p>
                    )}
                    {task.actionDate && (
                      <p className="text-xs text-gray-400 mt-0.5">{task.actionDate}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {task.archived && (
                      <span className="text-xs text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">Archived</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_STYLES[task.status] || STATUS_STYLES['Not Started']}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {!q && (
            <p className="text-sm text-gray-400 px-4 py-6 text-center">
              Type to search across all tasks and notes
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

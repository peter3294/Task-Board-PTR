import { useEffect } from 'react';

const STATUS_STYLES = {
  'Not Started':   'bg-gray-100 text-gray-600',
  'Working On It': 'bg-blue-100 text-blue-700',
  'Blocked':       'bg-orange-100 text-orange-700',
  'Done':          'bg-green-100 text-green-700',
};

export default function ArchiveView({ archivedTasks, onUnarchive, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const topLevel = archivedTasks.filter(t => !t.parentId || !archivedTasks.find(a => a.id === t.parentId));

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-12 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Archive</h2>
            <p className="text-xs text-gray-500 mt-0.5">{archivedTasks.length} archived item{archivedTasks.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {archivedTasks.length === 0 ? (
            <p className="text-sm text-gray-400 px-5 py-8 text-center">No archived items</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Item</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {topLevel.map(task => (
                  <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-2.5">
                      <p className="text-sm text-gray-700 font-medium">{task.item || 'Untitled'}</p>
                      {task.link && (
                        <a
                          href={task.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline truncate block max-w-xs"
                        >
                          {task.link}
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-500">
                      {task.actionDate || '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_STYLES[task.status] || STATUS_STYLES['Not Started']}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => onUnarchive(task.id)}
                        className="text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-2.5 py-1 rounded transition-colors"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

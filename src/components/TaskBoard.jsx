import { useState, useCallback, useEffect } from 'react';
import TaskRow from './TaskRow';
import SearchModal from './SearchModal';
import ArchiveView from './ArchiveView';
import CalendarPanel from './CalendarPanel';
import QuoteTicker from './QuoteTicker';

const SORT_KEYS = {
  item: 'item',
  actionDate: 'actionDate',
  status: 'status',
  link: 'link',
};

const STATUS_ORDER = {
  'Not Started': 0,
  'Working On It': 1,
  'Blocked': 2,
  'Done': 3,
};

function buildTree(tasks) {
  const map = {};
  tasks.forEach(t => { map[t.id] = { ...t, children: [] }; });
  const roots = [];
  tasks.forEach(t => {
    if (t.parentId && map[t.parentId]) {
      map[t.parentId].children.push(map[t.id]);
    } else {
      roots.push(map[t.id]);
    }
  });
  return roots;
}

function sortNodes(nodes, key, dir) {
  const compare = (a, b) => {
    let av = a[key] || '';
    let bv = b[key] || '';
    if (key === 'status') {
      av = STATUS_ORDER[av] ?? 99;
      bv = STATUS_ORDER[bv] ?? 99;
      return dir === 'asc' ? av - bv : bv - av;
    }
    const cmp = String(av).localeCompare(String(bv));
    return dir === 'asc' ? cmp : -cmp;
  };
  return [...nodes]
    .sort(compare)
    .map(n => ({ ...n, children: sortNodes(n.children || [], key, dir) }));
}

function SortIcon({ active, dir }) {
  if (!active) return (
    <svg className="w-3 h-3 text-av-teal/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
  return (
    <svg className="w-3 h-3 text-av-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d={dir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
    </svg>
  );
}

export default function TaskBoard({
  tasks,
  archivedTasks,
  allTasks,
  loading,
  error,
  addTask,
  updateTask,
  archiveTask,
  unarchiveTask,
  getToken,
  onSignOut,
}) {
  const [sortKey, setSortKey] = useState('actionDate');
  const [sortDir, setSortDir] = useState('asc');
  const [showSearch, setShowSearch] = useState(false);
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    const handler = () => setShowSearch(true);
    window.addEventListener('open-search', handler);
    return () => window.removeEventListener('open-search', handler);
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleAddTask = useCallback(async () => {
    await addTask(null);
  }, [addTask]);

  const handleAddSubtask = useCallback(async (parentId) => {
    await addTask(parentId);
  }, [addTask]);

  const tree = sortNodes(buildTree(tasks), sortKey, sortDir);

  const ColHeader = ({ colKey, label }) => (
    <th
      onClick={() => handleSort(colKey)}
      className="px-3 py-2.5 text-left text-xs font-medium text-av-blue uppercase tracking-wide cursor-pointer hover:text-av-teal select-none whitespace-nowrap transition-colors"
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon active={sortKey === colKey} dir={sortDir} />
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-av-bg-gray flex flex-col">
      {/* Top bar — AV Blue */}
      <header className="bg-av-blue px-5 py-3 flex items-center gap-3 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="w-6 h-6 bg-white/15 rounded flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-sm font-semibold text-white tracking-wide">Task Board</h1>
        </div>

        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white border border-white/25 hover:border-white/50 rounded-md px-3 py-1.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Search
          <kbd className="ml-1 text-xs text-white/40 font-mono">⌘K</kbd>
        </button>

        <button
          onClick={() => setShowArchive(true)}
          className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white border border-white/25 hover:border-white/50 rounded-md px-3 py-1.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          Archive
          {archivedTasks.length > 0 && (
            <span className="text-xs bg-white/20 text-white rounded px-1.5 py-0.5 font-medium">
              {archivedTasks.length}
            </span>
          )}
        </button>

        <button
          onClick={onSignOut}
          className="text-sm text-white/50 hover:text-white/90 transition-colors px-2"
          title="Sign out"
        >
          Sign out
        </button>
      </header>

      {/* Motivational quote ticker — AV Navy */}
      <QuoteTicker />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Board area */}
        <div className="flex-1 overflow-auto">
          {error && (
            <div className="mx-4 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="px-0">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-10 bg-av-bg-blue border-b border-av-light-teal/40">
                <tr>
                  <ColHeader colKey="item" label="Item" />
                  <ColHeader colKey="actionDate" label="Action Date" />
                  <ColHeader colKey="status" label="Status" />
                  <ColHeader colKey="link" label="Link" />
                  <th className="px-3 py-2.5 w-24" />
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                      Loading tasks…
                    </td>
                  </tr>
                )}

                {!loading && tree.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                      No tasks yet. Add one below.
                    </td>
                  </tr>
                )}

                {tree.map(node => (
                  <TaskRow
                    key={node.id}
                    task={node}
                    children={node.children || []}
                    depth={0}
                    onUpdate={updateTask}
                    onArchive={archiveTask}
                    onAddSubtask={handleAddSubtask}
                  />
                ))}
              </tbody>
            </table>

            {/* Add task */}
            <div className="px-3 py-2 border-t border-av-light-teal/30">
              <button
                onClick={handleAddTask}
                disabled={loading}
                className="flex items-center gap-1.5 text-sm text-av-teal/60 hover:text-av-teal py-1.5 px-2 rounded hover:bg-av-bg-teal transition-colors disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add task
              </button>
            </div>
          </div>
        </div>

        {/* Calendar panel */}
        <CalendarPanel getToken={getToken} />
      </div>

      {/* Modals */}
      {showSearch && (
        <SearchModal
          allTasks={allTasks}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showArchive && (
        <ArchiveView
          archivedTasks={archivedTasks}
          onUnarchive={unarchiveTask}
          onClose={() => setShowArchive(false)}
        />
      )}
    </div>
  );
}

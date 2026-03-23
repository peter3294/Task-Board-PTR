import { useState, useCallback, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import TaskRow from './TaskRow';
import SearchModal from './SearchModal';
import ArchiveView from './ArchiveView';
import CalendarPanel from './CalendarPanel';
import QuoteTicker from './QuoteTicker';

const STATUS_ORDER = {
  'Not Started': 0,
  'Working On It': 1,
  'Blocked': 2,
  'Done': 3,
};

const STATUS_OPTIONS = ['Not Started', 'Working On It', 'Blocked', 'Done'];
const DATE_FILTER_OPTIONS = ['All', 'Overdue', 'Today', 'This Week', 'Next 14 Days'];

const STATUS_STYLES = {
  'Not Started':   'bg-gray-100 text-gray-600',
  'Working On It': 'bg-blue-100 text-blue-700',
  'Blocked':       'bg-orange-100 text-orange-700',
  'Done':          'bg-green-100 text-green-700',
};

// ── helpers ──────────────────────────────────────────────────────────────────

function buildTree(tasks) {
  const map = {};
  tasks.forEach(t => { map[t.id] = { ...t, children: [] }; });
  const roots = [];
  tasks.forEach(t => {
    if (t.parentId && map[t.parentId]) {
      map[t.parentId].children.push(map[t.id]);
    } else if (map[t.id]) {
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

function applyFilters(tasks, filterStatuses, filterDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today); endOfToday.setHours(23, 59, 59, 999);
  const endOfWeek  = new Date(today); endOfWeek.setDate(today.getDate() + 7);
  const end14Days  = new Date(today); end14Days.setDate(today.getDate() + 14);

  return tasks.filter(t => {
    if (filterStatuses.length > 0 && !filterStatuses.includes(t.status)) return false;
    if (filterDate !== 'All' && t.actionDate) {
      const d = new Date(t.actionDate + 'T12:00:00');
      if (filterDate === 'Overdue'      && d >= today)       return false;
      if (filterDate === 'Today'        && (d < today || d > endOfToday)) return false;
      if (filterDate === 'This Week'    && (d < today || d > endOfWeek))  return false;
      if (filterDate === 'Next 14 Days' && (d < today || d > end14Days))  return false;
    } else if (filterDate !== 'All' && !t.actionDate) {
      return false;
    }
    return true;
  });
}

// ── sub-components ────────────────────────────────────────────────────────────

function SortIcon({ active, dir }) {
  if (!active) return (
    <svg className="w-3 h-3 text-av-teal/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
  return (
    <svg className="w-3 h-3 text-av-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d={dir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
    </svg>
  );
}

function StatusMultiFilter({ selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = (opt) => {
    const next = selected.includes(opt)
      ? selected.filter(s => s !== opt)
      : [...selected, opt];
    onChange(next);
  };

  const label = selected.length === 0 ? 'All'
    : selected.length === 1 ? selected[0]
    : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-1 focus:ring-av-teal"
      >
        <span>{label}</span>
        <svg className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-md shadow-lg z-30 min-w-[175px]">
          {STATUS_OPTIONS.map(opt => (
            <label
              key={opt}
              className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="rounded border-gray-300 text-av-teal focus:ring-av-teal"
              />
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_STYLES[opt]}`}>
                {opt}
              </span>
            </label>
          ))}
          {selected.length > 0 && (
            <button
              onClick={() => { onChange([]); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-av-teal hover:bg-gray-50 border-t border-gray-100"
            >
              Clear selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function TaskBoard({
  tasks,
  archivedTasks,
  allTasks,
  loading,
  error,
  addTask,
  updateTask,
  reorderTasks,
  archiveTask,
  unarchiveTask,
  deleteTask,
  quotes,
  getToken,
  userInfo,
  onSignOut,
}) {
  const [sortKey, setSortKey]           = useState('actionDate');
  const [sortDir, setSortDir]           = useState('asc');
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterDate,     setFilterDate]     = useState('All');
  const [showSearch,  setShowSearch]  = useState(false);
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

  const handleAddTask    = useCallback(async () => { await addTask(null); }, [addTask]);
  const handleAddSubtask = useCallback(async (parentId) => { await addTask(parentId); }, [addTask]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const activeTask = tasks.find(t => t.id === active.id);
    const overTask   = tasks.find(t => t.id === over.id);
    if (!activeTask || !overTask) return;
    if (activeTask.parentId !== overTask.parentId) return;

    const siblings = tasks
      .filter(t => t.parentId === activeTask.parentId)
      .sort((a, b) => a.order - b.order);

    const oldIdx = siblings.findIndex(t => t.id === active.id);
    const newIdx = siblings.findIndex(t => t.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    const reordered = arrayMove(siblings, oldIdx, newIdx);
    // Single batch call — avoids Google Sheets write-quota errors
    reorderTasks(reordered);
  }, [tasks, reorderTasks]);

  const filtered = applyFilters(tasks, filterStatuses, filterDate);
  const tree = sortNodes(buildTree(filtered), sortKey, sortDir);
  const activeFilters = filterStatuses.length + (filterDate !== 'All' ? 1 : 0);

  const thBase = 'px-3 py-2.5 text-left text-xs font-medium text-av-blue uppercase tracking-wide select-none whitespace-nowrap bg-av-bg-blue';

  const ColHeader = ({ colKey, label }) => (
    <th
      onClick={() => handleSort(colKey)}
      className={`${thBase} cursor-pointer hover:text-av-teal transition-colors`}
      style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 0 #C8E8E7' }}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon active={sortKey === colKey} dir={sortDir} />
      </div>
    </th>
  );

  return (
    // h-screen + overflow-hidden forces the inner div to scroll, making sticky headers work
    <div className="h-screen bg-av-bg-gray flex flex-col overflow-hidden">

      {/* Top bar */}
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

        {/* User avatar + name */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/20">
          {userInfo?.picture && (
            <img
              src={userInfo.picture}
              alt={userInfo.name || 'User'}
              className="w-7 h-7 rounded-full border-2 border-white/30"
              referrerPolicy="no-referrer"
            />
          )}
          {userInfo?.name && (
            <span className="text-sm text-white/80 max-w-[120px] truncate hidden sm:block">
              {userInfo.name}
            </span>
          )}
          <button
            onClick={onSignOut}
            className="text-xs text-white/40 hover:text-white/80 transition-colors"
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Quote ticker */}
      <QuoteTicker quotes={quotes} />

      {/* Main content */}
      <div className="flex flex-1 min-h-0">

        {/* Board area */}
        <div className="flex-1 flex flex-col min-h-0">
          {error && (
            <div className="mx-4 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700 flex-shrink-0">
              {error}
            </div>
          )}

          {/* Filter bar */}
          <div className="flex items-center gap-3 px-3 py-2 bg-white border-b border-av-light-teal/30 flex-shrink-0">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Filter</span>

            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500">Status</label>
              <StatusMultiFilter selected={filterStatuses} onChange={setFilterStatuses} />
            </div>

            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500">Date</label>
              <select
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-av-teal"
              >
                {DATE_FILTER_OPTIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {activeFilters > 0 && (
              <button
                onClick={() => { setFilterStatuses([]); setFilterDate('All'); }}
                className="text-xs text-av-teal hover:text-av-blue transition-colors ml-1"
              >
                Clear filters
              </button>
            )}

            {/* Add task button lives in the filter bar — always visible */}
            <button
              onClick={handleAddTask}
              disabled={loading}
              className="ml-auto flex items-center gap-1.5 text-sm text-av-teal/70 hover:text-av-teal border border-av-teal/30 hover:border-av-teal/60 py-1 px-3 rounded transition-colors disabled:opacity-40"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add task
            </button>

            <span className="text-xs text-gray-400">
              {filtered.length} task{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Scrollable table — overflow-auto here is the scroll container for sticky headers */}
          <div className="flex-1 overflow-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <ColHeader colKey="item" label="Item" />
                    <ColHeader colKey="actionDate" label="Action Date" />
                    <ColHeader colKey="status" label="Status" />
                    <ColHeader colKey="link" label="Link" />
                    <th
                      className={`${thBase} w-32`}
                      style={{ position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 0 #C8E8E7' }}
                    />
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
                        {activeFilters > 0 ? 'No tasks match the current filters.' : 'No tasks yet — click Add task to get started.'}
                      </td>
                    </tr>
                  )}

                  <SortableContext items={tree.map(n => n.id)} strategy={verticalListSortingStrategy}>
                    {tree.map(node => (
                      <TaskRow
                        key={node.id}
                        task={node}
                        children={node.children || []}
                        depth={0}
                        onUpdate={updateTask}
                        onArchive={archiveTask}
                        onDelete={deleteTask}
                        onAddSubtask={handleAddSubtask}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
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

import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskDetail from './TaskDetail';

const STATUS_OPTIONS = ['Not Started', 'Working On It', 'Blocked', 'Done'];

const STATUS_STYLES = {
  'Not Started':   'bg-gray-100 text-gray-600',
  'Working On It': 'bg-blue-100 text-blue-700',
  'Blocked':       'bg-orange-100 text-orange-700',
  'Done':          'bg-green-100 text-green-700',
};

function InlineInput({ value, onChange, onBlur, autoFocus, className = '' }) {
  const ref = useRef();
  useEffect(() => { if (autoFocus) ref.current?.focus(); }, [autoFocus]);
  return (
    <input
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={e => e.key === 'Enter' && onBlur()}
      className={`border border-blue-300 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white ${className}`}
    />
  );
}

function DragHandle({ listeners, attributes }) {
  return (
    <button
      {...listeners}
      {...attributes}
      className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none"
      tabIndex={-1}
      title="Drag to reorder"
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <circle cx="7" cy="5"  r="1.2" /><circle cx="13" cy="5"  r="1.2" />
        <circle cx="7" cy="10" r="1.2" /><circle cx="13" cy="10" r="1.2" />
        <circle cx="7" cy="15" r="1.2" /><circle cx="13" cy="15" r="1.2" />
      </svg>
    </button>
  );
}

export default function TaskRow({ task, children = [], depth = 0, onUpdate, onArchive, onDelete, onAddSubtask, onReorderChildren }) {
  const [notesExpanded, setNotesExpanded]   = useState(false);
  const [childrenOpen, setChildrenOpen]     = useState(false);
  const [editField, setEditField]           = useState(null);
  const [editValue, setEditValue]           = useState('');
  const [hovered, setHovered]               = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
    zIndex: isDragging ? 999 : 'auto',
  };

  const startEdit = (field) => { setEditField(field); setEditValue(task[field] || ''); };
  const commitEdit = () => {
    if (editField && editValue !== task[editField]) onUpdate(task.id, { [editField]: editValue });
    setEditField(null);
  };
  const handleDelete = () => {
    if (window.confirm(`Permanently delete "${task.item || 'this task'}"? This cannot be undone.`)) onDelete(task.id);
  };

  const indentPx  = depth * 20 + 8;
  const hasChildren = children.length > 0;

  const formatDate = (d) => {
    if (!d) return '';
    const parts = d.split('-');
    if (parts.length !== 3) return d;
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`border-b border-gray-100 transition-colors group ${isDragging ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
      >
        {/* Item */}
        <td className="py-1.5 pr-3" style={{ paddingLeft: `${indentPx}px` }}>
          <div className="flex items-center gap-1 min-w-0">

            {/* Drag handle */}
            <DragHandle listeners={listeners} attributes={attributes} />

            {/* Subtask expand chevron — parent rows only */}
            {depth === 0 && hasChildren && (
              <button
                onClick={() => setChildrenOpen(v => !v)}
                className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-700"
                title={childrenOpen ? 'Collapse subtasks' : 'Expand subtasks'}
              >
                <svg className={`w-3 h-3 transition-transform ${childrenOpen ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Sub-level connector */}
            {depth > 0 && (
              <span className="flex-shrink-0 w-2 border-b border-gray-300 -ml-1 mr-0.5" />
            )}

            {editField === 'item' ? (
              <InlineInput value={editValue} onChange={setEditValue} onBlur={commitEdit} autoFocus className="w-full" />
            ) : (
              <span
                onClick={() => startEdit('item')}
                className={`truncate cursor-text text-sm text-gray-900 ${!task.item ? 'text-gray-400 italic' : ''}`}
                title={task.item}
              >
                {task.item || 'Untitled'}
              </span>
            )}

            {/* Notes indicator dot */}
            {task.notes && !notesExpanded && (
              <button
                onClick={() => setNotesExpanded(true)}
                className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 hover:bg-blue-600 ml-1 transition-colors"
                title="View notes"
              />
            )}
          </div>
        </td>

        {/* Action Date */}
        <td className="py-1.5 px-3 whitespace-nowrap">
          {editField === 'actionDate' ? (
            <input type="date" value={editValue}
              onChange={e => setEditValue(e.target.value)} onBlur={commitEdit} autoFocus
              className="border border-blue-300 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          ) : (
            <span onClick={() => startEdit('actionDate')} className="text-sm text-gray-700 cursor-pointer hover:text-gray-900">
              {formatDate(task.actionDate) || <span className="text-gray-300">—</span>}
            </span>
          )}
        </td>

        {/* Status */}
        <td className="py-1.5 px-3">
          {editField === 'status' ? (
            <select value={editValue}
              onChange={e => { setEditValue(e.target.value); commitEdit(); }}
              onBlur={commitEdit} autoFocus
              className="border border-blue-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <span
              onClick={() => startEdit('status')}
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${STATUS_STYLES[task.status] || STATUS_STYLES['Not Started']}`}
            >
              {task.status}
            </span>
          )}
        </td>

        {/* Link */}
        <td className="py-1.5 px-3 max-w-[200px]">
          {editField === 'link' ? (
            <InlineInput value={editValue} onChange={setEditValue} onBlur={commitEdit} autoFocus className="w-full" />
          ) : task.link ? (
            <div className="flex items-center gap-1 min-w-0">
              <a href={task.link} target="_blank" rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
                title={task.link} onClick={e => e.stopPropagation()}>
                {(() => { try { return new URL(task.link).hostname.replace('www.', ''); } catch { return task.link; } })()}
              </a>
              <button onClick={() => startEdit('link')}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity" title="Edit link">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          ) : (
            <span onClick={() => startEdit('link')} className="text-sm text-gray-300 cursor-text hover:text-gray-500">Add link</span>
          )}
        </td>

        {/* Actions */}
        <td className="py-1.5 pl-3 pr-4 whitespace-nowrap">
          <div className={`flex items-center gap-1 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            {/* Notes toggle — always available */}
            <button
              onClick={() => setNotesExpanded(v => !v)}
              className={`text-xs px-1.5 py-0.5 rounded transition-colors ${notesExpanded ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
              title={notesExpanded ? 'Close notes' : 'Open notes'}
            >
              Notes
            </button>
            <button onClick={() => onAddSubtask(task.id)}
              className="text-xs text-gray-500 hover:text-gray-800 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors" title="Add subtask">
              + Sub
            </button>
            <button onClick={() => onArchive(task.id)}
              className="text-xs text-gray-400 hover:text-orange-600 px-1.5 py-0.5 rounded hover:bg-orange-50 transition-colors" title="Archive">
              Archive
            </button>
            <button onClick={handleDelete}
              className="text-xs text-gray-300 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors" title="Delete permanently">
              Delete
            </button>
          </div>
        </td>
      </tr>

      {/* Notes panel */}
      {notesExpanded && (
        <tr>
          <td colSpan={5} className="p-0 bg-blue-50/30">
            <TaskDetail task={task} onUpdate={onUpdate} />
          </td>
        </tr>
      )}

      {/* Subtasks — sortable within parent */}
      {childrenOpen && children.length > 0 && (
        <SortableContext items={children.map(c => c.id)} strategy={verticalListSortingStrategy}>
          {children.map(child => (
            <TaskRow
              key={child.id}
              task={child}
              children={child.children || []}
              depth={depth + 1}
              onUpdate={onUpdate}
              onArchive={onArchive}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
            />
          ))}
        </SortableContext>
      )}
    </>
  );
}

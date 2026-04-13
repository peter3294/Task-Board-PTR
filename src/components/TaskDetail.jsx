import { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';

export default function TaskDetail({ task, onUpdate, onClose }) {
  const [notes, setNotes] = useState(task?.notes || '');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setNotes(task?.notes || '');
    setDirty(false);
  }, [task?.id, task?.notes]);

  const handleChange = (html) => {
    setNotes(html);
    setDirty(true);
  };

  const save = () => {
    onUpdate(task.id, { notes });
    setDirty(false);
  };

  if (!task) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="min-w-0 flex-1 mr-3">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Notes</span>
          <h3 className="text-sm font-medium text-gray-900 truncate" title={task.item}>
            {task.item || 'Untitled'}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {dirty && (
            <>
              <button
                onClick={() => { setNotes(task.notes || ''); setDirty(false); }}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Discard
              </button>
              <button
                onClick={save}
                className="text-xs bg-gray-900 text-white px-3 py-1 rounded hover:bg-gray-700 transition-colors"
              >
                Save
              </button>
            </>
          )}
          {!dirty && notes && (
            <span className="text-xs text-gray-400">Saved</span>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 ml-1"
            title="Close notes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto px-4 py-3">
        <RichTextEditor content={notes} onChange={handleChange} editable={true} />
      </div>
    </div>
  );
}

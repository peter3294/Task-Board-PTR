import { useState, useEffect } from 'react';
import RichTextEditor from './RichTextEditor';

export default function TaskDetail({ task, onUpdate, onClose }) {
  const [notes, setNotes] = useState(task.notes || '');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setNotes(task.notes || '');
    setDirty(false);
  }, [task.id, task.notes]);

  const handleChange = (html) => {
    setNotes(html);
    setDirty(true);
  };

  const save = () => {
    onUpdate(task.id, { notes });
    setDirty(false);
  };

  return (
    <div className="bg-gray-50 border-t border-gray-200 px-4 py-3">
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</span>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
        <RichTextEditor
          content={notes}
          onChange={handleChange}
          editable={true}
        />
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { ensureSheet, fetchTasks, appendTask, updateTask as apiUpdateTask } from '../lib/sheetsApi';

const SHEET_ID = import.meta.env.VITE_SHEET_ID;

function newTask(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    parentId: null,
    item: '',
    actionDate: '',
    status: 'Not Started',
    link: '',
    notes: '',
    archived: false,
    order: Date.now(),
    createdAt: new Date().toISOString(),
    rowIndex: null,
    ...overrides,
  };
}

export function useTasks(getToken) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      await ensureSheet(token, SHEET_ID);
      const loaded = await fetchTasks(token, SHEET_ID);
      setTasks(loaded);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = useCallback(async (parentId = null) => {
    const token = getToken();
    if (!token) return;
    const task = newTask({ parentId });
    // Optimistic update
    setTasks(prev => [...prev, task]);
    try {
      const rowIndex = await appendTask(token, SHEET_ID, task);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, rowIndex } : t));
    } catch (e) {
      setError(e.message);
      setTasks(prev => prev.filter(t => t.id !== task.id));
    }
    return task.id;
  }, [getToken]);

  const updateTask = useCallback(async (id, updates) => {
    const token = getToken();
    if (!token) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const updated = { ...task, ...updates };
    if (!updated.rowIndex) return; // not yet persisted
    try {
      await apiUpdateTask(token, SHEET_ID, updated);
    } catch (e) {
      setError(e.message);
      setTasks(prev => prev.map(t => t.id === id ? task : t)); // rollback
    }
  }, [getToken, tasks]);

  const archiveTask = useCallback(async (id) => {
    // Archive task and all its descendants
    const allIds = new Set();
    const collect = (taskId) => {
      allIds.add(taskId);
      tasks.filter(t => t.parentId === taskId).forEach(t => collect(t.id));
    };
    collect(id);
    const token = getToken();
    if (!token) return;
    setTasks(prev => prev.map(t => allIds.has(t.id) ? { ...t, archived: true } : t));
    try {
      const toArchive = tasks.filter(t => allIds.has(t.id));
      await Promise.all(
        toArchive.filter(t => t.rowIndex).map(t =>
          apiUpdateTask(token, SHEET_ID, { ...t, archived: true })
        )
      );
    } catch (e) {
      setError(e.message);
      setTasks(prev => prev.map(t => allIds.has(t.id) ? { ...t, archived: false } : t));
    }
  }, [getToken, tasks]);

  const unarchiveTask = useCallback(async (id) => {
    const token = getToken();
    if (!token) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, archived: false } : t));
    try {
      if (task.rowIndex) await apiUpdateTask(token, SHEET_ID, { ...task, archived: false });
    } catch (e) {
      setError(e.message);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, archived: true } : t));
    }
  }, [getToken, tasks]);

  const activeTasks = tasks.filter(t => !t.archived);
  const archivedTasks = tasks.filter(t => t.archived);

  return {
    tasks: activeTasks,
    archivedTasks,
    allTasks: tasks,
    loading,
    error,
    reload: load,
    addTask,
    updateTask,
    archiveTask,
    unarchiveTask,
  };
}

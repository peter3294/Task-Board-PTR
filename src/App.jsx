import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import { ensureQuotesSheet, fetchQuotes } from './lib/sheetsApi';
import LoginPage from './components/LoginPage';
import TaskBoard from './components/TaskBoard';

const SHEET_ID = import.meta.env.VITE_SHEET_ID;

export default function App() {
  const { isAuthenticated, ready, signingIn, signIn, signOut, getToken, userInfo } = useAuth();
  const {
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
  } = useTasks(getToken);

  const [quotes, setQuotes] = useState([]);

  const loadQuotes = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      await ensureQuotesSheet(token, SHEET_ID);
      const data = await fetchQuotes(token, SHEET_ID);
      if (data.length > 0) setQuotes(data);
    } catch (_) {
      // quotes are non-critical — fall back to hardcoded defaults in QuoteTicker
    }
  }, [getToken]);

  useEffect(() => {
    if (isAuthenticated) loadQuotes();
  }, [isAuthenticated, loadQuotes]);

  // ⌘K shortcut for search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('open-search'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onSignIn={signIn} ready={ready} signingIn={signingIn} />;
  }

  return (
    <TaskBoard
      tasks={tasks}
      archivedTasks={archivedTasks}
      allTasks={allTasks}
      loading={loading}
      error={error}
      addTask={addTask}
      updateTask={updateTask}
      reorderTasks={reorderTasks}
      archiveTask={archiveTask}
      unarchiveTask={unarchiveTask}
      deleteTask={deleteTask}
      quotes={quotes}
      getToken={getToken}
      userInfo={userInfo}
      onSignOut={signOut}
    />
  );
}

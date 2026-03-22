import { useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useTasks } from './hooks/useTasks';
import LoginPage from './components/LoginPage';
import TaskBoard from './components/TaskBoard';

export default function App() {
  const { isAuthenticated, ready, signingIn, signIn, signOut, getToken } = useAuth();
  const {
    tasks,
    archivedTasks,
    allTasks,
    loading,
    error,
    addTask,
    updateTask,
    archiveTask,
    unarchiveTask,
  } = useTasks(getToken);

  // ⌘K shortcut for search (handled inside TaskBoard via keyboard listener)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Dispatch to TaskBoard via a custom event
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
      archiveTask={archiveTask}
      unarchiveTask={unarchiveTask}
      getToken={getToken}
      onSignOut={signOut}
    />
  );
}

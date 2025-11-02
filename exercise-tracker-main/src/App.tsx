import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import CreateRoutine from './components/CreateRoutine';
import WorkoutPlayer from './components/WorkoutPlayer';
import RoutineDetail from './components/RoutineDetail';
import TodoList from './components/TodoList';
import HabitTracker from './components/HabitTracker';
import { Routine } from './types';
import { loadRoutines, getRoutineById } from './services/storageService';
import { loadExercises } from './services/exerciseService';

type Page = 'home' | 'create' | 'workout' | 'routine-detail';
type AppType = 'dashboard' | 'exercise' | 'todos' | 'habits';

function App() {
  const [currentApp, setCurrentApp] = useState<AppType>('dashboard');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      await loadExercises();
      const loadedRoutines = loadRoutines();
      setRoutines(loadedRoutines);
      setIsLoading(false);
    };
    initApp();
  }, []);

  const handleNavigate = (page: string, routineId?: string) => {
    setCurrentPage(page as Page);
    if (routineId) {
      setSelectedRoutineId(routineId);
    }
  };

  const handleNavigateApp = (app: string) => {
    setCurrentApp(app as AppType);
    setCurrentPage('home');
    setSelectedRoutineId(null);
  };

  const refreshRoutines = () => {
    const loadedRoutines = loadRoutines();
    setRoutines(loadedRoutines);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const selectedRoutine = selectedRoutineId ? getRoutineById(selectedRoutineId) : null;

  return (
    <>
      <Sidebar currentApp={currentApp} onNavigateApp={handleNavigateApp} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {currentApp === 'dashboard' && <Dashboard />}

      {currentApp === 'exercise' && (
        <>
          {currentPage === 'home' && (
            <HomePage routines={routines} onNavigate={handleNavigate} />
          )}
          {currentPage === 'create' && (
            <CreateRoutine onNavigate={(page) => {
              refreshRoutines();
              handleNavigate(page);
            }} />
          )}
          {currentPage === 'workout' && selectedRoutine && (
            <WorkoutPlayer
              routine={selectedRoutine}
              onNavigate={(page) => {
                refreshRoutines();
                handleNavigate(page);
              }}
            />
          )}
          {currentPage === 'routine-detail' && selectedRoutine && (
            <RoutineDetail
              routine={selectedRoutine}
              onNavigate={handleNavigate}
              onDelete={refreshRoutines}
            />
          )}
        </>
      )}

      {currentApp === 'todos' && <TodoList />}

      {currentApp === 'habits' && <HabitTracker />}
    </>
  );
}

export default App;

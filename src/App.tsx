import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import CreateRoutine from './components/CreateRoutine';
import CreateWeeklyRoutine from './components/CreateWeeklyRoutine';
import WorkoutPlayer from './components/WorkoutPlayer';
import WeeklyWorkoutPlayer from './components/WeeklyWorkoutPlayer';
import RoutineDetail from './components/RoutineDetail';
import WeeklyRoutineDetail from './components/WeeklyRoutineDetail';
import TodoList from './components/TodoList';
import HabitTracker from './components/HabitTracker';
import Notes from './components/Notes';
import { Routine, DayOfWeek } from './types';
import { loadRoutines, getRoutineById, getWeeklyRoutineById } from './services/storageService';
import { loadExercises } from './services/exerciseService';

type Page = 'home' | 'create' | 'create-weekly' | 'workout' | 'workout-weekly' | 'routine-detail' | 'weekly-routine-detail';
type AppType = 'dashboard' | 'exercise' | 'todos' | 'habits' | 'notes';

function App() {
  const [currentApp, setCurrentApp] = useState<AppType>('dashboard');
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek | null>(null);
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

  const handleNavigate = (page: string, routineId?: string, day?: DayOfWeek) => {
    setCurrentPage(page as Page);
    if (routineId) {
      setSelectedRoutineId(routineId);
    }
    if (day) {
      setSelectedDay(day);
    }
  };

  const handleNavigateApp = (app: string) => {
    setCurrentApp(app as AppType);
    setCurrentPage('home');
    setSelectedRoutineId(null);
    setSelectedDay(null);
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
  const selectedWeeklyRoutine = selectedRoutineId ? getWeeklyRoutineById(selectedRoutineId) : null;

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

      {currentApp === 'dashboard' && <Dashboard onNavigateApp={handleNavigateApp} />}

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
          {currentPage === 'create-weekly' && (
            <CreateWeeklyRoutine onNavigate={(page) => {
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
          {currentPage === 'workout-weekly' && selectedWeeklyRoutine && selectedDay && (
            <WeeklyWorkoutPlayer
              routine={selectedWeeklyRoutine}
              day={selectedDay}
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
          {currentPage === 'weekly-routine-detail' && selectedWeeklyRoutine && (
            <WeeklyRoutineDetail
              routine={selectedWeeklyRoutine}
              onNavigate={handleNavigate}
              onDelete={refreshRoutines}
            />
          )}
        </>
      )}

      {currentApp === 'todos' && <TodoList />}

      {currentApp === 'habits' && <HabitTracker />}

      {currentApp === 'notes' && <Notes />}
    </>
  );
}

export default App;

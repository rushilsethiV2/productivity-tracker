import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import HomePage from './pages/HomePage';
import CreateRoutine from './pages/CreateRoutine';
import CreateWeeklyRoutine from './pages/CreateWeeklyRoutine';
import WorkoutPlayer from './pages/WorkoutPlayer';
import WeeklyWorkoutPlayer from './pages/WeeklyWorkoutPlayer';
import RoutineDetail from './pages/RoutineDetail';
import WeeklyRoutineDetail from './pages/WeeklyRoutineDetail';
import TodoList from './components/TodoList';
import HabitTracker from './components/HabitTracker';
import Notes from './components/Notes';
import AuthDropbox from './pages/AuthDropbox';
import { loadExercises } from './services/exerciseService';
import { migrateOldStorage } from './utils/yearStorage';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // Migrate old localStorage data to year-based structure
      migrateOldStorage();
      await loadExercises();
      setIsLoading(false);
    };
    initApp();
  }, []);

  useEffect(() => {
    // Background sync to Dropbox every 30 seconds for connected users
    const DROPBOX_TOKEN_KEY = 'dropbox_access_token';
    const DROPBOX_FOLDER_PATH = '/flow-state';

    const uploadAllDataToDropbox = async () => {
      if (typeof window === 'undefined') return;

      let token: string | null = null;
      try {
        token = window.localStorage.getItem(DROPBOX_TOKEN_KEY);
      } catch {
        return;
      }
      if (!token) return;

      try {
        const { listYearKeys, getYearData, getCurrentYear } = await import('./utils/yearStorage');
        const allYears = listYearKeys();
        const currentYear = getCurrentYear();
        const yearsToUpload = Array.from(new Set([...allYears, currentYear]));

        // Ensure folder exists
        try {
          const folderResponse = await fetch('https://api.dropboxapi.com/2/files/create_folder_v2', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              path: DROPBOX_FOLDER_PATH,
              autorename: false,
            }),
          });

          // 409 means folder already exists, which is fine
          // 401/400 means token is invalid, but we'll handle that silently in background sync
          if (!folderResponse.ok && folderResponse.status !== 409 && folderResponse.status !== 401 && folderResponse.status !== 400) {
            // Other errors, log but continue
            console.warn('Dropbox folder creation failed:', folderResponse.status);
          }
        } catch {
          // Network error, ignore in background sync
        }

        // Upload each year file
        for (const year of yearsToUpload) {
          const data = getYearData(year);
          const contents = JSON.stringify(data, null, 2);
          const path = `${DROPBOX_FOLDER_PATH}/${year}.json`;

          await fetch('https://content.dropboxapi.com/2/files/upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/octet-stream',
              'Dropbox-API-Arg': JSON.stringify({
                path,
                mode: 'overwrite',
                mute: false,
                strict_conflict: false,
              }),
            },
            body: contents,
          });
        }
        // Update last sync time
        try {
          window.localStorage.setItem('dropbox_last_sync', new Date().toISOString());
        } catch {
          // Ignore
        }
      } catch {
        // Silently ignore background sync errors
      }
    };

    const intervalId = window.setInterval(() => {
      void uploadAllDataToDropbox();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

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

  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
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
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/exercise" element={<HomePage />} />
            <Route path="/exercise/create" element={<CreateRoutine />} />
            <Route path="/exercise/create-weekly" element={<CreateWeeklyRoutine />} />
            <Route path="/exercise/workout/:routineId" element={<WorkoutPlayer />} />
            <Route path="/exercise/workout-weekly/:routineId/:day" element={<WeeklyWorkoutPlayer />} />
            <Route path="/exercise/routine/:routineId" element={<RoutineDetail />} />
            <Route path="/exercise/weekly-routine/:routineId" element={<WeeklyRoutineDetail />} />
            <Route path="/todos" element={<TodoList />} />
            <Route path="/habits" element={<HabitTracker />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/auth" element={<AuthDropbox />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

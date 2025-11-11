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

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      await loadExercises();
      setIsLoading(false);
    };
    initApp();
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Calendar, Clock } from 'lucide-react';
import { Routine, WeeklyRoutine } from '../types';
import { loadRoutines, loadWeeklyRoutines } from '../services/storageService';

export default function HomePage() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weeklyRoutines, setWeeklyRoutines] = useState<WeeklyRoutine[]>([]);

  useEffect(() => {
    setRoutines(loadRoutines());
    setWeeklyRoutines(loadWeeklyRoutines());
  }, []);

  const dailyRoutines = routines.filter(r => r.type === 'daily');

  return (
    <div className="min-h-screen p-6 pb-24 md:pl-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">
              Exercise Tracker
            </h1>
          </div>
          <p className="text-gray-400">Track your workouts and build your routines</p>
        </header>

        <div className="grid gap-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => navigate('/exercise/create')}
              className="bg-[rgb(var(--card))] hover:bg-[rgb(var(--card-hover))] border border-[rgb(var(--border))] rounded-xl p-6 cursor-pointer transition-all hover:scale-105 hover:border-yellow-500"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-1">Daily Routine</h2>
                  <p className="text-gray-400">Single workout session</p>
                </div>
              </div>
            </div>
            <div
              onClick={() => navigate('/exercise/create-weekly')}
              className="bg-[rgb(var(--card))] hover:bg-[rgb(var(--card-hover))] border border-[rgb(var(--border))] rounded-xl p-6 cursor-pointer transition-all hover:scale-105 hover:border-blue-500"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-1">Weekly Routine</h2>
                  <p className="text-gray-400">Day-wise workout plan</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-yellow-400" />
              <h2 className="text-2xl font-semibold">Daily Routines</h2>
            </div>
            {dailyRoutines.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No daily routines yet</p>
            ) : (
              <div className="grid gap-3">
                {dailyRoutines.map(routine => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-semibold">Weekly Routines</h2>
            </div>
            {weeklyRoutines.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No weekly routines yet</p>
            ) : (
              <div className="grid gap-3">
                {weeklyRoutines.map(routine => (
                  <WeeklyRoutineCard
                    key={routine.id}
                    routine={routine}
                    onNavigate={navigate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoutineCard({ routine, onNavigate }: { routine: Routine; onNavigate: (path: string) => void }) {
  return (
    <div
      onClick={() => onNavigate(`/exercise/routine/${routine.id}`)}
      className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-all hover:scale-102"
    >
      <h3 className="font-semibold text-lg mb-2">{routine.name}</h3>
      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span>{routine.exercises.length} exercises</span>
        {routine.lastPerformed && (
          <span>Last: {new Date(routine.lastPerformed).toLocaleDateString()}</span>
        )}
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(`/exercise/workout/${routine.id}`);
        }}
        className="mt-3 w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
      >
        Start Workout
      </button>
    </div>
  );
}

function WeeklyRoutineCard({ routine, onNavigate }: { routine: WeeklyRoutine; onNavigate: (path: string) => void }) {
  const workoutDays = routine.weeklyPlan.filter(p => !p.isRestDay && p.exercises.length > 0).length;
  const restDays = routine.weeklyPlan.filter(p => p.isRestDay).length;

  return (
    <div
      onClick={() => onNavigate(`/exercise/weekly-routine/${routine.id}`)}
      className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-all hover:scale-102"
    >
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold text-lg">{routine.name}</h3>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
        <span>{workoutDays} workout days</span>
        <span>{restDays} rest days</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNavigate(`/exercise/weekly-routine/${routine.id}`);
        }}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
      >
        View Schedule
      </button>
    </div>
  );
}

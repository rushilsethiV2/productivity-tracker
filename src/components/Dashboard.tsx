import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, TrendingUp, Flame, CheckCircle, Dumbbell, Target, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { loadTodos } from '../services/todoService';
import { loadHabits, loadHabitEntries, getHabitEntry } from '../services/habitService';
import { loadRoutines } from '../services/storageService';
import { loadCollections, loadNotes } from '../services/notesService';
import { Todo, Habit, Routine } from '../types';
import KanbanBoard from './KanbanBoard';
import StatCard from './StatCard';
import StreakChart from './StreakChart';
import CalendarWidget from './CalendarWidget';
import WorkoutBanner from './WorkoutBanner';

interface DashboardProps {
  onNavigateApp?: (app: string) => void;
}

export default function Dashboard({ onNavigateApp }: DashboardProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setTodos(loadTodos());
    setHabits(loadHabits());
    setRoutines(loadRoutines());
  };

  const getNotesCount = () => {
    const collections = loadCollections();
    const notes = loadNotes();
    return { collections: collections.length, notes: notes.length };
  };

  const calculateStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const activeTodos = todos.filter(t => !t.completed);
    const completedToday = todos.filter(t =>
      t.completed && t.completedAt && t.completedAt.split('T')[0] === today
    );

    const habitEntries = loadHabitEntries();
    const todayHabits = habits.filter(h => {
      const entry = getHabitEntry(h.id, today);
      return entry?.completed;
    });

    const currentStreak = calculateCurrentStreak();
    const longestStreak = calculateLongestStreak();

    const notesCount = getNotesCount();

    return {
      activeTodos: activeTodos.length,
      completedToday: completedToday.length,
      totalHabits: habits.length,
      completedHabits: todayHabits.length,
      totalRoutines: routines.length,
      currentStreak,
      longestStreak,
      totalCollections: notesCount.collections,
      totalNotes: notesCount.notes,
    };
  };

  const calculateCurrentStreak = () => {
    const entries = loadHabitEntries();
    if (habits.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayEntries = entries.filter(e => e.date === dateStr);

      if (dayEntries.length === 0) break;

      const completedCount = dayEntries.filter(e => e.completed).length;
      if (completedCount === 0) break;

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  const calculateLongestStreak = () => {
    const entries = loadHabitEntries();
    if (habits.length === 0) return 0;

    let maxStreak = 0;
    let currentStreak = 0;
    const sortedDates = Array.from(new Set(entries.map(e => e.date))).sort();

    for (const date of sortedDates) {
      const dayEntries = entries.filter(e => e.date === date);
      const completedCount = dayEntries.filter(e => e.completed).length;

      if (completedCount > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen p-6 pb-24 md:pl-24">
      <div className="max-w-[1800px] mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-yellow-400 to-green-400 bg-clip-text text-transparent mb-2">
            Dashboard
          </h1>
          <p className="text-gray-400">Your productivity overview at a glance</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={Target}
            label="Active Tasks"
            value={stats.activeTodos}
            color="blue"
            subtitle={`${stats.completedToday} completed today`}
          />
          <StatCard
            icon={CheckCircle}
            label="Habits Today"
            value={`${stats.completedHabits}/${stats.totalHabits}`}
            color="green"
            subtitle="Keep it going!"
          />
          <StatCard
            icon={Flame}
            label="Current Streak"
            value={stats.currentStreak}
            color="orange"
            subtitle={`Best: ${stats.longestStreak} days`}
          />
          <StatCard
            icon={Dumbbell}
            label="Workout Routines"
            value={stats.totalRoutines}
            color="yellow"
            subtitle="Ready to go"
          />
          <StatCard
            icon={BookOpen}
            label="Notes"
            value={stats.totalNotes}
            color="blue"
            subtitle={`${stats.totalCollections} collections`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <StreakChart habits={habits} />
          </div>
          <div className="space-y-6">
            <CalendarWidget
              todos={todos}
              habits={habits}
              routines={routines}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              key={refreshKey}
            />
            <WorkoutBanner onNavigate={onNavigateApp} />
          </div>
        </div>

        <div>
          <KanbanBoard todos={todos} onUpdate={refreshData} />
        </div>
      </div>
    </div>
  );
}

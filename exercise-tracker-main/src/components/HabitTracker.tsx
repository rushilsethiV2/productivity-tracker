import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Habit, HabitEntry } from '../types';
import {
  loadHabits,
  addHabit,
  deleteHabit,
  loadHabitEntries,
  setHabitEntry,
  getHabitEntry,
  isDateModifiable,
} from '../services/habitService';

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [entries, setEntries] = useState<HabitEntry[]>([]);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setHabits(loadHabits());
    setEntries(loadHabitEntries());
  };

  const handleAddHabit = (name: string, color: string) => {
    const habit: Habit = {
      id: Date.now().toString(),
      name,
      color,
      createdAt: new Date().toISOString(),
    };
    addHabit(habit);
    refreshData();
    setShowAddModal(false);
  };

  const handleDeleteHabit = (id: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      deleteHabit(id);
      refreshData();
    }
  };

  const handleToggleHabit = (habitId: string, date: string, currentValue: boolean) => {
    if (!isDateModifiable(date)) return;
    setHabitEntry(habitId, date, !currentValue);
    refreshData();
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const getCompletionStats = () => {
    const totalPossible = habits.length * 7;
    const completed = weekDates.reduce((acc, date) => {
      const dateStr = formatDate(date);
      return acc + habits.filter(h => {
        const entry = getHabitEntry(h.id, dateStr);
        return entry?.completed;
      }).length;
    }, 0);

    return {
      completed,
      total: totalPossible,
      percentage: totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0,
    };
  };

  const stats = getCompletionStats();

  return (
    <div className="min-h-screen p-6 pb-24 pl-24">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                Habit Tracker
              </h1>
              <p className="text-gray-400">Build consistency, one day at a time</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Habit
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Total Habits</p>
              <p className="text-3xl font-bold text-blue-400">{habits.length}</p>
            </div>
            <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">This Week</p>
              <p className="text-3xl font-bold text-green-400">
                {stats.completed}/{stats.total}
              </p>
            </div>
            <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-yellow-400">{stats.percentage}%</p>
            </div>
          </div>

          <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4 flex items-center justify-between">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-[rgb(var(--background))] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="font-semibold">
                {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={goToCurrentWeek}
                className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors text-sm font-medium"
              >
                Today
              </button>
              <button
                onClick={goToNextWeek}
                className="p-2 hover:bg-[rgb(var(--background))] rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {habits.length === 0 ? (
          <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-12 text-center">
            <p className="text-gray-400">No habits yet. Add your first habit to start tracking!</p>
          </div>
        ) : (
          <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgb(var(--border))]">
                  <th className="text-left p-4 font-semibold sticky left-0 bg-[rgb(var(--card))] z-10 min-w-[200px]">
                    Habit
                  </th>
                  {weekDates.map(date => {
                    const isToday = formatDate(date) === formatDate(new Date());
                    return (
                      <th key={date.toISOString()} className="p-4 text-center min-w-[100px]">
                        <div className={`${isToday ? 'text-green-400' : 'text-gray-400'}`}>
                          <div className="text-xs">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className={`text-sm font-semibold ${isToday ? 'text-green-400' : ''}`}>
                            {date.getDate()}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-4 text-center min-w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {habits.map(habit => (
                  <tr
                    key={habit.id}
                    className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--background))] transition-colors"
                  >
                    <td className="p-4 sticky left-0 bg-[rgb(var(--card))] z-10">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: habit.color }}
                        />
                        <span className="font-medium">{habit.name}</span>
                      </div>
                    </td>
                    {weekDates.map(date => {
                      const dateStr = formatDate(date);
                      const entry = getHabitEntry(habit.id, dateStr);
                      const isCompleted = entry?.completed || false;
                      const canModify = isDateModifiable(dateStr);
                      const isToday = dateStr === formatDate(new Date());

                      return (
                        <td key={date.toISOString()} className="p-4 text-center">
                          <button
                            onClick={() => handleToggleHabit(habit.id, dateStr, isCompleted)}
                            disabled={!canModify}
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                              isCompleted
                                ? 'bg-green-500 border-green-500'
                                : isToday
                                ? 'border-green-400 hover:bg-green-500/20'
                                : canModify
                                ? 'border-gray-600 hover:border-green-400'
                                : 'border-gray-700 opacity-30 cursor-not-allowed'
                            }`}
                          >
                            {isCompleted && (
                              <div className="flex items-center justify-center">
                                <div className="w-6 h-6 text-white">✓</div>
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <p className="text-sm text-blue-300">
            <strong>Note:</strong> Days become locked after 4 AM the following day. Today and future dates remain editable.
          </p>
        </div>

        {showAddModal && (
          <AddHabitModal
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddHabit}
          />
        )}
      </div>
    </div>
  );
}

function AddHabitModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const predefinedColors = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim(), color);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl max-w-md w-full">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Add New Habit</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Habit Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Morning Exercise, Read 30 mins..."
                className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-4 py-3 focus:outline-none focus:border-green-500"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="grid grid-cols-8 gap-2 mb-3">
                {predefinedColors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-lg transition-all ${
                      color === c ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-12 bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[rgb(var(--background))] border border-[rgb(var(--border))] hover:border-gray-500 py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 rounded-lg transition-all font-semibold"
            >
              Add Habit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

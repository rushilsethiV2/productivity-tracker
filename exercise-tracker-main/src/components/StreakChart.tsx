import { TrendingUp } from 'lucide-react';
import { Habit } from '../types';
import { loadHabitEntries } from '../services/habitService';

interface StreakChartProps {
  habits: Habit[];
}

export default function StreakChart({ habits }: StreakChartProps) {
  const getLast30Days = () => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  const calculateDayCompletion = (date: Date) => {
    if (habits.length === 0) return 0;

    const dateStr = date.toISOString().split('T')[0];
    const entries = loadHabitEntries();
    const dayEntries = entries.filter(e => e.date === dateStr && e.completed);

    return (dayEntries.length / habits.length) * 100;
  };

  const days = getLast30Days();
  const maxCompletion = 100;

  return (
    <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <TrendingUp className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Activity Streak</h2>
          <p className="text-sm text-gray-400">Last 30 days habit completion</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1 h-32">
        {days.map((day, index) => {
          const completion = calculateDayCompletion(day);
          const height = (completion / maxCompletion) * 100;
          const isToday = day.toDateString() === new Date().toDateString();

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
              <div className="relative w-full h-full flex items-end">
                <div
                  className={`w-full rounded-t transition-all ${
                    completion === 100
                      ? 'bg-gradient-to-t from-green-500 to-emerald-400'
                      : completion >= 50
                      ? 'bg-gradient-to-t from-yellow-500 to-orange-400'
                      : completion > 0
                      ? 'bg-gradient-to-t from-blue-500 to-cyan-400'
                      : 'bg-gray-700'
                  } ${isToday ? 'ring-2 ring-white' : ''}`}
                  style={{ height: `${Math.max(height, 4)}%` }}
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    <br />
                    {completion.toFixed(0)}%
                  </div>
                </div>
              </div>
              {(index === 0 || index === days.length - 1 || day.getDate() === 1) && (
                <span className="text-xs text-gray-500">
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).split(' ')[0]}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-center gap-4 mt-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-700" />
          <span className="text-gray-400">No activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-t from-blue-500 to-cyan-400" />
          <span className="text-gray-400">Low</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-t from-yellow-500 to-orange-400" />
          <span className="text-gray-400">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gradient-to-t from-green-500 to-emerald-400" />
          <span className="text-gray-400">Complete</span>
        </div>
      </div>
    </div>
  );
}

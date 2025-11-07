import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, Dumbbell, Target, X } from 'lucide-react';
import { Todo, Habit, Routine } from '../types';
import { getHabitEntry } from '../services/habitService';

interface CalendarWidgetProps {
  todos: Todo[];
  habits: Habit[];
  routines: Routine[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function CalendarWidget({
  todos,
  habits,
  routines,
  currentDate,
  onDateChange,
}: CalendarWidgetProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [tooltipDate, setTooltipDate] = useState<string | null>(null);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getActivitiesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];

    const todosForDay = todos.filter(t =>
      !t.completed && t.dueDate && t.dueDate.split('T')[0] === dateStr
    );

    const habitsForDay = habits.filter(h => {
      const entry = getHabitEntry(h.id, dateStr);
      return entry?.completed;
    });

    const routinesForDay = routines.filter(r =>
      r.lastPerformed && r.lastPerformed.split('T')[0] === dateStr
    );

    return {
      todos: todosForDay,
      habits: habitsForDay,
      routines: routinesForDay,
      todosCount: todosForDay.length,
      habitsCount: habitsForDay.length,
      routinesCount: routinesForDay.length,
      hasActivity: todosForDay.length > 0 || habitsForDay.length > 0 || routinesForDay.length > 0,
    };
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setViewDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setViewDate(newDate);
  };

  const goToToday = () => {
    setViewDate(new Date());
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(viewDate);
  const today = new Date();
  const selectedDateStr = currentDate.toISOString().split('T')[0];

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold">Calendar</h2>
        </div>
        <button
          onClick={goToToday}
          className="text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 px-3 py-1 rounded-lg transition-colors"
        >
          Today
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-1 hover:bg-[rgb(var(--background))] rounded transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold">
          {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={goToNextMonth}
          className="p-1 hover:bg-[rgb(var(--background))] rounded transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-gray-400 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 relative">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const date = new Date(year, month, day);
          const dateStr = date.toISOString().split('T')[0];
          const isToday = date.toDateString() === today.toDateString();
          const isSelected = dateStr === selectedDateStr;
          const activities = getActivitiesForDate(date);
          const showTooltip = tooltipDate === dateStr;

          return (
            <div key={day} className="relative">
              <button
                onClick={() => onDateChange(date)}
                onMouseEnter={() => activities.hasActivity && setTooltipDate(dateStr)}
                onMouseLeave={() => setTooltipDate(null)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative w-full ${
                  isToday
                    ? 'bg-blue-500/20 border border-blue-500 text-blue-400 font-bold'
                    : isSelected
                    ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-400'
                    : 'hover:bg-[rgb(var(--background))] border border-transparent'
                }`}
              >
                <span>{day}</span>
                {activities.hasActivity && (
                  <div className="flex gap-0.5 mt-0.5">
                    {activities.todosCount > 0 && (
                      <div className="w-1 h-1 rounded-full bg-yellow-400" />
                    )}
                    {activities.habitsCount > 0 && (
                      <div className="w-1 h-1 rounded-full bg-green-400" />
                    )}
                    {activities.routinesCount > 0 && (
                      <div className="w-1 h-1 rounded-full bg-blue-400" />
                    )}
                  </div>
                )}
              </button>

              {showTooltip && activities.hasActivity && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64">
                  <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg shadow-xl p-3 space-y-2">
                    {activities.todosCount > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-yellow-400">
                          <Target className="w-3 h-3" />
                          Tasks ({activities.todosCount})
                        </div>
                        <div className="ml-5 space-y-0.5">
                          {activities.todos.map(todo => (
                            <p key={todo.id} className="text-xs text-gray-300 truncate">
                              {todo.title}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {activities.habitsCount > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Habits ({activities.habitsCount})
                        </div>
                        <div className="ml-5 space-y-0.5">
                          {activities.habits.map(habit => (
                            <p key={habit.id} className="text-xs text-gray-300 truncate">
                              {habit.name}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {activities.routinesCount > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-blue-400">
                          <Dumbbell className="w-3 h-3" />
                          Workouts ({activities.routinesCount})
                        </div>
                        <div className="ml-5 space-y-0.5">
                          {activities.routines.map(routine => (
                            <p key={routine.id} className="text-xs text-gray-300 truncate">
                              {routine.name}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-[rgb(var(--border))]">
        <p className="text-xs font-medium text-gray-400 mb-2">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <div className="space-y-2">
          {getActivitiesForDate(currentDate).todosCount > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <Target className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-300">
                {getActivitiesForDate(currentDate).todosCount} task(s) due
              </span>
            </div>
          )}
          {getActivitiesForDate(currentDate).habitsCount > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">
                {getActivitiesForDate(currentDate).habitsCount} habit(s) completed
              </span>
            </div>
          )}
          {getActivitiesForDate(currentDate).routinesCount > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <Dumbbell className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">
                {getActivitiesForDate(currentDate).routinesCount} workout(s)
              </span>
            </div>
          )}
          {!getActivitiesForDate(currentDate).hasActivity && (
            <p className="text-xs text-gray-500">No activities for this day</p>
          )}
        </div>
      </div>
    </div>
  );
}

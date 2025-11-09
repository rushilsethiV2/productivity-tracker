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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDay = new Date(date);
    selectedDay.setHours(0, 0, 0, 0);
    const isFutureDate = selectedDay > today;
    const isToday = selectedDay.getTime() === today.getTime();

    const todosForDay = todos.filter(t =>
      !t.completed && t.dueDate && t.dueDate.split('T')[0] === dateStr
    );

    let habitsForDay: Habit[] = [];
    let habitsCompleted = 0;
    let habitsPending = 0;

    if (!isFutureDate) {
      const completedHabits = habits.filter(h => {
        const entry = getHabitEntry(h.id, dateStr);
        return entry?.completed;
      });
      habitsForDay = completedHabits;
      habitsCompleted = completedHabits.length;

      if (isToday) {
        habitsPending = habits.length - habitsCompleted;
      }
    }

    let routinesForDay: Routine[] = [];
    let routinesCompleted = 0;
    let routinesPending = 0;

    if (!isFutureDate) {
      const completedRoutines = routines.filter(r =>
        r.lastPerformed && r.lastPerformed.split('T')[0] === dateStr
      );
      routinesForDay = completedRoutines;
      routinesCompleted = completedRoutines.length > 0 ? 1 : 0;

      if (isToday && routines.length > 0) {
        routinesPending = routinesCompleted === 0 ? 1 : 0;
      }
    }

    return {
      todos: todosForDay,
      habits: habitsForDay,
      routines: routinesForDay,
      todosCount: todosForDay.length,
      habitsCount: habitsForDay.length,
      habitsCompleted,
      habitsPending,
      routinesCount: routinesForDay.length > 0 ? 1 : 0,
      routinesCompleted,
      routinesPending,
      totalHabits: habits.length,
      totalRoutines: routines.length > 0 ? 1 : 0,
      hasActivity: todosForDay.length > 0 || habitsForDay.length > 0 || routinesForDay.length > 0 || (isToday && (habitsPending > 0 || routinesPending > 0)),
      isFutureDate,
      isToday,
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
                    {(activities.habitsCompleted > 0 || activities.habitsPending > 0) && (
                      <div className={`w-1 h-1 rounded-full ${
                        activities.isToday && activities.habitsPending > 0
                          ? 'bg-orange-400'
                          : 'bg-green-400'
                      }`} />
                    )}
                    {(activities.routinesCompleted > 0 || activities.routinesPending > 0) && (
                      <div className={`w-1 h-1 rounded-full ${
                        activities.isToday && activities.routinesPending > 0
                          ? 'bg-cyan-400'
                          : 'bg-blue-400'
                      }`} />
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
                          Tasks ({activities.todosCount} pending)
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
                    {(activities.habitsCompleted > 0 || activities.habitsPending > 0) && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-green-400">
                          <CheckCircle className="w-3 h-3" />
                          Habits ({activities.habitsCompleted}/{activities.totalHabits} {activities.isToday ? 'completed' : 'done'})
                        </div>
                        {activities.habits.length > 0 && (
                          <div className="ml-5 space-y-0.5">
                            {activities.habits.map(habit => (
                              <p key={habit.id} className="text-xs text-gray-300 truncate">
                                {habit.name}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {(activities.routinesCompleted > 0 || activities.routinesPending > 0) && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-blue-400">
                          <Dumbbell className="w-3 h-3" />
                          Workouts ({activities.routinesCompleted}/{activities.totalRoutines} {activities.isToday ? 'completed' : 'done'})
                        </div>
                        {activities.routines.length > 0 && (
                          <div className="ml-5 space-y-0.5">
                            {activities.routines.map(routine => (
                              <p key={routine.id} className="text-xs text-gray-300 truncate">
                                {routine.name}
                              </p>
                            ))}
                          </div>
                        )}
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
        <p className="text-xs font-medium text-gray-400 mb-3">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <div className="space-y-2">
          {(() => {
            const activities = getActivitiesForDate(currentDate);

            if (activities.isFutureDate) {
              if (activities.todosCount > 0) {
                return (
                  <>
                    <div className="flex items-center gap-2 text-xs">
                      <Target className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300">
                        {activities.todosCount} task(s) scheduled
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 italic">Progress tracking available after completion</p>
                  </>
                );
              }
              return <p className="text-xs text-gray-500">No tasks scheduled for this day</p>;
            }

            const hasAnyActivity = activities.todosCount > 0 ||
                                   activities.habitsCompleted > 0 ||
                                   activities.habitsPending > 0 ||
                                   activities.routinesCompleted > 0 ||
                                   activities.routinesPending > 0;

            if (!hasAnyActivity) {
              return <p className="text-xs text-gray-500">No activities for this day</p>;
            }

            return (
              <>
                {activities.todosCount > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <Target className="w-4 h-4 text-yellow-400" />
                      <span className="text-gray-300">Tasks</span>
                    </div>
                    <span className="text-xs font-medium text-yellow-400">
                      {activities.todosCount} pending
                    </span>
                  </div>
                )}

                {(activities.habitsCompleted > 0 || activities.habitsPending > 0) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">Habits</span>
                    </div>
                    <span className="text-xs font-medium">
                      <span className="text-green-400">{activities.habitsCompleted}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-gray-400">{activities.totalHabits}</span>
                      {activities.isToday && activities.habitsPending > 0 && (
                        <span className="text-orange-400 ml-1">({activities.habitsPending} left)</span>
                      )}
                    </span>
                  </div>
                )}

                {(activities.routinesCompleted > 0 || activities.routinesPending > 0) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <Dumbbell className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">Workouts</span>
                    </div>
                    <span className="text-xs font-medium">
                      <span className="text-blue-400">{activities.routinesCompleted}</span>
                      <span className="text-gray-500">/</span>
                      <span className="text-gray-400">{activities.totalRoutines}</span>
                      {activities.isToday && activities.routinesPending > 0 && (
                        <span className="text-orange-400 ml-1">({activities.routinesPending} left)</span>
                      )}
                    </span>
                  </div>
                )}

                {activities.isToday && (
                  <div className="mt-3 pt-2 border-t border-[rgb(var(--border))]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-400">Today's Progress</span>
                      <span className="font-semibold text-blue-400">
                        {(() => {
                          const totalItems = activities.todosCount + activities.totalHabits + activities.totalRoutines;
                          const completedItems = activities.habitsCompleted + activities.routinesCompleted;
                          if (totalItems === 0) return '0%';
                          return Math.round((completedItems / totalItems) * 100) + '%';
                        })()}
                      </span>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

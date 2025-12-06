import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Play, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { DayOfWeek } from '../types';
import { getExerciseById, getExerciseImagePath } from '../services/exerciseService';
import { deleteWeeklyRoutine, getWeeklyRoutineById } from '../services/storageService';

const DAYS_OF_WEEK: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function WeeklyRoutineDetail() {
  const navigate = useNavigate();
  const { routineId } = useParams<{ routineId: string }>();
  const routine = routineId ? getWeeklyRoutineById(routineId) : null;

  if (!routine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Weekly routine not found</p>
      </div>
    );
  }

  const handleDelete = () => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="font-semibold mb-3">Delete "{routine.name}"?</p>
          <p className="text-sm text-gray-400 mb-4">This action cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteWeeklyRoutine(routine.id);
                closeToast();
                toast.success('Weekly routine deleted successfully');
                navigate('/exercise');
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
            >
              Delete
            </button>
            <button
              onClick={closeToast}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        autoClose: false,
        closeButton: false,
        draggable: false,
      }
    );
  };

  const getCurrentDay = (): DayOfWeek => {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const todaysPlan = routine.weeklyPlan.find(p => p.day === getCurrentDay());

  return (
    <div className="min-h-screen p-6 pb-24 md:pl-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/exercise')}
            className="p-2 hover:bg-[rgb(var(--card))] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">{routine.name}</h1>
          </div>
          <p className="text-gray-400 mb-4">Weekly Routine</p>

          {todaysPlan && !todaysPlan.isRestDay && todaysPlan.exercises.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-300 mb-3">
                Today's Workout: {DAYS_OF_WEEK.find(d => d.key === getCurrentDay())?.label}
              </p>
              <button
                onClick={() => navigate(`/exercise/workout-weekly/${routine.id}/${getCurrentDay()}`)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Start Today's Workout
              </button>
            </div>
          )}

          {todaysPlan && todaysPlan.isRestDay && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-300 text-center">
                Today is a rest day. Enjoy your recovery!
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Weekly Schedule</h2>
          {DAYS_OF_WEEK.map(({ key, label }) => {
            const plan = routine.weeklyPlan.find(p => p.day === key)!;
            const isToday = getCurrentDay() === key;
            const lastPerformed = routine.lastPerformedDays?.[key];

            return (
              <div
                key={key}
                className={`bg-[rgb(var(--card))] border rounded-xl p-6 transition-all ${
                  isToday
                    ? 'border-blue-500 ring-2 ring-blue-500/20'
                    : 'border-[rgb(var(--border))] hover:border-blue-500/50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold">{label}</h3>
                    {isToday && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {lastPerformed && (
                      <span className="text-sm text-gray-400">
                        Last: {new Date(lastPerformed).toLocaleDateString()}
                      </span>
                    )}
                    {plan.isRestDay ? (
                      <span className="text-sm bg-green-500/20 text-green-400 px-3 py-1 rounded-full">
                        Rest Day
                      </span>
                    ) : (
                      <>
                        <span className="text-sm text-gray-400">
                          {plan.exercises.length} exercises
                        </span>
                        <button
                          onClick={() => navigate(`/exercise/workout-weekly/${routine.id}/${key}`)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Start
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {!plan.isRestDay && plan.exercises.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {plan.exercises.map((routineEx, index) => {
                      const exercise = getExerciseById(routineEx.exerciseId);
                      if (!exercise) return null;

                      return (
                        <div
                          key={index}
                          className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg p-3 flex gap-3"
                        >
                          <div className="flex-shrink-0 w-16 h-16 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                            <img
                              src={getExerciseImagePath(exercise.id, 0)}
                              alt={exercise.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm mb-1 truncate">{exercise.name}</h4>
                            <div className="flex gap-2 text-xs">
                              <span className="text-blue-400">{routineEx.sets} sets</span>
                              <span className="text-gray-500">·</span>
                              <span className="text-yellow-400">
                                {routineEx.type === 'reps'
                                  ? `${routineEx.repsPerSet} reps`
                                  : `${routineEx.timePerSet}s`}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Dumbbell, Zap, Heart, AlertCircle, Check } from 'lucide-react';
import { Routine, WeeklyRoutine, DayOfWeek } from '../types';
import { loadRoutines, updateRoutine, loadWeeklyRoutines } from '../services/storageService';

interface WorkoutBannerProps {
  onNavigate?: (app: string) => void;
}

const REST_DAY_TIPS = [
  {
    title: 'Walking',
    description: 'A light 30-minute walk aids recovery and cardiovascular health',
  },
  {
    title: 'Stretching',
    description: 'Improve flexibility and reduce muscle tension with gentle stretches',
  },
  {
    title: 'Yoga',
    description: 'Low-impact practices promote relaxation and mobility',
  },
  {
    title: 'Swimming',
    description: 'Easy on joints while keeping your body active',
  },
  {
    title: 'Meditation',
    description: 'Mental recovery is as important as physical recovery',
  },
  {
    title: 'Light Cycling',
    description: 'Gentle cycling on flat terrain enhances recovery',
  },
];

export default function WorkoutBanner({ onNavigate }: WorkoutBannerProps) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weeklyRoutines, setWeeklyRoutines] = useState<WeeklyRoutine[]>([]);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [isRestDay, setIsRestDay] = useState(false);

  useEffect(() => {
    loadWorkoutData();
    checkResetTime();

    const timer = setInterval(checkResetTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentDay = (): DayOfWeek => {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const loadWorkoutData = () => {
    const loaded = loadRoutines();
    const loadedWeekly = loadWeeklyRoutines();
    setRoutines(loaded);
    setWeeklyRoutines(loadedWeekly);
    checkTodayCompletion(loaded, loadedWeekly);
  };

  const checkResetTime = () => {
    const now = new Date();
    const lastResetTime = localStorage.getItem('workout_reset_time');

    if (!lastResetTime) {
      localStorage.setItem('workout_reset_time', now.toISOString());
      return;
    }

    const lastReset = new Date(lastResetTime);
    const nextReset = new Date(lastReset);
    nextReset.setDate(nextReset.getDate() + 1);
    nextReset.setHours(4, 0, 0, 0);

    if (now >= nextReset) {
      setWorkoutCompleted(false);
      setIsRestDay(false);
      localStorage.setItem('workout_reset_time', now.toISOString());
    }
  };

  const checkTodayCompletion = (loadedRoutines: Routine[], loadedWeekly: WeeklyRoutine[]) => {
    const today = new Date().toISOString().split('T')[0];
    const currentDay = getCurrentDay();

    const dailyCompleted = loadedRoutines.some(
      r => r.lastPerformed && r.lastPerformed.split('T')[0] === today
    );

    const weeklyCompleted = loadedWeekly.some(wr => {
      const dayPlan = wr.weeklyPlan.find(p => p.day === currentDay);
      if (!dayPlan || dayPlan.isRestDay || dayPlan.exercises.length === 0) {
        return true;
      }
      return wr.lastPerformedDays?.[currentDay] &&
             wr.lastPerformedDays[currentDay].split('T')[0] === today;
    });

    const hasWeeklyRestDay = loadedWeekly.some(wr => {
      const dayPlan = wr.weeklyPlan.find(p => p.day === currentDay);
      return dayPlan?.isRestDay;
    });

    setWorkoutCompleted(dailyCompleted || weeklyCompleted);

    const isRestToday = localStorage.getItem(`rest_day_${today}`) === 'true' || hasWeeklyRestDay;
    setIsRestDay(isRestToday);
  };

  const handleWorkoutComplete = () => {
    const today = new Date().toISOString();
    if (routines.length > 0) {
      updateRoutine({
        ...routines[0],
        lastPerformed: today,
      });
      setWorkoutCompleted(true);
    }
  };

  const handleRestDay = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`rest_day_${today}`, 'true');
    setIsRestDay(true);
  };

  if (routines.length === 0 && weeklyRoutines.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <AlertCircle className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">No Workouts Created</h3>
            <p className="text-gray-300 text-sm mb-4">
              Start building a stronger you by creating your first workout routine. Set up a routine that fits your goals and schedule.
            </p>
            <button
              onClick={() => onNavigate?.('exercise')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Create First Workout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (workoutCompleted || isRestDay) {
    return (
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <Check className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">
              {isRestDay ? 'Rest Day Active' : 'Workout Completed!'}
            </h3>
            <p className="text-gray-300 text-sm mb-4">
              {isRestDay
                ? 'Great choice! Active recovery is important for long-term progress.'
                : 'Amazing effort today! Keep up the great work!'}
            </p>
            {isRestDay && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REST_DAY_TIPS.slice(0, 3).map((tip, index) => (
                  <div key={index} className="flex gap-2 text-sm">
                    <Heart className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-200">{tip.title}</p>
                      <p className="text-gray-400 text-xs">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-orange-500/20 rounded-lg">
          <Dumbbell className="w-6 h-6 text-orange-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">Time to Workout</h3>
          <p className="text-gray-300 text-sm mb-4">
            Complete at least one workout routine to stay on track with your fitness goals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate?.('exercise')}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              <Zap className="w-4 h-4" />
              Go to Workout
            </button>
            <button
              onClick={handleRestDay}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors"
            >
              Rest Day
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

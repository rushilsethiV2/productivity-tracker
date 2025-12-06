import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Pause, SkipForward, CheckCircle } from 'lucide-react';
import { Routine } from '../types';
import { getExerciseById, getExerciseImagePath } from '../services/exerciseService';
import { updateRoutine, addSession, getRoutineById } from '../services/storageService';

type WorkoutState = 'ready' | 'exercise' | 'rest' | 'completed';

export default function WorkoutPlayer() {
  const navigate = useNavigate();
  const { routineId } = useParams<{ routineId: string }>();
  const routine = routineId ? getRoutineById(routineId) : null;

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [state, setState] = useState<WorkoutState>('ready');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [sessionStartTime] = useState(new Date().toISOString());

  if (!routine) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Routine not found</p>
      </div>
    );
  }

  const currentRoutineExercise = routine.exercises[currentExerciseIndex];
  const currentExercise = currentRoutineExercise ? getExerciseById(currentRoutineExercise.exerciseId) : null;
  const totalExercises = routine.exercises.length;

  useEffect(() => {
    if (state === 'exercise' && currentRoutineExercise?.type === 'time' && !isPaused) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        handleSetComplete();
      }
    }
  }, [timeLeft, state, isPaused]);

  useEffect(() => {
    if ((state === 'exercise' || state === 'rest') && !isPaused) {
      const imageTimer = setInterval(() => {
        setImageIndex(prev => (prev === 0 ? 1 : 0));
      }, 1000);
      return () => clearInterval(imageTimer);
    }
  }, [state, isPaused]);

  useEffect(() => {
    if (state === 'rest' && !isPaused) {
      if (timeLeft > 0) {
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        startNextSet();
      }
    }
  }, [timeLeft, state, isPaused]);

  const startWorkout = () => {
    setState('exercise');
    if (currentRoutineExercise?.type === 'time') {
      setTimeLeft(currentRoutineExercise.timePerSet || 30);
    }
  };

  const handleSetComplete = () => {
    if (currentSet < currentRoutineExercise.sets) {
      setState('rest');
      setTimeLeft(currentRoutineExercise.restBetweenSets);
    } else {
      goToNextExercise();
    }
  };

  const startNextSet = () => {
    setCurrentSet(currentSet + 1);
    setState('exercise');
    if (currentRoutineExercise?.type === 'time') {
      setTimeLeft(currentRoutineExercise.timePerSet || 30);
    }
  };

  const goToNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setState('exercise');
      const nextExercise = routine.exercises[currentExerciseIndex + 1];
      if (nextExercise?.type === 'time') {
        setTimeLeft(nextExercise.timePerSet || 30);
      }
    } else {
      completeWorkout();
    }
  };

  const completeWorkout = () => {
    setState('completed');

    const updatedRoutine = {
      ...routine,
      lastPerformed: new Date().toISOString(),
    };
    updateRoutine(updatedRoutine);

    addSession({
      routineId: routine.id,
      startTime: sessionStartTime,
      endTime: new Date().toISOString(),
      completed: true,
    });
  };

  const skipExercise = () => {
    goToNextExercise();
  };

  if (!currentExercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Exercise not found</p>
      </div>
    );
  }

  if (state === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-yellow-400 bg-clip-text text-transparent">
            Workout Complete!
          </h1>
          <p className="text-gray-400 mb-8">Great job finishing your routine</p>
          <button
            onClick={() => navigate('/exercise')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-xl transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24 md:pl-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/exercise')}
            className="p-2 hover:bg-[rgb(var(--card))] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h2 className="text-sm text-gray-400">
              Exercise {currentExerciseIndex + 1} of {totalExercises}
            </h2>
            <div className="flex gap-1 mt-2">
              {routine.exercises.map((_, index) => (
                <div
                  key={index}
                  className={`h-1 w-8 rounded-full ${
                    index < currentExerciseIndex
                      ? 'bg-green-400'
                      : index === currentExerciseIndex
                      ? 'bg-blue-400'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={skipExercise}
            className="p-2 hover:bg-[rgb(var(--card))] rounded-lg transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl overflow-hidden mb-6">
          <img
            src={getExerciseImagePath(currentExercise.id, imageIndex)}
            alt={currentExercise.name}
            className="w-full h-64 md:h-96 object-contain bg-gray-900"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23333" width="400" height="400"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>

        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{currentExercise.name}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {currentExercise.primaryMuscles.map(muscle => (
              <span
                key={muscle}
                className="text-sm bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full"
              >
                {muscle}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Set</p>
              <p className="text-2xl font-bold text-blue-400">
                {currentSet}/{currentRoutineExercise.sets}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">
                {currentRoutineExercise.type === 'reps' ? 'Reps' : 'Time'}
              </p>
              <p className="text-2xl font-bold text-yellow-400">
                {currentRoutineExercise.type === 'reps'
                  ? currentRoutineExercise.repsPerSet
                  : `${currentRoutineExercise.timePerSet}s`}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Rest</p>
              <p className="text-2xl font-bold text-green-400">
                {currentRoutineExercise.restBetweenSets}s
              </p>
            </div>
          </div>

          {state === 'rest' && (
            <div className="text-center mb-6">
              <p className="text-4xl font-bold text-yellow-400 mb-2">{timeLeft}s</p>
              <p className="text-gray-400">Rest Time</p>
            </div>
          )}

          {state === 'exercise' && currentRoutineExercise.type === 'time' && (
            <div className="text-center mb-6">
              <p className="text-6xl font-bold text-blue-400 mb-2">{timeLeft}s</p>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-yellow-400 h-full transition-all duration-1000"
                  style={{
                    width: `${((currentRoutineExercise.timePerSet! - timeLeft) / currentRoutineExercise.timePerSet!) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {state === 'ready' && (
            <button
              onClick={startWorkout}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-6 h-6" />
              Start Exercise
            </button>
          )}

          {state === 'exercise' && currentRoutineExercise.type === 'reps' && (
            <button
              onClick={handleSetComplete}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-4 rounded-xl transition-all"
            >
              Complete Set
            </button>
          )}

          {state === 'exercise' && currentRoutineExercise.type === 'time' && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
          )}
        </div>

        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6">
          <h3 className="font-semibold mb-3">Instructions</h3>
          <ol className="space-y-2 list-decimal list-inside text-gray-300">
            {currentExercise.instructions.map((instruction, index) => (
              <li key={index} className="leading-relaxed">{instruction}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

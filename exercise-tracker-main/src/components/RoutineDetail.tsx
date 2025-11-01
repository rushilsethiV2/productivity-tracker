import { useState } from 'react';
import { ArrowLeft, Trash2, Edit2, Play } from 'lucide-react';
import { toast } from 'react-toastify';
import { Routine, Exercise } from '../types';
import { getExerciseById, getExerciseImagePath } from '../services/exerciseService';
import { deleteRoutine } from '../services/storageService';

interface RoutineDetailProps {
  routine: Routine;
  onNavigate: (page: string, routineId?: string) => void;
  onDelete: () => void;
}

export default function RoutineDetail({ routine, onNavigate, onDelete }: RoutineDetailProps) {
  const handleDelete = () => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="font-semibold mb-3">Delete "{routine.name}"?</p>
          <p className="text-sm text-gray-400 mb-4">This action cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteRoutine(routine.id);
                onDelete();
                closeToast();
                toast.success('Routine deleted successfully');
                onNavigate('home');
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

  return (
    <div className="min-h-screen p-6 pb-24 md:pl-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('home')}
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
          <h1 className="text-3xl font-bold mb-2">{routine.name}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <span className="capitalize">{routine.type} Routine</span>
            <span>{routine.exercises.length} exercises</span>
            {routine.lastPerformed && (
              <span>Last: {new Date(routine.lastPerformed).toLocaleDateString()}</span>
            )}
          </div>
          <button
            onClick={() => onNavigate('workout', routine.id)}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-6 h-6" />
            Start Workout
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold mb-4">Exercises</h2>
          {routine.exercises.map((routineEx, index) => {
            const exercise = getExerciseById(routineEx.exerciseId);
            if (!exercise) return null;

            return (
              <ExerciseCard
                key={index}
                exercise={exercise}
                routineExercise={routineEx}
                index={index}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({
  exercise,
  routineExercise,
  index,
}: {
  exercise: Exercise;
  routineExercise: any;
  index: number;
}) {
  return (
    <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-4 hover:border-blue-500/50 transition-colors">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-24 h-24 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
          <img
            src={getExerciseImagePath(exercise.id, 0)}
            alt={exercise.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-sm text-gray-400">Exercise {index + 1}</span>
              <h3 className="text-lg font-semibold">{exercise.name}</h3>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {exercise.primaryMuscles.map(muscle => (
              <span
                key={muscle}
                className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
              >
                {muscle}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Sets:</span>{' '}
              <span className="font-semibold text-blue-400">{routineExercise.sets}</span>
            </div>
            <div>
              <span className="text-gray-400">
                {routineExercise.type === 'reps' ? 'Reps:' : 'Time:'}
              </span>{' '}
              <span className="font-semibold text-yellow-400">
                {routineExercise.type === 'reps'
                  ? routineExercise.repsPerSet
                  : `${routineExercise.timePerSet}s`}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Rest:</span>{' '}
              <span className="font-semibold text-green-400">
                {routineExercise.restBetweenSets}s
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

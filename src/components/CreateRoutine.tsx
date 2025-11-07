import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Trash2, Calendar, Clock } from 'lucide-react';
import { toast } from 'react-toastify';
import { Exercise, Routine, RoutineExercise } from '../types';
import { loadExercises, getExerciseImagePath } from '../services/exerciseService';
import { addRoutine } from '../services/storageService';

interface CreateRoutineProps {
  onNavigate: (page: string) => void;
}

export default function CreateRoutine({ onNavigate }: CreateRoutineProps) {
  const [routineName, setRoutineName] = useState('');
  const [routineType, setRoutineType] = useState<'daily' | 'weekly'>('daily');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  useEffect(() => {
    loadExercises().then(setExercises);
  }, []);

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ex.primaryMuscles.some(m => m.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addExercise = (exercise: Exercise) => {
    const newRoutineExercise: RoutineExercise = {
      exerciseId: exercise.id,
      type: 'reps',
      sets: 3,
      repsPerSet: 10,
      restBetweenSets: 60,
    };
    setSelectedExercises([...selectedExercises, newRoutineExercise]);
    setShowExercisePicker(false);
    setSearchQuery('');
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, updates: Partial<RoutineExercise>) => {
    const updated = [...selectedExercises];
    updated[index] = { ...updated[index], ...updates };
    setSelectedExercises(updated);
  };

  const saveRoutine = () => {
    if (!routineName.trim()) {
      toast.error('Please provide a routine name');
      return;
    }

    if (selectedExercises.length === 0) {
      toast.error('Please add at least one exercise');
      return;
    }

    const routine: Routine = {
      id: Date.now().toString(),
      name: routineName,
      type: routineType,
      exercises: selectedExercises,
      createdAt: new Date().toISOString(),
    };

    addRoutine(routine);
    toast.success('Routine created successfully!');
    onNavigate('home');
  };

  return (
    <div className="min-h-screen p-6 pb-24 md:pl-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 hover:bg-[rgb(var(--card))] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-3xl font-bold">Create Routine</h1>
        </div>

        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Routine Name</label>
            <input
              type="text"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="Enter routine name..."
              className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Routine Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRoutineType('daily')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                  routineType === 'daily'
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                    : 'bg-[rgb(var(--background))] border-[rgb(var(--border))] hover:border-yellow-500'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span className="font-medium">Daily</span>
              </button>
              <button
                onClick={() => setRoutineType('weekly')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border transition-all ${
                  routineType === 'weekly'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-[rgb(var(--background))] border-[rgb(var(--border))] hover:border-blue-500'
                }`}
              >
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Weekly</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Exercises</h2>
            <button
              onClick={() => setShowExercisePicker(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Exercise
            </button>
          </div>

          {selectedExercises.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No exercises added yet</p>
          ) : (
            <div className="space-y-3">
              {selectedExercises.map((routineEx, index) => {
                const exercise = exercises.find(ex => ex.id === routineEx.exerciseId);
                if (!exercise) return null;

                return (
                  <ExerciseConfig
                    key={index}
                    exercise={exercise}
                    routineExercise={routineEx}
                    onUpdate={(updates) => updateExercise(index, updates)}
                    onRemove={() => removeExercise(index)}
                  />
                );
              })}
            </div>
          )}
        </div>

        <button
          onClick={saveRoutine}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 rounded-xl transition-all"
        >
          Save Routine
        </button>

        {showExercisePicker && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-[rgb(var(--border))]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Select Exercise</h2>
                  <button
                    onClick={() => {
                      setShowExercisePicker(false);
                      setSearchQuery('');
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search exercises..."
                    className="w-full bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>
              <div className="overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredExercises.map(exercise => (
                    <div
                      key={exercise.id}
                      onClick={() => addExercise(exercise)}
                      className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-all"
                    >
                      <div className="w-full h-40 bg-gray-900 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                        <img
                          src={getExerciseImagePath(exercise.id, 0)}
                          alt={exercise.name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23666" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                      <h3 className="font-semibold mb-1">{exercise.name}</h3>
                      <div className="flex flex-wrap gap-1">
                        {exercise.primaryMuscles.map(muscle => (
                          <span
                            key={muscle}
                            className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ExerciseConfig({
  exercise,
  routineExercise,
  onUpdate,
  onRemove,
}: {
  exercise: Exercise;
  routineExercise: RoutineExercise;
  onUpdate: (updates: Partial<RoutineExercise>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-[rgb(var(--background))] border border-[rgb(var(--border))] rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold">{exercise.name}</h3>
          <p className="text-sm text-gray-400">{exercise.primaryMuscles.join(', ')}</p>
        </div>
        <button
          onClick={onRemove}
          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <button
          onClick={() => onUpdate({ type: 'reps', timePerSet: undefined })}
          className={`py-2 px-3 rounded-lg border transition-all ${
            routineExercise.type === 'reps'
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'border-[rgb(var(--border))] hover:border-blue-500'
          }`}
        >
          Reps Based
        </button>
        <button
          onClick={() => onUpdate({ type: 'time', repsPerSet: undefined })}
          className={`py-2 px-3 rounded-lg border transition-all ${
            routineExercise.type === 'time'
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
              : 'border-[rgb(var(--border))] hover:border-yellow-500'
          }`}
        >
          Time Based
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Sets</label>
          <input
            type="number"
            value={routineExercise.sets}
            onChange={(e) => onUpdate({ sets: parseInt(e.target.value) || 1 })}
            min="1"
            className="w-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
        {routineExercise.type === 'reps' ? (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Reps</label>
            <input
              type="number"
              value={routineExercise.repsPerSet}
              onChange={(e) => onUpdate({ repsPerSet: parseInt(e.target.value) || 1 })}
              min="1"
              className="w-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Time (s)</label>
            <input
              type="number"
              value={routineExercise.timePerSet}
              onChange={(e) => onUpdate({ timePerSet: parseInt(e.target.value) || 30 })}
              min="1"
              className="w-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Rest (s)</label>
          <input
            type="number"
            value={routineExercise.restBetweenSets}
            onChange={(e) => onUpdate({ restBetweenSets: parseInt(e.target.value) || 0 })}
            min="0"
            className="w-full bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded px-3 py-2 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

import { Exercise } from '../types';

let exercisesCache: Exercise[] | null = null;

export async function loadExercises(): Promise<Exercise[]> {
  if (exercisesCache) {
    return exercisesCache;
  }

  try {
    const response = await fetch('/exercises.json');
    if (!response.ok) {
      throw new Error('Failed to load exercises');
    }
    exercisesCache = await response.json();
    return exercisesCache || [];
  } catch (error) {
    console.error('Error loading exercises:', error);
    return [];
  }
}

export function getExerciseById(id: string): Exercise | undefined {
  return exercisesCache?.find(ex => ex.id === id);
}

export function getExerciseImagePath(exerciseId: string, imageIndex: number): string {
  return `/exercises/${exerciseId}/${imageIndex}.jpg`;
}

export function searchExercises(query: string): Exercise[] {
  if (!exercisesCache) return [];

  const lowerQuery = query.toLowerCase();
  return exercisesCache.filter(ex =>
    ex.name.toLowerCase().includes(lowerQuery) ||
    ex.primaryMuscles.some(m => m.toLowerCase().includes(lowerQuery)) ||
    ex.equipment.toLowerCase().includes(lowerQuery)
  );
}

export function getExercisesByMuscle(muscle: string): Exercise[] {
  if (!exercisesCache) return [];

  const lowerMuscle = muscle.toLowerCase();
  return exercisesCache.filter(ex =>
    ex.primaryMuscles.some(m => m.toLowerCase() === lowerMuscle) ||
    ex.secondaryMuscles.some(m => m.toLowerCase() === lowerMuscle)
  );
}

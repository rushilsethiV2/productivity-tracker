export interface Exercise {
  id: string;
  name: string;
  force: string;
  level: string;
  mechanic: string;
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

export interface RoutineExercise {
  exerciseId: string;
  type: 'reps' | 'time';
  sets: number;
  repsPerSet?: number;
  timePerSet?: number;
  restBetweenSets: number;
}

export interface Routine {
  id: string;
  name: string;
  type: 'daily' | 'weekly';
  exercises: RoutineExercise[];
  createdAt: string;
  lastPerformed?: string;
}

export interface WorkoutSession {
  routineId: string;
  startTime: string;
  endTime?: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  dueDate?: string;
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface HabitEntry {
  habitId: string;
  date: string;
  completed: boolean;
}

export interface NoteCollection {
  id: string;
  name: string;
  createdAt: string;
}

export interface Note {
  id: string;
  collectionId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

import { Habit, HabitEntry } from '../types';

const HABITS_KEY = 'app_habits';
const HABIT_ENTRIES_KEY = 'app_habit_entries';

export function saveHabits(habits: Habit[]): void {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

export function loadHabits(): Habit[] {
  const data = localStorage.getItem(HABITS_KEY);
  return data ? JSON.parse(data) : [];
}

export function addHabit(habit: Habit): void {
  const habits = loadHabits();
  habits.push(habit);
  saveHabits(habits);
}

export function updateHabit(updatedHabit: Habit): void {
  const habits = loadHabits();
  const index = habits.findIndex(h => h.id === updatedHabit.id);
  if (index !== -1) {
    habits[index] = updatedHabit;
    saveHabits(habits);
  }
}

export function deleteHabit(id: string): void {
  const habits = loadHabits();
  const filtered = habits.filter(h => h.id !== id);
  saveHabits(filtered);

  const entries = loadHabitEntries();
  const filteredEntries = entries.filter(e => e.habitId !== id);
  saveHabitEntries(filteredEntries);
}

export function saveHabitEntries(entries: HabitEntry[]): void {
  localStorage.setItem(HABIT_ENTRIES_KEY, JSON.stringify(entries));
}

export function loadHabitEntries(): HabitEntry[] {
  const data = localStorage.getItem(HABIT_ENTRIES_KEY);
  return data ? JSON.parse(data) : [];
}

export function getHabitEntry(habitId: string, date: string): HabitEntry | undefined {
  const entries = loadHabitEntries();
  return entries.find(e => e.habitId === habitId && e.date === date);
}

export function setHabitEntry(habitId: string, date: string, completed: boolean): void {
  const entries = loadHabitEntries();
  const existingIndex = entries.findIndex(e => e.habitId === habitId && e.date === date);

  if (existingIndex !== -1) {
    entries[existingIndex].completed = completed;
  } else {
    entries.push({ habitId, date, completed });
  }

  saveHabitEntries(entries);
}

export function getHabitEntriesForDate(date: string): HabitEntry[] {
  const entries = loadHabitEntries();
  return entries.filter(e => e.date === date);
}

export function isDateModifiable(date: string): boolean {
  const now = new Date();
  const targetDate = new Date(date);

  const today = new Date(now);
  today.setHours(4, 0, 0, 0);

  if (now.getHours() < 4) {
    today.setDate(today.getDate() - 1);
  }

  return targetDate >= today;
}

import { Routine, WorkoutSession, WeeklyRoutine } from '../types';

const ROUTINES_KEY = 'workout_routines';
const SESSIONS_KEY = 'workout_sessions';
const WEEKLY_ROUTINES_KEY = 'weekly_workout_routines';

export function saveRoutines(routines: Routine[]): void {
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
}

export function loadRoutines(): Routine[] {
  const data = localStorage.getItem(ROUTINES_KEY);
  return data ? JSON.parse(data) : [];
}

export function addRoutine(routine: Routine): void {
  const routines = loadRoutines();
  routines.push(routine);
  saveRoutines(routines);
}

export function updateRoutine(updatedRoutine: Routine): void {
  const routines = loadRoutines();
  const index = routines.findIndex(r => r.id === updatedRoutine.id);
  if (index !== -1) {
    routines[index] = updatedRoutine;
    saveRoutines(routines);
  }
}

export function deleteRoutine(id: string): void {
  const routines = loadRoutines();
  const filtered = routines.filter(r => r.id !== id);
  saveRoutines(filtered);
}

export function getRoutineById(id: string): Routine | undefined {
  const routines = loadRoutines();
  return routines.find(r => r.id === id);
}

export function saveSessions(sessions: WorkoutSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function loadSessions(): WorkoutSession[] {
  const data = localStorage.getItem(SESSIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function addSession(session: WorkoutSession): void {
  const sessions = loadSessions();
  sessions.push(session);
  saveSessions(sessions);
}

export function updateSession(updatedSession: WorkoutSession): void {
  const sessions = loadSessions();
  const index = sessions.findIndex(
    s => s.routineId === updatedSession.routineId && s.startTime === updatedSession.startTime
  );
  if (index !== -1) {
    sessions[index] = updatedSession;
    saveSessions(sessions);
  }
}

export function saveWeeklyRoutines(routines: WeeklyRoutine[]): void {
  localStorage.setItem(WEEKLY_ROUTINES_KEY, JSON.stringify(routines));
}

export function loadWeeklyRoutines(): WeeklyRoutine[] {
  const data = localStorage.getItem(WEEKLY_ROUTINES_KEY);
  return data ? JSON.parse(data) : [];
}

export function addWeeklyRoutine(routine: WeeklyRoutine): void {
  const routines = loadWeeklyRoutines();
  routines.push(routine);
  saveWeeklyRoutines(routines);
}

export function updateWeeklyRoutine(updatedRoutine: WeeklyRoutine): void {
  const routines = loadWeeklyRoutines();
  const index = routines.findIndex(r => r.id === updatedRoutine.id);
  if (index !== -1) {
    routines[index] = updatedRoutine;
    saveWeeklyRoutines(routines);
  }
}

export function deleteWeeklyRoutine(id: string): void {
  const routines = loadWeeklyRoutines();
  const filtered = routines.filter(r => r.id !== id);
  saveWeeklyRoutines(filtered);
}

export function getWeeklyRoutineById(id: string): WeeklyRoutine | undefined {
  const routines = loadWeeklyRoutines();
  return routines.find(r => r.id === id);
}

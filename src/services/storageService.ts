import { Routine, WorkoutSession } from '../types';

const ROUTINES_KEY = 'workout_routines';
const SESSIONS_KEY = 'workout_sessions';

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

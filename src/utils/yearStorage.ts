/**
 * Year-based localStorage utility
 *
 * Instead of many app-specific keys, we store one key per year:
 *   "2025": {
 *     app_todos: [...],
 *     app_habits: [...],
 *     ...
 *   }
 *
 * This module also migrates old flat keys into the year-based structure.
 */

const YEAR_KEY_PATTERN = /^\d{4}$/;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const LEGACY_KEYS = [
  'app_todos',
  'app_habits',
  'app_habit_entries',
  'workout_routines',
  'workout_sessions',
  'weekly_workout_routines',
  'app_note_collections',
  'app_notes',
  'workout_reset_time',
];

export type YearStorageData = Record<string, any>;

function hasStorage(): boolean {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function safeParse(value: string | null): YearStorageData {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[yearStorage] Failed to parse data', error);
    return {};
  }
}

export function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}

function resolveYear(year?: string): string {
  const resolved = year || getCurrentYear();
  return YEAR_KEY_PATTERN.test(resolved) ? resolved : getCurrentYear();
}

export function getYearData(year?: string): YearStorageData {
  if (!hasStorage()) return {};
  const yearKey = resolveYear(year);
  return safeParse(localStorage.getItem(yearKey));
}

export function saveYearData(year: string, data: YearStorageData): void {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(resolveYear(year), JSON.stringify(data ?? {}));
  } catch (error) {
    console.error('[yearStorage] Failed to save data', error);
  }
}

export function getItem<T = unknown>(key: string, year?: string): T | undefined {
  const data = getYearData(year);
  return data[key];
}

export function setItem(key: string, value: any, year?: string): void {
  if (!hasStorage()) return;
  const yearKey = resolveYear(year);
  const data = getYearData(yearKey);
  data[key] = value;
  saveYearData(yearKey, data);
}

export function removeItem(key: string, year?: string): void {
  if (!hasStorage()) return;
  const yearKey = resolveYear(year);
  const data = getYearData(yearKey);
  delete data[key];
  saveYearData(yearKey, data);
}

export function clearYear(year: string): void {
  saveYearData(resolveYear(year), {});
}

export function listYearKeys(): string[] {
  if (!hasStorage()) return [];
  const years: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && YEAR_KEY_PATTERN.test(key)) {
      years.push(key);
    }
  }
  return years.sort();
}

export function getAllYearData(): Record<string, YearStorageData> {
  const years = listYearKeys();
  return years.reduce<Record<string, YearStorageData>>((acc, year) => {
    acc[year] = getYearData(year);
    return acc;
  }, {});
}

/**
 * Migrate old flat localStorage keys into the year-based structure.
 * Safe to call multiple times; it won't overwrite existing year data.
 */
export function migrateOldStorage(): void {
  if (!hasStorage()) return;

  const currentYear = getCurrentYear();
  const currentYearData = getYearData(currentYear);
  let mutatedCurrentYear = false;

  // Move legacy app-wise keys into the current year bucket
  LEGACY_KEYS.forEach(oldKey => {
    const oldValue = localStorage.getItem(oldKey);
    if (!oldValue || currentYearData[oldKey] !== undefined) {
      return;
    }

    try {
      currentYearData[oldKey] = JSON.parse(oldValue);
    } catch {
      currentYearData[oldKey] = oldValue;
    }
    mutatedCurrentYear = true;
  });

  if (mutatedCurrentYear) {
    saveYearData(currentYear, currentYearData);
  }

  // Collect all legacy rest_day_* entries first
  const restDayEntries: Array<{ year: string; date: string }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('rest_day_')) continue;

    const date = key.replace('rest_day_', '');
    const value = localStorage.getItem(key);
    if (value !== 'true' || !DATE_KEY_PATTERN.test(date)) continue;

    restDayEntries.push({ year: date.substring(0, 4), date });
  }

  // Store rest_day_* flags into their respective year objects
  restDayEntries.forEach(entry => {
    const yearData = getYearData(entry.year);
    if (!yearData.rest_days) {
      yearData.rest_days = {};
    }

    if (!yearData.rest_days[entry.date]) {
      yearData.rest_days[entry.date] = true;
      saveYearData(entry.year, yearData);
    }
  });
}

/**
 * Get rest day status for a specific date (YYYY-MM-DD)
 */
export function getRestDay(date: string): boolean {
  const year = date.substring(0, 4);
  const data = getYearData(year);
  return data.rest_days?.[date] === true;
}

/**
 * Set rest day status for a specific date (YYYY-MM-DD)
 */
export function setRestDay(date: string, isRestDay: boolean): void {
  if (!DATE_KEY_PATTERN.test(date)) return;
  const year = date.substring(0, 4);
  const data = getYearData(year);

  if (!data.rest_days) {
    data.rest_days = {};
  }

  if (isRestDay) {
    data.rest_days[date] = true;
  } else {
    delete data.rest_days[date];
  }

  saveYearData(year, data);
}




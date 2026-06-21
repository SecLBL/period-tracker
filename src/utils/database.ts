import Dexie, { type EntityTable } from 'dexie';
import type { Cycle, Symptom, Settings } from '../types';

const db = new Dexie('PeriodTrackerDB') as Dexie & {
  cycles: EntityTable<Cycle, 'id'>;
  symptoms: EntityTable<Symptom, 'id'>;
  settings: EntityTable<Settings, 'key'>;
};

db.version(1).stores({
  cycles: '++id, startDate, endDate',
  symptoms: '++id, date, symptomType, severity',
  settings: 'key'
});

/**
 * Request persistent storage so the browser does not evict our IndexedDB
 * data under storage pressure (the cause of "data deletes itself" on devices
 * with nearly-full storage, e.g. Android Chrome PWAs).
 *
 * Without this, IndexedDB is "best-effort" and may be cleared automatically
 * when the device runs low on space. With persistence granted, data is only
 * removed by an explicit user action.
 *
 * Safe to call repeatedly; returns the resulting persistence state.
 */
export async function ensurePersistentStorage(): Promise<{
  persisted: boolean;
  supported: boolean;
}> {
  if (!('storage' in navigator) || !navigator.storage?.persist) {
    return { persisted: false, supported: false };
  }
  try {
    // If already persisted, don't re-prompt.
    if (await navigator.storage.persisted()) {
      return { persisted: true, supported: true };
    }
    const persisted = await navigator.storage.persist();
    return { persisted, supported: true };
  } catch {
    return { persisted: false, supported: true };
  }
}

/**
 * Returns storage usage info, useful for warning the user before data loss
 * becomes likely. Values are in bytes; `quota` may be undefined if unsupported.
 */
export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (!('storage' in navigator) || !navigator.storage?.estimate) {
    return null;
  }
  try {
    return await navigator.storage.estimate();
  } catch {
    return null;
  }
}

// Cycle Operations
export async function addCycle(cycle: Omit<Cycle, 'id'>): Promise<number> {
  const id = await db.cycles.add(cycle as Cycle);
  return id as number;
}

export async function updateCycle(id: number, updates: Partial<Cycle>): Promise<void> {
  await db.cycles.update(id, updates);
}

export async function deleteCycle(id: number): Promise<void> {
  await db.cycles.delete(id);
}

export async function getAllCycles(): Promise<Cycle[]> {
  return await db.cycles.orderBy('startDate').reverse().toArray();
}

export async function getCyclesByDateRange(start: Date, end: Date): Promise<Cycle[]> {
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  return await db.cycles
    .where('startDate')
    .between(startStr, endStr, true, true)
    .toArray();
}

// Symptom Operations
export async function addSymptom(symptom: Omit<Symptom, 'id'>): Promise<number> {
  const id = await db.symptoms.add(symptom as Symptom);
  return id as number;
}

export async function updateSymptom(id: number, updates: Partial<Symptom>): Promise<void> {
  await db.symptoms.update(id, updates);
}

export async function deleteSymptom(id: number): Promise<void> {
  await db.symptoms.delete(id);
}

export async function getAllSymptoms(): Promise<Symptom[]> {
  return await db.symptoms.orderBy('date').reverse().toArray();
}

export async function getSymptomsByDate(date: string): Promise<Symptom[]> {
  return await db.symptoms.where('date').equals(date).toArray();
}

export async function getSymptomsByDateRange(start: string, end: string): Promise<Symptom[]> {
  return await db.symptoms
    .where('date')
    .between(start, end, true, true)
    .toArray();
}

// Settings Operations
export async function getSetting(key: string): Promise<string | undefined> {
  const setting = await db.settings.get(key);
  return setting?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}

// Export/Import Operations
export async function exportData(): Promise<{ cycles: Cycle[]; symptoms: Symptom[] }> {
  const cycles = await db.cycles.toArray();
  const symptoms = await db.symptoms.toArray();
  return { cycles, symptoms };
}

export async function importData(data: { cycles: Cycle[]; symptoms: Symptom[] }): Promise<void> {
  await db.transaction('rw', db.cycles, db.symptoms, async () => {
    await db.cycles.clear();
    await db.symptoms.clear();

    if (data.cycles && data.cycles.length > 0) {
      // Remove ids to let Dexie auto-generate them
      const cyclesWithoutIds = data.cycles.map(({ id: _, ...cycle }) => cycle);
      await db.cycles.bulkAdd(cyclesWithoutIds as Cycle[]);
    }

    if (data.symptoms && data.symptoms.length > 0) {
      const symptomsWithoutIds = data.symptoms.map(({ id: _, ...symptom }) => symptom);
      await db.symptoms.bulkAdd(symptomsWithoutIds as Symptom[]);
    }
  });
}

export { db };

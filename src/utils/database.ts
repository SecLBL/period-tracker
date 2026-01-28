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

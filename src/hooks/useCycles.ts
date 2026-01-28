import { useState, useEffect, useCallback } from 'react';
import type { Cycle, Symptom, Prediction, CycleStats } from '../types';
import {
  getAllCycles,
  addCycle as dbAddCycle,
  updateCycle as dbUpdateCycle,
  deleteCycle as dbDeleteCycle,
  getAllSymptoms,
  addSymptom as dbAddSymptom,
  updateSymptom as dbUpdateSymptom,
  deleteSymptom as dbDeleteSymptom,
} from '../utils/database';
import { predictNextPeriod, getCycleStats } from '../utils/calculations';

export interface UseCyclesReturn {
  cycles: Cycle[];
  symptoms: Symptom[];
  loading: boolean;
  error: string | null;
  addCycle: (cycle: Omit<Cycle, 'id'>) => Promise<void>;
  updateCycle: (id: number, updates: Partial<Cycle>) => Promise<void>;
  deleteCycle: (id: number) => Promise<void>;
  addSymptom: (symptom: Omit<Symptom, 'id'>) => Promise<void>;
  updateSymptom: (id: number, updates: Partial<Symptom>) => Promise<void>;
  deleteSymptom: (id: number) => Promise<void>;
  currentCycle: Cycle | null;
  predictions: Prediction | null;
  statistics: CycleStats;
  refresh: () => Promise<void>;
}

export function useCycles(): UseCyclesReturn {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cyclesData, symptomsData] = await Promise.all([
        getAllCycles(),
        getAllSymptoms(),
      ]);
      setCycles(cyclesData);
      setSymptoms(symptomsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addCycle = useCallback(async (cycle: Omit<Cycle, 'id'>) => {
    try {
      await dbAddCycle(cycle);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add cycle');
      throw err;
    }
  }, [loadData]);

  const updateCycle = useCallback(async (id: number, updates: Partial<Cycle>) => {
    try {
      await dbUpdateCycle(id, updates);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update cycle');
      throw err;
    }
  }, [loadData]);

  const deleteCycle = useCallback(async (id: number) => {
    try {
      await dbDeleteCycle(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete cycle');
      throw err;
    }
  }, [loadData]);

  const addSymptom = useCallback(async (symptom: Omit<Symptom, 'id'>) => {
    try {
      await dbAddSymptom(symptom);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add symptom');
      throw err;
    }
  }, [loadData]);

  const updateSymptom = useCallback(async (id: number, updates: Partial<Symptom>) => {
    try {
      await dbUpdateSymptom(id, updates);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update symptom');
      throw err;
    }
  }, [loadData]);

  const deleteSymptom = useCallback(async (id: number) => {
    try {
      await dbDeleteSymptom(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete symptom');
      throw err;
    }
  }, [loadData]);

  // Get current cycle (most recent)
  const currentCycle = cycles.length > 0
    ? cycles.reduce((latest, cycle) =>
        new Date(cycle.startDate) > new Date(latest.startDate) ? cycle : latest
      )
    : null;

  // Get predictions
  const predictions = predictNextPeriod(cycles);

  // Get statistics
  const statistics = getCycleStats(cycles);

  return {
    cycles,
    symptoms,
    loading,
    error,
    addCycle,
    updateCycle,
    deleteCycle,
    addSymptom,
    updateSymptom,
    deleteSymptom,
    currentCycle,
    predictions,
    statistics,
    refresh: loadData,
  };
}

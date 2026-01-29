/**
 * Combined prediction hook using ML model with statistical fallback.
 * Now includes symptom-based prediction adjustments.
 *
 * Strategy:
 * 1. If < 3 cycles: Use default values with low confidence
 * 2. If 3-6 cycles: Use improved statistical algorithm
 * 3. If >= 7 cycles: Use ML model with statistical confidence intervals
 * 4. On ML error: Fallback to statistical algorithm
 * 5. Analyze symptoms to detect PMS and adjust predictions
 */

import { useState, useEffect, useCallback } from 'react';
import { addDays, subDays, parseISO } from 'date-fns';
import type { Cycle, Symptom, ExtendedPrediction, PredictionSource, SymptomSignal } from '../types';
import {
  getWeightedAverageCycleLength,
  getAveragePeriodLength,
  getPredictionConfidence,
  getCycleTrend,
  estimateLutealPhase,
  getCycleLengths,
  analyzeSymptomSignal
} from '../utils/calculations';
import {
  loadModel,
  predictWithML,
  isModelReady,
  hasModelError,
  getMinCyclesForML
} from '../utils/mlPredictor';

export interface UsePredictionReturn {
  prediction: ExtendedPrediction | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePrediction(cycles: Cycle[], symptoms: Symptom[] = []): UsePredictionReturn {
  const [prediction, setPrediction] = useState<ExtendedPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePrediction = useCallback(async () => {
    if (cycles.length === 0) {
      setPrediction(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Sort cycles by date (most recent first)
      const sortedCycles = [...cycles].sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );

      const lastCycle = sortedCycles[0];
      const lastPeriodStart = parseISO(lastCycle.startDate);

      // Determine prediction source and get cycle length
      let predictedCycleLength: number;
      let source: PredictionSource;

      const cycleLengths = getCycleLengths(cycles);
      const minCyclesForML = getMinCyclesForML();

      // Try ML prediction if we have enough data
      if (cycleLengths.length >= minCyclesForML - 1) {
        try {
          if (!isModelReady() && !hasModelError()) {
            loadModel().catch(() => {
              // Silently fail - will use statistical fallback
            });
          }

          const mlPrediction = await predictWithML(cycles);

          if (mlPrediction !== null) {
            predictedCycleLength = mlPrediction;
            source = 'ml';
          } else {
            predictedCycleLength = getWeightedAverageCycleLength(cycles);
            source = 'statistical';
          }
        } catch {
          predictedCycleLength = getWeightedAverageCycleLength(cycles);
          source = 'statistical';
        }
      } else if (cycleLengths.length >= 2) {
        predictedCycleLength = getWeightedAverageCycleLength(cycles);
        source = 'statistical';
      } else {
        predictedCycleLength = 28;
        source = 'default';
      }

      // Calculate initial prediction dates
      const avgPeriodLength = getAveragePeriodLength(cycles);
      let nextPeriodStart = addDays(lastPeriodStart, predictedCycleLength);

      // Calculate ovulation and fertile window
      const lutealPhase = estimateLutealPhase(cycles);
      const ovulationDate = subDays(nextPeriodStart, lutealPhase);
      const fertileWindowStart = subDays(ovulationDate, 5);
      const fertileWindowEnd = addDays(ovulationDate, 1);

      // Get confidence interval and trend
      const confidence = getPredictionConfidence(cycles);
      const trend = getCycleTrend(cycles);

      // Analyze symptoms for additional signals
      let symptomSignal: SymptomSignal | null = null;

      if (symptoms.length > 0) {
        symptomSignal = analyzeSymptomSignal(symptoms, cycles, nextPeriodStart);

        // Apply symptom-based adjustment to prediction
        if (symptomSignal && symptomSignal.daysAdjustment !== 0) {
          nextPeriodStart = addDays(nextPeriodStart, symptomSignal.daysAdjustment);
          console.log(`[usePrediction] Symptom signal: ${symptomSignal.type}, adjusting by ${symptomSignal.daysAdjustment} days`);
        }
      }

      const extendedPrediction: ExtendedPrediction = {
        nextPeriodStart,
        nextPeriodEnd: addDays(nextPeriodStart, avgPeriodLength - 1),
        fertileWindowStart,
        fertileWindowEnd,
        ovulationDate,
        confidence,
        trend,
        source,
        estimatedLutealPhase: lutealPhase,
        symptomSignal
      };

      setPrediction(extendedPrediction);

    } catch (err) {
      console.error('[usePrediction] Error:', err);
      setError(err instanceof Error ? err.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  }, [cycles, symptoms]);

  // Recalculate when cycles or symptoms change
  useEffect(() => {
    calculatePrediction();
  }, [calculatePrediction]);

  // Pre-load model on mount
  useEffect(() => {
    if (!isModelReady() && !hasModelError()) {
      loadModel().catch(() => {
        // Silently fail - will use statistical fallback
      });
    }
  }, []);

  return {
    prediction,
    loading,
    error,
    refresh: calculatePrediction
  };
}

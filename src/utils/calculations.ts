import { differenceInDays, addDays, subDays, parseISO } from 'date-fns';
import type { Cycle, Symptom, Prediction, CycleStats, CyclePhase, PredictionConfidence, CycleTrend, SymptomSignal, SymptomType } from '../types';

export function calculateCycleLength(currentStart: Date, previousStart: Date): number {
  return differenceInDays(currentStart, previousStart);
}

export function getAverageCycleLength(cycles: Cycle[], count: number = 6): number {
  if (cycles.length < 2) return 28; // Default cycle length

  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const cyclesToUse = sortedCycles.slice(0, count + 1);
  const lengths: number[] = [];

  for (let i = 0; i < cyclesToUse.length - 1; i++) {
    const length = calculateCycleLength(
      parseISO(cyclesToUse[i].startDate),
      parseISO(cyclesToUse[i + 1].startDate)
    );
    if (length > 0 && length < 60) { // Sanity check
      lengths.push(length);
    }
  }

  if (lengths.length === 0) return 28;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

export function getAveragePeriodLength(cycles: Cycle[], count: number = 6): number {
  const completedCycles = cycles.filter(c => c.endDate);
  if (completedCycles.length === 0) return 5; // Default period length

  const sortedCycles = [...completedCycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const cyclesToUse = sortedCycles.slice(0, count);
  const lengths: number[] = [];

  for (const cycle of cyclesToUse) {
    if (cycle.endDate) {
      const length = differenceInDays(parseISO(cycle.endDate), parseISO(cycle.startDate)) + 1;
      if (length > 0 && length < 15) { // Sanity check
        lengths.push(length);
      }
    }
  }

  if (lengths.length === 0) return 5;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

export function predictNextPeriod(cycles: Cycle[]): Prediction | null {
  if (cycles.length < 1) return null;

  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const lastCycle = sortedCycles[0];
  const avgCycleLength = getAverageCycleLength(cycles);
  const avgPeriodLength = getAveragePeriodLength(cycles);

  const lastPeriodStart = parseISO(lastCycle.startDate);
  const nextPeriodStart = addDays(lastPeriodStart, avgCycleLength);
  const nextPeriodEnd = addDays(nextPeriodStart, avgPeriodLength - 1);

  // Ovulation typically occurs 14 days before the next period
  const ovulationDate = subDays(nextPeriodStart, 14);

  // Fertile window is typically 5 days before ovulation to 1 day after
  const fertileWindowStart = subDays(ovulationDate, 5);
  const fertileWindowEnd = addDays(ovulationDate, 1);

  return {
    nextPeriodStart,
    nextPeriodEnd,
    fertileWindowStart,
    fertileWindowEnd,
    ovulationDate,
  };
}

export function getFertileWindow(predictedStart: Date): { start: Date; end: Date } {
  const ovulationDate = subDays(predictedStart, 14);
  return {
    start: subDays(ovulationDate, 5),
    end: addDays(ovulationDate, 1),
  };
}

export function getOvulationDate(predictedStart: Date): Date {
  return subDays(predictedStart, 14);
}

export function getCycleDay(lastPeriodStart: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(lastPeriodStart);
  start.setHours(0, 0, 0, 0);
  return differenceInDays(today, start) + 1;
}

export function getCyclePhase(cycleDay: number, cycleLength: number = 28): CyclePhase {
  // Menstruation: Days 1-5 (approximately)
  if (cycleDay <= 5) {
    return 'menstruation';
  }

  // Ovulation occurs around 14 days before next period
  const ovulationDay = cycleLength - 14;

  // Follicular phase: From end of menstruation to ovulation
  if (cycleDay < ovulationDay - 1) {
    return 'follicular';
  }

  // Ovulation phase: Around ovulation day (±1 day)
  if (cycleDay >= ovulationDay - 1 && cycleDay <= ovulationDay + 1) {
    return 'ovulation';
  }

  // Luteal phase: After ovulation until next period
  return 'luteal';
}

export function getCycleStats(cycles: Cycle[]): CycleStats {
  if (cycles.length < 2) {
    return {
      averageCycleLength: 0,
      averagePeriodLength: 0,
      totalCycles: cycles.length,
      shortestCycle: 0,
      longestCycle: 0,
    };
  }

  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const cycleLengths: number[] = [];
  for (let i = 0; i < sortedCycles.length - 1; i++) {
    const length = calculateCycleLength(
      parseISO(sortedCycles[i].startDate),
      parseISO(sortedCycles[i + 1].startDate)
    );
    if (length > 0 && length < 60) {
      cycleLengths.push(length);
    }
  }

  return {
    averageCycleLength: getAverageCycleLength(cycles),
    averagePeriodLength: getAveragePeriodLength(cycles),
    totalCycles: cycles.length,
    shortestCycle: cycleLengths.length > 0 ? Math.min(...cycleLengths) : 0,
    longestCycle: cycleLengths.length > 0 ? Math.max(...cycleLengths) : 0,
  };
}

export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  return d >= s && d <= e;
}

/**
 * Calculate weighted average cycle length where more recent cycles have higher weight.
 * Uses exponential decay: weight = decay^(n-i) where n is total cycles and i is index
 */
export function getWeightedAverageCycleLength(cycles: Cycle[], count: number = 6, decay: number = 0.8): number {
  if (cycles.length < 2) return 28;

  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const cyclesToUse = sortedCycles.slice(0, count + 1);
  const lengths: number[] = [];

  for (let i = 0; i < cyclesToUse.length - 1; i++) {
    const length = calculateCycleLength(
      parseISO(cyclesToUse[i].startDate),
      parseISO(cyclesToUse[i + 1].startDate)
    );
    if (length > 0 && length < 60) {
      lengths.push(length);
    }
  }

  if (lengths.length === 0) return 28;

  // Calculate weights (most recent cycle gets highest weight)
  let weightedSum = 0;
  let totalWeight = 0;

  for (let i = 0; i < lengths.length; i++) {
    const weight = Math.pow(decay, i); // More recent = higher weight
    weightedSum += lengths[i] * weight;
    totalWeight += weight;
  }

  return Math.round(weightedSum / totalWeight);
}

/**
 * Calculate prediction confidence interval based on cycle variance.
 * Returns low/high bounds and confidence level.
 */
export function getPredictionConfidence(cycles: Cycle[], count: number = 6): PredictionConfidence {
  if (cycles.length < 3) {
    return { low: -5, high: 5, level: 'low' };
  }

  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const cyclesToUse = sortedCycles.slice(0, count + 1);
  const lengths: number[] = [];

  for (let i = 0; i < cyclesToUse.length - 1; i++) {
    const length = calculateCycleLength(
      parseISO(cyclesToUse[i].startDate),
      parseISO(cyclesToUse[i + 1].startDate)
    );
    if (length > 0 && length < 60) {
      lengths.push(length);
    }
  }

  if (lengths.length < 2) {
    return { low: -5, high: 5, level: 'low' };
  }

  // Calculate standard deviation
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Confidence interval (approximately 95% for normal distribution: mean ± 1.96*std)
  // Using 1.5 for a more conservative estimate
  const margin = Math.ceil(stdDev * 1.5);

  // Determine confidence level based on coefficient of variation (CV)
  const cv = stdDev / mean;
  let level: 'low' | 'medium' | 'high';

  if (cv < 0.05 && lengths.length >= 4) {
    level = 'high';
  } else if (cv < 0.1 && lengths.length >= 3) {
    level = 'medium';
  } else {
    level = 'low';
  }

  return {
    low: -margin,
    high: margin,
    level
  };
}

/**
 * Detect if cycles are trending longer, shorter, or staying stable.
 * Uses linear regression on recent cycles.
 */
export function getCycleTrend(cycles: Cycle[], count: number = 6): CycleTrend {
  if (cycles.length < 4) {
    return 'stable';
  }

  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const cyclesToUse = sortedCycles.slice(0, count + 1);
  const lengths: number[] = [];

  for (let i = 0; i < cyclesToUse.length - 1; i++) {
    const length = calculateCycleLength(
      parseISO(cyclesToUse[i].startDate),
      parseISO(cyclesToUse[i + 1].startDate)
    );
    if (length > 0 && length < 60) {
      lengths.push(length);
    }
  }

  if (lengths.length < 3) {
    return 'stable';
  }

  // Reverse so oldest is first (for trend calculation)
  lengths.reverse();

  // Simple linear regression
  const n = lengths.length;
  const xMean = (n - 1) / 2;
  const yMean = lengths.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (lengths[i] - yMean);
    denominator += Math.pow(i - xMean, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;

  // Threshold for trend detection (slope > 0.5 days per cycle is meaningful)
  if (slope > 0.5) {
    return 'increasing';
  } else if (slope < -0.5) {
    return 'decreasing';
  }

  return 'stable';
}

/**
 * Estimate luteal phase length (typically more consistent than follicular phase).
 * Luteal phase is usually 12-14 days and less variable between cycles.
 * Without ovulation data, we estimate based on cycle patterns.
 */
export function estimateLutealPhase(cycles: Cycle[]): number {
  // Default luteal phase length
  const DEFAULT_LUTEAL = 14;

  if (cycles.length < 2) {
    return DEFAULT_LUTEAL;
  }

  // Without ovulation tracking, we assume luteal phase is relatively constant
  // and use statistical average of 14 days with slight adjustment based on cycle length
  const avgCycleLength = getAverageCycleLength(cycles);

  // For shorter cycles, luteal phase might be slightly shorter
  // For longer cycles, follicular phase usually extends, luteal stays similar
  if (avgCycleLength < 26) {
    return 12;
  } else if (avgCycleLength > 32) {
    return 14;
  }

  return DEFAULT_LUTEAL;
}

/**
 * Get cycle lengths array for ML model input.
 */
export function getCycleLengths(cycles: Cycle[], count: number = 6): number[] {
  if (cycles.length < 2) return [];

  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const lengths: number[] = [];

  for (let i = 0; i < Math.min(sortedCycles.length - 1, count); i++) {
    const length = calculateCycleLength(
      parseISO(sortedCycles[i].startDate),
      parseISO(sortedCycles[i + 1].startDate)
    );
    if (length > 0 && length < 60) {
      lengths.push(length);
    }
  }

  return lengths;
}

/**
 * Get cycle variance (standard deviation).
 */
export function getCycleVariance(cycles: Cycle[], count: number = 6): number {
  const lengths = getCycleLengths(cycles, count);

  if (lengths.length < 2) return 0;

  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / lengths.length;

  return Math.sqrt(variance);
}

// ============================================================
// SYMPTOM-BASED PREDICTION FUNCTIONS (HYBRID: BASELINE + LEARNING)
// ============================================================

import type { LearnedSymptomPattern, PersonalSymptomProfile } from '../types';

// ============================================================
// BASELINE BIOLOGICAL INDICATORS (wissenschaftlich validiert)
// Diese wirken SOFORT ohne vorheriges Lernen
// ============================================================

// Hochzuverlässige Fruchtbarkeitsindikatoren (Goldstandard der NFP)
const BASELINE_FERTILITY_INDICATORS: SymptomType[] = [
  'cm_eggwhite',      // Spinnbarer Zervixschleim = höchste Fruchtbarkeit
  'cm_watery',        // Wässriger Schleim = hohe Fruchtbarkeit
  'pain_ovulation',   // Mittelschmerz = direkter Eisprung-Indikator
  'libido_high',      // Hohe Libido um Eisprung = wissenschaftlich belegt
];

// Direkte Perioden-Vorboten
const BASELINE_PERIOD_INDICATORS: SymptomType[] = [
  'bleeding_spotting',  // Schmierblutung oft 1-2 Tage vor Periode
];

// Typische PMS-Symptome (wissenschaftlich etabliert)
const BASELINE_PMS_INDICATORS: SymptomType[] = [
  'pain_cramps',        // Krämpfe
  'pain_breast',        // Brustspannen (Progesteron)
  'physical_bloating',  // Blähbauch
  'mood_irritable',     // Reizbarkeit
  'appetite_cravings',  // Heißhunger
];

/**
 * Analyze symptoms using BASELINE biological knowledge.
 * Works immediately without any learning - uses established medical science.
 * This is the "prior knowledge" that doesn't require historical data.
 */
export function analyzeBaselineSymptomSignal(
  symptoms: Symptom[],
  cycles: Cycle[],
  predictedPeriodStart: Date
): SymptomSignal | null {
  if (symptoms.length === 0) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get symptoms from the last 3 days (more recent = more relevant for baseline)
  const recentSymptoms = symptoms.filter(s => {
    const symptomDate = parseISO(s.date);
    const daysAgo = differenceInDays(today, symptomDate);
    return daysAgo >= 0 && daysAgo <= 3;
  });

  if (recentSymptoms.length === 0) {
    return null;
  }

  // Calculate cycle day if we have cycle data
  let cycleDay = 14; // Default assumption
  let avgCycleLength = 28;

  if (cycles.length > 0) {
    const sortedCycles = [...cycles].sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    const lastPeriodStart = parseISO(sortedCycles[0].startDate);
    cycleDay = getCycleDay(lastPeriodStart);
    avgCycleLength = getAverageCycleLength(cycles);
  }

  const daysUntilPeriod = differenceInDays(predictedPeriodStart, today);

  // ========================================
  // CHECK 1: Fertility indicators (highest priority)
  // Zervixschleim ist der Goldstandard - sofort reagieren!
  // ========================================
  const fertilitySymptoms = recentSymptoms.filter(s =>
    BASELINE_FERTILITY_INDICATORS.includes(s.symptomType)
  );

  if (fertilitySymptoms.length > 0) {
    const hasEggWhite = fertilitySymptoms.some(s => s.symptomType === 'cm_eggwhite');
    const hasWatery = fertilitySymptoms.some(s => s.symptomType === 'cm_watery');
    const hasOvulationPain = fertilitySymptoms.some(s => s.symptomType === 'pain_ovulation');
    const hasHighLibido = fertilitySymptoms.some(s => s.symptomType === 'libido_high');

    // Only trigger if we're in a plausible window (cycle day 8-22)
    if (cycleDay >= 8 && cycleDay <= 22) {
      let confidence: 'low' | 'medium' | 'high' = 'medium';
      let message = '';

      if (hasEggWhite) {
        confidence = 'high';
        message = 'Spinnbarer Zervixschleim erkannt - dies ist der zuverlässigste Fruchtbarkeitsindikator (Goldstandard der NFP).';
      } else if (hasWatery && hasOvulationPain) {
        confidence = 'high';
        message = 'Wässriger Zervixschleim und Mittelschmerz erkannt - wahrscheinlich Eisprung.';
      } else if (hasOvulationPain && hasHighLibido) {
        confidence = 'high';
        message = 'Mittelschmerz und hohe Libido erkannt - typische Eisprung-Kombination.';
      } else if (hasOvulationPain) {
        confidence = 'medium';
        message = 'Mittelschmerz erkannt - kann auf Eisprung hindeuten.';
      } else if (hasWatery) {
        confidence = 'medium';
        message = 'Wässriger Zervixschleim erkannt - möglicherweise fruchtbare Phase.';
      } else if (hasHighLibido) {
        confidence = 'low';
        message = 'Hohe Libido erkannt - kann auf fruchtbare Phase hindeuten.';
      }

      // Only return if we have a meaningful message
      if (message) {
        return {
          type: 'fertile_window',
          confidence,
          daysAdjustment: 0,
          relevantSymptoms: [...new Set(fertilitySymptoms.map(s => s.symptomType))],
          message,
          basedOnCycles: 0  // 0 = baseline knowledge, not learned
        };
      }
    }
  }

  // ========================================
  // CHECK 2: Period imminent (Schmierblutung in later luteal phase)
  // ========================================
  const periodIndicators = recentSymptoms.filter(s =>
    BASELINE_PERIOD_INDICATORS.includes(s.symptomType)
  );

  if (periodIndicators.length > 0 && cycleDay > avgCycleLength - 5) {
    const hasSpotting = periodIndicators.some(s => s.symptomType === 'bleeding_spotting');

    if (hasSpotting) {
      return {
        type: 'period_imminent',
        confidence: 'medium',
        daysAdjustment: Math.min(0, -daysUntilPeriod + 2), // Period likely in 1-2 days
        relevantSymptoms: ['bleeding_spotting'],
        message: 'Schmierblutung erkannt - die Periode beginnt typischerweise in 1-2 Tagen.',
        basedOnCycles: 0
      };
    }
  }

  // ========================================
  // CHECK 3: PMS indicators (multiple symptoms in late luteal phase)
  // Severity-weighted: stronger symptoms (3+) count more
  // ========================================
  const pmsSymptoms = recentSymptoms.filter(s =>
    BASELINE_PMS_INDICATORS.includes(s.symptomType)
  );

  // Need at least 2 PMS symptoms and be in late luteal phase
  if (pmsSymptoms.length >= 2 && cycleDay > avgCycleLength - 10) {
    // Count strong symptoms (severity >= 3) separately
    const strongPmsSymptoms = pmsSymptoms.filter(s => s.severity >= 3);
    const avgSeverity = pmsSymptoms.reduce((sum, s) => sum + s.severity, 0) / pmsSymptoms.length;

    // Confidence based on count AND severity
    let confidence: 'low' | 'medium' | 'high' = 'low';
    if (strongPmsSymptoms.length >= 3 || (pmsSymptoms.length >= 3 && avgSeverity >= 3.5)) {
      confidence = 'high';
    } else if (strongPmsSymptoms.length >= 2 || pmsSymptoms.length >= 3) {
      confidence = 'medium';
    }

    const severityNote = avgSeverity >= 3.5 ? ' (ausgeprägt)' : '';

    return {
      type: 'pms_pattern_match',
      confidence,
      daysAdjustment: 0, // Baseline doesn't adjust, only informs
      relevantSymptoms: [...new Set(pmsSymptoms.map(s => s.symptomType))],
      message: `${pmsSymptoms.length} typische PMS-Symptome erkannt${severityNote} - die Periode nähert sich möglicherweise.`,
      basedOnCycles: 0
    };
  }

  return null;
}

// Symptom categories for pattern analysis
const PMS_INDICATOR_SYMPTOMS: SymptomType[] = [
  // Schmerzen
  'pain_cramps', 'pain_pelvic', 'pain_back', 'pain_head', 'pain_breast',
  // Körperlich
  'physical_bloating', 'physical_acne', 'physical_nausea',
  'physical_hot_flashes', 'physical_water_retention', 'physical_dizzy',
  // Stimmung
  'mood_sensitive', 'mood_sad', 'mood_irritable', 'mood_anxious',
  // Energie & Schlaf
  'energy_low', 'sleep_poor', 'sleep_insomnia',
  // Appetit
  'appetite_cravings', 'appetite_high'
];

const OVULATION_INDICATOR_SYMPTOMS: SymptomType[] = [
  // Zervixschleim (Goldstandard für Fruchtbarkeit)
  'cm_eggwhite', 'cm_watery',
  // Libido & Stimmung
  'libido_high', 'pain_ovulation',
  'energy_high', 'mood_happy'
];

const PERIOD_INDICATOR_SYMPTOMS: SymptomType[] = [
  // Blutung
  'bleeding_spotting', 'bleeding_light', 'bleeding_heavy',
  // Schmerzen
  'pain_cramps'
];

/**
 * Learn personal symptom patterns from historical data.
 * Analyzes completed cycles to understand when symptoms typically appear.
 */
export function learnSymptomProfile(symptoms: Symptom[], cycles: Cycle[]): PersonalSymptomProfile {
  const profile: PersonalSymptomProfile = {
    pmsSymptoms: [],
    ovulationSymptoms: [],
    periodSymptoms: [],
    totalCyclesAnalyzed: 0
  };

  if (cycles.length < 2 || symptoms.length < 3) {
    return profile;
  }

  // Sort cycles chronologically
  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  // Track symptom occurrences relative to period start
  const symptomOccurrences: Map<SymptomType, { daysBeforePeriod: number[]; severities: number[] }> = new Map();

  // Analyze each completed cycle (need next cycle to know when it ended)
  for (let i = 0; i < sortedCycles.length - 1; i++) {
    const cycleStart = parseISO(sortedCycles[i].startDate);
    const nextCycleStart = parseISO(sortedCycles[i + 1].startDate);
    const cycleLength = differenceInDays(nextCycleStart, cycleStart);

    // Skip invalid cycles
    if (cycleLength < 15 || cycleLength > 60) continue;

    profile.totalCyclesAnalyzed++;

    // Find symptoms in this cycle (from 7 days before cycle start to next cycle start)
    const analysisStart = subDays(cycleStart, 7);
    const cycleSymptoms = symptoms.filter(s => {
      const date = parseISO(s.date);
      return date >= analysisStart && date < nextCycleStart;
    });

    for (const symptom of cycleSymptoms) {
      const symptomDate = parseISO(symptom.date);
      const daysBeforeNextPeriod = differenceInDays(nextCycleStart, symptomDate);

      const existing = symptomOccurrences.get(symptom.symptomType) || { daysBeforePeriod: [], severities: [] };
      existing.daysBeforePeriod.push(daysBeforeNextPeriod);
      existing.severities.push(symptom.severity);
      symptomOccurrences.set(symptom.symptomType, existing);
    }
  }

  // Convert occurrences to learned patterns
  for (const [symptomType, data] of symptomOccurrences) {
    if (data.daysBeforePeriod.length < 2) continue;  // Need at least 2 occurrences

    const avgDaysBeforePeriod = data.daysBeforePeriod.reduce((a, b) => a + b, 0) / data.daysBeforePeriod.length;
    const avgSeverity = data.severities.reduce((a, b) => a + b, 0) / data.severities.length;
    const frequency = data.daysBeforePeriod.length / profile.totalCyclesAnalyzed;

    const pattern: LearnedSymptomPattern = {
      symptomType,
      avgDaysBeforePeriod,
      frequency,
      avgSeverity,
      occurrences: data.daysBeforePeriod.length
    };

    // Categorize the pattern
    if (avgDaysBeforePeriod >= 1 && avgDaysBeforePeriod <= 7 && PMS_INDICATOR_SYMPTOMS.includes(symptomType)) {
      profile.pmsSymptoms.push(pattern);
    } else if (avgDaysBeforePeriod >= 12 && avgDaysBeforePeriod <= 18 && OVULATION_INDICATOR_SYMPTOMS.includes(symptomType)) {
      profile.ovulationSymptoms.push(pattern);
    } else if (avgDaysBeforePeriod <= 5 && PERIOD_INDICATOR_SYMPTOMS.includes(symptomType)) {
      profile.periodSymptoms.push(pattern);
    }
  }

  // Sort by frequency (most common first)
  profile.pmsSymptoms.sort((a, b) => b.frequency - a.frequency);
  profile.ovulationSymptoms.sort((a, b) => b.frequency - a.frequency);
  profile.periodSymptoms.sort((a, b) => b.frequency - a.frequency);

  return profile;
}

/**
 * Combine baseline and learned signals when they agree.
 * Boosts confidence when both sources detect the same pattern.
 */
function combineSignals(
  baselineSignal: SymptomSignal | null,
  learnedSignal: SymptomSignal | null
): SymptomSignal | null {
  // If only one exists, return that one
  if (!baselineSignal && !learnedSignal) return null;
  if (!baselineSignal) return learnedSignal;
  if (!learnedSignal) return baselineSignal;

  // If both detect the same type, boost confidence and combine info
  if (baselineSignal.type === learnedSignal.type) {
    // Merge relevant symptoms (unique)
    const combinedSymptoms = [...new Set([
      ...baselineSignal.relevantSymptoms,
      ...learnedSignal.relevantSymptoms
    ])];

    // Boost confidence: if either is high → high, if both medium → high, otherwise medium
    let combinedConfidence: 'low' | 'medium' | 'high' = 'medium';
    if (baselineSignal.confidence === 'high' || learnedSignal.confidence === 'high') {
      combinedConfidence = 'high';
    } else if (baselineSignal.confidence === 'medium' && learnedSignal.confidence === 'medium') {
      combinedConfidence = 'high';
    }

    // Use learned adjustment (more personalized) but keep learned message
    return {
      type: learnedSignal.type,
      confidence: combinedConfidence,
      daysAdjustment: learnedSignal.daysAdjustment,
      relevantSymptoms: combinedSymptoms,
      message: learnedSignal.basedOnCycles > 0
        ? `${learnedSignal.message} (Baseline + ${learnedSignal.basedOnCycles} Zyklen bestätigt)`
        : learnedSignal.message,
      basedOnCycles: learnedSignal.basedOnCycles
    };
  }

  // Different types: prioritize by type importance
  // Fertility > Period imminent > PMS
  const priority: Record<SymptomSignal['type'], number> = {
    'fertile_window': 4,
    'period_imminent': 3,
    'ovulation_pattern_match': 2,
    'pms_pattern_match': 1
  };

  return priority[baselineSignal.type] >= priority[learnedSignal.type]
    ? baselineSignal
    : learnedSignal;
}

/**
 * Analyze recent symptoms using HYBRID approach:
 * 1. First: Check baseline biological indicators (work immediately)
 * 2. Then: Enhance with learned personal patterns (if available)
 * 3. Finally: Combine both signals for best accuracy
 *
 * This ensures new users get immediate feedback on scientifically-validated
 * indicators, while experienced users get personalized predictions.
 */
export function analyzeSymptomSignal(
  symptoms: Symptom[],
  cycles: Cycle[],
  predictedPeriodStart: Date
): SymptomSignal | null {
  if (symptoms.length === 0) {
    return null;
  }

  // STEP 1: Always check baseline biological indicators first
  // These work without any learning and are scientifically validated
  const baselineSignal = analyzeBaselineSymptomSignal(symptoms, cycles, predictedPeriodStart);

  // If we don't have enough cycles for learning, return baseline result
  if (cycles.length === 0) {
    return baselineSignal;
  }

  // Learn personal patterns
  const profile = learnSymptomProfile(symptoms, cycles);

  // If not enough data to learn, return baseline signal
  if (profile.totalCyclesAnalyzed < 2) {
    return baselineSignal;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get symptoms from the last 7 days
  const recentSymptoms = symptoms.filter(s => {
    const symptomDate = parseISO(s.date);
    const daysAgo = differenceInDays(today, symptomDate);
    return daysAgo >= 0 && daysAgo <= 7;
  });

  if (recentSymptoms.length === 0) {
    return baselineSignal;  // Fall back to baseline if no recent symptoms for learning
  }

  const daysUntilPeriod = differenceInDays(predictedPeriodStart, today);
  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  const lastPeriodStart = parseISO(sortedCycles[0].startDate);
  const cycleDay = getCycleDay(lastPeriodStart);
  const avgCycleLength = getAverageCycleLength(cycles);

  // STEP 2: Check for learned patterns
  let learnedSignal: SymptomSignal | null = null;

  // Check for PMS pattern match
  if (profile.pmsSymptoms.length > 0 && cycleDay > avgCycleLength - 12) {
    const matchedPmsSymptoms = recentSymptoms.filter(s =>
      profile.pmsSymptoms.some(p => p.symptomType === s.symptomType)
    );

    if (matchedPmsSymptoms.length >= 2) {
      // Calculate personalized adjustment based on learned patterns
      const relevantPatterns = profile.pmsSymptoms.filter(p =>
        matchedPmsSymptoms.some(s => s.symptomType === p.symptomType)
      );

      // Weighted average of when these symptoms usually appear
      const totalWeight = relevantPatterns.reduce((sum, p) => sum + p.frequency * p.occurrences, 0);
      const weightedAvgDays = relevantPatterns.reduce(
        (sum, p) => sum + p.avgDaysBeforePeriod * p.frequency * p.occurrences, 0
      ) / totalWeight;

      // If symptoms typically appear X days before period, and they're appearing now,
      // the period might come in X days
      const estimatedDaysUntil = Math.round(weightedAvgDays);
      const adjustment = estimatedDaysUntil - daysUntilPeriod;

      // Only adjust if it's meaningful (> 1 day difference)
      const daysAdjustment = Math.abs(adjustment) > 1 ? Math.round(adjustment) : 0;

      const confidence = matchedPmsSymptoms.length >= 3 ? 'high' :
                        matchedPmsSymptoms.length >= 2 ? 'medium' : 'low';

      learnedSignal = {
        type: daysAdjustment < -1 ? 'period_imminent' : 'pms_pattern_match',
        confidence,
        daysAdjustment: Math.max(-5, Math.min(5, daysAdjustment)),  // Clamp adjustment
        relevantSymptoms: [...new Set(matchedPmsSymptoms.map(s => s.symptomType))],
        message: generatePmsMessage(matchedPmsSymptoms, profile, daysAdjustment),
        basedOnCycles: profile.totalCyclesAnalyzed
      };
    }
  }

  // Check for ovulation pattern match (only if no PMS signal yet)
  if (!learnedSignal && profile.ovulationSymptoms.length > 0 && cycleDay >= 8 && cycleDay <= 20) {
    const matchedOvulationSymptoms = recentSymptoms.filter(s =>
      profile.ovulationSymptoms.some(p => p.symptomType === s.symptomType)
    );

    if (matchedOvulationSymptoms.length >= 1) {
      // Check for fertile mucus specifically
      const hasFertileMucus = matchedOvulationSymptoms.some(s =>
        s.symptomType === 'cm_eggwhite' || s.symptomType === 'cm_watery'
      );

      const confidence = hasFertileMucus ? 'high' :
                        matchedOvulationSymptoms.length >= 2 ? 'medium' : 'low';

      learnedSignal = {
        type: hasFertileMucus ? 'fertile_window' : 'ovulation_pattern_match',
        confidence,
        daysAdjustment: 0,  // Ovulation symptoms don't change period prediction
        relevantSymptoms: [...new Set(matchedOvulationSymptoms.map(s => s.symptomType))],
        message: generateOvulationMessage(matchedOvulationSymptoms, hasFertileMucus),
        basedOnCycles: profile.totalCyclesAnalyzed
      };
    }
  }

  // STEP 3: Combine baseline and learned signals for best accuracy
  return combineSignals(baselineSignal, learnedSignal);
}

/**
 * Generate a human-readable message for PMS detection.
 */
function generatePmsMessage(
  matchedSymptoms: Symptom[],
  profile: PersonalSymptomProfile,
  daysAdjustment: number
): string {
  const symptomCount = matchedSymptoms.length;
  const cyclesAnalyzed = profile.totalCyclesAnalyzed;

  if (daysAdjustment < -1) {
    return `Basierend auf ${cyclesAnalyzed} analysierten Zyklen: Diese ${symptomCount} Symptome traten bei dir typischerweise kurz vor der Periode auf.`;
  }

  return `${symptomCount} deiner typischen PMS-Symptome erkannt (aus ${cyclesAnalyzed} Zyklen gelernt).`;
}

/**
 * Generate a human-readable message for ovulation detection.
 */
function generateOvulationMessage(matchedSymptoms: Symptom[], hasFertileMucus: boolean): string {
  if (hasFertileMucus) {
    return 'Fruchtbarer Zervixschleim erkannt - wahrscheinlich fruchtbare Phase.';
  }

  return `${matchedSymptoms.length} Eisprung-typische Symptome erkannt.`;
}

/**
 * Get symptom statistics for display.
 */
export function getSymptomStats(symptoms: Symptom[]): Map<SymptomType, number> {
  const stats = new Map<SymptomType, number>();

  for (const symptom of symptoms) {
    const count = stats.get(symptom.symptomType) || 0;
    stats.set(symptom.symptomType, count + 1);
  }

  return stats;
}

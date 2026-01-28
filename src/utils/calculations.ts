import { differenceInDays, addDays, subDays, parseISO } from 'date-fns';
import type { Cycle, Prediction, CycleStats, CyclePhase } from '../types';

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

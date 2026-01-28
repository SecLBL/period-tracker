export interface Cycle {
  id?: number;
  startDate: string;      // ISO date string
  endDate?: string;       // ISO date string
  notes?: string;
}

export interface Symptom {
  id?: number;
  date: string;           // ISO date string
  symptomType: SymptomType;
  severity: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export type SymptomType =
  | 'cramps'
  | 'headache'
  | 'mood'
  | 'energy'
  | 'bloating'
  | 'breast_tenderness'
  | 'other';

export interface Prediction {
  nextPeriodStart: Date;
  nextPeriodEnd: Date;
  fertileWindowStart: Date;
  fertileWindowEnd: Date;
  ovulationDate: Date;
}

export interface CycleStats {
  averageCycleLength: number;
  averagePeriodLength: number;
  totalCycles: number;
  shortestCycle: number;
  longestCycle: number;
}

export type CyclePhase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal';

export interface Settings {
  key: string;
  value: string;
}

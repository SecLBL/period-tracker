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

// Symptom categories for better organization (9 categories)
export type SymptomCategory =
  | 'bleeding'
  | 'pain'
  | 'physical'
  | 'mood'
  | 'energy'
  | 'sleep'
  | 'appetite'
  | 'cervical_mucus'
  | 'libido';

export type SymptomType =
  // Blutung (3)
  | 'bleeding_spotting'
  | 'bleeding_light'
  | 'bleeding_heavy'
  // Schmerzen (6)
  | 'pain_cramps'
  | 'pain_pelvic'
  | 'pain_back'
  | 'pain_head'
  | 'pain_ovulation'
  | 'pain_breast'
  // Körperlich (8)
  | 'physical_bloating'
  | 'physical_nausea'
  | 'physical_acne'
  | 'physical_digestion'
  | 'physical_hot_flashes'
  | 'physical_chills'
  | 'physical_water_retention'
  | 'physical_dizzy'
  // Stimmung (6)
  | 'mood_happy'
  | 'mood_calm'
  | 'mood_sensitive'
  | 'mood_sad'
  | 'mood_irritable'
  | 'mood_anxious'
  // Energie (2)
  | 'energy_high'
  | 'energy_low'
  // Schlaf (3)
  | 'sleep_good'
  | 'sleep_poor'
  | 'sleep_insomnia'
  // Appetit (3)
  | 'appetite_high'
  | 'appetite_low'
  | 'appetite_cravings'
  // Zervixschleim (5)
  | 'cm_dry'
  | 'cm_sticky'
  | 'cm_creamy'
  | 'cm_watery'
  | 'cm_eggwhite'
  // Libido (2)
  | 'libido_high'
  | 'libido_low';

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

// Extended prediction with confidence and metadata
export interface ExtendedPrediction extends Prediction {
  confidence: PredictionConfidence;
  trend: CycleTrend;
  source: PredictionSource;
  estimatedLutealPhase: number;
  symptomSignal: SymptomSignal | null;
}

// Symptom-based prediction signal
export interface SymptomSignal {
  type: 'pms_pattern_match' | 'ovulation_pattern_match' | 'period_imminent' | 'fertile_window';
  confidence: 'low' | 'medium' | 'high';
  daysAdjustment: number;  // Negative = sooner, Positive = later
  relevantSymptoms: SymptomType[];
  message: string;  // Human-readable explanation
  basedOnCycles: number;  // How many historical cycles this is based on
}

// Learned symptom pattern for a specific phase
export interface LearnedSymptomPattern {
  symptomType: SymptomType;
  avgDaysBeforePeriod: number;  // Negative = before, Positive = after period start
  frequency: number;  // 0-1, how often this symptom appears
  avgSeverity: number;  // Average severity when it appears
  occurrences: number;  // How many times observed
}

// Personal symptom profile learned from history
export interface PersonalSymptomProfile {
  pmsSymptoms: LearnedSymptomPattern[];  // Symptoms typically before period
  ovulationSymptoms: LearnedSymptomPattern[];  // Symptoms around ovulation
  periodSymptoms: LearnedSymptomPattern[];  // Symptoms during period
  totalCyclesAnalyzed: number;
}

export interface PredictionConfidence {
  low: number;   // Days (lower bound)
  high: number;  // Days (upper bound)
  level: 'low' | 'medium' | 'high';
}

export type CycleTrend = 'increasing' | 'decreasing' | 'stable';

export type PredictionSource = 'ml' | 'statistical' | 'default';

// Scaler parameters for ML model normalization
export interface ScalerParams {
  mean: number[];
  scale: number[];
  feature_names: string[];
}

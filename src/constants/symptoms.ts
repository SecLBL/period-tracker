import type { SymptomType, SymptomCategory } from '../types';

export interface SymptomOption {
  type: SymptomType;
  label: string;
  icon: string;
  category: SymptomCategory;
  isPositive?: boolean;
}

export const SYMPTOM_LABELS: Record<SymptomType, string> = {
  // Blutung
  bleeding_spotting: 'Schmierblutung',
  bleeding_light: 'Leichte Blutung',
  bleeding_heavy: 'Starke Blutung',
  // Schmerzen
  pain_cramps: 'Krämpfe',
  pain_pelvic: 'Unterleibsschmerzen',
  pain_back: 'Rückenschmerzen',
  pain_head: 'Kopfschmerzen',
  pain_ovulation: 'Mittelschmerz',
  pain_breast: 'Brustspannen',
  // Körperlich
  physical_bloating: 'Blähbauch',
  physical_nausea: 'Übelkeit',
  physical_acne: 'Hautunreinheiten',
  physical_digestion: 'Verdauungsprobleme',
  physical_hot_flashes: 'Hitzewallungen',
  physical_chills: 'Kältewallungen',
  physical_water_retention: 'Wassereinlagerungen',
  physical_dizzy: 'Schwindel',
  // Stimmung
  mood_happy: 'Glücklich',
  mood_calm: 'Ausgeglichen',
  mood_sensitive: 'Sensibel',
  mood_sad: 'Traurig',
  mood_irritable: 'Gereizt',
  mood_anxious: 'Ängstlich',
  // Energie
  energy_high: 'Viel Energie',
  energy_low: 'Wenig Energie',
  // Schlaf
  sleep_good: 'Gut geschlafen',
  sleep_poor: 'Schlecht geschlafen',
  sleep_insomnia: 'Schlaflosigkeit',
  // Appetit
  appetite_high: 'Viel Appetit',
  appetite_low: 'Wenig Appetit',
  appetite_cravings: 'Heißhunger',
  // Zervixschleim
  cm_dry: 'Trocken',
  cm_sticky: 'Klebrig',
  cm_creamy: 'Cremig',
  cm_watery: 'Wässrig',
  cm_eggwhite: 'Spinnbar',
  // Libido
  libido_high: 'Hohe Libido',
  libido_low: 'Niedrige Libido',
};

export const SYMPTOM_OPTIONS: SymptomOption[] = [
  // Blutung
  { type: 'bleeding_spotting', label: 'Schmierblutung', icon: '🩸', category: 'bleeding' },
  { type: 'bleeding_light', label: 'besonders leichte Blutung', icon: '💧', category: 'bleeding' },
  { type: 'bleeding_heavy', label: 'besonders starke Blutung', icon: '🌊', category: 'bleeding' },

  // Schmerzen
  { type: 'pain_cramps', label: 'Krämpfe', icon: '😣', category: 'pain' },
  { type: 'pain_pelvic', label: 'Unterleibsschmerzen', icon: '😓', category: 'pain' },
  { type: 'pain_back', label: 'Rückenschmerzen', icon: '🦴', category: 'pain' },
  { type: 'pain_head', label: 'Kopfschmerzen', icon: '🤕', category: 'pain' },
  { type: 'pain_ovulation', label: 'Mittelschmerz', icon: '⭐', category: 'pain' },
  { type: 'pain_breast', label: 'Brustspannen', icon: '💔', category: 'pain' },

  // Körperlich
  { type: 'physical_bloating', label: 'Blähbauch', icon: '🎈', category: 'physical' },
  { type: 'physical_nausea', label: 'Übelkeit', icon: '🤢', category: 'physical' },
  { type: 'physical_acne', label: 'Hautunreinheiten', icon: '😖', category: 'physical' },
  { type: 'physical_digestion', label: 'Verdauungsprobleme', icon: '🫄', category: 'physical' },
  { type: 'physical_hot_flashes', label: 'Hitzewallungen', icon: '🥵', category: 'physical' },
  { type: 'physical_chills', label: 'Kältewallungen', icon: '🥶', category: 'physical' },
  { type: 'physical_water_retention', label: 'Wassereinlagerungen', icon: '💧', category: 'physical' },
  { type: 'physical_dizzy', label: 'Schwindel', icon: '💫', category: 'physical' },

  // Stimmung
  { type: 'mood_happy', label: 'Glücklich', icon: '😊', category: 'mood', isPositive: true },
  { type: 'mood_calm', label: 'Ausgeglichen', icon: '😌', category: 'mood', isPositive: true },
  { type: 'mood_sensitive', label: 'Sensibel', icon: '🥹', category: 'mood' },
  { type: 'mood_sad', label: 'Traurig', icon: '😢', category: 'mood' },
  { type: 'mood_irritable', label: 'Gereizt', icon: '😤', category: 'mood' },
  { type: 'mood_anxious', label: 'Ängstlich', icon: '😰', category: 'mood' },

  // Energie
  { type: 'energy_high', label: 'besonders viel Energie', icon: '⚡', category: 'energy', isPositive: true },
  { type: 'energy_low', label: 'besonders wenig Energie', icon: '🪫', category: 'energy' },

  // Schlaf
  { type: 'sleep_good', label: 'Gut geschlafen', icon: '😴', category: 'sleep', isPositive: true },
  { type: 'sleep_poor', label: 'Schlecht geschlafen', icon: '🥱', category: 'sleep' },
  { type: 'sleep_insomnia', label: 'Schlaflosigkeit', icon: '😵‍💫', category: 'sleep' },

  // Appetit
  { type: 'appetite_high', label: 'Viel Appetit', icon: '🍽️', category: 'appetite' },
  { type: 'appetite_low', label: 'Wenig Appetit', icon: '🥗', category: 'appetite' },
  { type: 'appetite_cravings', label: 'Heißhunger', icon: '🍫', category: 'appetite' },

  // Zervixschleim
  { type: 'cm_dry', label: 'Trocken', icon: '🏜️', category: 'cervical_mucus' },
  { type: 'cm_sticky', label: 'Klebrig', icon: '🍯', category: 'cervical_mucus' },
  { type: 'cm_creamy', label: 'Cremig', icon: '🥛', category: 'cervical_mucus' },
  { type: 'cm_watery', label: 'Wässrig', icon: '💧', category: 'cervical_mucus' },
  { type: 'cm_eggwhite', label: 'Spinnbar', icon: '🥚', category: 'cervical_mucus' },

  // Libido
  { type: 'libido_high', label: 'besonders hohe Libido', icon: '🔥', category: 'libido', isPositive: true },
  { type: 'libido_low', label: 'besonders niedrige Libido', icon: '❄️', category: 'libido' },
];

export const CATEGORY_INFO: Record<SymptomCategory, { label: string; color: string }> = {
  bleeding: { label: 'Blutung', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  pain: { label: 'Schmerzen', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  physical: { label: 'Körperlich', color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' },
  mood: { label: 'Stimmung', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  energy: { label: 'Energie', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
  sleep: { label: 'Schlaf', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' },
  appetite: { label: 'Appetit', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  cervical_mucus: { label: 'Zervixschleim', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' },
  libido: { label: 'Libido', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' },
};

export const CATEGORIES: SymptomCategory[] = [
  'bleeding', 'pain', 'physical', 'mood', 'energy',
  'sleep', 'appetite', 'cervical_mucus', 'libido'
];

// Helper functions
export function getSymptomLabel(type: SymptomType): string {
  return SYMPTOM_LABELS[type] || type;
}

export function getSymptomOption(type: SymptomType): SymptomOption | undefined {
  return SYMPTOM_OPTIONS.find((o) => o.type === type);
}

export function getSymptomIcon(type: SymptomType): string {
  return getSymptomOption(type)?.icon || '❓';
}

export function isPositiveSymptom(type: SymptomType): boolean {
  return getSymptomOption(type)?.isPositive || false;
}

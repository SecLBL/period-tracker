import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Cycle, Symptom, ExtendedPrediction, CyclePhase, CycleTrend, PredictionSource, SymptomSignal } from '../types';
import { getCycleDay, getCyclePhase, getAverageCycleLength, sortCyclesByDate } from '../utils/calculations';
import { SYMPTOM_LABELS } from '../constants/symptoms';

interface PredictionViewProps {
  cycles: Cycle[];
  symptoms?: Symptom[];
  prediction: ExtendedPrediction | null;
}

const PHASE_INFO: Record<CyclePhase, { label: string; color: string; description: string }> = {
  menstruation: {
    label: 'Menstruation',
    color: 'bg-rose-500',
    description: 'Die Gebärmutterschleimhaut wird abgestoßen.',
  },
  follicular: {
    label: 'Follikelphase',
    color: 'bg-blue-500',
    description: 'Die Eizelle reift heran. Energie steigt.',
  },
  ovulation: {
    label: 'Eisprung',
    color: 'bg-purple-500',
    description: 'Fruchtbarste Zeit des Zyklus.',
  },
  luteal: {
    label: 'Lutealphase',
    color: 'bg-amber-500',
    description: 'Der Körper bereitet sich auf die nächste Periode vor.',
  },
};

const TREND_INFO: Record<CycleTrend, { icon: string; label: string }> = {
  increasing: { icon: '↑', label: 'Zyklen werden länger' },
  decreasing: { icon: '↓', label: 'Zyklen werden kürzer' },
  stable: { icon: '→', label: 'Stabil' },
};

const SOURCE_INFO: Record<PredictionSource, { label: string; description: string }> = {
  ml: { label: 'KI', description: 'Machine Learning Vorhersage' },
  statistical: { label: 'Statistik', description: 'Statistische Berechnung' },
  default: { label: 'Standard', description: 'Standardwerte (mehr Daten benötigt)' },
};

function ConfidenceBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { label: 'Niedrig', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    medium: { label: 'Mittel', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
    high: { label: 'Hoch', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${config[level].color}`}>
      Konfidenz: {config[level].label}
    </span>
  );
}

function PredictionSourceBadge({ source }: { source: PredictionSource }) {
  const config = {
    ml: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    statistical: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    default: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${config[source]}`} title={SOURCE_INFO[source].description}>
      {SOURCE_INFO[source].label}
    </span>
  );
}

function TrendIndicator({ trend }: { trend: CycleTrend }) {
  const info = TREND_INFO[trend];
  const colorClass = trend === 'stable'
    ? 'text-gray-500'
    : trend === 'increasing'
      ? 'text-amber-500'
      : 'text-blue-500';

  return (
    <div className={`flex items-center gap-1 ${colorClass}`} title={info.label}>
      <span className="text-lg font-bold">{info.icon}</span>
      <span className="text-xs">{info.label}</span>
    </div>
  );
}

function ConfidenceInterval({ prediction }: { prediction: ExtendedPrediction }) {
  const { confidence, nextPeriodStart } = prediction;

  const lowDate = addDays(nextPeriodStart, confidence.low);
  const highDate = addDays(nextPeriodStart, confidence.high);

  return (
    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
      Zeitfenster: {format(lowDate, 'dd. MMM', { locale: de })} - {format(highDate, 'dd. MMM', { locale: de })}
    </div>
  );
}

function SymptomSignalCard({ signal }: { signal: SymptomSignal }) {
  const signalConfig: Record<SymptomSignal['type'], {
    icon: string;
    title: string;
    color: string;
    textColor: string;
    subtextColor: string;
  }> = {
    pms_pattern_match: {
      icon: '🌸',
      title: 'PMS-Muster erkannt',
      color: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
      textColor: 'text-pink-800 dark:text-pink-300',
      subtextColor: 'text-pink-600 dark:text-pink-400',
    },
    period_imminent: {
      icon: '⏰',
      title: 'Periode steht bevor',
      color: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
      textColor: 'text-rose-800 dark:text-rose-300',
      subtextColor: 'text-rose-600 dark:text-rose-400',
    },
    ovulation_pattern_match: {
      icon: '🌟',
      title: 'Eisprung-Anzeichen',
      color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      textColor: 'text-purple-800 dark:text-purple-300',
      subtextColor: 'text-purple-600 dark:text-purple-400',
    },
    fertile_window: {
      icon: '🥚',
      title: 'Fruchtbare Phase',
      color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
      textColor: 'text-emerald-800 dark:text-emerald-300',
      subtextColor: 'text-emerald-600 dark:text-emerald-400',
    },
  };

  const config = signalConfig[signal.type];
  const symptomNames = signal.relevantSymptoms
    .map(s => SYMPTOM_LABELS[s] || s)
    .join(', ');

  return (
    <div className={`rounded-xl p-4 border ${config.color}`}>
      <div className="flex gap-3">
        <div className="text-2xl">{config.icon}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`text-sm font-medium ${config.textColor}`}>
              {config.title}
            </h4>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              signal.confidence === 'high'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : signal.confidence === 'medium'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {signal.confidence === 'high' ? 'Hoch' : signal.confidence === 'medium' ? 'Mittel' : 'Niedrig'}
            </span>
          </div>

          {/* Use the learned message */}
          <p className={`text-xs ${config.subtextColor}`}>
            {signal.message}
          </p>

          {/* Show matched symptoms */}
          <p className={`text-xs ${config.subtextColor} mt-1`}>
            Erkannt: {symptomNames}
          </p>

          {/* Show adjustment if any */}
          {signal.daysAdjustment !== 0 && (
            <p className={`text-xs font-medium ${config.textColor} mt-1`}>
              Vorhersage um {Math.abs(signal.daysAdjustment)} Tag{Math.abs(signal.daysAdjustment) !== 1 ? 'e' : ''} {signal.daysAdjustment < 0 ? 'vorverlegt' : 'verschoben'}
            </p>
          )}

          {/* Show data basis */}
          {signal.basedOnCycles > 0 && (
            <p className={`text-xs ${config.subtextColor} mt-2 opacity-75`}>
              Gelernt aus {signal.basedOnCycles} {signal.basedOnCycles === 1 ? 'Zyklus' : 'Zyklen'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PredictionView({ cycles, symptoms = [], prediction }: PredictionViewProps) {
  if (cycles.length === 0) {
    return (
      <div className="p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Keine Daten vorhanden
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Trage deine erste Periode ein, um Vorhersagen zu erhalten.
          </p>
        </div>
      </div>
    );
  }

  const sortedCycles = sortCyclesByDate(cycles);
  const lastCycle = sortedCycles[0];
  const lastPeriodStart = parseISO(lastCycle.startDate);

  const cycleDay = getCycleDay(lastPeriodStart);
  const avgCycleLength = getAverageCycleLength(cycles);
  const currentPhase = getCyclePhase(cycleDay, avgCycleLength);
  const phaseInfo = PHASE_INFO[currentPhase];

  const daysUntilNextPeriod = prediction
    ? differenceInDays(prediction.nextPeriodStart, new Date())
    : null;

  return (
    <div className="p-4 space-y-4">
      {/* Current Cycle Day */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center">
        <div className="text-6xl font-bold text-rose-500 mb-2">
          Tag {cycleDay}
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          deines aktuellen Zyklus
        </p>
      </div>

      {/* Symptom Signal Alert */}
      {prediction?.symptomSignal && (
        <SymptomSignalCard signal={prediction.symptomSignal} />
      )}

      {/* Current Phase */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-4 h-4 rounded-full ${phaseInfo.color}`}></div>
          <h3 className="font-medium text-gray-900 dark:text-white">
            {phaseInfo.label}
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {phaseInfo.description}
        </p>

        {/* Phase Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Tag 1</span>
            <span>Tag {avgCycleLength}</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${phaseInfo.color} transition-all`}
              style={{ width: `${Math.min((cycleDay / avgCycleLength) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Next Period Prediction */}
      {prediction && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Nächste Periode
            </h3>
            <div className="flex items-center gap-2">
              <PredictionSourceBadge source={prediction.source} />
              <ConfidenceBadge level={prediction.confidence.level} />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-rose-500">
                {format(prediction.nextPeriodStart, 'dd. MMMM', { locale: de })}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                bis ca. {format(prediction.nextPeriodEnd, 'dd. MMMM', { locale: de })}
              </div>
              <ConfidenceInterval prediction={prediction} />
            </div>
            {daysUntilNextPeriod !== null && (
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {daysUntilNextPeriod > 0 ? daysUntilNextPeriod : 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {daysUntilNextPeriod === 1 ? 'Tag' : 'Tage'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fertile Window */}
      {prediction && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            Fruchtbarkeitsfenster
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span className="text-gray-700 dark:text-gray-300">Fruchtbare Tage</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {format(prediction.fertileWindowStart, 'dd.MM.')} - {format(prediction.fertileWindowEnd, 'dd.MM.')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Eisprung</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {format(prediction.ovulationDate, 'dd. MMMM', { locale: de })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Statistics Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Dein Zyklus
          </h3>
          {prediction && <TrendIndicator trend={prediction.trend} />}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {avgCycleLength}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Tage Ø Zykluslänge
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {cycles.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {cycles.length === 1 ? 'Zyklus' : 'Zyklen'} erfasst
            </div>
          </div>
        </div>

        {prediction && prediction.source !== 'default' && (
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Geschätzte Lutealphase: {prediction.estimatedLutealPhase} Tage
            </div>
          </div>
        )}
      </div>

      {/* Data Quality Notice */}
      {cycles.length < 7 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="text-blue-500 text-xl">💡</div>
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                Genauere Vorhersagen
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                {cycles.length < 3
                  ? 'Erfasse mindestens 3 Zyklen für statistische Vorhersagen.'
                  : cycles.length < 7
                    ? `Noch ${7 - cycles.length} Zyklen für KI-gestützte Vorhersagen.`
                    : 'KI-Vorhersagen sind jetzt aktiv!'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Symptom Tracking Hint */}
      {symptoms.length === 0 && cycles.length >= 2 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="text-amber-500 text-xl">📝</div>
            <div>
              <h4 className="text-sm font-medium text-amber-900 dark:text-amber-300 mb-1">
                Symptome tracken
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Trage Symptome ein, um PMS-Muster zu erkennen und Vorhersagen zu verbessern.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center px-4">
        Die Vorhersagen basieren auf deinen bisherigen Zyklusdaten und Symptomen.
        Sie dienen nur zur Orientierung und ersetzen keine medizinische Beratung.
      </p>
    </div>
  );
}

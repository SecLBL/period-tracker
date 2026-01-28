import { format, differenceInDays, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import type { Cycle, Prediction, CyclePhase } from '../types';
import { getCycleDay, getCyclePhase, getAverageCycleLength } from '../utils/calculations';

interface PredictionViewProps {
  cycles: Cycle[];
  predictions: Prediction | null;
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

export function PredictionView({ cycles, predictions }: PredictionViewProps) {
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

  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  const lastCycle = sortedCycles[0];
  const lastPeriodStart = parseISO(lastCycle.startDate);

  const cycleDay = getCycleDay(lastPeriodStart);
  const avgCycleLength = getAverageCycleLength(cycles);
  const currentPhase = getCyclePhase(cycleDay, avgCycleLength);
  const phaseInfo = PHASE_INFO[currentPhase];

  const daysUntilNextPeriod = predictions
    ? differenceInDays(predictions.nextPeriodStart, new Date())
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
      {predictions && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">
            Nächste Periode
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-rose-500">
                {format(predictions.nextPeriodStart, 'dd. MMMM', { locale: de })}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                bis ca. {format(predictions.nextPeriodEnd, 'dd. MMMM', { locale: de })}
              </div>
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
      {predictions && (
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
                {format(predictions.fertileWindowStart, 'dd.MM.')} - {format(predictions.fertileWindowEnd, 'dd.MM.')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Eisprung</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {format(predictions.ovulationDate, 'dd. MMMM', { locale: de })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Statistics Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          Dein Zyklus
        </h3>
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
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center px-4">
        Die Vorhersagen basieren auf deinen bisherigen Zyklusdaten und dienen nur zur Orientierung.
        Sie ersetzen keine medizinische Beratung.
      </p>
    </div>
  );
}

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, parseISO, differenceInDays } from 'date-fns';
import type { Cycle, Symptom, CycleStats, SymptomType } from '../types';

interface StatisticsProps {
  cycles: Cycle[];
  symptoms: Symptom[];
  statistics: CycleStats;
}

const SYMPTOM_LABELS: Record<SymptomType, string> = {
  cramps: 'Krämpfe',
  headache: 'Kopfschmerzen',
  mood: 'Stimmung',
  energy: 'Energie',
  bloating: 'Blähungen',
  breast_tenderness: 'Brustspannen',
  other: 'Sonstiges',
};

export function Statistics({ cycles, symptoms, statistics }: StatisticsProps) {
  // Prepare cycle length data for chart
  const cycleLengthData = useMemo(() => {
    if (cycles.length < 2) return [];

    const sortedCycles = [...cycles].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    const data: { name: string; length: number }[] = [];
    for (let i = 1; i < sortedCycles.length; i++) {
      const length = differenceInDays(
        parseISO(sortedCycles[i].startDate),
        parseISO(sortedCycles[i - 1].startDate)
      );
      if (length > 0 && length < 60) {
        data.push({
          name: format(parseISO(sortedCycles[i].startDate), 'MM/yy'),
          length,
        });
      }
    }
    return data;
  }, [cycles]);

  // Prepare period length data
  const periodLengthData = useMemo(() => {
    return cycles
      .filter((c) => c.endDate)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .map((cycle) => ({
        name: format(parseISO(cycle.startDate), 'MM/yy'),
        length: differenceInDays(parseISO(cycle.endDate!), parseISO(cycle.startDate)) + 1,
      }));
  }, [cycles]);

  // Prepare symptom frequency data
  const symptomFrequencyData = useMemo(() => {
    const counts: Record<SymptomType, number> = {
      cramps: 0,
      headache: 0,
      mood: 0,
      energy: 0,
      bloating: 0,
      breast_tenderness: 0,
      other: 0,
    };

    symptoms.forEach((symptom) => {
      counts[symptom.symptomType]++;
    });

    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        name: SYMPTOM_LABELS[type as SymptomType],
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [symptoms]);

  if (cycles.length === 0) {
    return (
      <div className="p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Noch keine Statistiken
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Trage mindestens 2 Zyklen ein, um Statistiken zu sehen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Statistics Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h3 className="font-medium text-gray-900 dark:text-white mb-4">
          Übersicht
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-rose-500">
              {statistics.averageCycleLength || '-'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Ø Zykluslänge
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-rose-500">
              {statistics.averagePeriodLength || '-'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Ø Periodenlänge
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.shortestCycle || '-'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Kürzester Zyklus
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {statistics.longestCycle || '-'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Längster Zyklus
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Length Chart */}
      {cycleLengthData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Zykluslänge über Zeit
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cycleLengthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickLine={{ stroke: '#9CA3AF' }}
                />
                <YAxis
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickLine={{ stroke: '#9CA3AF' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value) => [`${value} Tage`, 'Zykluslänge']}
                />
                <Line
                  type="monotone"
                  dataKey="length"
                  stroke="#F43F5E"
                  strokeWidth={2}
                  dot={{ fill: '#F43F5E', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Period Length Chart */}
      {periodLengthData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Periodenlänge über Zeit
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={periodLengthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickLine={{ stroke: '#9CA3AF' }}
                />
                <YAxis
                  domain={[0, 'dataMax + 2']}
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickLine={{ stroke: '#9CA3AF' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value) => [`${value} Tage`, 'Periodenlänge']}
                />
                <Line
                  type="monotone"
                  dataKey="length"
                  stroke="#EC4899"
                  strokeWidth={2}
                  dot={{ fill: '#EC4899', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Symptom Frequency Chart */}
      {symptomFrequencyData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
            Symptom-Häufigkeit
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symptomFrequencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                <XAxis
                  type="number"
                  tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  tickLine={{ stroke: '#9CA3AF' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  tickLine={{ stroke: '#9CA3AF' }}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value) => [`${value}x`, 'Einträge']}
                />
                <Bar dataKey="count" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Total Counts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">
          Gesamt
        </h3>
        <div className="flex justify-around">
          <div className="text-center">
            <div className="text-3xl font-bold text-rose-500">
              {statistics.totalCycles}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Zyklen
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-500">
              {symptoms.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Symptome
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

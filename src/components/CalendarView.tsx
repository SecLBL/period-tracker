import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { de } from 'date-fns/locale';
import type { Cycle, Symptom, Prediction } from '../types';

interface CalendarViewProps {
  cycles: Cycle[];
  symptoms: Symptom[];
  predictions: Prediction | null;
  onDayClick: (date: Date) => void;
}

export function CalendarView({ cycles, symptoms, predictions, onDayClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getDayStatus = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');

    // Check if day is during a period
    const isPeriod = cycles.some((cycle) => {
      const start = parseISO(cycle.startDate);
      const end = cycle.endDate ? parseISO(cycle.endDate) : start;
      return isWithinInterval(day, { start, end });
    });

    // Check for symptoms
    const daySymptoms = symptoms.filter((s) => s.date === dateStr);
    const hasSymptoms = daySymptoms.length > 0;

    // Check predictions
    let isPredictedPeriod = false;
    let isFertile = false;
    let isOvulation = false;

    if (predictions) {
      isPredictedPeriod = isWithinInterval(day, {
        start: predictions.nextPeriodStart,
        end: predictions.nextPeriodEnd,
      });

      isFertile = isWithinInterval(day, {
        start: predictions.fertileWindowStart,
        end: predictions.fertileWindowEnd,
      });

      isOvulation = isSameDay(day, predictions.ovulationDate);
    }

    return { isPeriod, hasSymptoms, isPredictedPeriod, isFertile, isOvulation };
  };

  const weekDays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  return (
    <div className="p-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-rose-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Periode</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-rose-300 border-2 border-dashed border-rose-400"></div>
          <span className="text-gray-600 dark:text-gray-400">Vorhersage</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
          <span className="text-gray-600 dark:text-gray-400">Fruchtbar</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Eisprung</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Week Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());
            const { isPeriod, hasSymptoms, isPredictedPeriod, isFertile, isOvulation } = getDayStatus(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDayClick(day)}
                className={`
                  relative aspect-square p-1 flex flex-col items-center justify-center
                  border-b border-r border-gray-100 dark:border-gray-700
                  transition-colors hover:bg-gray-50 dark:hover:bg-gray-700
                  ${!isCurrentMonth ? 'opacity-30' : ''}
                `}
              >
                {/* Day Number */}
                <span
                  className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-sm
                    ${isToday ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold' : ''}
                    ${isPeriod && !isToday ? 'bg-rose-500 text-white' : ''}
                    ${isPredictedPeriod && !isPeriod && !isToday ? 'bg-rose-200 dark:bg-rose-900 border-2 border-dashed border-rose-400' : ''}
                    ${isOvulation && !isPeriod && !isToday ? 'bg-purple-500 text-white' : ''}
                    ${isFertile && !isOvulation && !isPeriod && !isPredictedPeriod && !isToday ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : ''}
                    ${!isPeriod && !isPredictedPeriod && !isFertile && !isOvulation && !isToday ? 'text-gray-700 dark:text-gray-300' : ''}
                  `}
                >
                  {format(day, 'd')}
                </span>

                {/* Symptom Indicator */}
                {hasSymptoms && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

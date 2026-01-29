import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import type { Symptom, SymptomType, SymptomCategory } from '../types';
import {
  SYMPTOM_OPTIONS,
  CATEGORY_INFO,
  CATEGORIES,
  getSymptomLabel,
  getSymptomIcon,
  isPositiveSymptom,
} from '../constants/symptoms';

interface SymptomTrackerProps {
  symptoms: Symptom[];
  selectedDate?: Date;
  onAddSymptom: (symptom: Omit<Symptom, 'id'>) => Promise<void>;
  onDeleteSymptom: (id: number) => Promise<void>;
}

export function SymptomTracker({
  symptoms,
  selectedDate,
  onAddSymptom,
  onDeleteSymptom,
}: SymptomTrackerProps) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [symptomType, setSymptomType] = useState<SymptomType>('bleeding_spotting');
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<SymptomCategory>('bleeding');

  useEffect(() => {
    if (selectedDate) {
      setDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddSymptom({
        date,
        symptomType,
        severity,
        notes: notes || undefined,
      });
      setNotes('');
      setSeverity(3);
    } catch (error) {
      console.error('Failed to add symptom:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Dieses Symptom wirklich löschen?')) {
      await onDeleteSymptom(id);
    }
  };

  // Get symptoms for selected date
  const dateSymptoms = symptoms.filter((s) => s.date === date);

  // Sort all symptoms by date (most recent first)
  const sortedSymptoms = [...symptoms].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Get symptoms for active category
  const categorySymptoms = SYMPTOM_OPTIONS.filter((o) => o.category === activeCategory);

  // Get severity label based on symptom type
  const getSeverityLabel = () => {
    if (isPositiveSymptom(symptomType)) {
      return `Intensität: ${severity}/5`;
    }
    return `Stärke: ${severity}/5`;
  };

  return (
    <div className="p-4 space-y-6">
      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-white">Symptom eintragen</h3>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Datum
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>

        {/* Category Tabs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Kategorie
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? CATEGORY_INFO[cat].color
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {CATEGORY_INFO[cat].label}
              </button>
            ))}
          </div>
        </div>

        {/* Symptom Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Symptom
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categorySymptoms.map((option) => (
              <button
                key={option.type}
                type="button"
                onClick={() => setSymptomType(option.type)}
                className={`p-3 rounded-lg border-2 transition-colors flex items-center gap-2 ${
                  symptomType === option.type
                    ? option.isPositive
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                      : 'border-rose-500 bg-rose-50 dark:bg-rose-900/30'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <span>{option.icon}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                {option.isPositive && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">+</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Severity Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {getSeverityLabel()}
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={severity}
              onChange={(e) => setSeverity(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                isPositiveSymptom(symptomType)
                  ? 'accent-emerald-500'
                  : 'accent-rose-500'
              }`}
              style={{
                background: `linear-gradient(to right, ${
                  isPositiveSymptom(symptomType) ? '#10b981' : '#f43f5e'
                } 0%, ${
                  isPositiveSymptom(symptomType) ? '#10b981' : '#f43f5e'
                } ${(severity - 1) * 25}%, #e5e7eb ${(severity - 1) * 25}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notizen (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
            placeholder="Zusätzliche Notizen..."
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-lg font-medium transition-colors"
        >
          Symptom speichern
        </button>
      </form>

      {/* Symptoms for selected date */}
      {dateSymptoms.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Symptome am {format(parseISO(date), 'dd.MM.yyyy')}
          </h3>
          <div className="space-y-2">
            {dateSymptoms.map((symptom) => {
              const isPositive = isPositiveSymptom(symptom.symptomType);
              return (
                <div
                  key={symptom.id}
                  className={`rounded-lg p-3 shadow-sm flex items-center justify-between ${
                    isPositive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getSymptomIcon(symptom.symptomType)}</span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {getSymptomLabel(symptom.symptomType)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {isPositive ? 'Intensität' : 'Stärke'}: {symptom.severity}/5
                        {symptom.notes && ` - ${symptom.notes}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => symptom.id && handleDelete(symptom.id)}
                    className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    aria-label="Delete"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Symptoms */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 dark:text-white">Letzte Symptome</h3>
        {sortedSymptoms.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Noch keine Symptome eingetragen.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedSymptoms.slice(0, 10).map((symptom) => {
              const isPositive = isPositiveSymptom(symptom.symptomType);
              return (
                <div
                  key={symptom.id}
                  className={`rounded-lg p-3 shadow-sm flex items-center justify-between ${
                    isPositive
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{getSymptomIcon(symptom.symptomType)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {getSymptomLabel(symptom.symptomType)} ({symptom.severity}/5)
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {format(parseISO(symptom.date), 'dd.MM.yyyy')}
                        {symptom.notes && ` - ${symptom.notes}`}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => symptom.id && handleDelete(symptom.id)}
                    className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    aria-label="Delete"
                  >
                    🗑️
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

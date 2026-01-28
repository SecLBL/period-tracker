import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import type { Cycle } from '../types';

interface CycleInputProps {
  cycles: Cycle[];
  selectedDate?: Date;
  onAddCycle: (cycle: Omit<Cycle, 'id'>) => Promise<void>;
  onUpdateCycle: (id: number, updates: Partial<Cycle>) => Promise<void>;
  onDeleteCycle: (id: number) => Promise<void>;
}

export function CycleInput({
  cycles,
  selectedDate,
  onAddCycle,
  onUpdateCycle,
  onDeleteCycle,
}: CycleInputProps) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      setStartDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingCycle && editingCycle.id) {
        await onUpdateCycle(editingCycle.id, {
          startDate,
          endDate: endDate || undefined,
          notes: notes || undefined,
        });
      } else {
        await onAddCycle({
          startDate,
          endDate: endDate || undefined,
          notes: notes || undefined,
        });
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save cycle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setStartDate(cycle.startDate);
    setEndDate(cycle.endDate || '');
    setNotes(cycle.notes || '');
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Diesen Zyklus wirklich löschen?')) {
      await onDeleteCycle(id);
      if (editingCycle?.id === id) {
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate('');
    setNotes('');
    setEditingCycle(null);
  };

  const handleQuickStart = async () => {
    setIsSubmitting(true);
    try {
      await onAddCycle({
        startDate: format(new Date(), 'yyyy-MM-dd'),
      });
    } catch (error) {
      console.error('Failed to add cycle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort cycles by start date (most recent first)
  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="p-4 space-y-6">
      {/* Quick Start Button */}
      <button
        onClick={handleQuickStart}
        disabled={isSubmitting}
        className="w-full py-4 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-xl">🩸</span>
        Heute gestartet
      </button>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-white">
          {editingCycle ? 'Zyklus bearbeiten' : 'Neuen Zyklus eintragen'}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Startdatum *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Enddatum (optional)
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

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
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white rounded-lg font-medium transition-colors"
          >
            {editingCycle ? 'Speichern' : 'Hinzufügen'}
          </button>
          {editingCycle && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
            >
              Abbrechen
            </button>
          )}
        </div>
      </form>

      {/* Cycles List */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 dark:text-white">Vergangene Zyklen</h3>
        {sortedCycles.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Noch keine Zyklen eingetragen.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedCycles.map((cycle) => (
              <div
                key={cycle.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {format(parseISO(cycle.startDate), 'dd.MM.yyyy')}
                    {cycle.endDate && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {' '}- {format(parseISO(cycle.endDate), 'dd.MM.yyyy')}
                      </span>
                    )}
                  </div>
                  {cycle.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {cycle.notes}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(cycle)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    aria-label="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => cycle.id && handleDelete(cycle.id)}
                    className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    aria-label="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

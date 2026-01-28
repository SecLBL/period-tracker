import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { exportData, importData } from '../utils/database';
import type { Cycle, Symptom } from '../types';

interface ExportImportProps {
  onDataChange: () => void;
}

export function ExportImport({ onDataChange }: ExportImportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);

    try {
      const data = await exportData();
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `period-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Daten erfolgreich exportiert!' });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: 'Export fehlgeschlagen.' });
    } finally {
      setIsExporting(false);
    }
  };

  const validateImportData = (data: unknown): data is { cycles: Cycle[]; symptoms: Symptom[] } => {
    if (typeof data !== 'object' || data === null) return false;

    const d = data as Record<string, unknown>;
    if (!Array.isArray(d.cycles) || !Array.isArray(d.symptoms)) return false;

    // Validate cycles
    for (const cycle of d.cycles) {
      if (typeof cycle !== 'object' || cycle === null) return false;
      const c = cycle as Record<string, unknown>;
      if (typeof c.startDate !== 'string') return false;
      if (c.endDate !== undefined && typeof c.endDate !== 'string') return false;
    }

    // Validate symptoms
    for (const symptom of d.symptoms) {
      if (typeof symptom !== 'object' || symptom === null) return false;
      const s = symptom as Record<string, unknown>;
      if (typeof s.date !== 'string') return false;
      if (typeof s.symptomType !== 'string') return false;
      if (typeof s.severity !== 'number' || s.severity < 1 || s.severity > 5) return false;
    }

    return true;
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!validateImportData(data)) {
        setMessage({ type: 'error', text: 'Ungültiges Dateiformat.' });
        return;
      }

      const confirmImport = window.confirm(
        `Import wird ${data.cycles.length} Zyklen und ${data.symptoms.length} Symptome importieren. ` +
        'Bestehende Daten werden ersetzt. Fortfahren?'
      );

      if (!confirmImport) {
        setMessage({ type: 'error', text: 'Import abgebrochen.' });
        return;
      }

      await importData(data);
      onDataChange();
      setMessage({
        type: 'success',
        text: `${data.cycles.length} Zyklen und ${data.symptoms.length} Symptome importiert!`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      setMessage({ type: 'error', text: 'Import fehlgeschlagen. Ungültige JSON-Datei.' });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Export Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          Daten exportieren
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Lade alle deine Daten als JSON-Datei herunter. Du kannst diese Datei als Backup speichern
          oder auf einem anderen Gerät importieren.
        </p>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span>📥</span>
          {isExporting ? 'Exportiere...' : 'Als JSON exportieren'}
        </button>
      </div>

      {/* Import Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          Daten importieren
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Importiere eine zuvor exportierte JSON-Datei. Achtung: Bestehende Daten werden ersetzt!
        </p>
        <label className="block">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleImport}
            disabled={isImporting}
            className="hidden"
          />
          <div className="w-full py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <span>📤</span>
            {isImporting ? 'Importiere...' : 'JSON-Datei auswählen'}
          </div>
        </label>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <span>🔒</span>
          Deine Privatsphäre
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Alle deine Daten werden ausschließlich lokal auf deinem Gerät gespeichert.
          Es werden keine Daten an Server übertragen. Diese App funktioniert vollständig offline.
        </p>
      </div>

      {/* Clear Data */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">
          Gefahrenzone
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Lösche alle gespeicherten Daten. Diese Aktion kann nicht rückgängig gemacht werden.
        </p>
        <button
          onClick={async () => {
            if (window.confirm('Wirklich ALLE Daten löschen? Diese Aktion kann nicht rückgängig gemacht werden!')) {
              await importData({ cycles: [], symptoms: [] });
              onDataChange();
              setMessage({ type: 'success', text: 'Alle Daten wurden gelöscht.' });
            }
          }}
          className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
        >
          Alle Daten löschen
        </button>
      </div>
    </div>
  );
}

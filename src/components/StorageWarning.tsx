import { useState } from 'react';
import { useStorageHealth } from '../hooks/useStorageHealth';

interface StorageWarningProps {
  /** Jump to the settings/export tab so the user can back up their data. */
  onGoToExport: () => void;
}

const DISMISS_KEY = 'storageWarningDismissed';

type Variant = {
  /** Visual severity: 'danger' = real data-loss risk, 'warning' = milder. */
  severity: 'danger' | 'warning';
  title: string;
  message: string;
};

/**
 * Picks the right warning for the current storage state, or null if data is safe:
 *
 * - not persistent  -> real risk of automatic eviction (data loss). The browser
 *   may delete the data under storage pressure. A nearly-full device makes this
 *   imminent. This is the cause of "data disappears on its own" on Android PWAs.
 * - persistent but nearly full -> existing data is safe from eviction, but new
 *   entries may fail to save (QuotaExceededError). Different, milder problem.
 * - persistent with space -> no warning.
 */
function resolveVariant(persisted: boolean, nearlyFull: boolean): Variant | null {
  if (!persisted) {
    return {
      severity: 'danger',
      title: 'Deine Daten könnten verloren gehen',
      message: nearlyFull
        ? 'Dein Gerätespeicher ist fast voll und dein Browser sichert die Daten nicht dauerhaft. Sie können dadurch jederzeit automatisch gelöscht werden. Gib Speicher frei und exportiere jetzt deine Daten.'
        : 'Dein Browser sichert deine Daten nicht dauerhaft. Bei vollem Gerätespeicher können sie automatisch gelöscht werden. Exportiere zur Sicherheit regelmäßig deine Daten.',
    };
  }
  if (nearlyFull) {
    return {
      severity: 'warning',
      title: 'Speicher fast voll',
      message:
        'Deine bisherigen Daten sind sicher, aber der Gerätespeicher ist fast voll. Neue Einträge lassen sich eventuell nicht mehr speichern. Bitte gib etwas Speicher frei.',
    };
  }
  return null;
}

/**
 * Shows a context-appropriate banner when the app's data could be lost or when
 * new writes might fail. Encourages an export as a safety net for the data-loss
 * case. Renders nothing when storage is healthy.
 */
export function StorageWarning({ onGoToExport }: StorageWarningProps) {
  const { loading, supported, persisted, nearlyFull } = useStorageHealth();
  // Dismiss only for the current session; the warning returns on next launch
  // because the risk persists until the user acts.
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === 'true'
  );

  const variant = supported ? resolveVariant(persisted, nearlyFull) : null;
  if (loading || dismissed || !variant) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  const danger = variant.severity === 'danger';
  const palette = danger
    ? {
        box: 'border-red-300 bg-red-50 text-red-900 dark:border-red-700/60 dark:bg-red-900/30 dark:text-red-100',
        cta: 'bg-red-500 hover:bg-red-600',
        dismiss:
          'text-red-800 hover:bg-red-100 dark:text-red-200 dark:hover:bg-red-800/40',
      }
    : {
        box: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/30 dark:text-amber-100',
        cta: 'bg-amber-500 hover:bg-amber-600',
        dismiss:
          'text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-800/40',
      };

  return (
    <div className={`mx-4 mt-4 rounded-lg border p-3 ${palette.box}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg leading-none" aria-hidden>⚠️</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{variant.title}</p>
          <p className="mt-1 text-sm">{variant.message}</p>
          <div className="mt-2 flex gap-2">
            {danger && (
              <button
                onClick={onGoToExport}
                className={`rounded-full px-3 py-1 text-sm font-medium text-white transition-colors ${palette.cta}`}
              >
                Daten exportieren
              </button>
            )}
            <button
              onClick={handleDismiss}
              className={`rounded-full px-3 py-1 text-sm transition-colors ${palette.dismiss}`}
            >
              {danger ? 'Später' : 'Verstanden'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { ensurePersistentStorage, getStorageEstimate } from '../utils/database';

// Dev-only manual override so the storage warning can be tested from the
// browser console. Stripped from production builds via `import.meta.env.DEV`.
//   window.__storageHealthOverride = { persisted: false, nearlyFull: true }
//   window.__refreshStorageHealth()           // re-run, no reload needed
//   delete window.__storageHealthOverride; window.__refreshStorageHealth()
declare global {
  interface Window {
    __storageHealthOverride?: Partial<StorageHealth>;
    __refreshStorageHealth?: () => void;
  }
}

export interface StorageHealth {
  loading: boolean;
  /** Whether the Storage API is available in this browser. */
  supported: boolean;
  /** Whether storage is marked persistent (won't be auto-evicted). */
  persisted: boolean;
  /** Fraction of the granted quota currently used (0..1), or null if unknown. */
  usageRatio: number | null;
  /** True when usage is high enough that eviction becomes likely. */
  nearlyFull: boolean;
}

const NEARLY_FULL_THRESHOLD = 0.8;

/**
 * Reports whether the app's data is safe from automatic browser eviction.
 * Re-requests persistence on mount (cheap if already granted) and inspects
 * the storage quota so the UI can warn the user before data loss.
 */
export function useStorageHealth(): StorageHealth {
  const [health, setHealth] = useState<StorageHealth>({
    loading: true,
    supported: true,
    persisted: true,
    usageRatio: null,
    nearlyFull: false,
  });

  const check = useCallback(async () => {
    const { persisted, supported } = await ensurePersistentStorage();
    const estimate = await getStorageEstimate();

    let usageRatio: number | null = null;
    if (estimate?.usage != null && estimate.quota) {
      usageRatio = estimate.usage / estimate.quota;
    }

    let next: StorageHealth = {
      loading: false,
      supported,
      persisted,
      usageRatio,
      nearlyFull: usageRatio != null && usageRatio >= NEARLY_FULL_THRESHOLD,
    };

    // Apply dev-only console overrides on top of the real values.
    if (import.meta.env.DEV && window.__storageHealthOverride) {
      next = { ...next, ...window.__storageHealthOverride };
    }

    setHealth(next);
  }, []);

  useEffect(() => {
    void check();
    if (import.meta.env.DEV) {
      window.__refreshStorageHealth = () => void check();
      return () => {
        delete window.__refreshStorageHealth;
      };
    }
  }, [check]);

  return health;
}

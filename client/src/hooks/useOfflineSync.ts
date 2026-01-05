import { useEffect, useState } from 'react';
import { syncService } from '@/lib/syncService';
import { indexedDBService } from '@/lib/indexedDB';

export function useOfflineSync() {
  const [connectionStatus, setConnectionStatus] = useState(syncService.getConnectionStatus());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    let isMounted = true;

    indexedDBService.init()
      .then(() => {
        if (!isMounted) return;
        interval = setInterval(() => {
          const status = syncService.getConnectionStatus();
          setConnectionStatus(status);
          indexedDBService.getPendingSync().then(items => {
            setPendingCount(items.length);
          }).catch(console.error);
        }, 1000);
      })
      .catch(console.error);

    // Download latest data when online
    if (navigator.onLine) {
      syncService.downloadLatestData().catch(console.error);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, []);

  const forcSync = async () => {
    await syncService.syncPendingData();
  };

  return {
    isOnline: connectionStatus.isOnline,
    syncInProgress: connectionStatus.syncInProgress,
    pendingCount,
    forceSync: forcSync,
  };
}

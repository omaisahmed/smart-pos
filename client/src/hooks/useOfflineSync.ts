import { useEffect, useState } from 'react';
import { syncService } from '@/lib/syncService';
import { indexedDBService } from '@/lib/indexedDB';

export function useOfflineSync() {
  const [connectionStatus, setConnectionStatus] = useState(syncService.getConnectionStatus());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Initialize IndexedDB
    indexedDBService.init().catch(console.error);

    // Update connection status periodically
    const interval = setInterval(() => {
      const status = syncService.getConnectionStatus();
      setConnectionStatus(status);
      
      // Update pending sync count
      indexedDBService.getPendingSync().then(items => {
        setPendingCount(items.length);
      }).catch(console.error);
    }, 1000);

    // Download latest data when online
    if (navigator.onLine) {
      syncService.downloadLatestData().catch(console.error);
    }

    return () => clearInterval(interval);
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

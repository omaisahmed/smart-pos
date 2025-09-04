import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function ConnectionStatus() {
  const { isOnline, syncInProgress, pendingCount, forceSync } = useOfflineSync();

  return (
    <div className="p-3 rounded-md bg-muted space-y-2">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        <span className="text-sm font-medium" data-testid="text-connection-status">
          {isOnline ? 'Online' : 'Offline Mode'}
        </span>
        {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
      </div>
      
      {pendingCount > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground" data-testid="text-pending-sync">
            {pendingCount} transactions pending sync
          </p>
          {isOnline && (
            <Button
              size="sm"
              variant="outline"
              onClick={forceSync}
              disabled={syncInProgress}
              className="w-full"
              data-testid="button-force-sync"
            >
              {syncInProgress ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync Now
                </>
              )}
            </Button>
          )}
        </div>
      )}
      
      {syncInProgress && (
        <Badge variant="secondary" className="text-xs">
          Syncing data...
        </Badge>
      )}
    </div>
  );
}

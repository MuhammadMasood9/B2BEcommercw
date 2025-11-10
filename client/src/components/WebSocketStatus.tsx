import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function WebSocketStatus() {
  const { isConnected, connectionError } = useWebSocketContext();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1 text-green-600">
              <Wifi className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">Live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <WifiOff className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">Offline</span>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        {isConnected ? (
          <p>Real-time updates active</p>
        ) : connectionError ? (
          <p>Connection error: {connectionError}</p>
        ) : (
          <p>Connecting to real-time updates...</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

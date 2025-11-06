import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationData {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'error' | 'warning';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  read: boolean;
  createdAt: Date;
}

interface WebSocketMessage {
  type: 'notification' | 'update' | 'connection' | 'pong';
  data: any;
}

interface UseWebSocketNotificationsProps {
  userId: string;
  enabled?: boolean;
}

export function useWebSocketNotifications({ userId, enabled = true }: UseWebSocketNotificationsProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const connect = useCallback(() => {
    // More robust validation
    const isValidUserId = userId && 
                         typeof userId === 'string' && 
                         userId.trim() !== '' && 
                         userId !== 'undefined' && 
                         userId !== 'null' &&
                         userId.length > 0;

    if (!enabled || loading || !user || !isValidUserId || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket connection skipped:', { 
        enabled, 
        loading, 
        user: !!user, 
        userId, 
        isValidUserId,
        readyState: wsRef.current?.readyState 
      });
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/notifications?userId=${encodeURIComponent(userId)}`;
      
      console.log('Attempting WebSocket connection:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Start ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'notification':
              handleNotification(message.data as NotificationData);
              break;
              
            case 'update':
              handleUpdate(message.data);
              break;
              
            case 'connection':
              console.log('WebSocket connection confirmed:', message.data);
              break;
              
            case 'pong':
              // Connection is alive
              break;
              
            default:
              console.log('Unknown WebSocket message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt to reconnect after a delay (unless it was a clean close)
        if (enabled && event.code !== 1000) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000); // Reconnect after 5 seconds
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionStatus('error');
    }
  }, [userId, enabled]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const handleNotification = (notification: NotificationData) => {
    // Show toast notification
    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
    });

    // Invalidate relevant queries to refresh data
    if (notification.relatedType === 'chat') {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/unread-count'] });
      
      if (notification.relatedId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/chat/conversations', notification.relatedId, 'messages'] 
        });
      }
    }

    // Invalidate notifications query
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
  };

  const handleUpdate = (update: any) => {
    switch (update.type) {
      case 'new_message':
        // Invalidate chat queries for real-time message updates
        queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
        if (update.conversationId) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/chat/conversations', update.conversationId, 'messages'] 
          });
        }
        break;
        
      case 'typing_indicator':
        // Handle typing indicators (could update UI state)
        console.log('User typing:', update);
        break;
        
      case 'user_status':
        // Handle user online/offline status updates
        console.log('User status update:', update);
        break;
        
      default:
        console.log('Unknown update type:', update.type);
    }
  };

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendTypingIndicator = useCallback((conversationId: string, isTyping: boolean) => {
    sendMessage({
      type: 'typing',
      conversationId,
      isTyping
    });
  }, [sendMessage]);

  const sendUserStatus = useCallback((isOnline: boolean, lastSeen?: Date) => {
    sendMessage({
      type: 'user_status',
      isOnline,
      lastSeen: lastSeen?.toISOString()
    });
  }, [sendMessage]);

  // Connect when component mounts and userId is available
  useEffect(() => {
    // More robust validation before attempting connection
    const isValidUserId = userId && 
                         typeof userId === 'string' && 
                         userId.trim() !== '' && 
                         userId !== 'undefined' && 
                         userId !== 'null' &&
                         userId.length > 0;

    // Only connect after authentication is complete and user is available
    if (enabled && !loading && user && user.id && isValidUserId) {
      const timer = setTimeout(() => {
        connect();
      }, 2000); // Wait 2 seconds before attempting connection to ensure auth is complete
      
      return () => {
        clearTimeout(timer);
        disconnect();
      };
    }

    return () => {
      disconnect();
    };
  }, [userId, enabled, loading, user, connect, disconnect]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, user might be away
        sendUserStatus(false, new Date());
      } else {
        // Page is visible, user is back
        sendUserStatus(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendUserStatus]);

  // Handle beforeunload to set user as offline
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendUserStatus(false, new Date());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sendUserStatus]);

  return {
    isConnected,
    connectionStatus,
    connect,
    disconnect,
    sendMessage,
    sendTypingIndicator,
    sendUserStatus
  };
}
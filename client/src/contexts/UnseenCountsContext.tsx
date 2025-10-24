import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';

interface UnseenCounts {
  notifications: number;
  chats: number;
}

interface UnseenCountsContextType {
  unseenCounts: UnseenCounts;
  refetchUnseenCounts: () => void;
  markNotificationsAsSeen: () => void;
  markChatsAsSeen: () => void;
}

const UnseenCountsContext = createContext<UnseenCountsContextType | undefined>(undefined);

export function UnseenCountsProvider({ children }: { children: React.ReactNode }) {
  const [unseenCounts, setUnseenCounts] = useState<UnseenCounts>({
    notifications: 0,
    chats: 0
  });

  const { user } = useAuth();

  // Fetch unseen notification count
  const { data: notificationsData, refetch: refetchNotifications, error: notificationsError } = useQuery({
    queryKey: ['/api/notifications/unseen-count'],
    queryFn: () => apiRequest('GET', '/api/notifications/unseen-count'),
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!user, // Only fetch if user is authenticated
  });

  // Fetch unseen chat count
  const { data: chatsData, refetch: refetchChats, error: chatsError } = useQuery({
    queryKey: ['/api/chat/unseen-count'],
    queryFn: () => apiRequest('GET', '/api/chat/unseen-count'),
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!user, // Only fetch if user is authenticated
  });

  // Debug logging
  useEffect(() => {
    console.log('UnseenCountsContext - User:', user);
    console.log('UnseenCountsContext - Notifications data:', notificationsData);
    console.log('UnseenCountsContext - Notifications error:', notificationsError);
    console.log('UnseenCountsContext - Chats data:', chatsData);
    console.log('UnseenCountsContext - Chats error:', chatsError);
  }, [user, notificationsData, notificationsError, chatsData, chatsError]);

  // Update unseen counts when data changes
  useEffect(() => {
    if (notificationsData) {
      setUnseenCounts(prev => ({
        ...prev,
        notifications: notificationsData.count || 0
      }));
    }
  }, [notificationsData]);

  useEffect(() => {
    if (chatsData) {
      setUnseenCounts(prev => ({
        ...prev,
        chats: chatsData.count || 0
      }));
    }
  }, [chatsData]);

  const refetchUnseenCounts = () => {
    refetchNotifications();
    refetchChats();
  };

  const markNotificationsAsSeen = () => {
    setUnseenCounts(prev => ({
      ...prev,
      notifications: 0
    }));
  };

  const markChatsAsSeen = () => {
    setUnseenCounts(prev => ({
      ...prev,
      chats: 0
    }));
  };

  return (
    <UnseenCountsContext.Provider
      value={{
        unseenCounts,
        refetchUnseenCounts,
        markNotificationsAsSeen,
        markChatsAsSeen
      }}
    >
      {children}
    </UnseenCountsContext.Provider>
  );
}

export function useUnseenCounts() {
  const context = useContext(UnseenCountsContext);
  if (context === undefined) {
    throw new Error('useUnseenCounts must be used within an UnseenCountsProvider');
  }
  return context;
}
import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  connectionError: string | null;
  send: (message: WebSocketMessage) => boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('Handling WebSocket message:', message.type);

    switch (message.type) {
      case 'connected':
        console.log('WebSocket connection confirmed');
        break;

      case 'notification':
        handleNotification(message.payload);
        break;

      case 'inquiry':
        handleInquiryUpdate(message.payload);
        break;

      case 'order':
        handleOrderUpdate(message.payload);
        break;

      case 'message':
        handleChatMessage(message.payload);
        break;

      case 'rfq':
        handleRFQUpdate(message.payload);
        break;

      case 'auction':
        handleAuctionUpdate(message.payload);
        break;

      case 'quotation':
        handleQuotationUpdate(message.payload);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [queryClient]);

  const handleNotification = (payload: any) => {
    const { title, message, type = 'info' } = payload;
    
    switch (type) {
      case 'success':
        toast.success(`${title}: ${message}`);
        break;
      case 'error':
        toast.error(`${title}: ${message}`);
        break;
      case 'warning':
        toast(`${title}: ${message}`, { icon: '⚠️' });
        break;
      default:
        toast(`${title}: ${message}`);
    }

    // Invalidate notifications query to refresh the list
    queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
  };

  const handleInquiryUpdate = (payload: any) => {
    const { action, inquiry } = payload;
    
    if (action === 'new') {
      toast.success('New inquiry received!');
    } else if (action === 'updated') {
      toast('Inquiry updated');
    }

    // Invalidate inquiries queries
    queryClient.invalidateQueries({ queryKey: ['/api/suppliers/inquiries'] });
    queryClient.invalidateQueries({ queryKey: ['/api/suppliers/dashboard/stats'] });
  };

  const handleOrderUpdate = (payload: any) => {
    const { action, order } = payload;
    
    if (action === 'new') {
      toast.success(`New order received: #${order.id}`);
    } else if (action === 'status_changed') {
      toast(`Order #${order.id} status updated to ${order.status}`);
    }

    // Invalidate orders queries
    queryClient.invalidateQueries({ queryKey: ['/api/suppliers/orders'] });
    queryClient.invalidateQueries({ queryKey: ['/api/suppliers/dashboard/stats'] });
  };

  const handleChatMessage = (payload: any) => {
    const { conversationId, sender } = payload;
    
    // Show notification for new message
    toast(`New message from ${sender.name}`);

    // Invalidate chat queries
    queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
    queryClient.invalidateQueries({ 
      queryKey: [`/api/chat/conversations/${conversationId}/messages`] 
    });
    queryClient.invalidateQueries({ queryKey: ['/api/chat/unread-count'] });
  };

  const handleRFQUpdate = (payload: any) => {
    const { action, rfq } = payload;
    
    if (action === 'new') {
      toast.success('New RFQ matching your products!');
    } else if (action === 'updated') {
      toast('RFQ updated');
    }

    // Invalidate RFQ queries
    queryClient.invalidateQueries({ queryKey: ['/api/suppliers/rfqs'] });
  };

  const handleAuctionUpdate = (payload: any) => {
    const { action, auction } = payload;
    
    if (action === 'new_bid') {
      toast('New bid placed on auction');
    } else if (action === 'outbid') {
      toast.error('You have been outbid!', { duration: 5000 });
    } else if (action === 'won') {
      toast.success('Congratulations! You won the auction!');
    }

    // Invalidate auction queries
    queryClient.invalidateQueries({ queryKey: ['/api/suppliers/auctions'] });
  };

  const handleQuotationUpdate = (payload: any) => {
    const { action, quotation } = payload;
    
    if (action === 'accepted') {
      toast.success(`Quotation #${quotation.id} accepted!`);
    } else if (action === 'rejected') {
      toast.error(`Quotation #${quotation.id} rejected`);
    } else if (action === 'expired') {
      toast(`Quotation #${quotation.id} expired`, { icon: '⏰' });
    }

    // Invalidate quotation queries
    queryClient.invalidateQueries({ queryKey: ['/api/suppliers/quotations'] });
    queryClient.invalidateQueries({ queryKey: ['/api/suppliers/dashboard/stats'] });
  };

  const { isConnected, connectionError, send } = useWebSocket({
    onMessage: handleMessage,
    onConnect: () => {
      console.log('WebSocket connected successfully');
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
    }
  });

  return (
    <WebSocketContext.Provider value={{ isConnected, connectionError, send }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }
  return context;
}

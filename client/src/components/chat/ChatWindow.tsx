import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, 
  Phone, 
  Video, 
  MoreVertical,
  ArrowLeft,
  RefreshCw,
  Bot,
  Shield,
  User,
  Circle,
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { useToast } from '@/hooks/use-toast';
import { useWebSocketNotifications } from '@/hooks/useWebSocketNotifications';

interface ChatWindowProps {
  conversationId: string;
  userRole: 'buyer' | 'supplier' | 'admin';
  userId: string;
  onClose?: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  className?: string;
}

interface Conversation {
  id: string;
  type: string;
  subject?: string;
  status: string;
  lastMessageAt: string;
  buyerId?: string;
  supplierId?: string;
  adminId?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerCompany?: string;
  supplierName?: string;
  supplierEmail?: string;
  supplierCompany?: string;
  adminName?: string;
  adminEmail?: string;
  productId?: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'buyer' | 'supplier' | 'admin';
  message: string;
  attachments?: string[];
  productReferences?: string[];
  isRead: boolean;
  createdAt: string;
}

export default function ChatWindow({ 
  conversationId, 
  userRole, 
  userId, 
  onClose, 
  onMinimize,
  isMinimized = false,
  className = ""
}: ChatWindowProps) {
  const [otherUserStatus, setOtherUserStatus] = useState<{ isOnline: boolean; lastSeen: Date | null } | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // WebSocket connection for real-time updates
  const { isConnected, sendTypingIndicator } = useWebSocketNotifications({
    userId,
    enabled: true
  });

  // Fetch conversation details
  const { data: conversationData, isLoading: conversationLoading } = useQuery({
    queryKey: ['/api/chat/conversations', conversationId],
    queryFn: () => apiRequest('GET', `/api/chat/conversations/${conversationId}`),
    enabled: !!conversationId,
  });

  // Fetch messages for conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/chat/conversations', conversationId, 'messages'],
    queryFn: () => apiRequest('GET', `/api/chat/conversations/${conversationId}/messages`),
    enabled: !!conversationId,
    refetchInterval: isConnected ? 30000 : 5000, // Poll less frequently when WebSocket is connected
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { content: string; messageType?: string; attachments?: any[] }) =>
      apiRequest('POST', `/api/chat/conversations/${conversationId}/messages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', conversationId, 'messages'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest('PATCH', `/api/chat/conversations/${conversationId}/read`),
  });

  const conversation = conversationData as Conversation;
  const messages = (messagesData as any)?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversationId && !isMinimized) {
      markAsReadMutation.mutate();
    }
  }, [conversationId, isMinimized]);

  // Fetch other user's online status
  useEffect(() => {
    if (!conversation) {
      setOtherUserStatus(null);
      return;
    }

    let otherUserId: string | undefined;
    
    if (userRole === 'buyer') {
      otherUserId = conversation.supplierId || conversation.adminId;
    } else if (userRole === 'supplier') {
      otherUserId = conversation.buyerId || conversation.adminId;
    } else if (userRole === 'admin') {
      otherUserId = conversation.buyerId || conversation.supplierId;
    }

    if (!otherUserId) return;

    const fetchUserStatus = async () => {
      try {
        const status = await apiRequest('GET', `/api/chat/user/${otherUserId}/status`);
        setOtherUserStatus(status);
      } catch (error) {
        console.error('Error fetching user status:', error);
      }
    };

    fetchUserStatus();

    // Poll for status updates every 30 seconds
    const interval = setInterval(fetchUserStatus, 30000);

    return () => clearInterval(interval);
  }, [conversation, userRole]);

  const handleSendMessage = (content: string, attachments?: any[], productReferences?: string[]) => {
    if (!conversationId) return;

    sendMessageMutation.mutate({
      content,
      messageType: 'text',
      attachments,
      productReferences
    });
  };

  const handleSendImage = (file: File) => {
    if (!conversationId) return;

    // Convert file to base64 for demo - in real app, upload to server first
    const reader = new FileReader();
    reader.onload = () => {
      const attachment = {
        name: file.name,
        type: 'image',
        url: reader.result,
        size: file.size
      };

      sendMessageMutation.mutate({
        content: '',
        messageType: 'image',
        attachments: [attachment]
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageClick = (imageUrl: string) => {
    // Open image in new tab or modal
    window.open(imageUrl, '_blank');
  };

  const getConversationTitle = () => {
    if (!conversation) return 'Chat';
    
    if (userRole === 'buyer') {
      if (conversation.type === 'buyer_supplier') {
        return conversation.supplierName || conversation.supplierEmail || 'Supplier';
      } else {
        return conversation.adminName || conversation.adminEmail || 'Support Team';
      }
    } else if (userRole === 'supplier') {
      if (conversation.type === 'buyer_supplier') {
        return conversation.buyerName || conversation.buyerEmail || 'Customer';
      } else {
        return conversation.adminName || conversation.adminEmail || 'Support Team';
      }
    } else if (userRole === 'admin') {
      if (conversation.type === 'buyer_supplier') {
        return 'Buyer-Supplier Chat';
      } else if (conversation.type === 'buyer_admin') {
        return conversation.buyerName || conversation.buyerEmail || 'Customer';
      } else {
        return conversation.supplierName || conversation.supplierEmail || 'Supplier';
      }
    }
    
    return 'Chat';
  };

  const getConversationSubtitle = () => {
    if (!conversation) return '';
    
    let subtitle = '';
    if (userRole === 'buyer') {
      if (conversation.type === 'buyer_supplier') {
        subtitle = conversation.supplierCompany || 'Supplier';
      } else {
        subtitle = 'Support Team';
      }
    } else if (userRole === 'supplier') {
      if (conversation.type === 'buyer_supplier') {
        subtitle = conversation.buyerCompany || 'Customer';
      } else {
        subtitle = 'Support Team';
      }
    } else if (userRole === 'admin') {
      if (conversation.type === 'buyer_admin') {
        subtitle = conversation.buyerCompany || 'Customer Support';
      } else if (conversation.type === 'supplier_admin') {
        subtitle = conversation.supplierCompany || 'Supplier Support';
      } else {
        subtitle = 'Mediation';
      }
    }
    
    if (conversation.productId) {
      subtitle += ` • Product Inquiry`;
    }
    
    return subtitle;
  };

  const formatLastSeen = (lastSeen: Date | null) => {
    if (!lastSeen) return '';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return lastSeenDate.toLocaleDateString();
  };

  const getAvatarIcon = () => {
    if (userRole === 'buyer') {
      if (conversation?.type === 'buyer_supplier') {
        return <User className="h-6 w-6 text-white" />;
      } else {
        return <Shield className="h-6 w-6 text-white" />;
      }
    } else if (userRole === 'supplier') {
      if (conversation?.type === 'buyer_supplier') {
        return <User className="h-6 w-6 text-white" />;
      } else {
        return <Shield className="h-6 w-6 text-white" />;
      }
    } else {
      return <User className="h-6 w-6 text-white" />;
    }
  };

  if (conversationLoading) {
    return (
      <Card className={`flex flex-col h-full ${className}`}>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </Card>
    );
  }

  if (isMinimized) {
    return (
      <Card className={`w-80 h-12 ${className}`}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              {getAvatarIcon()}
            </div>
            <span className="text-sm font-medium truncate">
              {getConversationTitle()}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className="h-6 w-6 p-0"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <CardHeader className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  {getAvatarIcon()}
                </div>
                {/* Online/Offline Status Indicator */}
                {otherUserStatus && (
                  <div className="absolute bottom-0 right-0">
                    <Circle 
                      className={`h-3 w-3 ${
                        otherUserStatus.isOnline 
                          ? 'fill-green-500 text-green-500' 
                          : 'fill-gray-400 text-gray-400'
                      } border-2 border-white rounded-full`}
                    />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getConversationTitle()}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">
                    {getConversationSubtitle()}
                  </p>
                  {otherUserStatus && (
                    <span className="text-xs text-gray-500">
                      {otherUserStatus.isOnline 
                        ? '• Online' 
                        : `• Last seen ${formatLastSeen(otherUserStatus.lastSeen)}`
                      }
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {conversation?.productId && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                Product Inquiry
              </Badge>
            )}
            <Badge variant="secondary" className="capitalize bg-green-100 text-green-800">
              {conversation?.status || 'active'}
            </Badge>
            
            <div className="flex items-center space-x-1">
              {onMinimize && (
                <Button variant="ghost" size="sm" onClick={onMinimize} className="h-8 w-8 p-0">
                  <Minimize2 className="h-4 w-4 text-gray-600" />
                </Button>
              )}
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                  <X className="h-4 w-4 text-gray-600" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-50">
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No messages yet
            </h3>
            <p className="text-gray-500">
              Start the conversation by sending a message below.
            </p>
          </div>
        ) : (
          messages.map((message: Message) => {
            // Determine if message is from current user
            const isOwn = message.senderId === userId;
            
            return (
              <ChatMessage
                key={message.id}
                message={{
                  id: message.id,
                  content: message.message,
                  messageType: 'text',
                  attachments: message.attachments ? message.attachments.map(url => ({ url, type: 'image' })) : [],
                  senderType: message.senderType,
                  createdAt: message.createdAt,
                  isRead: message.isRead
                }}
                isOwn={isOwn}
                onImageClick={handleImageClick}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Chat Input */}
      <div className="border-t border-gray-200">
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendImage={handleSendImage}
          onTyping={(typing) => sendTypingIndicator(conversationId, typing)}
          disabled={sendMessageMutation.isPending}
          placeholder={`Message ${getConversationTitle()}...`}
          showProductReference={conversation?.type === 'buyer_supplier'}
        />
      </div>
    </Card>
  );
}
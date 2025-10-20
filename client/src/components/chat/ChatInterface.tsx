import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Circle
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ConversationList from './ConversationList';
import { useToast } from '@/hooks/use-toast';

interface ChatInterfaceProps {
  userRole: 'buyer' | 'admin';
  userId: string;
}

export default function ChatInterface({ userRole, userId }: ChatInterfaceProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConversationList, setShowConversationList] = useState(userRole === 'admin');
  const [otherUserStatus, setOtherUserStatus] = useState<{ isOnline: boolean; lastSeen: Date | null } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/chat/conversations'],
    queryFn: () => apiRequest('GET', '/api/chat/conversations'),
  });

  // Fetch messages for selected conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/chat/conversations', selectedConversationId, 'messages'],
    queryFn: () => apiRequest('GET', `/api/chat/conversations/${selectedConversationId}/messages`),
    enabled: !!selectedConversationId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { content: string; messageType?: string; attachments?: any[] }) =>
      apiRequest('POST', `/api/chat/conversations/${selectedConversationId}/messages`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversationId, 'messages'] });
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: () =>
      apiRequest('PATCH', `/api/chat/conversations/${selectedConversationId}/read`),
  });

  // Update user online status mutation
  const updateOnlineStatusMutation = useMutation({
    mutationFn: (isOnline: boolean) =>
      apiRequest('POST', '/api/chat/user/status', { isOnline }),
  });

  const conversations = Array.isArray(conversationsData) ? conversationsData : (conversationsData as any)?.conversations || [];
  const messages = (messagesData as any)?.messages || [];
  const selectedConversation = conversations.find((c: any) => c.id === selectedConversationId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      markAsReadMutation.mutate();
    }
  }, [selectedConversationId]);

  // Set user as online when component mounts, offline when unmounts
  useEffect(() => {
    updateOnlineStatusMutation.mutate(true);
    
    // Set user as offline on unmount or page unload
    const handleUnload = () => {
      // Use navigator.sendBeacon for reliable status update on page unload
      const data = JSON.stringify({ isOnline: false });
      navigator.sendBeacon('/api/chat/user/status', data);
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      updateOnlineStatusMutation.mutate(false);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // Fetch other user's online status when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setOtherUserStatus(null);
      return;
    }

    const otherUserId = userRole === 'buyer' 
      ? selectedConversation.unreadCountAdmin 
      : selectedConversation.buyerId;

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
  }, [selectedConversation, userRole]);

  // Update user activity timestamp periodically
  useEffect(() => {
    const activityInterval = setInterval(() => {
      updateOnlineStatusMutation.mutate(true);
    }, 60000); // Update every minute

    return () => clearInterval(activityInterval);
  }, []);

  const handleSendMessage = (content: string, attachments?: any[]) => {
    if (!selectedConversationId) return;

    sendMessageMutation.mutate({
      content,
      messageType: 'text',
      attachments
    });
  };

  const handleSendImage = (file: File) => {
    if (!selectedConversationId) return;

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

  const handleCreateConversation = () => {
    // This would open a modal to select admin or create new conversation
    toast({
      title: "Create Conversation",
      description: "Feature coming soon! This will allow you to start a new chat with our support team.",
    });
  };

  const getConversationTitle = () => {
    if (!selectedConversation) return 'Select a conversation';
    
    if (userRole === 'buyer') {
      return selectedConversation.adminName || selectedConversation.adminEmail || 'Support Team';
    } else {
      return selectedConversation.buyerName || selectedConversation.buyerEmail || 'Customer';
    }
  };

  const getConversationSubtitle = () => {
    if (!selectedConversation) return '';
    
    let subtitle = '';
    if (userRole === 'buyer') {
      subtitle = selectedConversation.adminCompany || 'Support Team';
    } else {
      subtitle = selectedConversation.buyerCompany || 'Customer';
    }
    
    if (selectedConversation.productId) {
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

  return (
    <div className="flex h-full bg-gray-50 w-full">
      {/* Conversation List */}
      {showConversationList && (
        <ConversationList
          conversations={conversations}
          selectedConversationId={selectedConversationId || undefined}
          onSelectConversation={setSelectedConversationId}
          onCreateConversation={userRole === 'buyer' ? handleCreateConversation : undefined}
          userRole={userRole}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConversationList(!showConversationList)}
                    className={userRole === 'admin' ? '' : 'lg:hidden'}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        {userRole === 'buyer' ? (
                          <Shield className="h-6 w-6 text-white" />
                        ) : (
                          <User className="h-6 w-6 text-white" />
                        )}
                      </div>
                      {/* Online/Offline Status Indicator */}
                      {otherUserStatus && (
                        <div className="absolute bottom-0 right-0">
                          <Circle 
                            className={`h-4 w-4 ${
                              otherUserStatus.isOnline 
                                ? 'fill-green-500 text-green-500' 
                                : 'fill-gray-400 text-gray-400'
                            } border-2 border-white rounded-full`}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {getConversationTitle()}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600 font-medium">
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

                <div className="flex items-center space-x-3">
                  {selectedConversation?.productId && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Product Inquiry
                    </Badge>
                  )}
                  <Badge variant="secondary" className="capitalize bg-green-100 text-green-800">
                    {selectedConversation?.status || 'active'}
                  </Badge>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-blue-50 rounded-full">
                      <Phone className="h-5 w-5 text-gray-600" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-blue-50 rounded-full">
                      <Video className="h-5 w-5 text-gray-600" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-10 w-10 p-0 hover:bg-gray-50 rounded-full">
                      <MoreVertical className="h-5 w-5 text-gray-600" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
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
                messages.map((message: any) => {
                  // Use the senderType from the server (already processed)
                  const isFromAdmin = message.senderType === 'admin';
                  const isOwn = userRole === 'admin' ? isFromAdmin : !isFromAdmin;
                  
                  return (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isOwn={isOwn}
                      onImageClick={handleImageClick}
                    />
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <ChatInput
              onSendMessage={handleSendMessage}
              onSendImage={handleSendImage}
              disabled={sendMessageMutation.isPending}
              placeholder={`Message ${getConversationTitle()}...`}
            />
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {userRole === 'buyer' ? 'Welcome to Support Chat' : 'Customer Support Center'}
              </h3>
              <p className="text-gray-500 mb-6">
                {userRole === 'buyer' 
                  ? 'Select a conversation or start a new chat with our support team.'
                  : 'Select a customer conversation to start helping.'
                }
              </p>
              {!showConversationList && (
                <Button
                  onClick={() => setShowConversationList(true)}
                  variant="outline"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {userRole === 'buyer' ? 'View Support Chats' : 'View Customer Chats'}
                </Button>
              )}
              {userRole === 'buyer' && (
                <Button onClick={handleCreateConversation} size="lg">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Start New Chat
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
  Search,
  Filter,
  Archive,
  Star,
  Clock
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ConversationList from './ConversationList';
import { useToast } from '@/hooks/use-toast';

interface AdminChatInterfaceProps {
  userId: string;
}

export default function AdminChatInterface({ userId }: AdminChatInterfaceProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations for admin
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/chat/conversations/admin/all'],
    queryFn: () => apiRequest('GET', '/api/chat/conversations/admin/all'),
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
    window.open(imageUrl, '_blank');
  };

  const getConversationTitle = () => {
    if (!selectedConversation) return 'Select a customer';
    
    return selectedConversation.buyerName || selectedConversation.buyerEmail || 'Customer';
  };

  const getConversationSubtitle = () => {
    if (!selectedConversation) return '';
    
    let subtitle = selectedConversation.buyerCompany || 'Customer';
    
    if (selectedConversation.productId) {
      subtitle += ` • Product Inquiry`;
    }
    
    return subtitle;
  };

  // Filter conversations based on search and status
  const filteredConversations = conversations.filter((conv: any) => {
    const matchesSearch = !searchQuery || 
      conv.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.buyerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.productId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-full bg-gray-50 w-full">
      {/* Conversation List */}
      {showConversationList && (
        <div className="w-[450px] bg-white border-r border-gray-200 flex flex-col h-full shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Customer Chats</h2>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search customers, products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <MessageCircle className="h-12 w-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No conversations yet
                </h3>
                <p className="text-gray-500 text-sm">
                  Customer conversations will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {filteredConversations.map((conversation: any) => (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-0 ${
                      selectedConversationId === conversation.id
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-md'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedConversationId(conversation.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                            <User className="h-6 w-6 text-white" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {conversation.buyerName || conversation.buyerEmail || 'Customer'}
                            </h4>
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              {conversation.unreadCount && conversation.unreadCount > 0 && (
                                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-1">
                            {conversation.subject || 'No messages yet'}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleTimeString() : ''}
                            </span>
                            {conversation.productId && (
                              <Badge variant="outline" className="text-xs">
                                Product
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConversationList(!showConversationList)}
                    className="h-10 w-10 p-0 hover:bg-gray-100 rounded-full"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {getConversationTitle()}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">
                        {getConversationSubtitle()}
                      </p>
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
                  const isOwn = isFromAdmin; // Admin's own messages
                  
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
                Customer Support Center
              </h3>
              <p className="text-gray-500 mb-6">
                Select a customer conversation to start helping.
              </p>
              {!showConversationList && (
                <Button
                  onClick={() => setShowConversationList(true)}
                  variant="outline"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  View Customer Chats
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

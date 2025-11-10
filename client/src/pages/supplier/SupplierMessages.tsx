import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Search, 
  Filter,
  User,
  Clock,
  CheckCircle,
  Package,
  Send,
  Loader2,
  Mail,
  MailOpen,
  Circle,
  CheckCheck,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SupplierMessages() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'active'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'unread' | 'name'>('recent');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations with improved polling
  const { data: conversationsData, isLoading: isLoadingConversations } = useQuery({
    queryKey: ['/api/chat/conversations'],
    queryFn: () => apiRequest('GET', '/api/chat/conversations'),
    refetchInterval: 3000, // Poll every 3 seconds for real-time updates
    refetchIntervalInBackground: true,
  });

  const conversations = conversationsData?.conversations || [];

  // Fetch messages for selected conversation with improved polling
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/chat/messages', selectedConversation],
    queryFn: async () => {
      if (!selectedConversation) return { messages: [] };
      return await apiRequest('GET', `/api/chat/conversations/${selectedConversation}/messages`);
    },
    enabled: !!selectedConversation,
    refetchInterval: 2000, // Poll every 2 seconds for active conversation
    refetchIntervalInBackground: true,
  });

  const messages = messagesData?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, attachments }: { 
      conversationId: string; 
      content: string;
      attachments?: any[];
    }) => {
      return await apiRequest('POST', `/api/chat/conversations/${conversationId}/messages`, {
        content,
        messageType: 'text',
        attachments
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages', selectedConversation] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setIsTyping(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return await apiRequest('PATCH', `/api/chat/conversations/${conversationId}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
    }
  });

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    markAsReadMutation.mutate(conversationId);
  };

  const handleSendMessage = (content: string, attachments?: any[]) => {
    if (!selectedConversation) return;
    sendMessageMutation.mutate({ conversationId: selectedConversation, content, attachments });
  };

  const handleTyping = () => {
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to clear typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  // Filter and sort conversations
  const filteredConversations = conversations
    .filter((conv: any) => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesBuyer = conv.buyerName?.toLowerCase().includes(query) || 
                            conv.buyerEmail?.toLowerCase().includes(query) ||
                            conv.buyerCompany?.toLowerCase().includes(query);
        const matchesProduct = conv.productName?.toLowerCase().includes(query);
        const matchesSubject = conv.subject?.toLowerCase().includes(query);
        
        if (!matchesBuyer && !matchesProduct && !matchesSubject) {
          return false;
        }
      }

      // Filter by status
      if (filterStatus === 'unread' && (!conv.unreadCountSupplier || conv.unreadCountSupplier === 0)) {
        return false;
      }
      if (filterStatus === 'active' && conv.status !== 'active') {
        return false;
      }

      return true;
    })
    .sort((a: any, b: any) => {
      // Sort conversations
      switch (sortBy) {
        case 'unread':
          return (b.unreadCountSupplier || 0) - (a.unreadCountSupplier || 0);
        case 'name':
          return (a.buyerName || '').localeCompare(b.buyerName || '');
        case 'recent':
        default:
          return new Date(b.lastMessageAt || b.createdAt).getTime() - 
                 new Date(a.lastMessageAt || a.createdAt).getTime();
      }
    });

  const selectedConv = conversations.find((c: any) => c.id === selectedConversation);

  // Calculate unread count
  const unreadCount = conversations.reduce((acc: number, conv: any) => 
    acc + (conv.unreadCountSupplier || 0), 0
  );

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* Conversations List */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('recent')}>
                  <Clock className="h-4 w-4 mr-2" />
                  Most Recent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('unread')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Unread First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  <User className="h-4 w-4 mr-2" />
                  Name (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)} className="mt-3">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                All
                {conversations.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {conversations.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread
                {unreadCount > 0 && (
                  <Badge className="ml-1 text-xs bg-red-500">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <Mail className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                {searchQuery || filterStatus !== 'all' 
                  ? 'No conversations match your filters' 
                  : 'No conversations yet'}
              </p>
              {(searchQuery || filterStatus !== 'all') && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {filteredConversations.map((conv: any) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedConversation === conv.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          {conv.unreadCountSupplier > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-xs text-white font-bold">
                                {conv.unreadCountSupplier > 9 ? '9+' : conv.unreadCountSupplier}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate ${
                              conv.unreadCountSupplier > 0 ? 'font-bold' : 'font-medium'
                            }`}>
                              {conv.buyerName || conv.buyerEmail || 'Unknown Buyer'}
                            </p>
                          </div>
                          {conv.buyerCompany && (
                            <p className="text-xs text-gray-500 truncate">{conv.buyerCompany}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    {conv.productName && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                        <Package className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{conv.productName}</span>
                      </div>
                    )}
                    <p className={`text-xs truncate ${
                      conv.unreadCountSupplier > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                    }`}>
                      {conv.lastMessage || conv.subject}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {conv.lastMessageAt && formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                      </span>
                      <div className="flex items-center gap-1">
                        {conv.unreadCountSupplier === 0 && (
                          <CheckCheck className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Messages Panel */}
      <Card className="flex-1 flex flex-col">
        {selectedConversation && selectedConv ? (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {selectedConv.buyerName || selectedConv.buyerEmail || 'Unknown Buyer'}
                    </CardTitle>
                    {selectedConv.buyerCompany && (
                      <p className="text-sm text-gray-500">{selectedConv.buyerCompany}</p>
                    )}
                    {selectedConv.productName && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                        <Package className="h-3 w-3" />
                        <span>{selectedConv.productName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 p-4">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start the conversation</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message: any) => (
                      <ChatMessage
                        key={message.id}
                        message={message}
                        isOwn={message.senderId === user?.id}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>
              {isTyping && (
                <div className="px-4 py-2 border-t bg-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="flex gap-1">
                      <Circle className="h-2 w-2 fill-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <Circle className="h-2 w-2 fill-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <Circle className="h-2 w-2 fill-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Typing...</span>
                  </div>
                </div>
              )}
              <div className="border-t">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  disabled={sendMessageMutation.isPending}
                  placeholder="Type your message..."
                />
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-sm text-gray-500">
                Choose a conversation from the list to view messages
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

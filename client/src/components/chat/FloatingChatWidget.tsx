import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2,
  Send,
  Loader2,
  User,
  Shield,
  Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { apiRequest } from '@/lib/queryClient';

interface FloatingChatWidgetProps {
  supplierId?: string;
  supplierName?: string;
  productId?: string;
  productName?: string;
  position?: 'bottom-right' | 'bottom-left';
}

export default function FloatingChatWidget({
  supplierId,
  supplierName,
  productId,
  productName,
  position = 'bottom-right'
}: FloatingChatWidgetProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Get or create conversation
  const { data: conversationData, isLoading: isLoadingConversation } = useQuery({
    queryKey: ['/api/chat/conversation', supplierId, productId],
    queryFn: async () => {
      if (!user) return null;
      
      // Try to find existing conversation
      const conversations = await apiRequest('GET', '/api/chat/conversations');
      const existing = conversations.conversations?.find((c: any) => 
        c.supplierId === supplierId && 
        (productId ? c.productId === productId : true)
      );
      
      if (existing) {
        return existing;
      }
      
      // Create new conversation
      return await apiRequest('POST', '/api/chat/conversations', {
        supplierId,
        productId,
        subject: productName 
          ? `Inquiry about ${productName}` 
          : `Chat with ${supplierName || 'Supplier'}`
      });
    },
    enabled: isOpen && !!user && !!supplierId,
  });

  // Get messages
  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/chat/messages', conversationData?.id],
    queryFn: async () => {
      if (!conversationData?.id) return { messages: [] };
      return await apiRequest('GET', `/api/chat/conversations/${conversationData.id}/messages`);
    },
    enabled: !!conversationData?.id,
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const messages = messagesData?.messages || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationData?.id) throw new Error('No conversation');
      return await apiRequest('POST', `/api/chat/conversations/${conversationData.id}/messages`, {
        content,
        messageType: 'text'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages', conversationData?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Update conversation ID
  useEffect(() => {
    if (conversationData?.id) {
      setConversationId(conversationData.id);
    }
  }, [conversationData]);

  const handleSendMessage = (content: string) => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to send messages",
        variant: "destructive"
      });
      return;
    }
    sendMessageMutation.mutate(content);
  };

  const handleToggle = () => {
    if (!user) {
      toast({
        title: "Please Sign In",
        description: "You need to be signed in to chat",
        variant: "destructive"
      });
      return;
    }
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  const positionClasses = position === 'bottom-right' 
    ? 'right-6 bottom-6' 
    : 'left-6 bottom-6';

  if (!supplierId) return null;

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      {/* Chat Button */}
      {!isOpen && (
        <Button
          onClick={handleToggle}
          className="h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {/* Unread badge */}
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-xs">
            0
          </Badge>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`w-96 shadow-2xl transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[600px]'} flex flex-col`}>
          {/* Header */}
          <CardHeader className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  {user?.role === 'supplier' ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <Building2 className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {supplierName || 'Supplier'}
                  </CardTitle>
                  {productName && (
                    <p className="text-xs text-blue-100 truncate max-w-[200px]">
                      {productName}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          {!isMinimized && (
            <>
              <CardContent className="flex-1 p-0 overflow-hidden">
                {isLoadingConversation || isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <ScrollArea className="h-full p-4" ref={scrollRef}>
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <MessageCircle className="h-12 w-12 text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500 mb-2">No messages yet</p>
                        <p className="text-xs text-gray-400">
                          Start a conversation with {supplierName || 'the supplier'}
                        </p>
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
                      </div>
                    )}
                  </ScrollArea>
                )}
              </CardContent>

              {/* Input */}
              <div className="border-t">
                <ChatInput
                  onSendMessage={handleSendMessage}
                  disabled={sendMessageMutation.isPending || isLoadingConversation}
                  placeholder={`Message ${supplierName || 'supplier'}...`}
                />
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

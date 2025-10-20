import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Send, X, ArrowUp, ShoppingCart, Search, MoreVertical, Phone, Video, Calendar, Paperclip, Smile, Wand2, Package, Building, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useProduct } from '@/contexts/ProductContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';

interface GlobalChatButtonProps {
  className?: string;
}

interface Conversation {
  id: string;
  buyerId: string;
  adminId: string;
  subject: string;
  lastMessage?: string | null;
  lastMessageAt: Date | null;
  unreadCountBuyer: number | null;
  unreadCountSupplier: number | null;
  productId: string | null;
  createdAt: Date | null;
  adminName?: string;
  adminEmail?: string;
  adminCompany?: string;
  productName?: string | null;
  productImages?: string[] | null;
  product?: {
    id: string;
    name: string;
    images: string[];
    priceRanges?: any;
  };
}

export default function GlobalChatButton({ className = '' }: GlobalChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConversationList, setShowConversationList] = useState(false);
  const [message, setMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationError, setConversationError] = useState<Error | null>(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { currentProduct } = useProduct();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get conversations for the user
  const { data: conversationsData } = useQuery({
    queryKey: ['/api/chat/conversations/buyer', user?.id],
    queryFn: () => apiRequest('GET', `/api/chat/conversations/buyer/${user?.id}`),
    enabled: !!user?.id,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const conversations = Array.isArray(conversationsData) ? conversationsData : [];

  // Get messages for the current conversation
  const { data: messagesData } = useQuery({
    queryKey: ['/api/chat/conversations', conversationId, 'messages'],
    queryFn: () => apiRequest('GET', `/api/chat/conversations/${conversationId}/messages`),
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll every 5 seconds for real-time feel
  });

  const messages = (messagesData as any)?.messages || [];
  
  // Debug logging
  console.log('=== CHAT DEBUG ===');
  console.log('Conversations data:', conversationsData);
  console.log('Conversations:', conversations);
  console.log('Conversation ID:', conversationId);
  console.log('Messages data:', messagesData);
  console.log('Messages:', messages);
  console.log('==================');

  // Get unread count
  const { data: unreadData } = useQuery({
    queryKey: ['/api/chat/unread-count', user?.id],
    queryFn: () => apiRequest('GET', `/api/chat/unread-count/${user?.id}`),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const unreadCount = (unreadData as any)?.count || 0;

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const productId = currentProduct?.id;
      const productName = currentProduct?.name;

      // Create new conversation if productId is provided
      if (productId) {
        const createResponse = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            buyerId: user.id,
            adminId: 'admin',
            subject: `Inquiry about ${productName || 'Product'}`,
            productId: productId,
          }),
        });
        
        if (!createResponse.ok) {
          let errorMessage = 'Failed to create conversation';
          try {
            const errorData = await createResponse.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch (jsonError) {
            const errorText = await createResponse.text();
            console.error('Non-JSON error response:', errorText);
            errorMessage = `Server error: ${createResponse.status} ${createResponse.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        let newConversation;
        try {
          newConversation = await createResponse.json();
        } catch (jsonError) {
          console.error('Failed to parse conversation response as JSON:', jsonError);
          throw new Error('Invalid response from server');
        }
        setConversationId(newConversation.id);
        return newConversation;
      }
      
      // If no product, find existing conversation or create general one
      const existingConversation = conversations.find((conv: any) => !conv.productId);
      if (existingConversation) {
        setConversationId(existingConversation.id);
        return existingConversation;
      }

      // Create general conversation
      const createResponse = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          buyerId: user.id,
          adminId: 'admin',
          subject: 'General Inquiry',
        }),
      });
      
      if (!createResponse.ok) {
        let errorMessage = 'Failed to create conversation';
        try {
          const errorData = await createResponse.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (jsonError) {
          const errorText = await createResponse.text();
          console.error('Non-JSON error response:', errorText);
          errorMessage = `Server error: ${createResponse.status} ${createResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      let newConversation;
      try {
        newConversation = await createResponse.json();
      } catch (jsonError) {
        console.error('Failed to parse conversation response as JSON:', jsonError);
        throw new Error('Invalid response from server');
      }
      setConversationId(newConversation.id);
      return newConversation;
    },
    onSuccess: (newConversation) => {
      setConversationError(null);
      setConversationLoading(false);
      setConversationId(newConversation.id);
      setShowConversationList(false);
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations/buyer', user?.id] });
    },
    onError: (error: Error) => {
      setConversationError(error);
      setConversationLoading(false);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) throw new Error('No conversation selected');
      
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content,
          receiverId: 'admin',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', conversationId, 'messages'] });
    },
  });

  // Handle opening chat
  const handleOpenChat = async () => {
    if (!user) {
      alert('Please log in to use chat');
      return;
    }

    setIsOpen(true);
    setShowConversationList(true);
    setConversationError(null);
    
    // If there are existing conversations, show them
    // If no conversations exist, create a new one
    if (conversations.length === 0) {
      setConversationLoading(true);
      try {
        await createConversationMutation.mutateAsync();
      } catch (error) {
        console.error('Error creating conversation:', error);
      }
    }
  };

  // Handle conversation selection
  const handleConversationSelect = (conversation: Conversation) => {
    setConversationId(conversation.id);
    setShowConversationList(false);
  };

  // Handle sending message
  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message);
  };

  // Handle back to top
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv: Conversation) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.subject?.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.toLowerCase().includes(searchLower) ||
      conv.productId?.toLowerCase().includes(searchLower) ||
      (conv.product && conv.product.name.toLowerCase().includes(searchLower))
    );
  });

  if (!user) {
    return null;
  }

  return (
    <div className={`fixed right-4 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-3 ${className}`}>
      {/* Back to Top Button */}
      <Button
        onClick={handleBackToTop}
        className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white shadow-lg"
        size="icon"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>

      {/* Chat Button */}
      <Button
        onClick={handleOpenChat}
        className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg relative"
        size="icon"
      >
        <MessageCircle className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Shopping Cart Button */}
      <Button
        onClick={() => window.location.href = '/cart'}
        className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 text-white shadow-lg"
        size="icon"
      >
        <ShoppingCart className="h-5 w-5" />
      </Button>

      {/* Chat Interface */}
      {isOpen && (
        <div className="flex" style={{ position: 'absolute', right: '60px', top: '0', zIndex: 10000 }}>
          {/* Conversation List Sidebar */}
          {showConversationList && (
            <Card className="w-80 h-96 flex flex-col bg-white dark:bg-gray-800 shadow-2xl border-0 mr-2">
              {/* Header */}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
                <div className="flex items-center space-x-2">
                  <CardTitle className="text-lg font-semibold">Messenger</CardTitle>
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setIsOpen(false)}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              {/* Search */}
              <div className="p-3 border-b">
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Conversation List */}
              <div className="flex-1 overflow-y-auto">
                {/* Start New Conversation Button */}
                <div className="p-3 border-b">
                  <Button
                    onClick={() => {
                      setConversationLoading(true);
                      createConversationMutation.mutate();
                    }}
                    disabled={conversationLoading}
                    className="w-full"
                    size="sm"
                  >
                    {conversationLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MessageCircle className="h-4 w-4 mr-2" />
                    )}
                    Start New Conversation
                  </Button>
                </div>

                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-sm">No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation: Conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation)}
                      className="p-3 border-b hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                          {conversation.productImages && conversation.productImages.length > 0 ? (
                            <img src={(conversation.productImages[0] || '').startsWith('http') ? conversation.productImages[0] : `/uploads/${conversation.productImages[0]}`} alt={conversation.productName || 'Product'} className="w-full h-full object-cover" />
                          ) : (
                            <MessageCircle className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              Admin Support
                            </p>
                            {conversation.unreadCountBuyer && conversation.unreadCountBuyer > 0 && (
                              <Badge className="bg-red-500 text-white text-xs">
                                {conversation.unreadCountBuyer}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {conversation.subject || conversation.lastMessage || 'No messages yet'}
                          </p>
                          {conversation.productId && (
                            <p className="text-xs text-blue-600 truncate">
                              {conversation.productName || 'Product Inquiry'}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            {conversation.lastMessageAt 
                              ? new Date(conversation.lastMessageAt).toLocaleDateString()
                              : new Date(conversation.createdAt || '').toLocaleDateString()
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {/* Chat Window */}
          <Card className="w-80 h-96 flex flex-col bg-white dark:bg-gray-800 shadow-2xl border-0">
            {/* Header */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowConversationList(true)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <ArrowUp className="h-4 w-4 rotate-90" />
                </Button>
                <div>
                  <CardTitle className="text-lg font-semibold">Admin Support</CardTitle>
                  <p className="text-xs text-gray-500">Local Time: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreVertical className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Product Context */}
            {currentProduct && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Product: {currentProduct.name}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {typeof (currentProduct as any)?.priceRanges === 'string' 
                        ? (currentProduct as any).priceRanges 
                        : 'Contact for price'
                      }
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
              {conversationError ? (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-4">
                    <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm font-medium">Error creating conversation</p>
                    <p className="text-xs text-gray-500 mt-1">{conversationError.message}</p>
                  </div>
                  <Button 
                    onClick={() => window.location.reload()} 
                    size="sm" 
                    variant="outline"
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    Try Again
                  </Button>
                </div>
              ) : conversationLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 text-sm">Setting up conversation...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-sm mb-4">
                    {currentProduct 
                      ? `Start a conversation about ${currentProduct.name}`
                      : "Start a conversation with our support team"
                    }
                  </p>
                  
                  {/* Suggested Questions */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">You may want to ask:</p>
                    <div className="space-y-1">
                      <Button variant="outline" size="sm" className="w-full text-left justify-start">
                        Do you have product specifications?
                      </Button>
                      <Button variant="outline" size="sm" className="w-full text-left justify-start">
                        What is the minimum order quantity?
                      </Button>
                      <Button variant="outline" size="sm" className="w-full text-left justify-start">
                        Can you provide a sample?
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg: any) => {
                  const isOwn = msg.senderType === 'buyer'; // User's own messages
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <p className="text-sm">{msg.content || msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t bg-white dark:bg-gray-800">
              {/* Action Icons */}
              <div className="flex items-center space-x-2 mb-2">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Smile className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    conversationError ? "Error occurred, please try again..." :
                    conversationLoading ? "Setting up conversation..." : 
                    "Please type your message here..."
                  }
                  className="resize-none"
                  rows={2}
                  disabled={sendMessageMutation.isPending || conversationLoading || !!conversationError}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || !message.trim() || conversationLoading || !!conversationError}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
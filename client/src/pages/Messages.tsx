import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Send, 
  Paperclip, 
  Phone, 
  Video,
  MoreVertical,
  MessageSquare,
  Clock,
  CheckCircle,
  CheckCheck,
  User,
  Building,
  Package,
  FileText,
  Image as ImageIcon,
  Download
} from 'lucide-react';

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Conversations from API
  const { data: conversationsResp, isLoading } = useQuery({
    queryKey: ['/api/chat/conversations'],
    queryFn: () => apiRequest('GET', '/api/chat/conversations'),
  });
  const conversations: any[] = Array.isArray(conversationsResp) ? conversationsResp : (conversationsResp as any)?.conversations || [];

  // Messages for selected conversation
  const { data: messagesResp } = useQuery({
    queryKey: ['/api/chat/conversations', selectedConversation?.id, 'messages'],
    queryFn: () => apiRequest('GET', `/api/chat/conversations/${selectedConversation?.id}/messages`),
    enabled: !!selectedConversation?.id,
    refetchInterval: 5000,
  });
  const messages = (messagesResp as any)?.messages || [];

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, attachments }: any) => {
      return apiRequest('POST', `/api/chat/conversations/${conversationId}/messages`, {
        content,
        attachments,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation?.id, 'messages'] });
      setNewMessage('');
    }
  });

  const getTitle = (c: any) => (c.adminName || c.adminEmail || c.buyerName || c.buyerEmail || 'Chat');
  const getCompany = (c: any) => (c.adminCompany || c.buyerCompany || '');
  const getAvatarImage = (c: any) => {
    const img = c.productImages?.[0];
    if (img && img.startsWith('http')) return img;
    if (img) return `/uploads/${img}`;
    return undefined;
  };

  const filteredConversations = conversations.filter((conversation: any) => {
    const q = searchQuery.toLowerCase();
    return getTitle(conversation).toLowerCase().includes(q) ||
           getCompany(conversation).toLowerCase().includes(q) ||
           (conversation.productName?.toLowerCase() || '').includes(q);
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return Clock;
      case 'delivered': return CheckCircle;
      case 'read': return CheckCheck;
      default: return Clock;
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: newMessage,
      attachments: []
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      <main className="flex-1 overflow-hidden">
        {/* Hero Section with Gradient */}
        <section className="relative py-12 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-white">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
                <MessageSquare className="w-4 h-4" />
                <span>Business Communication</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold mb-4">
                Messages
              </h1>
              
              <p className="text-lg text-white/90 max-w-2xl mx-auto">
                Communicate with admins and manage your business conversations
              </p>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[75vh]">
            {/* Conversations List */}
            <Card className="lg:col-span-1 h-[75vh] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Conversations
                  <Badge variant="secondary">
                    {conversations.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 flex flex-col min-h-0">
                {/* Search */}
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500">No conversations found</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredConversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                            selectedConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={getAvatarImage(conversation)} alt={getTitle(conversation)} />
                                <AvatarFallback>
                                  {(getTitle(conversation)[0] || 'C')}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                conversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-sm truncate">
                                  {getTitle(conversation)}
                                </h4>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">
                                    {conversation.lastMessageAt || conversation.createdAt 
                                      ? formatTime(conversation.lastMessageAt || conversation.createdAt)
                                      : ''}
                                  </span>
                                  {conversation.unreadCount > 0 && (
                                    <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {getCompany(conversation)}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 truncate mt-1">
                                {conversation.lastMessage}
                              </p>
                              {conversation.productName && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Package className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500 truncate">
                                    {conversation.productName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-2 flex flex-col h-[75vh] overflow-hidden">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getAvatarImage(selectedConversation)} alt={getTitle(selectedConversation)} />
                            <AvatarFallback>
                              {(getTitle(selectedConversation)[0] || 'C')}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <h3 className="font-semibold">{getTitle(selectedConversation)}</h3>
                          <p className="text-sm text-gray-500">
                            {getCompany(selectedConversation)}
                          </p>
                          {selectedConversation.productName && (
                            <div className="mt-1 flex items-center gap-2">
                              <img
                                src={getAvatarImage(selectedConversation)}
                                alt={selectedConversation.productName}
                                className="w-6 h-6 rounded object-cover border"
                              />
                              <span className="text-xs text-blue-600 truncate max-w-[220px]" title={selectedConversation.productName}>
                                {selectedConversation.productName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Video className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Product Context */}
                  {selectedConversation.productContext && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedConversation.productContext.image}
                          alt={selectedConversation.productContext.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <h4 className="font-medium text-sm">
                            {selectedConversation.productContext.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Product Inquiry • ID: {selectedConversation.productContext.id}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto">
                          <FileText className="h-4 w-4 mr-2" />
                          View Product
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
                      <div className="space-y-4">
                          {(messages || []).map((message: any) => {
                            const isOwnMessage = message.senderType === 'buyer';
                            const StatusIcon = getMessageStatusIcon(message.status);
                            
                            return (
                              <div key={message.id} className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                {!isOwnMessage && (
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="text-[10px]">{(message.senderName?.[0] || 'U')}</AvatarFallback>
                                  </Avatar>
                                )}
                                <div className={`max-w-[72%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                                  <div className={`px-3 py-2 rounded-2xl shadow-sm ${
                                    isOwnMessage 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border'
                                  }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content || message.message}</p>
                                  
                                  {/* Attachments */}
                                  {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {message.attachments.map((attachment: any) => (
                                        <div key={attachment.id} className="flex items-center gap-2 p-2 bg-white/20 rounded">
                                          <FileText className="h-4 w-4" />
                                          <span className="text-xs">{attachment.name}</span>
                                          <span className="text-xs opacity-75">({attachment.size})</span>
                                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                            <Download className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  </div>
                                  <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-500 ${
                                    isOwnMessage ? 'justify-end' : 'justify-start'
                                  }`}>
                                    <span>{new Date(message.createdAt || message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isOwnMessage && (<StatusIcon className="h-3 w-3" />)}
                                  </div>
                                </div>
                                {isOwnMessage && (
                                  <div className="w-7 h-7" />
                                )}
                              </div>
                            );
                          })}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t bg-white dark:bg-gray-900 shrink-0">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="min-h-[40px] max-h-[120px] resize-none"
                          rows={1}
                        />
                      </div>
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                        size="sm"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
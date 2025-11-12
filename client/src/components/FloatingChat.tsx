import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageCircle, 
  Search, 
  Send, 
  Paperclip, 
  Mic, 
  MicOff,
  Phone, 
  Video,
  Calendar,
  Scissors,
  Smile,
  X,
  Minimize2,
  Maximize2,
  ChevronUp,
  ChevronDown,
  Package,
  User,
  Clock,
  CheckCircle,
  CheckCheck,
  Edit,
  Reply,
  Trash2,
  Volume2,
  Play,
  Image as ImageIcon,
  FileText,
  Download,
  MoreVertical,
  CheckCircle2,
  Plus,
  Settings,
  Bell,
  ShoppingCart
} from 'lucide-react';

interface FloatingChatProps {
  isOpen: boolean;
  onToggle: () => void;
  chatType?: 'general' | 'product';
  productId?: string;
  productName?: string;
}

export default function FloatingChat({ 
  isOpen, 
  onToggle, 
  chatType = 'general',
  productId,
  productName 
}: FloatingChatProps) {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [showConversations, setShowConversations] = useState(true);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Get conversations - use different endpoints based on user role
  const { data: conversationsResp, isLoading } = useQuery({
    queryKey: ['/api/chat/conversations', user?.role],
    queryFn: () => {
      if (user?.role === 'admin') {
        return apiRequest('GET', '/api/chat/conversations/admin/all');
      } else {
        return apiRequest('GET', '/api/chat/conversations');
      }
    },
    enabled: !!user, // Only fetch if user is authenticated
  });
  const conversations: any[] = Array.isArray(conversationsResp) ? conversationsResp : (conversationsResp as any)?.conversations || [];

  // Filter conversations by type
  const filteredConversations = conversations.filter(conv => {
    // If a specific product chat is requested (e.g., opened from a product page)
    if (chatType === 'product' && productId) {
      return conv.productId === productId;
    }
    // Otherwise, show all conversations (general and product-specific)
    // This means the floating chat will display a combined list for both buyers and admins.
    return true;
  });

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

  // Auto-select first conversation
  useEffect(() => {
    if (filteredConversations.length > 0 && !selectedConversation) {
      setSelectedConversation(filteredConversations[0]);
    }
  }, [filteredConversations, selectedConversation]);

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, attachments, replyTo, messageType = 'text' }: any) => {
      return apiRequest('POST', `/api/chat/conversations/${conversationId}/messages`, {
        content,
        attachments,
        replyTo,
        messageType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', user?.role] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation?.id, 'messages'] });
      setNewMessage('');
      setAttachments([]);
      setReplyingTo(null);
    }
  });

  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: any) => {
      return apiRequest('PUT', `/api/chat/messages/${messageId}`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation?.id, 'messages'] });
      setEditingMessage(null);
    }
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/chat/conversations', {
        subject: chatType === 'product' 
          ? `Inquiry about ${productName || 'Product'}` 
          : 'General Support Inquiry',
        productId: chatType === 'product' ? productId : undefined
      });
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', user?.role] });
      setSelectedConversation(newConversation);
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: newMessage,
      attachments: attachments.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        data: file
      })),
      replyTo: replyingTo?.id
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'voice-message.wav', { type: 'audio/wav' });
        setAttachments(prev => [...prev, audioFile]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessage(messageId);
    setNewMessage(content);
  };

  const handleSaveEdit = () => {
    if (editingMessage && newMessage.trim()) {
      editMessageMutation.mutate({
        messageId: editingMessage,
        content: newMessage
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return Clock;
      case 'delivered': return CheckCircle;
      case 'read': return CheckCheck;
      default: return Clock;
    }
  };

  if (!isOpen) return null;

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6 md:bottom-8 md:right-8">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[420px] h-[400px]">
          <div className="p-6 text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Please Sign In
            </h3>
            <p className="text-gray-500 mb-4">
              You need to be signed in to access the chat system.
            </p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6 md:bottom-8 md:right-8">
      <div className={`bg-white rounded-2xl shadow-2xl border border-gray-200 transition-all duration-300 ${
        isMinimized ? 'w-80 h-16' : 'w-[600px] h-[800px] max-w-[95vw] max-h-[95vh] sm:w-[700px] sm:h-[850px] md:w-[800px] md:h-[900px]'
      }`}>
        {isMinimized ? (
          <div className="flex items-center justify-between p-4 h-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-gray-900">
                  {chatType === 'product' ? 'Product Chat' : 'Admin Support'}
                </h3>
                <p className="text-xs text-gray-500">
                  {filteredConversations.length} conversations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(false)}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggle}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-primary to-orange-600 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowConversations(!showConversations)}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                >
                  {showConversations ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </Button>
                <div>
                  <h3 className="font-semibold text-sm">
                    {chatType === 'product' ? `Product Chat - ${productName || 'Product'}` : 'Admin Support'}
                  </h3>
                  <p className="text-xs text-primary">
                    Local Time: {new Date().toLocaleTimeString()} • {filteredConversations.length} conversations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onToggle}
                  className="h-8 w-8 p-0 text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-1 min-h-0 h-full">
              {/* Conversations List */}
              {showConversations && (
                <div className="w-1/3 border-r border-gray-200 flex flex-col min-w-[250px] max-w-[300px] sm:w-2/5 sm:min-w-[300px] sm:max-w-[350px] md:w-1/2 md:min-w-[350px] md:max-w-[400px]">
                  <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 text-sm border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : filteredConversations.length === 0 ? (
                      <div className="p-6 text-center">
                        <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h5 className="text-lg font-semibold text-gray-900 mb-2">
                          {chatType === 'product' 
                            ? `Start a conversation about ${productName || 'this product'}`
                            : 'Start a conversation with our support team'
                          }
                        </h5>
                        <p className="text-sm text-gray-500 mb-4">
                          {chatType === 'product' 
                            ? 'Get help with this specific product or ask questions about pricing and availability.'
                            : 'Get help with your account, orders, or general inquiries. You can also discuss specific products.'
                          }
                        </p>
                        <Button 
                          onClick={() => createConversationMutation.mutate()}
                          disabled={createConversationMutation.isPending}
                          className="w-full bg-primary hover:bg-primary"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Start New Conversation
                        </Button>
                        <p className="text-xs text-gray-400 mt-2">
                          {chatType === 'product' 
                            ? 'This chat is for product-specific inquiries'
                            : 'This chat supports both general inquiries and product-specific discussions'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="h-full">
                        <div className="space-y-2 p-3">
                          {filteredConversations.map((conversation: any) => (
                            <div
                              key={conversation.id}
                              className={`p-4 cursor-pointer rounded-xl transition-all duration-200 ${
                                selectedConversation?.id === conversation.id 
                                  ? 'bg-primary border border-primary shadow-sm' 
                                  : 'hover:bg-gray-50 hover:shadow-sm'
                              }`}
                              onClick={() => setSelectedConversation(conversation)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage 
                                    src={Array.isArray(conversation.productImages) 
                                      ? conversation.productImages[0] 
                                      : (typeof conversation.productImages === 'string' 
                                          ? (() => {
                                              try {
                                                return JSON.parse(conversation.productImages || '[]')[0];
                                              } catch {
                                                return null;
                                              }
                                            })()
                                          : null)} 
                                    alt={conversation.adminName || conversation.buyerName} 
                                  />
                                  <AvatarFallback className="text-sm font-medium">
                                    {(conversation.adminName || conversation.buyerName)?.[0] || 'A'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold text-sm truncate">
                                      {conversation.adminName || conversation.buyerName || 'Admin Support'}
                                    </h4>
                                    {(conversation.unreadCountBuyer || conversation.unreadCount) > 0 && (
                                      <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                                        {conversation.unreadCountBuyer || conversation.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 truncate">
                                    {conversation.subject || conversation.lastMessage || 'No messages'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {conversation.productName ? (
                                      <div className="flex items-center gap-1">
                                        <Package className="h-4 w-4 text-primary" />
                                        <span className="text-sm text-primary truncate font-medium">
                                          {conversation.productName}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <User className="h-4 w-4 text-gray-400" />
                                        <span className="text-sm text-gray-500 font-medium">
                                          General Chat
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Area */}
              <div className={`flex flex-col ${showConversations ? 'flex-1' : 'w-full'} min-w-0 h-full`}>
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={Array.isArray(selectedConversation.productImages) 
                                ? selectedConversation.productImages[0] 
                                : (typeof selectedConversation.productImages === 'string' 
                                    ? (() => {
                                        try {
                                          return JSON.parse(selectedConversation.productImages || '[]')[0];
                                        } catch {
                                          return null;
                                        }
                                      })()
                                    : null)} 
                              alt={selectedConversation.adminName || selectedConversation.buyerName} 
                            />
                            <AvatarFallback className="text-sm font-medium">
                              {(selectedConversation.adminName || selectedConversation.buyerName)?.[0] || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-base">
                              {selectedConversation.adminName || selectedConversation.buyerName || 'Admin Support'}
                            </h4>
                            {selectedConversation.productName && (
                              <p className="text-sm text-gray-600">
                                {selectedConversation.productName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-gray-200"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4">
                      <div className="space-y-4 h-full">
                        {(messages || []).map((message: any) => {
                          const isOwnMessage = message.senderType === 'buyer';
                          const StatusIcon = getMessageStatusIcon(message.status);
                          
                          return (
                            <div key={message.id} className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              {!isOwnMessage && (
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-sm font-medium">{(message.senderName?.[0] || 'A')}</AvatarFallback>
                                </Avatar>
                              )}
                              <div className={`max-w-[80%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                                {/* Reply Context */}
                                {message.replyTo && (
                                  <div className="mb-1 p-2 bg-gray-100 rounded-lg border-l-2 border-primary">
                                    <p className="text-xs text-gray-600">Replying to:</p>
                                    <p className="text-xs text-gray-800 truncate">{message.replyTo.content}</p>
                                  </div>
                                )}
                                
                                <div className={`px-4 py-3 rounded-2xl shadow-sm group relative ${
                                  isOwnMessage 
                                    ? 'bg-primary text-white' 
                                    : 'bg-gray-100 text-gray-900'
                                }`}>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content || message.message}</p>
                                
                                  {/* Attachments */}
                                  {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {message.attachments.map((attachment: any, idx: number) => (
                                        <div key={attachment.id || idx} className="flex items-center gap-2 p-1 bg-white/20 rounded">
                                          {attachment.type?.startsWith('image/') ? (
                                            <ImageIcon className="h-3 w-3" />
                                          ) : attachment.type?.startsWith('audio/') ? (
                                            <Volume2 className="h-3 w-3" />
                                          ) : attachment.type?.startsWith('video/') ? (
                                            <Play className="h-3 w-3" />
                                          ) : (
                                            <FileText className="h-3 w-3" />
                                          )}
                                          <span className="text-xs">{attachment.name}</span>
                                          <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                                            <Download className="h-2 w-2" />
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Message Actions */}
                                  {isOwnMessage && (
                                    <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 w-5 p-0 text-white hover:bg-gray-700"
                                          onClick={() => setReplyingTo(message)}
                                        >
                                          <Reply className="h-2 w-2" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 w-5 p-0 text-white hover:bg-gray-700"
                                          onClick={() => handleEditMessage(message.id, message.content)}
                                        >
                                          <Edit className="h-2 w-2" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-5 w-5 p-0 text-white hover:bg-red-600"
                                        >
                                          <Trash2 className="h-2 w-2" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                                  isOwnMessage ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span>{formatTime(message.createdAt || message.timestamp)}</span>
                                  {isOwnMessage && (<StatusIcon className="h-3 w-3" />)}
                                  {message.edited && (
                                    <span className="text-gray-400">(edited)</span>
                                  )}
                                </div>
                              </div>
                              {isOwnMessage && (
                                <div className="w-6 h-6" />
                              )}
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Reply Context */}
                    {replyingTo && (
                      <div className="p-2 bg-primary border-l-4 border-primary">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-primary font-medium">Replying to:</p>
                            <p className="text-xs text-gray-800 truncate">{replyingTo.content}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setReplyingTo(null)}
                            className="h-4 w-4 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                      <div className="p-2 bg-gray-50 border-t">
                        <div className="flex flex-wrap gap-1">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center gap-1 bg-white rounded p-1 border">
                              {file.type.startsWith('image/') ? (
                                <ImageIcon className="h-3 w-3 text-primary" />
                              ) : file.type.startsWith('audio/') ? (
                                <Volume2 className="h-3 w-3 text-green-500" />
                              ) : file.type.startsWith('video/') ? (
                                <Play className="h-3 w-3 text-purple-500" />
                              ) : (
                                <FileText className="h-3 w-3 text-gray-500" />
                              )}
                              <span className="text-xs truncate max-w-[60px]">{file.name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeAttachment(index)}
                                className="h-3 w-3 p-0"
                              >
                                <X className="h-2 w-2" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Input */}
                    <div className="p-5 border-t border-gray-200 bg-white">
                      {/* Action Icons Row */}
                      <div className="flex gap-2 mb-4">
                        <input
                          type="file"
                          id="file-upload"
                          multiple
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => document.getElementById('file-upload')?.click()}
                          className="h-10 w-10 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                          <Paperclip className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onMouseDown={startRecording}
                          onMouseUp={stopRecording}
                          onMouseLeave={stopRecording}
                          className={`h-10 w-10 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg ${isRecording ? 'bg-red-500 text-white hover:bg-red-600' : ''}`}
                        >
                          {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-10 w-10 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                          <Smile className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {/* Input Area */}
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Textarea
                            placeholder={editingMessage ? "Edit your message..." : "Type your message here..."}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className="min-h-[70px] max-h-[140px] resize-none text-sm border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-xl"
                            rows={3}
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          {editingMessage ? (
                            <>
                              <Button
                                onClick={handleSaveEdit}
                                disabled={!newMessage.trim() || editMessageMutation.isPending}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 h-10 w-10 p-0 rounded-lg"
                              >
                                <CheckCircle2 className="h-5 w-5" />
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingMessage(null);
                                  setNewMessage('');
                                }}
                                size="sm"
                                variant="outline"
                                className="h-10 w-10 p-0 rounded-lg"
                              >
                                <X className="h-5 w-5" />
                              </Button>
                            </>
                          ) : (
                            <Button 
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim() || sendMessageMutation.isPending}
                              size="sm"
                              className="bg-primary hover:bg-primary h-10 w-10 p-0 rounded-lg"
                            >
                              <Send className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-10">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center mx-auto mb-8">
                        <MessageCircle className="h-12 w-12 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">
                        {chatType === 'product' ? `Start a conversation about ${productName || 'this product'}` : 'Start a conversation with our support team'}
                      </h3>
                      <p className="text-base text-gray-600 mb-8 max-w-sm mx-auto">
                        {chatType === 'product' 
                          ? `Ask questions, get quotes, or discuss specifications for ${productName || 'this product'}`
                          : 'Get help with your account, orders, or general inquiries'
                        }
                      </p>
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => setShowConversations(true)}
                          className="bg-primary hover:bg-primary px-8 py-3 rounded-xl text-sm font-medium"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Start New Conversation
                        </Button>
                        <p className="text-sm text-gray-500">
                          {chatType === 'product' 
                            ? 'This chat is specifically for product-related questions'
                            : 'This chat is for general support and inquiries'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

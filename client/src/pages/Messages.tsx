import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Download,
  Mic,
  MicOff,
  Edit,
  Reply,
  X,
  Play,
  Pause,
  Volume2,
  Trash2,
  Star,
  StarOff,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  ShoppingCart,
  Eye,
  Heart
} from 'lucide-react';

export default function Messages() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatType, setChatType] = useState<'general' | 'product'>('general');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
  const [hasAttemptedProductConversation, setHasAttemptedProductConversation] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [, setLocation] = useLocation();

  // Get URL parameters for product-specific chat
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('productId');
  const productName = urlParams.get('productName');
  const urlChatType = urlParams.get('chatType') as 'general' | 'product' | null;

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

  // Separate conversations by type
  const generalConversations = conversations.filter(conv => !conv.productId);
  const productConversations = conversations.filter(conv => conv.productId);

  const createConversationMutation = useMutation({
    mutationFn: async ({ productId, productName }: { productId: string; productName: string }) => {
      return apiRequest('POST', '/api/chat/conversations', {
        subject: `Inquiry about ${productName}`,
        productId
      });
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
      setSelectedConversation(newConversation);
      setHasAttemptedProductConversation(true);
    },
    onError: (error) => {
      console.error('Error creating conversation:', error);
      // Reset the flag on error so user can try again
      setHasAttemptedProductConversation(false);
    }
  });

  const createProductConversation = (productId: string, productName: string) => {
    createConversationMutation.mutate({ productId, productName });
  };

  // Set chat type from URL parameter and handle product-specific chat
  useEffect(() => {
    if (urlChatType && (urlChatType === 'general' || urlChatType === 'product')) {
      setChatType(urlChatType);
    }
    
    // Reset attempt flag when productId changes (different product)
    if (productId) {
      setHasAttemptedProductConversation(false);
    }
  }, [urlChatType, productId]);

  // Handle product-specific conversation creation when conversations are loaded or when we have URL parameters
  useEffect(() => {
    if (productId && productName && urlChatType === 'product' && !hasAttemptedProductConversation) {
      // Check if conversations are loaded (either empty array or with data)
      if (conversations !== undefined) {
        const existingProductConversation = productConversations.find(conv => conv.productId === productId);
        if (existingProductConversation) {
          setSelectedConversation(existingProductConversation);
          setHasAttemptedProductConversation(true);
        } else if (!createConversationMutation.isPending) {
          // Double-check that no conversation exists for this product before creating
          const doubleCheckConversation = conversations.find(conv => conv.productId === productId);
          if (!doubleCheckConversation) {
            setHasAttemptedProductConversation(true);
            createProductConversation(productId, productName);
          } else {
            setSelectedConversation(doubleCheckConversation);
            setHasAttemptedProductConversation(true);
          }
        }
      }
    }
  }, [conversations, productId, productName, urlChatType, hasAttemptedProductConversation, createConversationMutation.isPending]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup effect to reset state when component unmounts
  useEffect(() => {
    return () => {
      setHasAttemptedProductConversation(false);
    };
  }, []);

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
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations'] });
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

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return apiRequest('DELETE', `/api/chat/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations', selectedConversation?.id, 'messages'] });
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

  const currentConversations = chatType === 'general' ? generalConversations : productConversations;
  
  const filteredConversations = currentConversations.filter((conversation: any) => {
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

  const handleDeleteMessage = (messageId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteMessageMutation.mutate(messageId);
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
          {/* Chat Type Selector */}
          <div className="mb-6">
            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg w-fit">
              <Button
                variant={chatType === 'general' ? 'default' : 'ghost'}
                onClick={() => setChatType('general')}
                className="px-6"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                General Chat
                <Badge variant="secondary" className="ml-2">
                  {generalConversations.length}
                </Badge>
              </Button>
              <Button
                variant={chatType === 'product' ? 'default' : 'ghost'}
                onClick={() => setChatType('product')}
                className="px-6"
              >
                <Package className="w-4 h-4 mr-2" />
                Product Chat
                <Badge variant="secondary" className="ml-2">
                  {productConversations.length}
                </Badge>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[75vh]">
            {/* Conversations List */}
            <Card className="lg:col-span-1 h-[75vh] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {chatType === 'general' ? 'General Conversations' : 'Product Conversations'}
                  <Badge variant="secondary">
                    {chatType === 'general' ? generalConversations.length : productConversations.length}
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
                                  {/* Reply Context */}
                                  {message.replyTo && (
                                    <div className="mb-2 p-2 bg-gray-100 rounded-lg border-l-4 border-blue-500">
                                      <p className="text-xs text-gray-600">Replying to:</p>
                                      <p className="text-sm text-gray-800 truncate">{message.replyTo.content}</p>
                                    </div>
                                  )}
                                  
                                  <div className={`px-3 py-2 rounded-2xl shadow-sm group relative ${
                                    isOwnMessage 
                                      ? 'bg-blue-600 text-white' 
                                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border'
                                  }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content || message.message}</p>
                                  
                                    {/* Attachments */}
                                    {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                                      <div className="mt-2 space-y-2">
                                        {message.attachments.map((attachment: any, idx: number) => (
                                          <div key={attachment.id || idx} className="flex items-center gap-2 p-2 bg-white/20 rounded">
                                            {attachment.type?.startsWith('image/') ? (
                                              <ImageIcon className="h-4 w-4" />
                                            ) : attachment.type?.startsWith('audio/') ? (
                                              <Volume2 className="h-4 w-4" />
                                            ) : attachment.type?.startsWith('video/') ? (
                                              <Play className="h-4 w-4" />
                                            ) : (
                                              <FileText className="h-4 w-4" />
                                            )}
                                            <span className="text-xs">{attachment.name}</span>
                                            <span className="text-xs opacity-75">({attachment.size})</span>
                                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                              <Download className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Message Actions */}
                                    {isOwnMessage && (
                                      <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                                            onClick={() => setReplyingTo(message)}
                                          >
                                            <Reply className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-white hover:bg-gray-700"
                                            onClick={() => handleEditMessage(message.id, message.content)}
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-6 w-6 p-0 text-white hover:bg-red-600"
                                            onClick={() => handleDeleteMessage(message.id)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-500 ${
                                    isOwnMessage ? 'justify-end' : 'justify-start'
                                  }`}>
                                    <span>{new Date(message.createdAt || message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    {isOwnMessage && (<StatusIcon className="h-3 w-3" />)}
                                    {message.edited && (
                                      <span className="text-gray-400">(edited)</span>
                                    )}
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

                  {/* Reply Context */}
                  {replyingTo && (
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-500">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-600 font-medium">Replying to:</p>
                          <p className="text-sm text-gray-800 truncate">{replyingTo.content}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReplyingTo(null)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Attachments Preview */}
                  {attachments.length > 0 && (
                    <div className="p-3 bg-gray-50 border-t">
                      <div className="flex flex-wrap gap-2">
                        {attachments.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 bg-white rounded-lg p-2 border">
                            {file.type.startsWith('image/') ? (
                              <ImageIcon className="h-4 w-4 text-blue-500" />
                            ) : file.type.startsWith('audio/') ? (
                              <Volume2 className="h-4 w-4 text-green-500" />
                            ) : file.type.startsWith('video/') ? (
                              <Play className="h-4 w-4 text-purple-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeAttachment(index)}
                              className="h-4 w-4 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="p-4 border-t bg-white dark:bg-gray-900 shrink-0">
                    <div className="flex gap-2">
                      <div className="flex gap-1">
                        <input
                          type="file"
                          id="file-upload"
                          multiple
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onMouseDown={startRecording}
                          onMouseUp={stopRecording}
                          onMouseLeave={stopRecording}
                          className={isRecording ? 'bg-red-500 text-white' : ''}
                        >
                          {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                      </div>
                      <div className="flex-1">
                        <Textarea
                          placeholder={editingMessage ? "Edit your message..." : "Type your message..."}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="min-h-[40px] max-h-[120px] resize-none"
                          rows={1}
                        />
                      </div>
                      <div className="flex gap-1">
                        {editingMessage ? (
                          <>
                            <Button
                              onClick={handleSaveEdit}
                              disabled={!newMessage.trim() || editMessageMutation.isPending}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingMessage(null);
                                setNewMessage('');
                              }}
                              size="sm"
                              variant="outline"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button 
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sendMessageMutation.isPending}
                            size="sm"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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
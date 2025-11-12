import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  Search, 
  Filter,
  Bot,
  User,
  Clock,
  CheckCircle,
  ArrowLeft,
  Phone,
  Video,
  Users,
  TrendingUp,
  AlertCircle,
  Package,
  Send,
  Paperclip,
  Mic,
  MicOff,
  Edit,
  Reply,
  X,
  Play,
  Volume2,
  Trash2,
  Star,
  StarOff,
  CheckCircle2,
  Eye,
  Heart,
  ShoppingCart,
  FileText,
  Image as ImageIcon,
  Download,
  MoreVertical,
  CheckCheck
} from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { useToast } from '@/hooks/use-toast';

export default function AdminChat() {
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatType, setChatType] = useState<'general' | 'product'>('general');
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'all' | 'product'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Get current user info
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: () => apiRequest('GET', '/api/auth/me'),
  });

  // Get all conversations for admin
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/chat/conversations/admin/all'],
    queryFn: () => apiRequest('GET', '/api/chat/conversations/admin/all'),
  });

  // Messages for selected conversation
  const { data: messagesResp } = useQuery({
    queryKey: ['/api/chat/conversations', selectedConversation?.id, 'messages'],
    queryFn: () => apiRequest('GET', `/api/chat/conversations/${selectedConversation?.id}/messages`),
    enabled: !!selectedConversation?.id,
    refetchInterval: 5000,
  });

  // Get unread count
  const { data: unreadData } = useQuery({
    queryKey: ['/api/chat/unread-count'],
    queryFn: () => apiRequest('GET', '/api/chat/unread-count'),
  });

  const user = (userData as any)?.user;
  const conversations = (conversationsData as any)?.conversations || [];
  const messages = (messagesResp as any)?.messages || [];
  const unreadCount = (unreadData as any)?.count || 0;

  // Separate conversations by type
  const generalConversations = conversations.filter((conv: any) => !conv.productId);
  const productConversations = conversations.filter((conv: any) => conv.productId);

  // Auto-switch to product chat if no general conversations but product conversations exist
  useEffect(() => {
    if (chatType === 'general' && generalConversations.length === 0 && productConversations.length > 0) {
      setChatType('product');
    }
  }, [chatType, generalConversations.length, productConversations.length]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  // Get unique products for filter
  const uniqueProducts = Array.from(
    new Set(
      conversations
        .filter((conv: any) => conv.productId && conv.productName)
        .map((conv: any) => ({ id: conv.productId, name: conv.productName }))
    )
  );

  // Filter conversations based on chat type
  const currentConversations = chatType === 'general' ? generalConversations : productConversations;
  
  const filteredConversations = currentConversations.filter((conv: any) => {
    const matchesSearch = !searchQuery || 
      conv.buyerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.buyerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.productId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.productName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || conv.status === statusFilter;
    const matchesProduct = productFilter === 'all' || conv.productId === productFilter;

    return matchesSearch && matchesStatus && matchesProduct;
  });


  // Group conversations by product for product view
  const conversationsByProduct = filteredConversations.reduce((acc: any, conv: any) => {
    const productKey = conv.productId || 'no-product';
    const productName = conv.productName || 'General Inquiry';
    
    if (!acc[productKey]) {
      acc[productKey] = {
        productId: conv.productId,
        productName: productName,
        conversations: []
      };
    }
    acc[productKey].conversations.push(conv);
    return acc;
  }, {});

  // Message handling functions
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

  const handleSelectConversation = (conversation: any) => {
    setSelectedConversation(conversation);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Please log in to access admin chat
          </h3>
          <p className="text-gray-500">
            You need to be logged in as an admin to access the chat management.
          </p>
        </div>
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="p-6 pb-0">
            <Breadcrumb items={[
              { label: "Admin", href: "/admin" },
              { label: "Chat Management" }
            ]} />
          </div>

          {/* Chat Interface */}
          <div className="h-[calc(100vh-200px)] w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Conversations List */}
              <Card className="lg:col-span-1 h-full flex flex-col">
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

                  {/* Chat Type Selector */}
                  <div className="p-4 border-b">
                    <div className="flex space-x-2">
                      <Button
                        variant={chatType === 'general' ? 'default' : 'outline'}
                        onClick={() => setChatType('general')}
                        size="sm"
                        className="flex-1"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        General
                      </Button>
                      <Button
                        variant={chatType === 'product' ? 'default' : 'outline'}
                        onClick={() => setChatType('product')}
                        size="sm"
                        className="flex-1"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Product
                      </Button>
                    </div>
                  </div>

                  {/* Conversations */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {conversationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : (chatType === 'general' ? generalConversations : productConversations).length === 0 ? (
                      <div className="p-8 text-center">
                        <p className="text-gray-500">No conversations found</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {(chatType === 'general' ? generalConversations : productConversations).map((conversation: any) => (
                          <div
                            key={conversation.id}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                              selectedConversation?.id === conversation.id ? 'bg-primary border-r-4 border-primary' : ''
                            }`}
                            onClick={() => handleSelectConversation(conversation)}
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={conversation.productImages?.[0]} alt={conversation.buyerName} />
                                <AvatarFallback>
                                  {conversation.buyerName?.[0] || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-medium text-sm truncate">
                                    {conversation.buyerName || conversation.buyerEmail || 'Customer'}
                                  </h4>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">
                                      {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </span>
                                    {conversation.unreadCount > 0 && (
                                      <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                        {conversation.unreadCount}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                  {conversation.buyerCompany || 'Customer'}
                                </p>
                                <p className="text-sm text-gray-700 truncate mt-1">
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
              <Card className="lg:col-span-2 flex flex-col h-full overflow-hidden">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="border-b shrink-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedConversation.productImages?.[0]} alt={selectedConversation.buyerName} />
                            <AvatarFallback>
                              {selectedConversation.buyerName?.[0] || 'C'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{selectedConversation.buyerName || selectedConversation.buyerEmail}</h3>
                            <p className="text-sm text-gray-500">
                              {selectedConversation.buyerCompany || 'Customer'}
                            </p>
                            {selectedConversation.productName && (
                              <div className="mt-1 flex items-center gap-2">
                                <img
                                  src={selectedConversation.productImages?.[0]}
                                  alt={selectedConversation.productName}
                                  className="w-6 h-6 rounded object-cover border"
                                />
                                <span className="text-xs text-primary truncate max-w-[220px]" title={selectedConversation.productName}>
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

                    {/* Messages */}
                    <CardContent className="p-0 flex flex-col flex-1 min-h-0">
                      <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
                        <div className="space-y-4">
                          {(messages || []).map((message: any) => {
                            const isOwnMessage = message.senderType === 'admin';
                            const StatusIcon = message.status === 'sent' ? Clock : message.status === 'delivered' ? CheckCircle : CheckCheck;
                            
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
                                    <div className="mb-2 p-2 bg-gray-100 rounded-lg border-l-4 border-primary">
                                      <p className="text-xs text-gray-600">Replying to:</p>
                                      <p className="text-sm text-gray-800 truncate">{message.replyTo.content}</p>
                                    </div>
                                  )}
                                  
                                  <div className={`px-3 py-2 rounded-2xl shadow-sm group relative ${
                                    isOwnMessage 
                                      ? 'bg-primary text-white' 
                                      : 'bg-white text-gray-900 border'
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
                      <div className="p-3 bg-primary border-l-4 border-primary">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-primary font-medium">Replying to:</p>
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
                                <ImageIcon className="h-4 w-4 text-primary" />
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
                    <div className="p-4 border-t bg-white shrink-0">
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
                      <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-gray-600">
                        Choose a conversation from the list to start messaging
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full p-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: "Admin", href: "/admin" },
          { label: "Chat Management" }
        ]} />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Chat Management
              </h1>
              <p className="text-gray-600">
                Manage customer conversations and provide support.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={chatType === 'general' ? 'default' : 'ghost'}
                  onClick={() => setChatType('general')}
                  className="px-4"
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
                  className="px-4"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Product Chat
                  <Badge variant="secondary" className="ml-2">
                    {productConversations.length}
                  </Badge>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">Total Conversations</p>
                  <p className="text-3xl font-bold text-white">{conversations.length}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-100">Active Chats</p>
                  <p className="text-3xl font-bold text-white">
                    {conversations.filter((c: any) => c.status === 'active').length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-100">Unread Messages</p>
                  <p className="text-3xl font-bold text-white">{unreadCount}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-100">Response Rate</p>
                  <p className="text-3xl font-bold text-white">98%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

               {/* Filters and Search */}
               <Card className="mb-6">
                 <CardContent className="p-6">
                   <div className="space-y-4">
                     {/* Search Bar */}
                     <div className="relative">
                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                       <Input
                         placeholder="Search conversations by customer name, email, subject, product name, or product ID..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className="pl-10"
                       />
                     </div>
                     
                     {/* Filters Row */}
                     <div className="flex flex-col md:flex-row gap-4">
                       <div className="flex space-x-2">
                         <select
                           value={statusFilter}
                           onChange={(e) => setStatusFilter(e.target.value)}
                           className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                         >
                           <option value="all">All Status</option>
                           <option value="active">Active</option>
                           <option value="closed">Closed</option>
                           <option value="archived">Archived</option>
                         </select>
                         
                         <select
                           value={productFilter}
                           onChange={(e) => setProductFilter(e.target.value)}
                           className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                         >
                           <option value="all">All Products</option>
                           {uniqueProducts.map((product: any) => (
                             <option key={product.id} value={product.id}>
                               {product.name}
                             </option>
                           ))}
                         </select>
                       </div>
                       
                       <div className="flex space-x-2">
                         <Button 
                           variant={viewMode === 'all' ? 'default' : 'outline'} 
                           size="sm"
                           onClick={() => setViewMode('all')}
                         >
                           <Users className="h-4 w-4 mr-2" />
                           All Chats
                         </Button>
                         <Button 
                           variant={viewMode === 'product' ? 'default' : 'outline'} 
                           size="sm"
                           onClick={() => setViewMode('product')}
                         >
                           <Package className="h-4 w-4 mr-2" />
                           By Product
                         </Button>
                       </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>

        {/* Conversations List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Customer Conversations</span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {filteredConversations.length} conversations
                </Badge>
                {viewMode === 'product' && (
                  <Badge variant="outline">
                    {Object.keys(conversationsByProduct).length} products
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conversationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No conversations found
                </h3>
                <p className="text-gray-500">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Customer conversations will appear here when they start chatting.'
                  }
                </p>
              </div>
            ) : viewMode === 'product' ? (
              /* Product-wise view */
              <div className="space-y-6">
                {Object.values(conversationsByProduct).map((productGroup: any) => (
                  <div key={productGroup.productId || 'no-product'} className="border rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-600 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {productGroup.productName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {productGroup.conversations.length} conversation{productGroup.conversations.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {productGroup.conversations.map((conversation: any) => (
                        <div
                          key={conversation.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                          onClick={() => handleSelectConversation(conversation.id)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-sm">
                                {conversation.buyerName || conversation.buyerEmail || 'Unknown Customer'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {conversation.subject || 'No Subject'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(conversation.status)}>
                              {conversation.status}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* All conversations view */
              <div className="space-y-4">
                {filteredConversations.map((conversation: any) => (
                  <div
                    key={conversation.id}
                    className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.productImages?.[0]} alt={conversation.buyerName} />
                      <AvatarFallback>
                        {conversation.buyerName?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.buyerName || conversation.buyerEmail || 'Customer'}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${
                              conversation.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : conversation.status === 'closed'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {conversation.status}
                          </Badge>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {conversation.unreadCount} new
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.buyerCompany || 'Customer'}
                      </p>
                      <p className="text-sm text-gray-700 truncate mt-1">
                        {conversation.lastMessage}
                      </p>
                      {conversation.productName && (
                        <div className="flex items-center mt-1">
                          <Package className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500 truncate">
                            {conversation.productName}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Last message: {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString() : 'No messages'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-primary hover:bg-primary">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

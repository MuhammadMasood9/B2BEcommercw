import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Online,
  Offline,
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
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const queryClient = useQueryClient();

  // Mock data - in real app, this would come from API
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [
        {
          id: 1,
          type: 'supplier',
          name: 'Shanghai Manufacturing Co.',
          company: 'Shanghai Manufacturing Co. Ltd.',
          avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop',
          lastMessage: 'We can provide samples by next week. Please confirm your shipping address.',
          lastMessageTime: '2024-01-15T14:30:00Z',
          unreadCount: 2,
          isOnline: true,
          productContext: {
            id: 'prod-1',
            name: 'Industrial Water Pumps',
            image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=200&h=200&fit=crop'
          },
          inquiryId: 1,
          messages: [
            {
              id: 1,
              senderId: 'supplier-1',
              senderName: 'Shanghai Manufacturing Co.',
              senderType: 'supplier',
              content: 'Thank you for your inquiry about our industrial water pumps.',
              timestamp: '2024-01-15T10:00:00Z',
              status: 'delivered',
              attachments: []
            },
            {
              id: 2,
              senderId: 'buyer-1',
              senderName: 'John Smith',
              senderType: 'buyer',
              content: 'Hi, I need 50 units for a water treatment plant. What\'s your best price?',
              timestamp: '2024-01-15T10:15:00Z',
              status: 'read',
              attachments: []
            },
            {
              id: 3,
              senderId: 'supplier-1',
              senderName: 'Shanghai Manufacturing Co.',
              senderType: 'supplier',
              content: 'Our best price is $850 per unit for 50 pieces. This includes ISO certification.',
              timestamp: '2024-01-15T10:30:00Z',
              status: 'delivered',
              attachments: [
                {
                  id: 1,
                  name: 'quotation.pdf',
                  type: 'pdf',
                  size: '245 KB',
                  url: '#'
                }
              ]
            },
            {
              id: 4,
              senderId: 'buyer-1',
              senderName: 'John Smith',
              senderType: 'buyer',
              content: 'That sounds good. Can you provide samples first?',
              timestamp: '2024-01-15T11:00:00Z',
              status: 'read',
              attachments: []
            },
            {
              id: 5,
              senderId: 'supplier-1',
              senderName: 'Shanghai Manufacturing Co.',
              senderType: 'supplier',
              content: 'We can provide samples by next week. Please confirm your shipping address.',
              timestamp: '2024-01-15T14:30:00Z',
              status: 'delivered',
              attachments: []
            }
          ]
        },
        {
          id: 2,
          type: 'supplier',
          name: 'Guangzhou Electronics Ltd.',
          company: 'Guangzhou Electronics Ltd.',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
          lastMessage: 'Please check our latest quotation for LED lights.',
          lastMessageTime: '2024-01-14T16:20:00Z',
          unreadCount: 0,
          isOnline: false,
          productContext: {
            id: 'prod-2',
            name: 'LED Street Lights',
            image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop'
          },
          inquiryId: 2,
          messages: [
            {
              id: 6,
              senderId: 'supplier-2',
              senderName: 'Guangzhou Electronics Ltd.',
              senderType: 'supplier',
              content: 'Please check our latest quotation for LED lights.',
              timestamp: '2024-01-14T16:20:00Z',
              status: 'read',
              attachments: [
                {
                  id: 2,
                  name: 'led_quotation.pdf',
                  type: 'pdf',
                  size: '312 KB',
                  url: '#'
                }
              ]
            }
          ]
        },
        {
          id: 3,
          type: 'buyer',
          name: 'Maria Garcia',
          company: 'Garcia Municipal Corp.',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop',
          lastMessage: 'Can you send me more information about your packaging solutions?',
          lastMessageTime: '2024-01-13T09:45:00Z',
          unreadCount: 1,
          isOnline: true,
          productContext: {
            id: 'prod-3',
            name: 'Custom Packaging Boxes',
            image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=200&h=200&fit=crop'
          },
          inquiryId: 3,
          messages: [
            {
              id: 7,
              senderId: 'buyer-3',
              senderName: 'Maria Garcia',
              senderType: 'buyer',
              content: 'Can you send me more information about your packaging solutions?',
              timestamp: '2024-01-13T09:45:00Z',
              status: 'delivered',
              attachments: []
            }
          ]
        }
      ];
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content, attachments }) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setNewMessage('');
    }
  });

  const filteredConversations = conversations.filter(conversation => {
    return conversation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conversation.company.toLowerCase().includes(searchQuery.toLowerCase());
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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Messages
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Communicate with suppliers and manage your business conversations
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversations List */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Conversations
                  <Badge variant="secondary">
                    {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
                <ScrollArea className="h-[500px]">
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
                                <AvatarImage src={conversation.avatar} alt={conversation.name} />
                                <AvatarFallback>
                                  {conversation.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                                conversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-sm truncate">
                                  {conversation.name}
                                </h4>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">
                                    {formatTime(conversation.lastMessageTime)}
                                  </span>
                                  {conversation.unreadCount > 0 && (
                                    <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {conversation.company}
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 truncate mt-1">
                                {conversation.lastMessage}
                              </p>
                              {conversation.productContext && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Package className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500 truncate">
                                    {conversation.productContext.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-2">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                            <AvatarFallback>
                              {selectedConversation.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                            selectedConversation.isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{selectedConversation.name}</h3>
                          <p className="text-sm text-gray-500">
                            {selectedConversation.company}
                          </p>
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
                  <CardContent className="p-0">
                    <ScrollArea className="h-[350px] p-4">
                      <div className="space-y-4">
                        {selectedConversation.messages.map((message) => {
                          const isOwnMessage = message.senderType === 'buyer';
                          const StatusIcon = getMessageStatusIcon(message.status);
                          
                          return (
                            <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                                <div className={`p-3 rounded-lg ${
                                  isOwnMessage 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                                }`}>
                                  <p className="text-sm">{message.content}</p>
                                  
                                  {/* Attachments */}
                                  {message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {message.attachments.map((attachment) => (
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
                                <div className={`flex items-center gap-1 mt-1 text-xs text-gray-500 ${
                                  isOwnMessage ? 'justify-end' : 'justify-start'
                                }`}>
                                  <span>{formatTime(message.timestamp)}</span>
                                  {isOwnMessage && (
                                    <StatusIcon className="h-3 w-3" />
                                  )}
                                </div>
                              </div>
                              {!isOwnMessage && (
                                <div className="order-2 ml-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {message.senderName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t">
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
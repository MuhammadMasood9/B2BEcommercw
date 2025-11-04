import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  FileText,
  Paperclip,
  Smile,
  Settings,
  Users,
  Bell,
  Archive,
  Trash2,
  Star,
  Flag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'admin' | 'user';
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: string[];
  messageType: 'text' | 'image' | 'file' | 'system';
}

interface Conversation {
  id: string;
  userId: string;
  userName: string;
  userCompany: string;
  userAvatar?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
  isOnline: boolean;
  status: 'active' | 'archived' | 'blocked';
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

export default function AdminChat() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      userId: "user1",
      userName: "John Smith",
      userCompany: "Tech Solutions Inc.",
      userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      lastMessage: "Thank you for the quotation. We're interested in placing an order for 500 units.",
      lastMessageAt: new Date("2024-01-23T10:30:00"),
      unreadCount: 2,
      isOnline: true,
      status: 'active',
      tags: ['VIP', 'High Value'],
      priority: 'high'
    },
    {
      id: "2",
      userId: "user2",
      userName: "Maria Garcia",
      userCompany: "Industrial Supplies Ltd.",
      userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      lastMessage: "Can you provide more details about the customization options?",
      lastMessageAt: new Date("2024-01-23T09:15:00"),
      unreadCount: 0,
      isOnline: false,
      status: 'active',
      tags: ['New Customer'],
      priority: 'medium'
    },
    {
      id: "3",
      userId: "user3",
      userName: "Ahmed Hassan",
      userCompany: "Middle East Trading Co.",
      userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      lastMessage: "What are your payment terms for bulk orders?",
      lastMessageAt: new Date("2024-01-22T16:45:00"),
      unreadCount: 1,
      isOnline: true,
      status: 'active',
      tags: ['Bulk Order'],
      priority: 'high'
    },
    {
      id: "4",
      userId: "user4",
      userName: "Li Wei",
      userCompany: "China Manufacturing Group",
      userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      lastMessage: "We need samples before placing a large order.",
      lastMessageAt: new Date("2024-01-22T14:20:00"),
      unreadCount: 0,
      isOnline: false,
      status: 'active',
      tags: ['Sample Request'],
      priority: 'medium'
    }
  ]);

  const [selectedConversation, setSelectedConversation] = useState<string>("1");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'archived'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load messages for the selected conversation
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) {
        setMessages([]);
        return;
      }

      try {
        const response = await fetch(`/api/chat/conversations/${selectedConversation.id}/messages`);
        if (response.ok) {
          const messagesData = await response.json();
          setMessages(messagesData || []);
        } else {
          console.warn('Failed to fetch messages');
          setMessages([]);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      }
    };

    loadMessages();
      {
        id: "3",
        senderId: "admin",
        senderName: "Admin",
        senderType: 'admin',
        content: "• Power: 100W\n• Voltage: AC 85-265V\n• Color Temperature: 6000K\n• Lumens: 10000lm\n• IP Rating: IP65\n• Lifespan: 50,000 hours\n• Beam Angle: 120°\n• Material: Aluminum Alloy\n• Warranty: 3 Years",
        timestamp: new Date("2024-01-23T09:06:00"),
        isRead: true,
        messageType: 'text'
      },
      {
        id: "4",
        senderId: "user1",
        senderName: "John Smith",
        senderType: 'user',
        content: "That sounds great! What's the minimum order quantity and pricing?",
        timestamp: new Date("2024-01-23T09:15:00"),
        isRead: true,
        messageType: 'text'
      },
      {
        id: "5",
        senderId: "admin",
        senderName: "Admin",
        senderType: 'admin',
        content: "Our MOQ is 100 pieces. Here's our tiered pricing:\n\n• 100-499 pieces: $45.00/piece\n• 500-999 pieces: $42.00/piece\n• 1000+ pieces: $38.00/piece\n\nWe also offer samples for $55.00 + shipping. Would you like me to send you a detailed quotation?",
        timestamp: new Date("2024-01-23T09:20:00"),
        isRead: true,
        messageType: 'text'
      },
      {
        id: "6",
        senderId: "user1",
        senderName: "John Smith",
        senderType: 'user',
        content: "Thank you for the quotation. We're interested in placing an order for 500 units.",
        timestamp: new Date("2024-01-23T10:30:00"),
        isRead: false,
        messageType: 'text'
  }, [selectedConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.userCompany.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'unread' && conv.unreadCount > 0) ||
                         (filterStatus === 'archived' && conv.status === 'archived');
    
    return matchesSearch && matchesStatus;
  });

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: "admin",
      senderName: "Admin",
      senderType: 'admin',
      content: newMessage,
      timestamp: new Date(),
      isRead: true,
      messageType: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Update conversation's last message
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation 
        ? { ...conv, lastMessage: newMessage, lastMessageAt: new Date() }
        : conv
    ));

    toast({
      title: "Message sent",
      description: "Your message has been sent successfully.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="h-[600px] flex bg-white rounded-lg border shadow-sm">
      {/* Conversations Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('all')}
              className="flex-1"
            >
              All
            </Button>
            <Button
              variant={filterStatus === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('unread')}
              className="flex-1"
            >
              Unread
            </Button>
            <Button
              variant={filterStatus === 'archived' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('archived')}
              className="flex-1"
            >
              Archived
            </Button>
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedConversation === conversation.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedConversation(conversation.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.userAvatar} />
                      <AvatarFallback>
                        {conversation.userName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-sm truncate">{conversation.userName}</h3>
                      <div className="flex items-center gap-1">
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 truncate">
                      {conversation.userCompany}
                    </p>
                    
                    <p className="text-sm text-gray-600 truncate mb-2">
                      {conversation.lastMessage}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getPriorityColor(conversation.priority)}`}
                      >
                        {conversation.priority}
                      </Badge>
                      {conversation.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={currentConversation.userAvatar} />
                  <AvatarFallback>
                    {currentConversation.userName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{currentConversation.userName}</h3>
                  <p className="text-sm text-muted-foreground">{currentConversation.userCompany}</p>
                </div>
                {currentConversation.isOnline && (
                  <Badge variant="secondary" className="text-green-600">
                    Online
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <FileText className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.senderType === 'admin' ? 'order-2' : 'order-1'}`}>
                      <div className="flex items-end gap-2">
                        {message.senderType === 'user' && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={currentConversation.userAvatar} />
                            <AvatarFallback className="text-xs">
                              {message.senderName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            message.senderType === 'admin'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        
                        {message.senderType === 'admin' && (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-blue-500 text-white">
                              A
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      
                      <div className={`text-xs text-muted-foreground mt-1 ${
                        message.senderType === 'admin' ? 'text-right' : 'text-left'
                      }`}>
                        {formatTime(message.timestamp)}
                        {!message.isRead && message.senderType === 'user' && (
                          <span className="ml-2 text-blue-500">• Unread</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Smile className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pr-12"
                  />
                </div>
                
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

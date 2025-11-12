import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MessageCircle, 
  Plus, 
  MoreVertical,
  User,
  Shield,
  Clock,
  CheckCircle,
  Circle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  subject?: string;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  productId?: string;
  // For buyer view
  adminName?: string;
  adminEmail?: string;
  adminCompany?: string;
  // For admin view
  buyerName?: string;
  buyerEmail?: string;
  buyerCompany?: string;
  unreadCount?: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation?: () => void;
  userRole: 'buyer' | 'admin';
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  userRole,
  searchQuery,
  onSearchChange
}: ConversationListProps) {
  const [showSearch, setShowSearch] = useState(false);

  const getConversationTitle = (conversation: Conversation) => {
    if (userRole === 'buyer') {
      return conversation.adminName || conversation.adminEmail || 'Admin';
    } else {
      return conversation.buyerName || conversation.buyerEmail || 'Buyer';
    }
  };

  const getConversationSubtitle = (conversation: Conversation) => {
    if (userRole === 'buyer') {
      return conversation.adminCompany || 'Support Team';
    } else {
      return conversation.buyerCompany || 'Customer';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Circle className="h-3 w-3 text-green-500" />;
      case 'closed':
        return <CheckCircle className="h-3 w-3 text-gray-500" />;
      default:
        return <Clock className="h-3 w-3 text-yellow-500" />;
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

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      getConversationTitle(conversation).toLowerCase().includes(query) ||
      getConversationSubtitle(conversation).toLowerCase().includes(query) ||
      conversation.subject?.toLowerCase().includes(query) ||
      conversation.productId?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-[400px] bg-white border-r border-gray-200 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary to-orange-600">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {userRole === 'buyer' ? 'Support Chats' : 'Customer Chats'}
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSearch(!showSearch)}
              className="h-8 w-8 p-0"
            >
              <Search className="h-4 w-4" />
            </Button>
            {userRole === 'buyer' && onCreateConversation && (
              <Button
                onClick={onCreateConversation}
                size="sm"
                className="h-8 w-8 p-0 bg-primary hover:bg-primary"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations, products..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
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
              {userRole === 'buyer' 
                ? 'Start a conversation with our support team'
                : 'Customer conversations will appear here'
              }
            </p>
            {userRole === 'buyer' && onCreateConversation && (
              <Button
                onClick={onCreateConversation}
                className="mt-4"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Start Chat
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-0 ${
                  selectedConversationId === conversation.id
                    ? 'bg-gradient-to-r from-primary to-orange-600 border-l-4 border-l-primary/100 shadow-md'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-600 rounded-full flex items-center justify-center shadow-md">
                        {userRole === 'buyer' ? (
                          <Shield className="h-6 w-6 text-white" />
                        ) : (
                          <User className="h-6 w-6 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {getConversationTitle(conversation)}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(conversation.status)}
                          {conversation.unreadCount && conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 truncate">
                        {getConversationSubtitle(conversation)}
                      </p>
                      
                      {conversation.subject && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {conversation.subject}
                        </p>
                      )}
                      
                      {conversation.productId && (
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="text-xs">
                            Product Inquiry
                          </Badge>
                          <span className="text-xs text-gray-500 ml-2">
                            ID: {conversation.productId}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getStatusColor(conversation.status)}`}
                        >
                          {conversation.status}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
                        </span>
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
  );
}

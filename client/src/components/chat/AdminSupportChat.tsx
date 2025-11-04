import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageCircle, 
  Search, 
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Shield,
  Package,
  Settings,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import ChatWindow from './ChatWindow';
import ConversationList from './ConversationList';
import { useToast } from '@/hooks/use-toast';

interface AdminSupportChatProps {
  userRole: 'admin';
  userId: string;
}

interface SupportTicket {
  id: string;
  type: 'buyer_admin' | 'supplier_admin';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  subject: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  lastMessageAt: string;
  buyerId?: string;
  buyerName?: string;
  buyerEmail?: string;
  supplierId?: string;
  supplierName?: string;
  supplierEmail?: string;
  unreadCount?: number;
}

export default function AdminSupportChat({ userRole, userId }: AdminSupportChatProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lastMessage');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all support conversations
  const { data: conversationsData, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/chat/conversations/admin/all'],
    queryFn: () => apiRequest('GET', '/api/chat/conversations/admin/all'),
    refetchInterval: 10000, // Refresh every 10 seconds for admin queue
  });

  // Assign conversation mutation
  const assignConversationMutation = useMutation({
    mutationFn: (data: { conversationId: string; adminId: string; priority?: string }) =>
      apiRequest('PATCH', `/api/chat/conversations/${data.conversationId}/assign`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations/admin/all'] });
      toast({
        title: "Conversation assigned",
        description: "You have been assigned to this conversation",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to assign conversation",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  // Update priority mutation
  const updatePriorityMutation = useMutation({
    mutationFn: (data: { conversationId: string; priority: string }) =>
      apiRequest('PATCH', `/api/chat/conversations/${data.conversationId}/priority`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations/admin/all'] });
      toast({
        title: "Priority updated",
        description: "Conversation priority has been updated",
      });
    }
  });

  // Close conversation mutation
  const closeConversationMutation = useMutation({
    mutationFn: (conversationId: string) =>
      apiRequest('PATCH', `/api/chat/conversations/${conversationId}/close`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/conversations/admin/all'] });
      setSelectedConversationId(null);
      toast({
        title: "Conversation closed",
        description: "The conversation has been marked as resolved",
      });
    }
  });

  const conversations = Array.isArray(conversationsData) 
    ? conversationsData 
    : (conversationsData as any)?.conversations || [];

  // Filter and sort conversations
  const filteredConversations = conversations
    .filter((conv: SupportTicket) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          conv.subject?.toLowerCase().includes(query) ||
          conv.buyerName?.toLowerCase().includes(query) ||
          conv.buyerEmail?.toLowerCase().includes(query) ||
          conv.supplierName?.toLowerCase().includes(query) ||
          conv.supplierEmail?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && conv.status !== statusFilter) return false;

      // Priority filter
      if (priorityFilter !== 'all' && conv.priority !== priorityFilter) return false;

      // Type filter
      if (typeFilter !== 'all' && conv.type !== typeFilter) return false;

      return true;
    })
    .sort((a: SupportTicket, b: SupportTicket) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'lastMessage':
        default:
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      }
    });

  const handleAssignToMe = (conversationId: string) => {
    assignConversationMutation.mutate({ conversationId, adminId: userId });
  };

  const handleUpdatePriority = (conversationId: string, priority: string) => {
    updatePriorityMutation.mutate({ conversationId, priority });
  };

  const handleCloseConversation = (conversationId: string) => {
    closeConversationMutation.mutate(conversationId);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <ArrowUp className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <ArrowUp className="h-4 w-4 text-yellow-500 rotate-45" />;
      case 'low':
      default:
        return <ArrowDown className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'assigned':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'open':
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'supplier_admin':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'buyer_admin':
      default:
        return <User className="h-4 w-4 text-green-600" />;
    }
  };

  const SupportTicketCard = ({ ticket }: { ticket: SupportTicket }) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-0 ${
        selectedConversationId === ticket.id
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-md'
          : 'hover:bg-gray-50'
      }`}
      onClick={() => setSelectedConversationId(ticket.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Priority & Type Indicators */}
          <div className="flex flex-col items-center space-y-1">
            {getPriorityIcon(ticket.priority)}
            {getTypeIcon(ticket.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {ticket.subject || 'Support Request'}
              </h4>
              <div className="flex items-center space-x-1">
                {getStatusIcon(ticket.status)}
                {ticket.unreadCount && ticket.unreadCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {ticket.unreadCount}
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <Badge variant="outline" className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority.toUpperCase()}
              </Badge>
              <Badge variant="secondary" className="text-xs capitalize">
                {ticket.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {ticket.type === 'buyer_admin' ? 'Customer' : 'Supplier'}
              </Badge>
            </div>
            
            <p className="text-xs text-gray-600 truncate">
              {ticket.type === 'buyer_admin' 
                ? `${ticket.buyerName || ticket.buyerEmail || 'Customer'}`
                : `${ticket.supplierName || ticket.supplierEmail || 'Supplier'}`
              }
            </p>
            
            {ticket.assignedToName && (
              <p className="text-xs text-blue-600 mt-1">
                Assigned to: {ticket.assignedToName}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">
                {new Date(ticket.lastMessageAt).toLocaleString()}
              </span>
              {!ticket.assignedTo && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAssignToMe(ticket.id);
                  }}
                  className="text-xs h-6"
                >
                  Assign to me
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex h-full bg-gray-50">
      {/* Support Queue */}
      <div className="w-96 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Support Queue
            </h2>
            <Badge variant="secondary" className="text-xs">
              {filteredConversations.length} tickets
            </Badge>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tickets..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="buyer_admin">Customer</SelectItem>
                <SelectItem value="supplier_admin">Supplier</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastMessage">Last Message</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="created">Created Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tickets List */}
        <div className="flex-1 overflow-y-auto p-2">
          {conversationsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <MessageCircle className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No support tickets found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((ticket: SupportTicket) => (
                <SupportTicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        {selectedConversationId ? (
          <div className="h-full flex flex-col">
            {/* Ticket Actions */}
            <div className="border-b border-gray-200 p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold">Support Ticket</h3>
                  <Badge variant="outline" className="text-xs">
                    ID: {selectedConversationId.slice(-8)}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Select 
                    value={filteredConversations.find(c => c.id === selectedConversationId)?.priority || 'medium'}
                    onValueChange={(priority) => handleUpdatePriority(selectedConversationId, priority)}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCloseConversation(selectedConversationId)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolve
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1">
              <ChatWindow
                conversationId={selectedConversationId}
                userRole={userRole}
                userId={userId}
                className="h-full border-0"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Shield className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Admin Support Center
              </h3>
              <p className="text-gray-500 mb-6">
                Select a support ticket from the queue to start helping customers and suppliers.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-green-600" />
                  Customer Support
                </div>
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-blue-600" />
                  Supplier Support
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
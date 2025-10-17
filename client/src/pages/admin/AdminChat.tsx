import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Package
} from 'lucide-react';
import ImprovedChatInterface from '@/components/chat/ImprovedChatInterface';
import Breadcrumb from '@/components/Breadcrumb';
import { useToast } from '@/hooks/use-toast';

export default function AdminChat() {
  const [showChatInterface, setShowChatInterface] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'all' | 'product'>('all');
  const { toast } = useToast();

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

  // Get unread count
  const { data: unreadData } = useQuery({
    queryKey: ['/api/chat/unread-count'],
    queryFn: () => apiRequest('GET', '/api/chat/unread-count'),
  });

  const user = (userData as any)?.user;
  const conversations = (conversationsData as any)?.conversations || [];
  const unreadCount = (unreadData as any)?.count || 0;


  // Get unique products for filter
  const uniqueProducts = Array.from(
    new Set(
      conversations
        .filter((conv: any) => conv.productId && conv.productName)
        .map((conv: any) => ({ id: conv.productId, name: conv.productName }))
    )
  );

  // Filter conversations
  const filteredConversations = conversations.filter((conv: any) => {
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

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setShowChatInterface(true);
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
    setShowChatInterface(false);
    setSelectedConversationId(null);
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

  if (showChatInterface && user.id) {
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
            <ImprovedChatInterface userRole="admin" userId={user.id} />
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
              <Button
                onClick={() => setShowChatInterface(true)}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Open Chat Interface
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Total Conversations</p>
                  <p className="text-3xl font-bold text-white">{conversations.length}</p>
                </div>
                <MessageCircle className="h-8 w-8 text-blue-200" />
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
                           className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         >
                           <option value="all">All Status</option>
                           <option value="active">Active</option>
                           <option value="closed">Closed</option>
                           <option value="archived">Archived</option>
                         </select>
                         
                         <select
                           value={productFilter}
                           onChange={(e) => setProductFilter(e.target.value)}
                           className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
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
                    onClick={() => handleSelectConversation(conversation.id)}
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
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
                      {conversation.subject && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.subject}
                        </p>
                      )}
                      {conversation.productId && (
                        <div className="flex items-center mt-1">
                          <Badge variant="outline" className="text-xs">
                            Product Inquiry
                          </Badge>
                          <span className="text-xs text-gray-500 ml-2">
                            Product ID: {conversation.productId}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Last message: {new Date(conversation.lastMessageAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
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

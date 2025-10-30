import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Bell, 
  Info, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Shield, 
  Truck, 
  MessageSquare,
  User,
  Package,
  FileText,
  Clock,
  Search,
  Trash2,
  CheckSquare,
  RefreshCw
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
  relatedId?: string;
  relatedType?: 'inquiry' | 'quotation' | 'order' | 'chat' | 'rfq';
}

export default function NotificationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  // Get buyer notifications
  const { data: notificationsResp, isLoading } = useQuery({
    queryKey: ['/api/buyer/notifications'],
    queryFn: () => apiRequest('GET', '/api/buyer/notifications'),
  });
  const allNotifications: Notification[] = (notificationsResp as any)?.notifications || [];
  
  // Filter notifications
  const filteredNotifications = allNotifications.filter((notification: Notification) => {
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || notification.relatedType === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'read' && notification.read) ||
      (statusFilter === 'unread' && !notification.read);
    return matchesSearch && matchesType && matchesStatus;
  });
  
  // Filter by tab
  const notifications = activeTab === 'all' 
    ? filteredNotifications
    : activeTab === 'unread'
    ? filteredNotifications.filter(n => !n.read)
    : activeTab === 'read'
    ? filteredNotifications.filter(n => n.read)
    : filteredNotifications;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('PATCH', `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/notifications'] });
      toast({
        title: "Success",
        description: "Notification marked as read.",
      });
    }
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/notifications'] });
      toast({
        title: "Info",
        description: "Notification deleted.",
      });
    }
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', '/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/buyer/notifications'] });
      toast({
        title: "Success",
        description: "All notifications marked as read.",
      });
    }
  });

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const deleteNotification = (id: string) => {
    deleteNotificationMutation.mutate(id);
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBadgeVariant = (type: Notification['type']) => {
    switch (type) {
      case 'info': return 'outline';
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'secondary';
    }
  };

  const getRelatedIcon = (relatedType?: string) => {
    switch (relatedType) {
      case 'inquiry': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'quotation': return <Package className="h-4 w-4 text-green-500" />;
      case 'order': return <Truck className="h-4 w-4 text-purple-500" />;
      case 'chat': return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case 'rfq': return <User className="h-4 w-4 text-indigo-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const unreadCount = allNotifications.filter(n => !n.read).length;
  const readCount = allNotifications.filter(n => n.read).length;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      {/* Hero Section with Gradient */}
      <section className="relative py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-blue-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-600/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-sm text-white/95 shadow-lg mb-6">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Stay
              <span className="bg-gradient-to-r from-blue-200 via-white to-blue-200 bg-clip-text text-transparent block">
                Updated
              </span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-8">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up! No new notifications'}
            </p>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 text-white/80 text-sm mt-8">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-300" />
                <span>Verified Suppliers</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-yellow-300" />
                <span>Fast Shipping</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-300" />
                <span>Direct Communication</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards - Only Total, Unread, and Read */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="bg-white  shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{allNotifications.length}</div>
                <div className="text-xs text-gray-600">Total</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{unreadCount}</div>
                <div className="text-xs text-gray-600">Unread</div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{readCount}</div>
                <div className="text-xs text-gray-600">Read</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter Controls */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="inquiry">Inquiries</SelectItem>
                      <SelectItem value="quotation">Quotations</SelectItem>
                      <SelectItem value="order">Orders</SelectItem>
                      <SelectItem value="rfq">RFQs</SelectItem>
                      <SelectItem value="chat">Chat</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setTypeFilter('all');
                      setStatusFilter('all');
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Notifications</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="read">Read ({readCount})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bell className="h-12 w-12 text-blue-600" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-4">No notifications found</h2>
                      <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                          ? 'Try adjusting your search criteria'
                          : "You're all caught up! We'll notify you when there's something new."}
                      </p>
                      {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSearchQuery('');
                            setTypeFilter('all');
                            setStatusFilter('all');
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-3">
                        {notifications.map(notification => (
                          <Card
                            key={notification.id}
                            className={`group relative overflow-hidden transition-all duration-300 ${
                              notification.read 
                                ? 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md' 
                                : 'bg-white border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl hover:border-l-blue-600'
                            }`}
                          >
                            {/* Unread Indicator */}
                            {!notification.read && (
                              <div className="absolute top-4 right-4 w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                            )}
                            
                            <CardContent className="p-5">
                              <div className="flex items-start gap-4">
                                {/* Icon Section */}
                                <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                                  notification.type === 'info' 
                                    ? 'bg-blue-50 text-blue-600' 
                                    : notification.type === 'success'
                                    ? 'bg-green-50 text-green-600'
                                    : notification.type === 'error'
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-yellow-50 text-yellow-600'
                                }`}>
                                  <div className="flex items-center justify-center w-full h-full">
                                    {getIcon(notification.type)}
                                  </div>
                                </div>
                                
                                {/* Content Section */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-start gap-2 mb-2 flex-wrap">
                                        <h3 className={`font-bold text-base leading-tight ${
                                          notification.read ? 'text-gray-700' : 'text-gray-900'
                                        }`}>
                                          {notification.title}
                                        </h3>
                                        {!notification.read && (
                                          <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5 font-medium">
                                            New
                                          </Badge>
                                        )}
                                      </div>
                                      <p className={`text-sm leading-relaxed mb-3 ${
                                        notification.read ? 'text-gray-500' : 'text-gray-700'
                                      }`}>
                                        {notification.message}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* Metadata Row */}
                                  <div className="flex items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      {notification.relatedType && (
                                        <Badge 
                                          variant="outline" 
                                          className="flex items-center gap-1.5 text-xs px-2 py-0.5 border-gray-300 bg-gray-50"
                                        >
                                          {getRelatedIcon(notification.relatedType)}
                                          <span className="capitalize text-gray-600">{notification.relatedType}</span>
                                        </Badge>
                                      )}
                                      <Badge 
                                        variant={getBadgeVariant(notification.type)} 
                                        className="text-xs px-2 py-0.5 font-medium"
                                      >
                                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                                      </Badge>
                                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{new Date(notification.timestamp).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                    {!notification.read && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => markAsRead(notification.id)}
                                        disabled={markAsReadMutation.isPending}
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-3 text-xs font-medium"
                                      >
                                        <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                                        Mark as Read
                                      </Button>
                                    )}
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => deleteNotification(notification.id)} 
                                      disabled={deleteNotificationMutation.isPending}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-3 text-xs font-medium"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
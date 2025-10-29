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
import Breadcrumb from '@/components/Breadcrumb';
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
  Filter,
  Trash2,
  CheckSquare,
  Eye,
  Sparkles,
  TrendingUp,
  Activity,
  RefreshCw,
  Settings
} from 'lucide-react';
import { useState } from 'react';

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

export default function AdminNotificationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  // Get admin notifications
  const { data: notificationsResp, isLoading } = useQuery({
    queryKey: ['/api/admin/notifications'],
    queryFn: () => apiRequest('GET', '/api/admin/notifications'),
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
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
  const infoCount = allNotifications.filter(n => n.type === 'info').length;
  const successCount = allNotifications.filter(n => n.type === 'success').length;
  const errorCount = allNotifications.filter(n => n.type === 'error').length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto p-6">
        {/* Breadcrumb */}
        <Breadcrumb items={[{ label: "Notifications" }]} />
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Notification Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Stay updated with all system activities, inquiries, orders, and important alerts
              </p>
            </div>
            <div className="flex gap-3">
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  disabled={markAllAsReadMutation.isPending}
                  size="sm"
                  variant="outline"
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark All as Read'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Notifications</p>
                  <p className="text-3xl font-bold">{allNotifications.length}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Unread</p>
                  <p className="text-3xl font-bold">{unreadCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Read</p>
                  <p className="text-3xl font-bold">{readCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Info</p>
                  <p className="text-3xl font-bold">{infoCount}</p>
                </div>
                <Info className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Errors</p>
                  <p className="text-3xl font-bold">{errorCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-200" />
              </div>
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
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Info, CheckCircle, XCircle, AlertTriangle, Shield, Truck, MessageSquare, User, Package, FileText, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Breadcrumb from '@/components/Breadcrumb';

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

  // Get admin notifications
  const { data: notificationsResp, isLoading } = useQuery({
    queryKey: ['/api/admin/notifications'],
    queryFn: () => apiRequest('GET', '/api/admin/notifications'),
  });
  const notifications: Notification[] = (notificationsResp as any)?.notifications || [];

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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Admin', href: '/admin' },
          { label: 'Notifications', href: '/admin/notifications' }
        ]}
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
         
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Notifications</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllAsRead}
            disabled={markAllAsReadMutation.isPending}
            className="border-blue-200 hover:bg-blue-50"
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Notifications Card */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">No notifications</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                You're all caught up! We'll notify you when there's something new.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-200 text-gray-600' 
                        : 'bg-white border-blue-200 shadow-md'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className={`font-bold text-lg ${
                              notification.read ? 'text-gray-600' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </h3>
                            {notification.relatedType && (
                              <div className="flex items-center gap-1">
                                {getRelatedIcon(notification.relatedType)}
                                <span className="text-xs text-gray-500 capitalize">
                                  {notification.relatedType}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className={`text-sm leading-relaxed ${
                            notification.read ? 'text-gray-500' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </p>
                        </div>
                        <Badge variant={getBadgeVariant(notification.type)} className="text-xs ml-2">
                          {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                          {new Date(notification.timestamp).toLocaleString()}
                        </p>
                        <div className="flex gap-2">
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => markAsRead(notification.id)}
                              disabled={markAsReadMutation.isPending}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              Mark as Read
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteNotification(notification.id)} 
                            disabled={deleteNotificationMutation.isPending}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
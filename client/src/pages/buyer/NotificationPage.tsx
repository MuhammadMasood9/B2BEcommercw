import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Info, CheckCircle, XCircle, AlertTriangle, Shield, Truck, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

  // Get buyer notifications
  const { data: notificationsResp, isLoading } = useQuery({
    queryKey: ['/api/buyer/notifications'],
    queryFn: () => apiRequest('GET', '/api/buyer/notifications'),
  });
  const notifications: Notification[] = (notificationsResp as any)?.notifications || [];

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

  const unreadCount = notifications.filter(n => !n.read).length;

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
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Notification Center</CardTitle>
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
            </CardHeader>
            <CardContent className="pt-4">
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
                              <h3 className={`font-bold text-lg mb-2 ${
                                notification.read ? 'text-gray-600' : 'text-gray-900'
                              }`}>
                                {notification.title}
                              </h3>
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
      </main>
      <Footer />
    </div>
  );
}
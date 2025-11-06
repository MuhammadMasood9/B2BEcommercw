import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  MessageSquare,
  ShoppingCart,
  Package,
  DollarSign,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Settings,
  Filter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface SupplierNotification {
  id: string;
  type: 'inquiry' | 'order' | 'product_approved' | 'product_rejected' | 'payout' | 'review' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface SupplierNotificationCenterProps {
  className?: string;
}

const notificationIcons = {
  inquiry: MessageSquare,
  order: ShoppingCart,
  product_approved: CheckCircle,
  product_rejected: AlertTriangle,
  payout: DollarSign,
  review: Star,
  system: Bell,
};

const priorityColors = {
  low: "bg-gray-100 text-gray-800 border-gray-200",
  medium: "bg-blue-100 text-blue-800 border-blue-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

const priorityBadgeColors = {
  low: "secondary",
  medium: "outline",
  high: "default",
  critical: "destructive",
} as const;

export function SupplierNotificationCenter({ className }: SupplierNotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SupplierNotification[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock notifications for demonstration
  useEffect(() => {
    const mockNotifications: SupplierNotification[] = [
      {
        id: "1",
        type: "inquiry",
        priority: "high",
        title: "New Product Inquiry",
        message: "ABC Corp is interested in your Industrial Pumps and requested a quote",
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        isRead: false,
        actionUrl: "/supplier/inquiries/inq_123",
        actionLabel: "Respond to Inquiry",
        metadata: { inquiryId: "inq_123", companyName: "ABC Corp", productName: "Industrial Pumps" }
      },
      {
        id: "2",
        type: "order",
        priority: "critical",
        title: "New Order Received",
        message: "Order #ORD-2024-001 for $15,000 worth of products needs processing",
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isRead: false,
        actionUrl: "/supplier/orders/ORD-2024-001",
        actionLabel: "Process Order",
        metadata: { orderId: "ORD-2024-001", amount: 15000, itemCount: 5 }
      },
      {
        id: "3",
        type: "product_approved",
        priority: "medium",
        title: "Product Approved",
        message: "Your product 'Heavy Duty Motor' has been approved and is now live",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: true,
        actionUrl: "/supplier/products/prod_456",
        actionLabel: "View Product",
        metadata: { productId: "prod_456", productName: "Heavy Duty Motor" }
      },
      {
        id: "4",
        type: "payout",
        priority: "medium",
        title: "Payout Processed",
        message: "Your monthly payout of $2,450 has been processed and will arrive in 2-3 business days",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        isRead: false,
        actionUrl: "/supplier/earnings/payouts",
        actionLabel: "View Payouts",
        metadata: { amount: 2450, payoutId: "payout_789" }
      },
      {
        id: "5",
        type: "review",
        priority: "low",
        title: "New Customer Review",
        message: "You received a 5-star review from TechStart Inc for excellent service",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        isRead: true,
        actionUrl: "/supplier/reviews",
        actionLabel: "View Reviews",
        metadata: { rating: 5, reviewerName: "TechStart Inc" }
      },
      {
        id: "6",
        type: "product_rejected",
        priority: "high",
        title: "Product Needs Attention",
        message: "Your product 'Hydraulic Valve' was rejected due to incomplete specifications",
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        isRead: false,
        actionUrl: "/supplier/products/prod_321",
        actionLabel: "Fix Product",
        metadata: { productId: "prod_321", productName: "Hydraulic Valve", reason: "incomplete specifications" }
      },
      {
        id: "7",
        type: "system",
        priority: "low",
        title: "Profile Completion",
        message: "Complete your supplier profile to increase visibility by 40%",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        isRead: true,
        actionUrl: "/supplier/store/profile",
        actionLabel: "Complete Profile",
        metadata: { completionPercentage: 75 }
      }
    ];

    setNotifications(mockNotifications);
    setIsLoading(false);
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab !== "all" && notification.type !== activeTab) return false;
    if (showOnlyUnread && notification.isRead) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderNotification = (notification: SupplierNotification) => {
    const IconComponent = notificationIcons[notification.type];
    
    return (
      <Card 
        key={notification.id}
        className={cn(
          "mb-3 transition-all duration-200 hover:shadow-md cursor-pointer",
          !notification.isRead && "border-l-4 border-l-blue-500",
          priorityColors[notification.priority]
        )}
        onClick={() => !notification.isRead && markAsRead(notification.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className={cn(
                "p-2 rounded-lg",
                notification.priority === 'critical' ? "bg-red-100" :
                notification.priority === 'high' ? "bg-orange-100" :
                notification.priority === 'medium' ? "bg-blue-100" : "bg-gray-100"
              )}>
                <IconComponent className={cn(
                  "h-4 w-4",
                  notification.priority === 'critical' ? "text-red-600" :
                  notification.priority === 'high' ? "text-orange-600" :
                  notification.priority === 'medium' ? "text-blue-600" : "text-gray-600"
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={cn(
                    "text-sm font-medium truncate",
                    !notification.isRead && "font-semibold"
                  )}>
                    {notification.title}
                  </h4>
                  <div className="flex items-center space-x-2 ml-2">
                    <Badge variant={priorityBadgeColors[notification.priority]} className="text-xs">
                      {notification.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {getRelativeTime(notification.timestamp)}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {notification.message}
                </p>
                
                {notification.actionUrl && (
                  <div className="flex items-center justify-between">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = notification.actionUrl!;
                      }}
                    >
                      {notification.actionLabel || "View Details"}
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
            {criticalCount > 0 && (
              <Badge variant="outline" className="text-xs border-red-500 text-red-600">
                {criticalCount} Urgent
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOnlyUnread(!showOnlyUnread)}
              className={cn(showOnlyUnread && "bg-accent")}
            >
              {showOnlyUnread ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={markAllAsRead}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All as Read
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Filter className="h-4 w-4 mr-2" />
                  Notification Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({filteredNotifications.length})
            </TabsTrigger>
            <TabsTrigger value="inquiry">
              Inquiries ({notifications.filter(n => n.type === 'inquiry').length})
            </TabsTrigger>
            <TabsTrigger value="order">
              Orders ({notifications.filter(n => n.type === 'order').length})
            </TabsTrigger>
            <TabsTrigger value="system">
              System ({notifications.filter(n => n.type === 'system' || n.type === 'product_approved' || n.type === 'product_rejected').length})
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <ScrollArea className="h-96">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredNotifications.length > 0 ? (
                <div className="space-y-2">
                  {filteredNotifications.map(renderNotification)}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications found</p>
                  {showOnlyUnread && (
                    <p className="text-sm mt-1">Try showing all notifications</p>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
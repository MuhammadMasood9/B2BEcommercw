import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bell,
  MessageSquare,
  FileText,
  ShoppingCart,
  DollarSign,
  Package,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  Trash2,
  Settings,
  Filter,
  Star,
  Users
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

interface BuyerNotification {
  id: string;
  type: 'quotation_received' | 'inquiry_response' | 'order_update' | 'rfq_response' | 'message' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

interface BuyerNotificationCenterProps {
  className?: string;
}

const notificationIcons = {
  quotation_received: DollarSign,
  inquiry_response: MessageSquare,
  order_update: ShoppingCart,
  rfq_response: FileText,
  message: MessageSquare,
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

export function BuyerNotificationCenter({ className }: BuyerNotificationCenterProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<BuyerNotification[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock notifications for demonstration
  useEffect(() => {
    const mockNotifications: BuyerNotification[] = [
      {
        id: "1",
        type: "quotation_received",
        priority: "high",
        title: "New Quotation Received",
        message: "TechSupply Co. sent you a quotation for Industrial Pumps - $2,500 for 10 units",
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        isRead: false,
        actionUrl: "/buyer/quotations/quot_123",
        actionLabel: "Review Quotation",
        metadata: { quotationId: "quot_123", supplierName: "TechSupply Co.", amount: 2500, productName: "Industrial Pumps" }
      },
      {
        id: "2",
        type: "inquiry_response",
        priority: "medium",
        title: "Inquiry Response",
        message: "GlobalParts Ltd responded to your inquiry about Heavy Duty Motors",
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        isRead: false,
        actionUrl: "/buyer/inquiries/inq_456",
        actionLabel: "View Response",
        metadata: { inquiryId: "inq_456", supplierName: "GlobalParts Ltd", productName: "Heavy Duty Motors" }
      },
      {
        id: "3",
        type: "order_update",
        priority: "critical",
        title: "Order Shipped",
        message: "Your order #ORD-2024-001 has been shipped and is on its way",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: true,
        actionUrl: "/buyer/orders/ORD-2024-001",
        actionLabel: "Track Order",
        metadata: { orderId: "ORD-2024-001", trackingNumber: "TRK123456789" }
      },
      {
        id: "4",
        type: "rfq_response",
        priority: "high",
        title: "RFQ Responses Received",
        message: "3 suppliers responded to your RFQ for Manufacturing Equipment",
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        isRead: false,
        actionUrl: "/buyer/rfqs/rfq_789",
        actionLabel: "Compare Responses",
        metadata: { rfqId: "rfq_789", responseCount: 3, category: "Manufacturing Equipment" }
      },
      {
        id: "5",
        type: "message",
        priority: "medium",
        title: "New Message",
        message: "You have a new message from MegaSupplier Inc regarding your recent inquiry",
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        isRead: true,
        actionUrl: "/messages/conv_321",
        actionLabel: "Read Message",
        metadata: { conversationId: "conv_321", senderName: "MegaSupplier Inc" }
      },
      {
        id: "6",
        type: "quotation_received",
        priority: "medium",
        title: "Competitive Quotation",
        message: "EliteManufacturing sent a competitive quote 15% lower than your current best offer",
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        isRead: false,
        actionUrl: "/buyer/quotations/quot_654",
        actionLabel: "Compare Quotes",
        metadata: { quotationId: "quot_654", supplierName: "EliteManufacturing", savingsPercent: 15 }
      },
      {
        id: "7",
        type: "system",
        priority: "low",
        title: "Profile Optimization",
        message: "Complete your buyer profile to receive better-matched supplier recommendations",
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        isRead: true,
        actionUrl: "/buyer/profile",
        actionLabel: "Complete Profile",
        metadata: { completionPercentage: 65 }
      },
      {
        id: "8",
        type: "order_update",
        priority: "medium",
        title: "Payment Confirmation",
        message: "Payment confirmed for Order #ORD-2024-002. Supplier will begin processing shortly",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        isRead: true,
        actionUrl: "/buyer/orders/ORD-2024-002",
        actionLabel: "View Order",
        metadata: { orderId: "ORD-2024-002", amount: 5200 }
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

  const renderNotification = (notification: BuyerNotification) => {
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
                
                {/* Additional metadata display */}
                {notification.metadata && (
                  <div className="flex items-center gap-2 mb-2">
                    {notification.metadata.supplierName && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {notification.metadata.supplierName}
                      </Badge>
                    )}
                    {notification.metadata.amount && (
                      <Badge variant="outline" className="text-xs">
                        <DollarSign className="h-3 w-3 mr-1" />
                        ${notification.metadata.amount.toLocaleString()}
                      </Badge>
                    )}
                    {notification.metadata.responseCount && (
                      <Badge variant="outline" className="text-xs">
                        {notification.metadata.responseCount} responses
                      </Badge>
                    )}
                  </div>
                )}
                
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
            <TabsTrigger value="quotation_received">
              Quotes ({notifications.filter(n => n.type === 'quotation_received').length})
            </TabsTrigger>
            <TabsTrigger value="order_update">
              Orders ({notifications.filter(n => n.type === 'order_update').length})
            </TabsTrigger>
            <TabsTrigger value="message">
              Messages ({notifications.filter(n => n.type === 'message' || n.type === 'inquiry_response').length})
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
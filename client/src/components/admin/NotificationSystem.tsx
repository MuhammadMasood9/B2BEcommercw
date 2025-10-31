import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info,
  Bell,
  BellOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}

const notificationConfig = {
  success: {
    icon: CheckCircle,
    bgColor: "bg-green-50 border-green-200",
    iconColor: "text-green-600",
    titleColor: "text-green-800"
  },
  error: {
    icon: AlertCircle,
    bgColor: "bg-red-50 border-red-200", 
    iconColor: "text-red-600",
    titleColor: "text-red-800"
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-yellow-50 border-yellow-200",
    iconColor: "text-yellow-600", 
    titleColor: "text-yellow-800"
  },
  info: {
    icon: Info,
    bgColor: "bg-blue-50 border-blue-200",
    iconColor: "text-blue-600",
    titleColor: "text-blue-800"
  }
};

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4'
};

export default function NotificationSystem({ 
  notifications, 
  onRemove, 
  position = 'top-right',
  maxVisible = 5 
}: NotificationSystemProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const visibleNotifications = notifications.slice(0, maxVisible);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Auto-remove success and info notifications after 5 seconds
  useEffect(() => {
    const timers = notifications
      .filter(n => n.type === 'success' || n.type === 'info')
      .map(notification => 
        setTimeout(() => onRemove(notification.id), 5000)
      );

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [notifications, onRemove]);

  if (notifications.length === 0) return null;

  return (
    <div className={cn("fixed z-50 space-y-2 w-80", positionClasses[position])}>
      {/* Notification Toggle */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMinimized(!isMinimized)}
          className="bg-white shadow-md"
        >
          {isMinimized ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          {notifications.length > 0 && (
            <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
              {notifications.length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Notifications List */}
      {!isMinimized && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {visibleNotifications.map((notification) => {
            const config = notificationConfig[notification.type];
            const IconComponent = config.icon;

            return (
              <Card
                key={notification.id}
                className={cn(
                  "p-4 shadow-lg border transition-all duration-300 hover:shadow-xl",
                  config.bgColor,
                  "animate-in slide-in-from-right-full"
                )}
              >
                <div className="flex items-start gap-3">
                  <IconComponent className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconColor)} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className={cn("font-medium text-sm", config.titleColor)}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(notification.id)}
                        className="h-6 w-6 p-0 hover:bg-white/50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Show count if there are more notifications */}
          {notifications.length > maxVisible && (
            <Card className="p-2 text-center bg-gray-50">
              <p className="text-sm text-muted-foreground">
                +{notifications.length - maxVisible} more notifications
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
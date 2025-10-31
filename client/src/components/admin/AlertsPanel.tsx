import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  X,
  Eye,
  Clock,
  Filter,
  Bell,
  BellOff
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: 'system' | 'security' | 'business' | 'compliance' | 'fraud_detection' | 'quality_control';
  severity: 'critical' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged?: boolean;
  entityId?: string;
  entityType?: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  summary: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  onViewDetails?: (alert: Alert) => void;
  onFilterChange?: (severity: string | null) => void;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    color: "text-red-600",
    bgColor: "bg-red-50 border-red-200",
    badgeColor: "bg-red-100 text-red-800"
  },
  error: {
    icon: AlertCircle,
    color: "text-orange-600", 
    bgColor: "bg-orange-50 border-orange-200",
    badgeColor: "bg-orange-100 text-orange-800"
  },
  warning: {
    icon: AlertCircle,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50 border-yellow-200", 
    badgeColor: "bg-yellow-100 text-yellow-800"
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-100 text-blue-800"
  }
};

const typeLabels = {
  system: "System",
  security: "Security",
  business: "Business",
  compliance: "Compliance", 
  fraud_detection: "Fraud",
  quality_control: "Quality"
};

export default function AlertsPanel({ 
  alerts, 
  summary, 
  onAcknowledge, 
  onDismiss, 
  onViewDetails,
  onFilterChange 
}: AlertsPanelProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const filteredAlerts = alerts.filter(alert => {
    if (selectedSeverity && alert.severity !== selectedSeverity) return false;
    if (!showAcknowledged && alert.acknowledged) return false;
    return true;
  });

  const handleFilterChange = (severity: string | null) => {
    setSelectedSeverity(severity);
    onFilterChange?.(severity);
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            System Alerts
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAcknowledged(!showAcknowledged)}
            >
              {showAcknowledged ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Alert Summary */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={selectedSeverity === null ? "default" : "outline"}
            size="sm"
            onClick={() => handleFilterChange(null)}
          >
            All ({alerts.length})
          </Button>
          {Object.entries(summary).map(([severity, count]) => {
            const config = severityConfig[severity as keyof typeof severityConfig];
            return (
              <Button
                key={severity}
                variant={selectedSeverity === severity ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(severity)}
                className={selectedSeverity === severity ? "" : config.color}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)} ({count})
              </Button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-6 space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-lg font-medium">No alerts to show</p>
                <p className="text-sm">All systems are running smoothly</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const config = severityConfig[alert.severity];
                const IconComponent = config.icon;

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-4 rounded-lg border transition-all hover:shadow-md",
                      config.bgColor,
                      alert.acknowledged && "opacity-60"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className={cn("h-5 w-5 mt-0.5", config.color)} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{alert.title}</h4>
                              <Badge className={config.badgeColor}>
                                {alert.severity}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {typeLabels[alert.type]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {alert.message}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(alert.timestamp)}
                              </span>
                              {alert.entityType && alert.entityId && (
                                <span>
                                  {alert.entityType}: {alert.entityId}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {!alert.acknowledged && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onAcknowledge?.(alert.id)}
                                title="Acknowledge"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewDetails?.(alert)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDismiss?.(alert.id)}
                              title="Dismiss"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
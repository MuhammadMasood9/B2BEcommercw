import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Settings, 
  Palette, 
  Layout, 
  RefreshCw,
  Save,
  RotateCcw,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSettings {
  refreshInterval: number;
  autoRefresh: boolean;
  timeRange: string;
  selectedMetrics: string[];
  alertFilters: string[];
}

interface DashboardCustomizationProps {
  settings: DashboardSettings;
  onSettingsChange: (settings: Partial<DashboardSettings>) => void;
  isOpen: boolean;
  onClose: () => void;
}

const availableMetrics = [
  { id: 'revenue', label: 'Revenue', description: 'Total platform revenue' },
  { id: 'suppliers', label: 'Suppliers', description: 'Active supplier count' },
  { id: 'products', label: 'Products', description: 'Total products' },
  { id: 'orders', label: 'Orders', description: 'Order volume' },
  { id: 'commission', label: 'Commission', description: 'Commission revenue' },
  { id: 'rating', label: 'Rating', description: 'Average supplier rating' },
  { id: 'response', label: 'Response Rate', description: 'Supplier response rate' },
  { id: 'approvals', label: 'Pending Approvals', description: 'Items awaiting approval' }
];

const timeRangeOptions = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y', label: '1 Year' }
];

const alertFilterOptions = [
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
  { value: 'error', label: 'Error', color: 'bg-orange-500' },
  { value: 'warning', label: 'Warning', color: 'bg-yellow-500' },
  { value: 'info', label: 'Info', color: 'bg-blue-500' }
];

export default function DashboardCustomization({ 
  settings, 
  onSettingsChange, 
  isOpen, 
  onClose 
}: DashboardCustomizationProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: DashboardSettings = {
      refreshInterval: 30000,
      autoRefresh: true,
      timeRange: '30d',
      selectedMetrics: ['revenue', 'suppliers', 'products', 'orders'],
      alertFilters: ['critical', 'error', 'warning']
    };
    setLocalSettings(defaultSettings);
  };

  const toggleMetric = (metricId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      selectedMetrics: prev.selectedMetrics.includes(metricId)
        ? prev.selectedMetrics.filter(id => id !== metricId)
        : [...prev.selectedMetrics, metricId]
    }));
  };

  const toggleAlertFilter = (filterValue: string) => {
    setLocalSettings(prev => ({
      ...prev,
      alertFilters: prev.alertFilters.includes(filterValue)
        ? prev.alertFilters.filter(f => f !== filterValue)
        : [...prev.alertFilters, filterValue]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Dashboard Customization
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Auto Refresh Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Auto Refresh
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-refresh">Enable Auto Refresh</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically update dashboard data
                </p>
              </div>
              <Switch
                id="auto-refresh"
                checked={localSettings.autoRefresh}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, autoRefresh: checked }))
                }
              />
            </div>

            {localSettings.autoRefresh && (
              <div className="space-y-2">
                <Label>Refresh Interval: {localSettings.refreshInterval / 1000}s</Label>
                <Slider
                  value={[localSettings.refreshInterval]}
                  onValueChange={([value]) => 
                    setLocalSettings(prev => ({ ...prev, refreshInterval: value }))
                  }
                  min={5000}
                  max={300000}
                  step={5000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>5s</span>
                  <span>5m</span>
                </div>
              </div>
            )}
          </div>

          {/* Time Range */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Default Time Range
            </h3>
            
            <div className="grid grid-cols-2 gap-2">
              {timeRangeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={localSettings.timeRange === option.value ? "default" : "outline"}
                  onClick={() => 
                    setLocalSettings(prev => ({ ...prev, timeRange: option.value }))
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Visible Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visible Metrics
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {availableMetrics.map((metric) => {
                const isSelected = localSettings.selectedMetrics.includes(metric.id);
                
                return (
                  <div
                    key={metric.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                      isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                    )}
                    onClick={() => toggleMetric(metric.id)}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <Eye className="h-4 w-4 text-blue-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                      <div>
                        <p className="font-medium">{metric.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                    {isSelected && (
                      <Badge variant="secondary">Visible</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Filters */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Alert Filters
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {alertFilterOptions.map((filter) => {
                const isSelected = localSettings.alertFilters.includes(filter.value);
                
                return (
                  <div
                    key={filter.value}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      isSelected ? "bg-gray-50 border-gray-300" : "hover:bg-gray-50"
                    )}
                    onClick={() => toggleAlertFilter(filter.value)}
                  >
                    <div className={cn("w-3 h-3 rounded-full", filter.color)} />
                    <span className="font-medium">{filter.label}</span>
                    {isSelected && (
                      <Badge variant="outline" className="ml-auto">
                        On
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
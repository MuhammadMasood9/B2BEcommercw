import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Calendar,
  Download,
  RefreshCw,
  Filter
} from "lucide-react";
import { useState } from "react";

interface TrendData {
  date: string;
  revenue: number;
  orders: number;
  suppliers: number;
  products: number;
}

interface MetricsChartsProps {
  trends: TrendData[];
  timeRange: string;
  onTimeRangeChange?: (range: string) => void;
  onRefresh?: () => void;
  onExport?: (chartType: string) => void;
}

export default function MetricsCharts({ 
  trends, 
  timeRange, 
  onTimeRangeChange, 
  onRefresh, 
  onExport 
}: MetricsChartsProps) {
  const [activeChart, setActiveChart] = useState("revenue");

  const timeRangeOptions = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "1y", label: "1 Year" }
  ];

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatNumber = (value: number) => value.toLocaleString();

  // Simple chart rendering using CSS (in production, you'd use a proper charting library)
  const renderSimpleChart = (data: number[], label: string, color: string, formatter: (n: number) => string) => {
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold">{label}</h4>
            <p className="text-sm text-muted-foreground">
              Current: {formatter(data[data.length - 1] || 0)}
            </p>
          </div>
          <Badge variant="outline" className={`${color} border-current`}>
            {data.length} data points
          </Badge>
        </div>
        
        <div className="h-64 flex items-end justify-between gap-1 p-4 bg-gray-50 rounded-lg">
          {data.map((value, index) => {
            const height = ((value - minValue) / range) * 200 + 20;
            return (
              <div
                key={index}
                className={`${color} rounded-t-sm min-w-[8px] flex-1 transition-all hover:opacity-80 cursor-pointer group relative`}
                style={{ height: `${height}px` }}
                title={`${trends[index]?.date}: ${formatter(value)}`}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {formatter(value)}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{trends[0]?.date}</span>
          <span>{trends[trends.length - 1]?.date}</span>
        </div>
      </div>
    );
  };

  const chartConfigs = {
    revenue: {
      data: trends.map(t => t.revenue),
      label: "Revenue Trend",
      color: "bg-green-500",
      formatter: formatCurrency
    },
    orders: {
      data: trends.map(t => t.orders),
      label: "Orders Trend", 
      color: "bg-blue-500",
      formatter: formatNumber
    },
    suppliers: {
      data: trends.map(t => t.suppliers),
      label: "New Suppliers",
      color: "bg-purple-500", 
      formatter: formatNumber
    },
    products: {
      data: trends.map(t => t.products),
      label: "New Products",
      color: "bg-orange-500",
      formatter: formatNumber
    }
  };

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Platform Metrics Trends
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {timeRangeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={timeRange === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => onTimeRangeChange?.(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport?.(activeChart)}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chart Tabs */}
      <Tabs value={activeChart} onValueChange={setActiveChart}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        {Object.entries(chartConfigs).map(([key, config]) => (
          <TabsContent key={key} value={key}>
            <Card>
              <CardContent className="p-6">
                {renderSimpleChart(config.data, config.label, config.color, config.formatter)}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(chartConfigs).map(([key, config]) => {
          const data = config.data;
          const current = data[data.length - 1] || 0;
          const previous = data[data.length - 2] || 0;
          const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
          
          return (
            <Card key={key} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {config.label}
                  </p>
                  <p className="text-2xl font-bold">
                    {config.formatter(current)}
                  </p>
                </div>
                <div className={`w-3 h-12 ${config.color} rounded`} />
              </div>
              <div className="mt-2 flex items-center gap-1">
                <TrendingUp className={`h-4 w-4 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground">vs previous</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart3, 
  TrendingUp, 
  PieChart, 
  LineChart,
  Activity
} from "lucide-react";

interface ChartData {
  monthlyTrends: Array<{
    month: string;
    year: number;
    views: number;
    inquiries: number;
    orders: number;
    revenue: number;
    newProducts: number;
    newCustomers: number;
  }>;
  categoryPerformance: Array<{
    categoryId: string;
    categoryName: string;
    productCount: number;
    totalViews: number;
    totalInquiries: number;
    totalOrders: number;
    totalRevenue: number;
  }>;
  customersByCountry: Array<{
    country: string;
    customerCount: number;
    totalOrders: number;
    totalRevenue: number;
  }>;
}

interface AnalyticsChartsProps {
  data: ChartData;
}

export default function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  
  // Simple bar chart component using CSS
  const SimpleBarChart = ({ 
    data, 
    dataKey, 
    title, 
    color = "bg-blue-500" 
  }: { 
    data: any[], 
    dataKey: string, 
    title: string, 
    color?: string 
  }) => {
    const maxValue = Math.max(...data.map(item => item[dataKey]));
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.slice(0, 6).map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {item.month ? `${item.month} ${item.year}` : 
                     item.categoryName || item.country || `Item ${index + 1}`}
                  </span>
                  <span className="text-muted-foreground">
                    {typeof item[dataKey] === 'number' ? 
                      item[dataKey].toLocaleString() : item[dataKey]}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`${color} h-2 rounded-full transition-all duration-500`}
                    style={{ 
                      width: `${maxValue > 0 ? (item[dataKey] / maxValue) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Simple line chart component using CSS
  const SimpleLineChart = ({ 
    data, 
    dataKey, 
    title, 
    color = "border-blue-500" 
  }: { 
    data: any[], 
    dataKey: string, 
    title: string, 
    color?: string 
  }) => {
    const maxValue = Math.max(...data.map(item => item[dataKey]));
    const minValue = Math.min(...data.map(item => item[dataKey]));
    const range = maxValue - minValue;
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-48 flex items-end justify-between gap-1 border-b border-l border-muted p-4">
            {data.slice(-12).map((item, index) => {
              const height = range > 0 ? ((item[dataKey] - minValue) / range) * 100 : 0;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className={`w-full ${color.replace('border-', 'bg-')} rounded-t transition-all duration-500`}
                    style={{ height: `${Math.max(height, 2)}%` }}
                  ></div>
                  <div className="text-xs text-muted-foreground mt-2 transform -rotate-45 origin-left">
                    {item.month?.slice(0, 3)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{minValue.toLocaleString()}</span>
            <span>{maxValue.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Simple pie chart component using CSS
  const SimplePieChart = ({ 
    data, 
    dataKey, 
    labelKey, 
    title 
  }: { 
    data: any[], 
    dataKey: string, 
    labelKey: string, 
    title: string 
  }) => {
    const total = data.reduce((sum, item) => sum + item[dataKey], 0);
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-red-500', 'bg-indigo-500'
    ];
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Legend */}
            <div className="space-y-2">
              {data.slice(0, 6).map((item, index) => {
                const percentage = total > 0 ? (item[dataKey] / total) * 100 : 0;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                      <span className="text-sm font-medium">
                        {item[labelKey]}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Visual representation */}
            <div className="flex h-4 rounded-full overflow-hidden bg-muted">
              {data.slice(0, 6).map((item, index) => {
                const percentage = total > 0 ? (item[dataKey] / total) * 100 : 0;
                return (
                  <div
                    key={index}
                    className={colors[index % colors.length]}
                    style={{ width: `${percentage}%` }}
                  ></div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Revenue Trend */}
      <SimpleLineChart
        data={data.monthlyTrends}
        dataKey="revenue"
        title="Revenue Trend"
        color="border-green-500"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views vs Orders Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Views vs Orders Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.monthlyTrends.slice(-6).map((trend, index) => {
                const conversionRate = trend.views > 0 ? (trend.orders / trend.views) * 100 : 0;
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{trend.month} {trend.year}</span>
                      <span className="text-muted-foreground">{conversionRate.toFixed(2)}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Views: {trend.views.toLocaleString()}</div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full"
                            style={{ 
                              width: `${Math.min((trend.views / Math.max(...data.monthlyTrends.map(t => t.views))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Orders: {trend.orders}</div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div 
                            className="bg-green-500 h-1 rounded-full"
                            style={{ 
                              width: `${Math.min((trend.orders / Math.max(...data.monthlyTrends.map(t => t.orders))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Category Performance */}
        <SimplePieChart
          data={data.categoryPerformance}
          dataKey="totalRevenue"
          labelKey="categoryName"
          title="Revenue by Category"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Views */}
        <SimpleBarChart
          data={data.monthlyTrends}
          dataKey="views"
          title="Monthly Views"
          color="bg-blue-500"
        />

        {/* Customer Distribution */}
        <SimpleBarChart
          data={data.customersByCountry}
          dataKey="customerCount"
          title="Customers by Country"
          color="bg-purple-500"
        />
      </div>

      {/* Inquiries Trend */}
      <SimpleLineChart
        data={data.monthlyTrends}
        dataKey="inquiries"
        title="Inquiries Trend"
        color="border-orange-500"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Products */}
        <SimpleBarChart
          data={data.monthlyTrends}
          dataKey="newProducts"
          title="New Products Added"
          color="bg-green-500"
        />

        {/* New Customers */}
        <SimpleBarChart
          data={data.monthlyTrends}
          dataKey="newCustomers"
          title="New Customers Acquired"
          color="bg-indigo-500"
        />
      </div>
    </div>
  );
}
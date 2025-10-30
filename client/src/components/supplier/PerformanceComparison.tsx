import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Award,
  BarChart3,
  Users,
  Eye,
  MessageSquare,
  ShoppingCart
} from "lucide-react";

interface BenchmarkData {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topPerformers: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  category: 'performance' | 'engagement' | 'conversion';
}

interface ComparisonPeriod {
  current: {
    period: string;
    metrics: Record<string, number>;
  };
  previous: {
    period: string;
    metrics: Record<string, number>;
  };
}

export default function PerformanceComparison() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([]);
  const [comparison, setComparison] = useState<ComparisonPeriod | null>(null);
  const [loading, setLoading] = useState(true);
  const [comparisonPeriod, setComparisonPeriod] = useState("month");

  // Fetch benchmark data
  const fetchBenchmarks = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would fetch from API
      // For now, using mock data with realistic industry benchmarks
      const mockBenchmarks: BenchmarkData[] = [
        {
          metric: "Conversion Rate",
          yourValue: 3.2,
          industryAverage: 2.5,
          topPerformers: 5.8,
          unit: "%",
          trend: "up",
          trendValue: 0.3,
          category: "conversion"
        },
        {
          metric: "Response Time",
          yourValue: 2.5,
          industryAverage: 4.2,
          topPerformers: 1.8,
          unit: "hours",
          trend: "down",
          trendValue: -0.5,
          category: "performance"
        },
        {
          metric: "Product Views per Day",
          yourValue: 450,
          industryAverage: 320,
          topPerformers: 850,
          unit: "views",
          trend: "up",
          trendValue: 25,
          category: "engagement"
        },
        {
          metric: "Inquiry Response Rate",
          yourValue: 85,
          industryAverage: 70,
          topPerformers: 95,
          unit: "%",
          trend: "stable",
          trendValue: 0,
          category: "performance"
        },
        {
          metric: "Average Order Value",
          yourValue: 2850,
          industryAverage: 2200,
          topPerformers: 4500,
          unit: "$",
          trend: "up",
          trendValue: 150,
          category: "conversion"
        },
        {
          metric: "Customer Retention",
          yourValue: 68,
          industryAverage: 55,
          topPerformers: 82,
          unit: "%",
          trend: "up",
          trendValue: 3,
          category: "engagement"
        }
      ];
      
      setBenchmarks(mockBenchmarks);
      
      // Mock comparison data
      const mockComparison: ComparisonPeriod = {
        current: {
          period: "This Month",
          metrics: {
            views: 13500,
            inquiries: 432,
            orders: 89,
            revenue: 253650,
            customers: 67
          }
        },
        previous: {
          period: "Last Month", 
          metrics: {
            views: 12200,
            inquiries: 398,
            orders: 76,
            revenue: 218400,
            customers: 58
          }
        }
      };
      
      setComparison(mockComparison);
      
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmarks();
  }, [comparisonPeriod]);

  const getPerformanceLevel = (yourValue: number, industryAverage: number, topPerformers: number) => {
    if (yourValue >= topPerformers * 0.9) return { level: "excellent", color: "text-green-600", bg: "bg-green-100" };
    if (yourValue >= industryAverage * 1.2) return { level: "above average", color: "text-blue-600", bg: "bg-blue-100" };
    if (yourValue >= industryAverage * 0.8) return { level: "average", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { level: "below average", color: "text-red-600", bg: "bg-red-100" };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === "$") return `$${value.toLocaleString()}`;
    if (unit === "%") return `${value}%`;
    return `${value.toLocaleString()} ${unit}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Performance Comparison</h2>
          <p className="text-muted-foreground">See how you stack up against industry benchmarks</p>
        </div>
        <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Period Comparison */}
      {comparison && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Period Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {[
                { key: 'views', label: 'Views', icon: Eye },
                { key: 'inquiries', label: 'Inquiries', icon: MessageSquare },
                { key: 'orders', label: 'Orders', icon: ShoppingCart },
                { key: 'revenue', label: 'Revenue', icon: Target },
                { key: 'customers', label: 'Customers', icon: Users }
              ].map(metric => {
                const current = comparison.current.metrics[metric.key];
                const previous = comparison.previous.metrics[metric.key];
                const change = calculateChange(current, previous);
                const Icon = metric.icon;
                
                return (
                  <div key={metric.key} className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {metric.key === 'revenue' ? `$${current.toLocaleString()}` : current.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">{metric.label}</div>
                    <div className={`flex items-center justify-center gap-1 text-sm ${
                      change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {change > 0 ? <TrendingUp className="w-3 h-3" /> : 
                       change < 0 ? <TrendingDown className="w-3 h-3" /> : 
                       <Minus className="w-3 h-3" />}
                      {Math.abs(change).toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Industry Benchmarks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {benchmarks.map((benchmark, index) => {
          const performance = getPerformanceLevel(benchmark.yourValue, benchmark.industryAverage, benchmark.topPerformers);
          const progressPercentage = Math.min((benchmark.yourValue / benchmark.topPerformers) * 100, 100);
          
          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{benchmark.metric}</CardTitle>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(benchmark.trend)}
                    <Badge className={performance.bg + " " + performance.color}>
                      {performance.level}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Your Performance */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Your Performance</span>
                    <span className="text-xl font-bold">{formatValue(benchmark.yourValue, benchmark.unit)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Benchmarks */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Industry Average</span>
                    <span className="font-medium">{formatValue(benchmark.industryAverage, benchmark.unit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Top Performers</span>
                    <span className="font-medium">{formatValue(benchmark.topPerformers, benchmark.unit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trend</span>
                    <span className={`font-medium flex items-center gap-1 ${
                      benchmark.trend === 'up' ? 'text-green-600' : 
                      benchmark.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {getTrendIcon(benchmark.trend)}
                      {benchmark.trendValue > 0 ? '+' : ''}{benchmark.trendValue} {benchmark.unit}
                    </span>
                  </div>
                </div>

                {/* Gap Analysis */}
                <div className="pt-2 border-t">
                  <div className="text-sm">
                    {benchmark.yourValue >= benchmark.topPerformers * 0.9 ? (
                      <div className="text-green-600 flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        Excellent performance! You're among the top performers.
                      </div>
                    ) : benchmark.yourValue >= benchmark.industryAverage ? (
                      <div className="text-blue-600">
                        Above average! Gap to top performers: {formatValue(benchmark.topPerformers - benchmark.yourValue, benchmark.unit)}
                      </div>
                    ) : (
                      <div className="text-orange-600">
                        Room for improvement. Gap to average: {formatValue(benchmark.industryAverage - benchmark.yourValue, benchmark.unit)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {benchmarks.filter(b => getPerformanceLevel(b.yourValue, b.industryAverage, b.topPerformers).level === "excellent").length}
              </div>
              <div className="text-muted-foreground">Excellent Metrics</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {benchmarks.filter(b => getPerformanceLevel(b.yourValue, b.industryAverage, b.topPerformers).level === "above average").length}
              </div>
              <div className="text-muted-foreground">Above Average</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {benchmarks.filter(b => ["average", "below average"].includes(getPerformanceLevel(b.yourValue, b.industryAverage, b.topPerformers).level)).length}
              </div>
              <div className="text-muted-foreground">Need Improvement</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  MessageCircle, 
  Clock, 
  TrendingUp, 
  Users,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Download,
  Filter
} from 'lucide-react';

interface ChatAnalyticsProps {
  userRole: 'admin' | 'supplier';
  userId: string;
}

interface AnalyticsData {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  resolutionRate: number;
  customerSatisfaction: number;
  conversationsByType: Array<{ type: string; count: number; percentage: number }>;
  messagesByDay: Array<{ date: string; messages: number; conversations: number }>;
  responseTimesByHour: Array<{ hour: number; avgTime: number }>;
  topCategories: Array<{ category: string; count: number; avgResolutionTime: number }>;
  performanceMetrics: {
    firstResponseTime: number;
    avgConversationLength: number;
    escalationRate: number;
    reopenRate: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ChatAnalytics({ userRole, userId }: ChatAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('7d');
  const [conversationType, setConversationType] = useState('all');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/chat/analytics', userRole, timeRange, conversationType],
    queryFn: () => apiRequest('GET', `/api/chat/analytics?role=${userRole}&timeRange=${timeRange}&type=${conversationType}`),
  });

  const analytics = analyticsData as AnalyticsData;

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatPercentage = (value: number) => `${Math.round(value * 100) / 100}%`;

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue',
    format = 'number'
  }: {
    title: string;
    value: number;
    change?: number;
    icon: any;
    color?: string;
    format?: 'number' | 'time' | 'percentage';
  }) => {
    const formatValue = () => {
      switch (format) {
        case 'time':
          return formatTime(value);
        case 'percentage':
          return formatPercentage(value);
        default:
          return value.toLocaleString();
      }
    };

    const getColorClasses = () => {
      switch (color) {
        case 'green':
          return 'text-green-600 bg-green-100';
        case 'yellow':
          return 'text-yellow-600 bg-yellow-100';
        case 'red':
          return 'text-red-600 bg-red-100';
        default:
          return 'text-blue-600 bg-blue-100';
      }
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{formatValue()}</p>
              {change !== undefined && (
                <div className="flex items-center mt-1">
                  <TrendingUp className={`h-4 w-4 mr-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last period</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full ${getColorClasses()}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chat Analytics</h2>
          <p className="text-gray-600">
            {userRole === 'admin' ? 'Platform-wide chat performance' : 'Your chat performance metrics'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={conversationType} onValueChange={setConversationType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="buyer_admin">Customer Support</SelectItem>
              <SelectItem value="supplier_admin">Supplier Support</SelectItem>
              <SelectItem value="buyer_supplier">Buyer-Supplier</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Conversations"
          value={analytics.totalConversations}
          change={12.5}
          icon={MessageCircle}
          color="blue"
        />
        <MetricCard
          title="Active Conversations"
          value={analytics.activeConversations}
          change={-2.1}
          icon={Users}
          color="green"
        />
        <MetricCard
          title="Avg Response Time"
          value={analytics.avgResponseTime}
          change={-15.3}
          icon={Clock}
          color="yellow"
          format="time"
        />
        <MetricCard
          title="Resolution Rate"
          value={analytics.resolutionRate}
          change={8.7}
          icon={CheckCircle}
          color="green"
          format="percentage"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Messages Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.messagesByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="messages" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Messages"
                />
                <Line 
                  type="monotone" 
                  dataKey="conversations" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Conversations"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversation Types */}
        <Card>
          <CardHeader>
            <CardTitle>Conversation Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.conversationsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, percentage }) => `${type}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.conversationsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Times by Hour */}
        <Card>
          <CardHeader>
            <CardTitle>Response Times by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.responseTimesByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip formatter={(value) => [formatTime(value as number), 'Avg Response Time']} />
                <Bar dataKey="avgTime" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topCategories.map((category, index) => (
                <div key={category.category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium capitalize">{category.category.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-500">
                        Avg resolution: {formatTime(category.avgResolutionTime)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">{category.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(analytics.performanceMetrics.firstResponseTime)}
              </div>
              <div className="text-sm text-gray-600">First Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatTime(analytics.performanceMetrics.avgConversationLength)}
              </div>
              <div className="text-sm text-gray-600">Avg Conversation Length</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {formatPercentage(analytics.performanceMetrics.escalationRate)}
              </div>
              <div className="text-sm text-gray-600">Escalation Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatPercentage(analytics.performanceMetrics.reopenRate)}
              </div>
              <div className="text-sm text-gray-600">Reopen Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Satisfaction */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Satisfaction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-green-600 mb-2">
                {analytics.customerSatisfaction.toFixed(1)}
              </div>
              <div className="text-lg text-gray-600">out of 5.0</div>
              <div className="flex items-center justify-center mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.round(analytics.customerSatisfaction)
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  >
                    ★
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
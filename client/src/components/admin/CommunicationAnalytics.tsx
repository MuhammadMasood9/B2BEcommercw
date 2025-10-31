import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Bell,
  Users,
  Eye,
  MousePointer,
  AlertTriangle,
  Calendar,
  Download
} from 'lucide-react';

interface DeliveryAnalytics {
  date: string;
  channel: string;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  failedCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

interface PerformanceMetrics {
  period: string;
  totalCommunications: number;
  activeCommunications: number;
  queuedNotifications: number;
  deliveryMetrics: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  };
}

interface CommunicationSummary {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function CommunicationAnalytics() {
  const [analytics, setAnalytics] = useState<DeliveryAnalytics[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [summary, setSummary] = useState<CommunicationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedChannel, setSelectedChannel] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedChannel]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (selectedChannel !== 'all') {
        params.append('channel', selectedChannel);
      }

      const [analyticsRes, performanceRes] = await Promise.all([
        fetch(`/api/admin/communications/analytics/delivery?${params}`),
        fetch(`/api/admin/communications/analytics/performance?period=${dateRange}`),
      ]);

      const [analyticsData, performanceData] = await Promise.all([
        analyticsRes.json(),
        performanceRes.json(),
      ]);

      setAnalytics(analyticsData.analytics || []);
      setSummary(analyticsData.summary || null);
      setPerformance(performanceData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'push': return <Smartphone className="h-4 w-4" />;
      case 'in_app': return <Bell className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  // Prepare chart data
  const chartData = analytics.reduce((acc: any[], item) => {
    const date = new Date(item.date).toLocaleDateString();
    const existingItem = acc.find(d => d.date === date);
    
    if (existingItem) {
      existingItem.sent += item.sentCount;
      existingItem.delivered += item.deliveredCount;
      existingItem.opened += item.openedCount;
      existingItem.clicked += item.clickedCount;
      existingItem.bounced += item.bouncedCount;
      existingItem.failed += item.failedCount;
    } else {
      acc.push({
        date,
        sent: item.sentCount,
        delivered: item.deliveredCount,
        opened: item.openedCount,
        clicked: item.clickedCount,
        bounced: item.bouncedCount,
        failed: item.failedCount,
      });
    }
    
    return acc;
  }, []);

  // Channel distribution data
  const channelData = analytics.reduce((acc: any[], item) => {
    const existingChannel = acc.find(c => c.name === item.channel);
    
    if (existingChannel) {
      existingChannel.value += item.sentCount;
    } else {
      acc.push({
        name: item.channel,
        value: item.sentCount,
      });
    }
    
    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Communication Analytics</h1>
          <p className="text-gray-600">Track delivery performance and engagement metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="push">Push</SelectItem>
              <SelectItem value="in_app">In-App</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sent</p>
                  <p className="text-2xl font-bold">{formatNumber(summary.totalSent)}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Delivery Rate</p>
                  <p className="text-2xl font-bold">{formatPercentage(summary.deliveryRate)}</p>
                </div>
                <Mail className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Open Rate</p>
                  <p className="text-2xl font-bold">{formatPercentage(summary.openRate)}</p>
                </div>
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Click Rate</p>
                  <p className="text-2xl font-bold">{formatPercentage(summary.clickRate)}</p>
                </div>
                <MousePointer className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Trends</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {performance && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Communications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total</span>
                      <span className="font-semibold">{performance.totalCommunications}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active</span>
                      <span className="font-semibold">{performance.activeCommunications}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Queued</span>
                      <span className="font-semibold">{performance.queuedNotifications}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Delivery Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sent</span>
                      <span className="font-semibold">{formatNumber(performance.deliveryMetrics.totalSent)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Delivered</span>
                      <span className="font-semibold">{formatNumber(performance.deliveryMetrics.totalDelivered)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Delivery Rate</span>
                      <span className="font-semibold">{formatPercentage(performance.deliveryMetrics.deliveryRate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Opened</span>
                      <span className="font-semibold">{formatNumber(performance.deliveryMetrics.totalOpened)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Clicked</span>
                      <span className="font-semibold">{formatNumber(performance.deliveryMetrics.totalClicked)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Open Rate</span>
                      <span className="font-semibold">{formatPercentage(performance.deliveryMetrics.openRate)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="delivery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke="#8884d8" name="Sent" />
                  <Line type="monotone" dataKey="delivered" stroke="#82ca9d" name="Delivered" />
                  <Line type="monotone" dataKey="failed" stroke="#ff7c7c" name="Failed" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="delivered" fill="#82ca9d" name="Delivered" />
                  <Bar dataKey="opened" fill="#8884d8" name="Opened" />
                  <Bar dataKey="clicked" fill="#ffc658" name="Clicked" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.reduce((acc: any[], item) => {
                    const existing = acc.find(c => c.channel === item.channel);
                    if (existing) {
                      existing.sent += item.sentCount;
                      existing.delivered += item.deliveredCount;
                      existing.opened += item.openedCount;
                      existing.clicked += item.clickedCount;
                    } else {
                      acc.push({
                        channel: item.channel,
                        sent: item.sentCount,
                        delivered: item.deliveredCount,
                        opened: item.openedCount,
                        clicked: item.clickedCount,
                      });
                    }
                    return acc;
                  }, []).map((channel) => (
                    <div key={channel.channel} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getChannelIcon(channel.channel)}
                        <div>
                          <p className="font-medium capitalize">{channel.channel}</p>
                          <p className="text-sm text-gray-600">
                            {formatNumber(channel.sent)} sent
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {channel.sent > 0 ? formatPercentage((channel.delivered / channel.sent) * 100) : '0%'}
                        </p>
                        <p className="text-sm text-gray-600">delivery rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
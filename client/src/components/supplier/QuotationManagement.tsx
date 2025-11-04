import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  BarChart3, 
  Settings, 
  Plus,
  TrendingUp,
  DollarSign,
  Target,
  Clock
} from 'lucide-react';
import QuotationCreator from './QuotationCreator';
import QuotationTemplateManager from './QuotationTemplateManager';
import QuotationTracker from './QuotationTracker';
import QuotationAnalytics from './QuotationAnalytics';
import { useQuery } from '@tanstack/react-query';

interface QuotationOverview {
  totalQuotations: number;
  pendingQuotations: number;
  acceptedQuotations: number;
  winRate: number;
  totalValue: number;
  recentActivity: Array<{
    id: string;
    type: 'quotation_sent' | 'quotation_accepted' | 'quotation_rejected';
    title: string;
    timestamp: string;
    value?: number;
  }>;
}

const QuotationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateQuotation, setShowCreateQuotation] = useState(false);

  // Fetch overview data
  const { data: overviewData } = useQuery({
    queryKey: ['quotation-overview'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/quotations/overview', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch overview');
      return response.json();
    }
  });

  const overview: QuotationOverview = overviewData?.success ? overviewData.overview : {
    totalQuotations: 0,
    pendingQuotations: 0,
    acceptedQuotations: 0,
    winRate: 0,
    totalValue: 0,
    recentActivity: []
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'quotation_sent':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'quotation_accepted':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'quotation_rejected':
        return <Clock className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'quotation_sent':
        return 'Quotation Sent';
      case 'quotation_accepted':
        return 'Quotation Accepted';
      case 'quotation_rejected':
        return 'Quotation Rejected';
      default:
        return 'Activity';
    }
  };

  if (showCreateQuotation) {
    return (
      <QuotationCreator
        onSuccess={() => setShowCreateQuotation(false)}
        onCancel={() => setShowCreateQuotation(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quotation Management</h1>
          <p className="text-gray-600">Create, track, and analyze your quotations</p>
        </div>
        <Button onClick={() => setShowCreateQuotation(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quotation
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracker">Tracker</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="creator">Creator</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Quotations</p>
                    <p className="text-3xl font-bold">{overview.totalQuotations}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Win Rate</p>
                    <p className="text-3xl font-bold text-green-600">{overview.winRate}%</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-3xl font-bold">{formatCurrency(overview.totalValue)}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-orange-600">{overview.pendingQuotations}</p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowCreateQuotation(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Quotation
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('templates')}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Templates
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('tracker')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Track Quotations
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab('analytics')}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {overview.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {overview.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getActivityIcon(activity.type)}
                          <div>
                            <p className="font-medium">{activity.title}</p>
                            <p className="text-sm text-gray-600">
                              {getActivityLabel(activity.type)} • {new Date(activity.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {activity.value && (
                          <Badge variant="secondary">
                            {formatCurrency(activity.value)}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Recent Activity</h3>
                    <p className="text-gray-600 mb-4">Start creating quotations to see activity here.</p>
                    <Button onClick={() => setShowCreateQuotation(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Quotation
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {overview.acceptedQuotations}
                  </div>
                  <p className="text-gray-600">Accepted Quotations</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {overview.totalQuotations > 0 
                      ? `${((overview.acceptedQuotations / overview.totalQuotations) * 100).toFixed(1)}% of total`
                      : 'No quotations yet'
                    }
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {overview.winRate}%
                  </div>
                  <p className="text-gray-600">Win Rate</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {overview.winRate > 30 ? 'Above average' : 'Room for improvement'}
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {formatCurrency(overview.totalValue / Math.max(overview.totalQuotations, 1))}
                  </div>
                  <p className="text-gray-600">Avg Quote Value</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Per quotation average
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracker">
          <QuotationTracker />
        </TabsContent>

        <TabsContent value="templates">
          <QuotationTemplateManager />
        </TabsContent>

        <TabsContent value="analytics">
          <QuotationAnalytics />
        </TabsContent>

        <TabsContent value="creator">
          <QuotationCreator />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuotationManagement;
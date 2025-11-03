import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
  Users,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import DisputeQueue from '@/components/admin/DisputeQueue';
import DisputeDetailView from '@/components/admin/DisputeDetailView';
import DisputeResolution from '@/components/admin/DisputeResolution';
import RefundProcessor from '@/components/admin/RefundProcessor';

interface Dispute {
  id: string;
  orderId: string;
  buyerId: string;
  supplierId: string;
  type: string;
  title: string;
  description: string;
  amount?: number;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt?: string;
  escalationLevel: number;
  buyerName?: string;
  supplierName?: string;
}

interface DisputeAnalytics {
  totalDisputes: number;
  openDisputes: number;
  resolvedDisputes: number;
  averageResolutionTime: number;
  disputesByType: Array<{ type: string; count: number; percentage: number }>;
  totalRefundAmount: number;
  resolutionRate: number;
}

const AdminDisputes: React.FC = () => {
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [activeTab, setActiveTab] = useState('queue');

  // Fetch dispute analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/disputes/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/disputes/analytics', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dispute analytics');
      }

      const result = await response.json();
      return result.data?.analytics as DisputeAnalytics;
    },
  });

  const handleSelectDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
    setActiveTab('detail');
  };

  const handleBackToQueue = () => {
    setSelectedDispute(null);
    setActiveTab('queue');
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
          <p className="text-gray-600">
            Manage and resolve buyer-supplier disputes
          </p>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Disputes</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.totalDisputes}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Disputes</p>
                  <p className="text-3xl font-bold text-red-600">{analytics.openDisputes}</p>
                </div>
                <Clock className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                  <p className="text-3xl font-bold text-green-600">{analytics.resolutionRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Resolution Time</p>
                  <p className="text-3xl font-bold text-blue-600">{analytics.averageResolutionTime}h</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Dispute Queue
            {analytics?.openDisputes && (
              <Badge variant="destructive" className="ml-1">
                {analytics.openDisputes}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="detail" disabled={!selectedDispute}>
            <Users className="h-4 w-4 mr-2" />
            Dispute Detail
          </TabsTrigger>
          <TabsTrigger value="resolution">
            <CheckCircle className="h-4 w-4 mr-2" />
            Resolution Tools
          </TabsTrigger>
          <TabsTrigger value="refunds">
            <DollarSign className="h-4 w-4 mr-2" />
            Refund Processing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-6">
          <DisputeQueue onSelectDispute={handleSelectDispute} />
        </TabsContent>

        <TabsContent value="detail" className="mt-6">
          {selectedDispute ? (
            <DisputeDetailView dispute={selectedDispute} onBack={handleBackToQueue} />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Select a dispute from the queue to view details</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resolution" className="mt-6">
          <DisputeResolution />
        </TabsContent>

        <TabsContent value="refunds" className="mt-6">
          <RefundProcessor />
        </TabsContent>
      </Tabs>

      {/* Dispute Type Breakdown */}
      {analytics?.disputesByType && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Dispute Types Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.disputesByType.map((type) => (
                <div key={type.type} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 capitalize">{type.type}</h3>
                    <Badge variant="outline">{type.percentage.toFixed(1)}%</Badge>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{type.count}</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${type.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDisputes;
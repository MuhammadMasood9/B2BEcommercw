import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Building,
  Calendar,
  DollarSign,
  FileText,
  Send,
  Paperclip,
  Filter,
  Search,
  TrendingUp,
  BarChart3,
  Eye
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
// import { useToast } from "@/hooks/use-toast";

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
  assignedMediator?: string;
  mediationNotes?: string;
  resolutionSummary?: string;
  resolutionType?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  escalationLevel: number;
  escalatedAt?: string;
  escalationReason?: string;
}

interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderType: string;
  message: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: string;
}

interface DisputeAnalytics {
  totalDisputes: number;
  openDisputes: number;
  resolvedDisputes: number;
  averageResolutionTime: number;
  disputesByType: Array<{ type: string; count: number; percentage: number }>;
  disputesBySupplier: Array<{ supplierId: string; supplierName: string; disputes: number; rate: number }>;
  resolutionTypes: Array<{ type: string; count: number; percentage: number }>;
  trends: {
    daily: Array<{ date: string; disputes: number; resolved: number }>;
    monthly: Array<{ month: string; disputes: number; resolved: number }>;
  };
}

const DisputeResolution: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    supplierId: '',
    buyerId: '',
    limit: 50,
    offset: 0,
  });

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const queryClient = useQueryClient();

  // Fetch disputes
  const { data: disputesData, isLoading: disputesLoading } = useQuery({
    queryKey: ['/api/admin/disputes', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const result = await apiRequest('GET', `/api/admin/disputes?${params}`);
      return result?.data ?? [];
    },
  });

  // Fetch dispute analytics
  const { data: analytics } = useQuery({
    queryKey: ['/api/admin/disputes/analytics'],
    queryFn: async () => {
      const result = await apiRequest('GET', '/api/admin/disputes/analytics');
      return (result?.data?.analytics ?? []) as DisputeAnalytics;
    },
    enabled: showAnalytics,
  });

  // Fetch dispute messages
  const { data: messages } = useQuery({
    queryKey: ['/api/admin/disputes', selectedDispute?.id, 'messages'],
    queryFn: async () => {
      if (!selectedDispute) return [];

      const result = await apiRequest('GET', `/api/admin/disputes/${selectedDispute.id}/messages`);
      return (result?.data?.messages ?? []) as DisputeMessage[];
    },
    enabled: !!selectedDispute,
  });

  // Update dispute status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ disputeId, status, resolutionData }: {
      disputeId: string;
      status: string;
      resolutionData?: any;
    }) => {
      return apiRequest('PUT', `/api/admin/disputes/${disputeId}/status`, {
        status,
        ...resolutionData,
      });
    },
    onSuccess: () => {
      toast.success('Dispute status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/disputes'] });
      setSelectedDispute(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update dispute status');
    },
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async ({ disputeId, message, isInternal }: {
      disputeId: string;
      message: string;
      isInternal: boolean;
    }) => {
      return apiRequest('POST', `/api/admin/disputes/${disputeId}/messages`, {
        message,
        isInternal,
      });
    },
    onSuccess: () => {
      toast.success('Message added successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/disputes', selectedDispute?.id, 'messages'] });
      setNewMessage('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add message');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'mediation':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusUpdate = (status: string, resolutionData?: any) => {
    if (!selectedDispute) return;

    updateStatusMutation.mutate({
      disputeId: selectedDispute.id,
      status,
      resolutionData,
    });
  };

  const handleAddMessage = () => {
    if (!selectedDispute || !newMessage.trim()) return;

    addMessageMutation.mutate({
      disputeId: selectedDispute.id,
      message: newMessage,
      isInternal,
    });
  };

  const disputes = disputesData?.disputes || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispute Resolution</h1>
          <p className="text-gray-600">Manage and resolve customer disputes</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </button>
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && analytics && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dispute Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{analytics.totalDisputes}</div>
              <div className="text-sm text-gray-600">Total Disputes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{analytics.openDisputes}</div>
              <div className="text-sm text-gray-600">Open Disputes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.resolvedDisputes}</div>
              <div className="text-sm text-gray-600">Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.averageResolutionTime}h</div>
              <div className="text-sm text-gray-600">Avg Resolution Time</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Disputes by Type</h3>
              <div className="space-y-2">
                {analytics.disputesByType.map((item) => (
                  <div key={item.type} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{item.type.replace('_', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{item.count}</span>
                      <span className="text-xs text-gray-500">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Resolution Types</h3>
              <div className="space-y-2">
                {analytics.resolutionTypes.map((item) => (
                  <div key={item.type} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">{item.type.replace('_', ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{item.count}</span>
                      <span className="text-xs text-gray-500">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="mediation">Mediation</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search disputes..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', supplierId: '', buyerId: '', limit: 50, offset: 0 })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Disputes List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Active Disputes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dispute
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {disputes.map((dispute: Dispute) => (
                <tr key={dispute.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {dispute.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        Order: {dispute.orderId}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">
                      {dispute.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dispute.amount ? formatCurrency(dispute.amount) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(dispute.status)}`}>
                      {dispute.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(dispute.priority)}`}>
                      {dispute.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(dispute.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedDispute(dispute)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dispute Details Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Dispute Resolution - {selectedDispute.title}
                </h2>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dispute Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Dispute Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedDispute.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Type</label>
                        <p className="text-sm text-gray-900 capitalize">{selectedDispute.type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Amount</label>
                        <p className="text-sm text-gray-900">
                          {selectedDispute.amount ? formatCurrency(selectedDispute.amount) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Status</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedDispute.status)}`}>
                          {selectedDispute.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Priority</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(selectedDispute.priority)}`}>
                          {selectedDispute.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Actions */}
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Resolution Actions</h4>
                    <div className="space-y-2">
                      {selectedDispute.status === 'open' && (
                        <button
                          onClick={() => handleStatusUpdate('under_review')}
                          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                        >
                          Start Review
                        </button>
                      )}
                      {selectedDispute.status === 'under_review' && (
                        <button
                          onClick={() => handleStatusUpdate('mediation')}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Begin Mediation
                        </button>
                      )}
                      {['under_review', 'mediation'].includes(selectedDispute.status) && (
                        <button
                          onClick={() => handleStatusUpdate('resolved', {
                            resolutionType: 'refund',
                            resolutionSummary: 'Dispute resolved with full refund'
                          })}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Resolve with Refund
                        </button>
                      )}
                      {selectedDispute.status === 'resolved' && (
                        <button
                          onClick={() => handleStatusUpdate('closed')}
                          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                        >
                          Close Dispute
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Messages</h3>
                  <div className="border border-gray-200 rounded-lg">
                    <div className="h-64 overflow-y-auto p-4 space-y-3">
                      {messages?.map((message: DisputeMessage) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.senderType === 'admin'
                              ? 'bg-blue-50 ml-4'
                              : 'bg-gray-50 mr-4'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {message.senderType === 'admin' ? 'Admin' : 'User'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{message.message}</p>
                          {message.isInternal && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full mt-2">
                              Internal Note
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add Message */}
                    <div className="border-t border-gray-200 p-4">
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id="internal"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor="internal" className="text-sm text-gray-600">
                          Internal note (not visible to parties)
                        </label>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
                        />
                        <button
                          onClick={handleAddMessage}
                          disabled={!newMessage.trim() || addMessageMutation.isPending}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeResolution;
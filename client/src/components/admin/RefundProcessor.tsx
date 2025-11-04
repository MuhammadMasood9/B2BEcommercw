import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calculator,
  FileText,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Plus
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface Refund {
  id: string;
  orderId: string;
  disputeId?: string;
  buyerId: string;
  supplierId: string;
  adminId: string;
  refundAmount: number;
  originalAmount: number;
  refundType: string;
  reason: string;
  commissionAdjustment: number;
  supplierDeduction: number;
  status: string;
  paymentMethod?: string;
  transactionId?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
  adminNotes?: string;
  buyerNotificationSent: boolean;
  supplierNotificationSent: boolean;
}

interface RefundFormData {
  orderId: string;
  disputeId?: string;
  buyerId: string;
  supplierId: string;
  refundAmount: number;
  originalAmount: number;
  refundType: 'full' | 'partial' | 'shipping_only';
  reason: string;
  commissionAdjustment?: number;
  supplierDeduction?: number;
  paymentMethod?: string;
  adminNotes?: string;
}

const RefundProcessor: React.FC = () => {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    status: '',
    supplierId: '',
    buyerId: '',
    limit: 50,
    offset: 0,
  });

  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<RefundFormData>({
    orderId: '',
    buyerId: '',
    supplierId: '',
    refundAmount: 0,
    originalAmount: 0,
    refundType: 'full',
    reason: '',
  });

  const queryClient = useQueryClient();

  // Fetch refunds
  const { data: refundsData, isLoading } = useQuery({
    queryKey: ['/api/admin/refunds', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/refunds?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch refunds');
      }

      const result = await response.json();
      return result.data;
    },
  });

  // Create refund mutation
  const createRefundMutation = useMutation({
    mutationFn: async (refundData: RefundFormData) => {
      const response = await fetch('/api/admin/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(refundData),
      });

      if (!response.ok) {
        throw new Error('Failed to create refund');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Refund created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/refunds'] });
      setShowCreateForm(false);
      setFormData({
        orderId: '',
        buyerId: '',
        supplierId: '',
        refundAmount: 0,
        originalAmount: 0,
        refundType: 'full',
        reason: '',
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || 'Failed to create refund',
        variant: "destructive",
      });
    },
  });

  // Update refund status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ refundId, status, transactionId }: {
      refundId: string;
      status: string;
      transactionId?: string;
    }) => {
      const response = await fetch(`/api/admin/refunds/${refundId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, transactionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update refund status');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Refund status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/refunds'] });
      setSelectedRefund(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || 'Failed to update refund status',
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRefundTypeColor = (type: string) => {
    switch (type) {
      case 'full':
        return 'bg-red-100 text-red-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipping_only':
        return 'bg-blue-100 text-blue-800';
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

  const calculateCommissionAdjustment = (refundAmount: number, originalAmount: number) => {
    // Assume 5% commission rate
    const commissionRate = 0.05;
    const refundPercentage = refundAmount / originalAmount;
    return originalAmount * commissionRate * refundPercentage;
  };

  const handleCreateRefund = () => {
    if (!formData.orderId || !formData.buyerId || !formData.supplierId || !formData.reason) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const commissionAdjustment = calculateCommissionAdjustment(formData.refundAmount, formData.originalAmount);
    
    createRefundMutation.mutate({
      ...formData,
      commissionAdjustment,
    });
  };

  const handleStatusUpdate = (status: string, transactionId?: string) => {
    if (!selectedRefund) return;

    updateStatusMutation.mutate({
      refundId: selectedRefund.id,
      status,
      transactionId,
    });
  };

  const refunds = refundsData?.refunds || [];
  const totalRefunds = refundsData?.total || 0;

  // Calculate summary statistics
  const summaryStats = refunds.reduce((acc, refund) => {
    acc.totalAmount += refund.refundAmount;
    acc.totalCommissionAdjustment += refund.commissionAdjustment;
    
    switch (refund.status) {
      case 'pending':
        acc.pendingCount++;
        break;
      case 'processing':
        acc.processingCount++;
        break;
      case 'completed':
        acc.completedCount++;
        break;
      case 'failed':
        acc.failedCount++;
        break;
    }
    
    return acc;
  }, {
    totalAmount: 0,
    totalCommissionAdjustment: 0,
    pendingCount: 0,
    processingCount: 0,
    completedCount: 0,
    failedCount: 0,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Refund Processor</h1>
          <p className="text-gray-600">Process and manage customer refunds</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Refund
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Refunds</p>
              <p className="text-2xl font-bold text-gray-900">{totalRefunds}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">
              Pending: {summaryStats.pendingCount} | Processing: {summaryStats.processingCount}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summaryStats.totalAmount)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">Commission Impact: {formatCurrency(summaryStats.totalCommissionAdjustment)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{summaryStats.completedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">
              Success Rate: {totalRefunds > 0 ? ((summaryStats.completedCount / totalRefunds) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{summaryStats.failedCount}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">Requires attention</span>
          </div>
        </div>
      </div>

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
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search refunds..."
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

      {/* Refunds Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Refund Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {refunds.map((refund: Refund) => (
                <tr key={refund.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {refund.orderId}
                      </div>
                      {refund.disputeId && (
                        <div className="text-sm text-gray-500">
                          Dispute: {refund.disputeId}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(refund.refundAmount)}
                      </div>
                      <div className="text-sm text-gray-500">
                        of {formatCurrency(refund.originalAmount)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRefundTypeColor(refund.refundType)}`}>
                      {refund.refundType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(refund.status)}`}>
                      {refund.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>Commission: -{formatCurrency(refund.commissionAdjustment)}</div>
                      {refund.supplierDeduction > 0 && (
                        <div className="text-red-600">Supplier: -{formatCurrency(refund.supplierDeduction)}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(refund.requestedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedRefund(refund)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {refund.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate('processing')}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Refund Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Create Refund</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Order ID *</label>
                    <input
                      type="text"
                      value={formData.orderId}
                      onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter order ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dispute ID</label>
                    <input
                      type="text"
                      value={formData.disputeId || ''}
                      onChange={(e) => setFormData({ ...formData, disputeId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional dispute ID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buyer ID *</label>
                    <input
                      type="text"
                      value={formData.buyerId}
                      onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter buyer ID"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier ID *</label>
                    <input
                      type="text"
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter supplier ID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Original Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.originalAmount}
                      onChange={(e) => setFormData({ ...formData, originalAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.refundAmount}
                      onChange={(e) => setFormData({ ...formData, refundAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Refund Type *</label>
                    <select
                      value={formData.refundType}
                      onChange={(e) => setFormData({ ...formData, refundType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="full">Full Refund</option>
                      <option value="partial">Partial Refund</option>
                      <option value="shipping_only">Shipping Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain the reason for this refund..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
                  <textarea
                    value={formData.adminNotes || ''}
                    onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Internal notes (optional)..."
                  />
                </div>

                {/* Commission Impact Preview */}
                {formData.refundAmount > 0 && formData.originalAmount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <Calculator className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="font-medium text-yellow-800">Commission Impact</span>
                    </div>
                    <div className="mt-2 text-sm text-yellow-700">
                      Estimated commission adjustment: {formatCurrency(calculateCommissionAdjustment(formData.refundAmount, formData.originalAmount))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRefund}
                  disabled={createRefundMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createRefundMutation.isPending ? 'Creating...' : 'Create Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Details Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Refund Details - {selectedRefund.orderId}
                </h2>
                <button
                  onClick={() => setSelectedRefund(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Refund Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedRefund.status)}`}>
                        {selectedRefund.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRefundTypeColor(selectedRefund.refundType)}`}>
                        {selectedRefund.refundType.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Refund Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedRefund.refundAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Original Amount:</span>
                      <span>{formatCurrency(selectedRefund.originalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Commission Adjustment:</span>
                      <span className="text-red-600">-{formatCurrency(selectedRefund.commissionAdjustment)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Requested:</span>
                      <span>{formatDate(selectedRefund.requestedAt)}</span>
                    </div>
                    {selectedRefund.processedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processed:</span>
                        <span>{formatDate(selectedRefund.processedAt)}</span>
                      </div>
                    )}
                    {selectedRefund.completedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Completed:</span>
                        <span>{formatDate(selectedRefund.completedAt)}</span>
                      </div>
                    )}
                    {selectedRefund.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transaction ID:</span>
                        <span className="font-mono text-sm">{selectedRefund.transactionId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Reason</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{selectedRefund.reason}</p>
              </div>

              {selectedRefund.adminNotes && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{selectedRefund.adminNotes}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end space-x-3">
                {selectedRefund.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate('processing')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Start Processing
                  </button>
                )}
                {selectedRefund.status === 'processing' && (
                  <button
                    onClick={() => {
                      const transactionId = prompt('Enter transaction ID:');
                      if (transactionId) {
                        handleStatusUpdate('completed', transactionId);
                      }
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundProcessor;
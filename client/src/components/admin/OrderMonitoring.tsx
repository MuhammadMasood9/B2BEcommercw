import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Download,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Package,
  Calendar
} from 'lucide-react';
// import { useToast } from "@/hooks/use-toast";

interface OrderMonitoringData {
  orders: OrderWithDetails[];
  summary: OrderSummary;
  anomalies: OrderAnomaly[];
  performance: OrderPerformanceData;
  suppliers: SupplierOrderData[];
}

interface OrderWithDetails {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  buyer: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
  supplier: {
    id: string;
    businessName: string;
    storeName: string;
    rating: number;
    responseRate: number;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
  };
  disputes: any[];
  interventions: any[];
  refunds: any[];
  anomalies: any[];
}

interface OrderSummary {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  disputedOrders: number;
  totalValue: number;
  averageOrderValue: number;
  disputeRate: number;
  completionRate: number;
}

interface OrderAnomaly {
  id: string;
  orderId: string;
  anomalyType: string;
  severity: string;
  description: string;
  detectedAt: string;
  status: string;
}

interface OrderPerformanceData {
  avgProcessingTime: number;
  avgDeliveryTime: number;
  onTimeDeliveryRate: number;
  customerSatisfactionScore: number;
  trends: {
    daily: Array<{ date: string; orders: number; value: number; disputes: number }>;
    hourly: Array<{ hour: number; orders: number; value: number }>;
  };
}

interface SupplierOrderData {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  completedOrders: number;
  disputedOrders: number;
  totalValue: number;
  averageOrderValue: number;
  disputeRate: number;
  performanceScore: number;
}

const OrderMonitoring: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    supplierId: '',
    buyerId: '',
    dateFrom: '',
    dateTo: '',
    search: '',
    limit: 50,
    offset: 0,
  });

  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const queryClient = useQueryClient();

  // Fetch comprehensive order monitoring data
  const { data: monitoringData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/admin/orders/comprehensive-monitoring', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/orders/comprehensive-monitoring?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch order monitoring data');
      }

      const result = await response.json();
      return result.data as OrderMonitoringData;
    },
  });

  // Detect anomalies mutation
  const detectAnomaliesMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/admin/orders/${orderId}/detect-anomalies`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to detect anomalies');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Anomaly detection completed');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to detect anomalies');
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
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading order monitoring data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <XCircle className="w-6 h-6 text-red-600 mr-2" />
          <span className="text-red-800">Failed to load order monitoring data</span>
        </div>
      </div>
    );
  }

  const { orders, summary, anomalies, performance, suppliers } = monitoringData || {
    orders: [],
    summary: {} as OrderSummary,
    anomalies: [],
    performance: {} as OrderPerformanceData,
    suppliers: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Monitoring</h1>
          <p className="text-gray-600">Comprehensive order tracking and management</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalOrders?.toLocaleString()}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+12% from last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalValue || 0)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">Avg: {formatCurrency(summary.averageOrderValue || 0)}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{summary.completionRate?.toFixed(1)}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">{summary.completedOrders} completed</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dispute Rate</p>
              <p className="text-2xl font-bold text-gray-900">{summary.disputeRate?.toFixed(1)}%</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-600">{summary.disputedOrders} disputes</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  status: '',
                  supplierId: '',
                  buyerId: '',
                  dateFrom: '',
                  dateTo: '',
                  search: '',
                  limit: 50,
                  offset: 0,
                })}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anomalies Alert */}
      {anomalies.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
            <span className="font-medium text-orange-800">
              {anomalies.length} order anomalies detected
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {anomalies.slice(0, 3).map((anomaly) => (
              <div key={anomaly.id} className="text-sm text-orange-700">
                • {anomaly.description}
              </div>
            ))}
            {anomalies.length > 3 && (
              <div className="text-sm text-orange-600">
                +{anomalies.length - 3} more anomalies
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.buyer.companyName || `${order.buyer.firstName} ${order.buyer.lastName}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.buyer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.supplier?.businessName}
                      </div>
                      <div className="text-sm text-gray-500">
                        Rating: {order.supplier?.rating?.toFixed(1)}/5
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
                      {order.disputes.length > 0 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          {order.disputes.length} dispute{order.disputes.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {order.anomalies.length > 0 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                          {order.anomalies.length} anomal{order.anomalies.length > 1 ? 'ies' : 'y'}
                        </span>
                      )}
                      {order.refunds.length > 0 && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          {order.refunds.length} refund{order.refunds.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => detectAnomaliesMutation.mutate(order.id)}
                        className="text-orange-600 hover:text-orange-900"
                        disabled={detectAnomaliesMutation.isPending}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Processing Time</span>
              <span className="text-sm font-medium text-gray-900">
                {performance.avgProcessingTime} hours
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Delivery Time</span>
              <span className="text-sm font-medium text-gray-900">
                {performance.avgDeliveryTime} days
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">On-Time Delivery Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {performance.onTimeDeliveryRate}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Customer Satisfaction</span>
              <span className="text-sm font-medium text-gray-900">
                {performance.customerSatisfactionScore}/5
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Suppliers by Orders</h3>
          <div className="space-y-3">
            {suppliers.slice(0, 5).map((supplier) => (
              <div key={supplier.supplierId} className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {supplier.supplierName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {supplier.totalOrders} orders • {supplier.disputeRate.toFixed(1)}% dispute rate
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(supplier.totalValue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Score: {supplier.performanceScore.toFixed(0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Order Details - {selectedOrder.orderNumber}
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Order Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">{formatCurrency(selectedOrder.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span>{formatDate(selectedOrder.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Issues & Actions</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Disputes:</span>
                      <span className="font-medium">{selectedOrder.disputes.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interventions:</span>
                      <span className="font-medium">{selectedOrder.interventions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Refunds:</span>
                      <span className="font-medium">{selectedOrder.refunds.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Anomalies:</span>
                      <span className="font-medium">{selectedOrder.anomalies.length}</span>
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

export default OrderMonitoring;
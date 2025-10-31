import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  MessageSquare,
  Settings,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  FileText,
  DollarSign,
  User,
  Calendar,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderIntervention {
  id: string;
  orderId: string;
  adminId: string;
  type: string;
  reason: string;
  actionTaken: string;
  previousStatus?: string;
  newStatus?: string;
  previousData?: any;
  newData?: any;
  financialImpact: number;
  commissionAdjustment: number;
  createdAt: string;
}

interface InterventionFormData {
  orderId: string;
  type: 'status_override' | 'refund_processing' | 'communication_facilitation' | 'escalation';
  reason: string;
  actionTaken: string;
  previousStatus?: string;
  newStatus?: string;
  financialImpact?: number;
  commissionAdjustment?: number;
}

const OrderIntervention: React.FC = () => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<InterventionFormData>({
    orderId: '',
    type: 'status_override',
    reason: '',
    actionTaken: '',
  });

  const queryClient = useQueryClient();

  // Fetch interventions for selected order
  const { data: interventions, isLoading } = useQuery({
    queryKey: ['/api/admin/orders', selectedOrderId, 'interventions'],
    queryFn: async () => {
      if (!selectedOrderId) return [];

      const response = await fetch(`/api/admin/orders/${selectedOrderId}/interventions`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch interventions');
      }

      const result = await response.json();
      return result.data.interventions as OrderIntervention[];
    },
    enabled: !!selectedOrderId,
  });

  // Create intervention mutation
  const createInterventionMutation = useMutation({
    mutationFn: async (interventionData: InterventionFormData) => {
      const response = await fetch(`/api/admin/orders/${interventionData.orderId}/intervene`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(interventionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create intervention');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Order intervention created successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrderId, 'interventions'] });
      setShowCreateForm(false);
      setFormData({
        orderId: '',
        type: 'status_override',
        reason: '',
        actionTaken: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create intervention');
    },
  });

  const getInterventionTypeColor = (type: string) => {
    switch (type) {
      case 'status_override':
        return 'bg-blue-100 text-blue-800';
      case 'refund_processing':
        return 'bg-red-100 text-red-800';
      case 'communication_facilitation':
        return 'bg-green-100 text-green-800';
      case 'escalation':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getInterventionIcon = (type: string) => {
    switch (type) {
      case 'status_override':
        return <Settings className="w-4 h-4" />;
      case 'refund_processing':
        return <DollarSign className="w-4 h-4" />;
      case 'communication_facilitation':
        return <MessageSquare className="w-4 h-4" />;
      case 'escalation':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
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

  const handleCreateIntervention = () => {
    if (!formData.orderId || !formData.reason || !formData.actionTaken) {
      toast.error('Please fill in all required fields');
      return;
    }

    createInterventionMutation.mutate(formData);
  };

  const interventionTypeOptions = [
    { value: 'status_override', label: 'Status Override', description: 'Change order status manually' },
    { value: 'refund_processing', label: 'Refund Processing', description: 'Process refund for order' },
    { value: 'communication_facilitation', label: 'Communication Facilitation', description: 'Facilitate communication between parties' },
    { value: 'escalation', label: 'Escalation', description: 'Escalate order to higher authority' },
  ];

  // Calculate summary statistics
  const summaryStats = interventions?.reduce((acc, intervention) => {
    acc.totalInterventions++;
    acc.totalFinancialImpact += intervention.financialImpact;
    acc.totalCommissionAdjustment += intervention.commissionAdjustment;
    
    acc.typeCount[intervention.type] = (acc.typeCount[intervention.type] || 0) + 1;
    
    return acc;
  }, {
    totalInterventions: 0,
    totalFinancialImpact: 0,
    totalCommissionAdjustment: 0,
    typeCount: {} as Record<string, number>,
  }) || {
    totalInterventions: 0,
    totalFinancialImpact: 0,
    totalCommissionAdjustment: 0,
    typeCount: {},
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Intervention</h1>
          <p className="text-gray-600">Manage and track order interventions</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Intervention
          </button>
        </div>
      </div>

      {/* Order Selection */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Order</h2>
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              placeholder="Enter Order ID to view interventions..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => {
              if (selectedOrderId) {
                queryClient.invalidateQueries({ queryKey: ['/api/admin/orders', selectedOrderId, 'interventions'] });
              }
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      {selectedOrderId && interventions && interventions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Interventions</p>
                <p className="text-2xl font-bold text-gray-900">{summaryStats.totalInterventions}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">For order: {selectedOrderId}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Financial Impact</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(Math.abs(summaryStats.totalFinancialImpact))}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${summaryStats.totalFinancialImpact >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className={summaryStats.totalFinancialImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                {summaryStats.totalFinancialImpact >= 0 ? 'Positive' : 'Negative'} impact
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commission Adjustment</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(Math.abs(summaryStats.totalCommissionAdjustment))}
                </p>
              </div>
              <TrendingUp className={`w-8 h-8 ${summaryStats.totalCommissionAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className={summaryStats.totalCommissionAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                {summaryStats.totalCommissionAdjustment >= 0 ? '+' : ''}{formatCurrency(summaryStats.totalCommissionAdjustment)}
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Common Type</p>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {Object.entries(summaryStats.typeCount).sort(([,a], [,b]) => b - a)[0]?.[0]?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-2 flex items-center text-sm">
              <span className="text-gray-600">
                {Object.entries(summaryStats.typeCount).sort(([,a], [,b]) => b - a)[0]?.[1] || 0} occurrences
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Interventions List */}
      {selectedOrderId && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Interventions for Order: {selectedOrderId}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2">Loading interventions...</span>
            </div>
          ) : interventions && interventions.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {interventions.map((intervention) => (
                <div key={intervention.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${getInterventionTypeColor(intervention.type)}`}>
                        {getInterventionIcon(intervention.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInterventionTypeColor(intervention.type)}`}>
                            {intervention.type.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(intervention.createdAt)}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {intervention.reason}
                        </h3>
                        
                        <p className="text-gray-700 mb-3">
                          {intervention.actionTaken}
                        </p>

                        {/* Status Change */}
                        {intervention.previousStatus && intervention.newStatus && (
                          <div className="flex items-center space-x-2 mb-3">
                            <span className="text-sm text-gray-600">Status changed:</span>
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                              {intervention.previousStatus}
                            </span>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              {intervention.newStatus}
                            </span>
                          </div>
                        )}

                        {/* Financial Impact */}
                        {(intervention.financialImpact !== 0 || intervention.commissionAdjustment !== 0) && (
                          <div className="flex items-center space-x-4 text-sm">
                            {intervention.financialImpact !== 0 && (
                              <div className="flex items-center">
                                <span className="text-gray-600 mr-1">Financial Impact:</span>
                                <span className={intervention.financialImpact >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {intervention.financialImpact >= 0 ? '+' : ''}{formatCurrency(intervention.financialImpact)}
                                </span>
                              </div>
                            )}
                            {intervention.commissionAdjustment !== 0 && (
                              <div className="flex items-center">
                                <span className="text-gray-600 mr-1">Commission:</span>
                                <span className={intervention.commissionAdjustment >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {intervention.commissionAdjustment >= 0 ? '+' : ''}{formatCurrency(intervention.commissionAdjustment)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : selectedOrderId ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <FileText className="w-8 h-8 mb-2" />
              <span>No interventions found for this order</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Create Intervention Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Create Order Intervention</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intervention Type *</label>
                  <div className="space-y-2">
                    {interventionTypeOptions.map((option) => (
                      <label key={option.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="interventionType"
                          value={option.value}
                          checked={formData.type === option.value}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Explain why this intervention is necessary..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Taken *</label>
                  <textarea
                    value={formData.actionTaken}
                    onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the specific actions taken..."
                  />
                </div>

                {/* Status Change Fields */}
                {formData.type === 'status_override' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Previous Status</label>
                      <input
                        type="text"
                        value={formData.previousStatus || ''}
                        onChange={(e) => setFormData({ ...formData, previousStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., pending"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                      <input
                        type="text"
                        value={formData.newStatus || ''}
                        onChange={(e) => setFormData({ ...formData, newStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., processing"
                      />
                    </div>
                  </div>
                )}

                {/* Financial Impact Fields */}
                {(formData.type === 'refund_processing' || formData.type === 'status_override') && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Financial Impact</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.financialImpact || ''}
                        onChange={(e) => setFormData({ ...formData, financialImpact: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Commission Adjustment</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.commissionAdjustment || ''}
                        onChange={(e) => setFormData({ ...formData, commissionAdjustment: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
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
                  onClick={handleCreateIntervention}
                  disabled={createInterventionMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createInterventionMutation.isPending ? 'Creating...' : 'Create Intervention'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderIntervention;
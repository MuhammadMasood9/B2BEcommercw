import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  MessageSquare,
  Paperclip,
  Send,
  User,
  Building,
  Calendar,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Upload
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';

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
  updatedAt?: string;
  resolvedAt?: string;
  escalationLevel: number;
  buyerName?: string;
  supplierName?: string;
  buyerEvidence?: string[];
  supplierEvidence?: string[];
}

interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderType: string;
  senderName?: string;
  message: string;
  attachments: string[];
  isInternal: boolean;
  createdAt: string;
}

interface DisputeDetailViewProps {
  dispute: Dispute;
  onBack: () => void;
}

export const DisputeDetailView: React.FC<DisputeDetailViewProps> = ({ dispute, onBack }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [resolutionData, setResolutionData] = useState({
    status: dispute.status,
    resolutionType: '',
    resolutionSummary: '',
    refundAmount: 0,
    mediationNotes: dispute.mediationNotes || ''
  });

  const queryClient = useQueryClient();

  // Fetch dispute messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/admin/disputes', dispute.id, 'messages'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/disputes/${dispute.id}/messages`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const result = await response.json();
      return result.data?.messages || [];
    },
  });

  // Add message mutation
  const addMessageMutation = useMutation({
    mutationFn: async ({ message, isInternal }: { message: string; isInternal: boolean }) => {
      const response = await fetch(`/api/admin/disputes/${dispute.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message, isInternal }),
      });

      if (!response.ok) {
        throw new Error('Failed to add message');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Message added successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/disputes', dispute.id, 'messages'] });
      setNewMessage('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add message');
    },
  });

  // Update dispute status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/disputes/${dispute.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update dispute status');
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Dispute status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/disputes'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update dispute status');
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    addMessageMutation.mutate({ message: newMessage, isInternal });
  };

  const handleResolveDispute = () => {
    updateStatusMutation.mutate(resolutionData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Queue
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{dispute.title}</h1>
          <p className="text-gray-600">Dispute #{dispute.id.slice(0, 8)}</p>
        </div>
        <Badge className={getStatusColor(dispute.status)}>
          {dispute.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dispute Details */}
          <Card>
            <CardHeader>
              <CardTitle>Dispute Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600">{dispute.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Type</h4>
                  <p className="text-gray-600 capitalize">{dispute.type}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Amount</h4>
                  <p className="text-gray-600">{formatAmount(dispute.amount)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Created</h4>
                  <p className="text-gray-600">{formatDate(dispute.createdAt)}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Order ID</h4>
                  <p className="text-gray-600">{dispute.orderId}</p>
                </div>
              </div>

              {/* Evidence Section */}
              {(dispute.buyerEvidence?.length || dispute.supplierEvidence?.length) && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Evidence</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dispute.buyerEvidence?.length && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Buyer Evidence</h4>
                        <div className="space-y-2">
                          {dispute.buyerEvidence.map((evidence, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{evidence}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {dispute.supplierEvidence?.length && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Supplier Evidence</h4>
                        <div className="space-y-2">
                          {dispute.supplierEvidence.map((evidence, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <FileText className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{evidence}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4 mb-6">
                  {messages.map((message: DisputeMessage) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg ${
                        message.isInternal
                          ? 'bg-blue-50 border-l-4 border-blue-400'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {message.senderName || message.senderType}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(message.createdAt)}
                        </span>
                        {message.isInternal && (
                          <Badge variant="secondary" className="text-xs">
                            Internal
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-700">{message.message}</p>
                      {message.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {message.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center gap-1 text-sm text-blue-600">
                              <Paperclip className="h-3 w-3" />
                              <span>{attachment}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add Message */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="internal"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="internal" className="text-sm text-gray-600">
                    Internal note (not visible to parties)
                  </label>
                </div>
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    rows={3}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || addMessageMutation.isPending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle>Parties Involved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Buyer</p>
                  <p className="text-sm text-gray-600">{dispute.buyerName || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Building className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Supplier</p>
                  <p className="text-sm text-gray-600">{dispute.supplierName || 'Unknown'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Resolution Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={resolutionData.status}
                  onValueChange={(value) => setResolutionData({ ...resolutionData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Type
                </label>
                <Select
                  value={resolutionData.resolutionType}
                  onValueChange={(value) => setResolutionData({ ...resolutionData, resolutionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refund_full">Full Refund</SelectItem>
                    <SelectItem value="refund_partial">Partial Refund</SelectItem>
                    <SelectItem value="replacement">Replacement</SelectItem>
                    <SelectItem value="store_credit">Store Credit</SelectItem>
                    <SelectItem value="no_action">No Action</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {resolutionData.resolutionType?.includes('refund') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={resolutionData.refundAmount}
                    onChange={(e) => setResolutionData({ ...resolutionData, refundAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Summary
                </label>
                <Textarea
                  placeholder="Describe the resolution..."
                  value={resolutionData.resolutionSummary}
                  onChange={(e) => setResolutionData({ ...resolutionData, resolutionSummary: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mediation Notes
                </label>
                <Textarea
                  placeholder="Internal notes..."
                  value={resolutionData.mediationNotes}
                  onChange={(e) => setResolutionData({ ...resolutionData, mediationNotes: e.target.value })}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleResolveDispute}
                disabled={updateStatusMutation.isPending}
                className="w-full"
              >
                {updateStatusMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Update Dispute
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DisputeDetailView;
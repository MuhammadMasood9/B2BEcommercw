import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Eye, DollarSign } from 'lucide-react';

interface PaymentSubmission {
  id: number;
  supplierId: number;
  supplierName: string;
  amount: number;
  commissionIds: number[];
  paymentMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: number;
  rejectionReason?: string;
  proofOfPayment?: string;
}

interface Commission {
  id: number;
  orderId: number;
  amount: number;
  dueDate: string;
}

export default function AdminPaymentVerification() {
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<PaymentSubmission | null>(null);
  const [commissionDetails, setCommissionDetails] = useState<Commission[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/admin/payment-submissions?status=${filter}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (error) {
      toast.error('Failed to fetch payment submissions');
    }
  };

  const fetchCommissionDetails = async (commissionIds: number[]) => {
    try {
      const response = await fetch('/api/admin/commissions/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ commissionIds })
      });
      if (response.ok) {
        const data = await response.json();
        setCommissionDetails(data);
      }
    } catch (error) {
      toast.error('Failed to fetch commission details');
    }
  };

  const viewSubmission = (submission: PaymentSubmission) => {
    setSelectedSubmission(submission);
    fetchCommissionDetails(submission.commissionIds);
    setRejectionReason('');
  };

  const approvePayment = async (submissionId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/payment-submissions/${submissionId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Payment approved successfully');
        fetchSubmissions();
        setSelectedSubmission(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to approve payment');
      }
    } catch (error) {
      toast.error('Failed to approve payment');
    } finally {
      setLoading(false);
    }
  };

  const rejectPayment = async (submissionId: number) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/payment-submissions/${submissionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectionReason })
      });

      if (response.ok) {
        toast.success('Payment rejected');
        fetchSubmissions();
        setSelectedSubmission(null);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to reject payment');
      }
    } catch (error) {
      toast.error('Failed to reject payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredSubmissions = submissions.filter(s => 
    filter === 'all' || s.status === filter
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Payment Verification</h1>
        </div>
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSubmission?.id === submission.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                  onClick={() => viewSubmission(submission)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium">{submission.supplierName}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getStatusColor(submission.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(submission.status)}
                        {submission.status}
                      </div>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">${submission.amount.toFixed(2)}</p>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
              {filteredSubmissions.length === 0 && (
                <p className="text-center text-gray-500 py-8">No submissions found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submission Details */}
        {selectedSubmission && (
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-600">Supplier</Label>
                  <p className="font-medium">{selectedSubmission.supplierName}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Amount</Label>
                  <p className="font-medium">${selectedSubmission.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Payment Method</Label>
                  <p className="font-medium">{selectedSubmission.paymentMethod}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Submitted</Label>
                  <p className="font-medium">
                    {new Date(selectedSubmission.submittedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Commission Details */}
              <div>
                <Label className="text-sm text-gray-600 mb-2 block">Related Commissions</Label>
                <div className="space-y-2">
                  {commissionDetails.map((commission) => (
                    <div key={commission.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-foreground">Order #{commission.orderId}</span>
                      <span className="font-medium text-foreground">${commission.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSubmission.status === 'pending' && (
                <>
                  <div>
                    <Label htmlFor="rejection-reason">Rejection Reason (if rejecting)</Label>
                    <Textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => approvePayment(selectedSubmission.id)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => rejectPayment(selectedSubmission.id)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </>
              )}

              {selectedSubmission.status === 'rejected' && selectedSubmission.rejectionReason && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                  <Label className="text-sm text-destructive font-medium">Rejection Reason:</Label>
                  <p className="text-destructive mt-1">{selectedSubmission.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
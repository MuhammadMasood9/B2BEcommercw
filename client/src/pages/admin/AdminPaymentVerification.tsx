import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, Eye, FileText, Calendar, DollarSign, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Commission {
  id: string;
  orderId: string;
  orderNumber: string;
  orderAmount: string;
  commissionAmount: string;
  commissionRate: string;
  status: string;
  createdAt: string;
}

interface PaymentSubmission {
  id: string;
  supplierId: string;
  supplierName: string;
  storeName: string;
  supplierEmail: string;
  supplierPhone: string;
  amount: string;
  commissionIds: string;
  paymentMethod: string;
  status: string;
  proofOfPayment: string;
  submittedAt: string;
  createdAt: string;
  commissions: Commission[];
}

export default function AdminPaymentVerification() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<PaymentSubmission | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch pending payments
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['/api/admin/payments/pending'],
  });

  const payments = paymentsData?.payments || [];

  // Verify payment mutation
  const verifyMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(`/api/admin/payments/${paymentId}/verify`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify payment');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Payment Verified',
        description: 'Payment has been successfully verified and approved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments/pending'] });
      setSelectedPayment(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reject payment mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const response = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject payment');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Payment Rejected',
        description: 'Payment has been rejected and supplier has been notified.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments/pending'] });
      setSelectedPayment(null);
      setShowRejectModal(false);
      setRejectionReason('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Rejection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleVerify = (payment: PaymentSubmission) => {
    if (confirm(`Are you sure you want to approve this payment of ₹${parseFloat(payment.amount).toFixed(2)}?`)) {
      verifyMutation.mutate(payment.id);
    }
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejecting this payment.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPayment) {
      rejectMutation.mutate({
        paymentId: selectedPayment.id,
        reason: rejectionReason,
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading pending payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Verification</h1>
        <p className="text-muted-foreground mt-2">
          Review and verify commission payment submissions from suppliers
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{payments.reduce((sum: number, p: PaymentSubmission) => sum + parseFloat(p.amount), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Pending verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.reduce((sum: number, p: PaymentSubmission) => sum + (p.commissions?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Commission records</p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Payment Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
              <p className="text-muted-foreground">
                There are no pending payment submissions to review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment: PaymentSubmission) => (
                <Card key={payment.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{payment.supplierName}</h3>
                          <Badge variant="outline">{payment.storeName}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Email: {payment.supplierEmail}</div>
                          <div>Phone: {payment.supplierPhone}</div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Submitted: {formatDate(payment.submittedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ₹{parseFloat(payment.amount).toFixed(2)}
                        </div>
                        <Badge className="mt-2">{payment.paymentMethod}</Badge>
                      </div>
                    </div>

                    {/* Commission Details */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold mb-2">Commission Details</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Order Amount</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead>Commission</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payment.commissions?.map((commission) => (
                            <TableRow key={commission.id}>
                              <TableCell className="font-medium">{commission.orderNumber}</TableCell>
                              <TableCell>₹{parseFloat(commission.orderAmount).toFixed(2)}</TableCell>
                              <TableCell>{(parseFloat(commission.commissionRate) * 100).toFixed(1)}%</TableCell>
                              <TableCell className="font-semibold">
                                ₹{parseFloat(commission.commissionAmount).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowProofModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Proof
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => handleVerify(payment)}
                        disabled={verifyMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Payment
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowRejectModal(true);
                        }}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Proof Modal */}
      <Dialog open={showProofModal} onOpenChange={setShowProofModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>
              Review the payment proof submitted by {selectedPayment?.supplierName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment?.proofOfPayment && (
              <div className="border rounded-lg p-4">
                {selectedPayment.proofOfPayment.startsWith('data:image') ? (
                  <img
                    src={selectedPayment.proofOfPayment}
                    alt="Payment Proof"
                    className="max-w-full h-auto rounded"
                  />
                ) : selectedPayment.proofOfPayment.startsWith('data:application/pdf') ? (
                  <iframe
                    src={selectedPayment.proofOfPayment}
                    className="w-full h-96 rounded"
                    title="Payment Proof PDF"
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Payment proof file attached
                    </p>
                    <a
                      href={selectedPayment.proofOfPayment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      Open in new tab
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProofModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment submission.
              The supplier will be notified with this reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

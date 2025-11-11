import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, XCircle, ExternalLink, User, Mail, Phone, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Payment {
  id: string;
  supplierId: string;
  supplierName: string;
  storeName: string;
  amount: string;
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  paymentProofUrl: string | null;
  status: string;
  notes: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export default function AdminCommissionPayments() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payments
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["/api/commissions/admin/payment-submissions", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      const url = `/api/commissions/admin/payment-submissions${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch payments");
      return response.json();
    },
  });

  const payments: Payment[] = paymentsData?.payments || [];

  // Verify payment mutation
  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const response = await fetch(`/api/commissions/admin/payment-submissions/${paymentId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to verify payment");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Verified",
        description: "Payment has been verified and commissions marked as paid.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/admin/payment-submissions"] });
      setIsVerifyDialogOpen(false);
      setSelectedPayment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject payment mutation
  const rejectPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, reason }: { paymentId: string; reason: string }) => {
      const response = await fetch(`/api/commissions/admin/payment-submissions/${paymentId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reject payment");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Rejected",
        description: "Payment has been rejected and supplier notified.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/admin/payment-submissions"] });
      setIsRejectDialogOpen(false);
      setSelectedPayment(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVerify = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsVerifyDialogOpen(true);
  };

  const handleReject = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsRejectDialogOpen(true);
  };

  const confirmVerify = () => {
    if (selectedPayment) {
      verifyPaymentMutation.mutate(selectedPayment.id);
    }
  };

  const confirmReject = () => {
    if (selectedPayment && rejectionReason) {
      rejectPaymentMutation.mutate({
        paymentId: selectedPayment.id,
        reason: rejectionReason,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive", icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      verified: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
    };

    const { variant, icon: Icon } = config[status] || config.pending;

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: "Bank Transfer",
      paypal: "PayPal",
      stripe: "Stripe",
      other: "Other",
    };
    return labels[method] || method;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commission Payment Verification</h1>
        <p className="text-muted-foreground">Review and verify supplier commission payments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Submissions</CardTitle>
          <CardDescription>Review supplier payment submissions</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="verified">Verified</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="space-y-4 mt-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : payments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payment submissions found
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="p-4 border rounded-lg space-y-3"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-lg">{payment.supplierName}</p>
                            {getStatusBadge(payment.status)}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>{payment.storeName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">
                            ${parseFloat(payment.amount).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Payment Details */}
                      <div className="grid grid-cols-2 gap-2 text-sm p-3 bg-muted rounded-lg">
                        <div>
                          <span className="text-muted-foreground">Method:</span>{" "}
                          <span className="font-medium">{getPaymentMethodLabel(payment.paymentMethod)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Transaction ID:</span>{" "}
                          <span className="font-mono text-xs">{payment.transactionId}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payment Date:</span>{" "}
                          <span>{format(new Date(payment.paymentDate), "PP")}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Submitted:</span>{" "}
                          <span>{format(new Date(payment.createdAt), "PP")}</span>
                        </div>
                      </div>

                      {/* Payment Proof */}
                      {payment.paymentProofUrl && (
                        <div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(payment.paymentProofUrl!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Payment Proof
                          </Button>
                        </div>
                      )}

                      {/* Notes */}
                      {payment.notes && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">Supplier Notes:</p>
                          <p className="text-sm">{payment.notes}</p>
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {payment.status === 'rejected' && payment.rejectionReason && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                          <p className="text-sm text-red-700">{payment.rejectionReason}</p>
                        </div>
                      )}

                      {/* Verification Info */}
                      {payment.verifiedAt && (
                        <div className="text-sm text-muted-foreground">
                          Verified on {format(new Date(payment.verifiedAt), "PPP 'at' p")}
                        </div>
                      )}

                      {/* Actions */}
                      {payment.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerify(payment)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Verify Payment
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(payment)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Verify Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Confirm that you have received this payment
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Supplier</span>
                  <span className="font-medium">{selectedPayment.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-bold text-lg">${parseFloat(selectedPayment.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-xs">{selectedPayment.transactionId}</span>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  This will mark all linked commissions as paid and update the supplier's credit status.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVerifyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmVerify}
              disabled={verifyPaymentMutation.isPending}
            >
              {verifyPaymentMutation.isPending ? "Verifying..." : "Verify Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this payment
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Supplier</span>
                  <span className="font-medium">{selectedPayment.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-bold text-lg">${parseFloat(selectedPayment.amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Explain why this payment is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  required
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason || rejectPaymentMutation.isPending}
            >
              {rejectPaymentMutation.isPending ? "Rejecting..." : "Reject Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

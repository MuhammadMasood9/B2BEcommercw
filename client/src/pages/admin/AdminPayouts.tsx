import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, CreditCard, User, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Payout {
  id: string;
  supplierId: string;
  supplierName: string;
  storeName: string;
  supplierEmail: string;
  supplierPhone: string;
  amount: string;
  commissionDeducted: string;
  netAmount: string;
  payoutMethod: string;
  status: string;
  scheduledDate: string | null;
  processedDate: string | null;
  transactionId: string | null;
  createdAt: string;
}

export default function AdminPayouts() {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isFailDialogOpen, setIsFailDialogOpen] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [failureReason, setFailureReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payouts
  const { data: payoutsData, isLoading } = useQuery({
    queryKey: ["/api/commissions/admin/payouts", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      const url = `/api/commissions/admin/payouts${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await fetch(url, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch payouts");
      return response.json();
    },
  });

  const payouts: Payout[] = payoutsData?.payouts || [];

  // Process payout mutation
  const processPayoutMutation = useMutation({
    mutationFn: async ({ id, transactionId }: { id: string; transactionId?: string }) => {
      const response = await fetch(`/api/commissions/admin/payouts/${id}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ transactionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process payout");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payout Processing",
        description: "Payout has been marked as processing.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/admin/payouts"] });
      setIsProcessDialogOpen(false);
      setSelectedPayout(null);
      setTransactionId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Process Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete payout mutation
  const completePayoutMutation = useMutation({
    mutationFn: async ({ id, transactionId }: { id: string; transactionId: string }) => {
      const response = await fetch(`/api/commissions/admin/payouts/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ transactionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to complete payout");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payout Completed",
        description: "Payout has been successfully completed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/admin/payouts"] });
      setIsCompleteDialogOpen(false);
      setSelectedPayout(null);
      setTransactionId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Complete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fail payout mutation
  const failPayoutMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/commissions/admin/payouts/${id}/fail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to mark payout as failed");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payout Failed",
        description: "Payout has been marked as failed.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/admin/payouts"] });
      setIsFailDialogOpen(false);
      setSelectedPayout(null);
      setFailureReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProcessPayout = (payout: Payout) => {
    setSelectedPayout(payout);
    setIsProcessDialogOpen(true);
  };

  const handleCompletePayout = (payout: Payout) => {
    setSelectedPayout(payout);
    setTransactionId(payout.transactionId || "");
    setIsCompleteDialogOpen(true);
  };

  const handleFailPayout = (payout: Payout) => {
    setSelectedPayout(payout);
    setIsFailDialogOpen(true);
  };

  const confirmProcess = () => {
    if (selectedPayout) {
      processPayoutMutation.mutate({
        id: selectedPayout.id,
        transactionId: transactionId || undefined,
      });
    }
  };

  const confirmComplete = () => {
    if (selectedPayout && transactionId) {
      completePayoutMutation.mutate({
        id: selectedPayout.id,
        transactionId,
      });
    }
  };

  const confirmFail = () => {
    if (selectedPayout) {
      failPayoutMutation.mutate({
        id: selectedPayout.id,
        reason: failureReason,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: any }> = {
      pending: { variant: "secondary", icon: Clock },
      processing: { variant: "outline", icon: AlertCircle },
      completed: { variant: "default", icon: CheckCircle },
      failed: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPayoutMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: "Bank Transfer",
      paypal: "PayPal",
    };
    return labels[method] || method;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payout Management</h1>
        <p className="text-muted-foreground">Process supplier payout requests</p>
      </div>

      {/* Payout Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Requests</CardTitle>
          <CardDescription>Review and process supplier payout requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="space-y-4 mt-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : payouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payout requests found
                </div>
              ) : (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div
                      key={payout.id}
                      className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-lg">{payout.supplierName}</p>
                            {getStatusBadge(payout.status)}
                          </div>

                          {/* Supplier Details */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>{payout.storeName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span>{payout.supplierEmail}</span>
                            </div>
                            {payout.supplierPhone && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{payout.supplierPhone}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CreditCard className="h-4 w-4" />
                              <span>{getPayoutMethodLabel(payout.payoutMethod)}</span>
                            </div>
                          </div>

                          {/* Dates */}
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Requested: {format(new Date(payout.createdAt), "PPP 'at' p")}</p>
                            {payout.processedDate && (
                              <p>Processed: {format(new Date(payout.processedDate), "PPP 'at' p")}</p>
                            )}
                            {payout.transactionId && (
                              <p className="font-mono">Transaction ID: {payout.transactionId}</p>
                            )}
                          </div>
                        </div>

                        {/* Amount & Actions */}
                        <div className="text-right space-y-3">
                          <div>
                            <div className="font-bold text-2xl text-green-600">
                              ${parseFloat(payout.netAmount).toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Gross: ${parseFloat(payout.amount).toFixed(2)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Commission: ${parseFloat(payout.commissionDeducted).toFixed(2)}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            {payout.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessPayout(payout)}
                                >
                                  Process
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleFailPayout(payout)}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {payout.status === "processing" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleCompletePayout(payout)}
                                >
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleFailPayout(payout)}
                                >
                                  Mark Failed
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Process Payout Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              Mark this payout as processing and optionally add a transaction ID
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Supplier</span>
                  <span className="font-medium">{selectedPayout.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-bold text-lg">${parseFloat(selectedPayout.netAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Method</span>
                  <span>{getPayoutMethodLabel(selectedPayout.payoutMethod)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction-id">Transaction ID (Optional)</Label>
                <Input
                  id="transaction-id"
                  placeholder="Enter transaction ID if available"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  You can add the transaction ID now or when completing the payout
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsProcessDialogOpen(false);
                setTransactionId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmProcess}
              disabled={processPayoutMutation.isPending}
            >
              {processPayoutMutation.isPending ? "Processing..." : "Start Processing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Payout Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Payout</DialogTitle>
            <DialogDescription>
              Confirm the payout has been successfully transferred
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Supplier</span>
                  <span className="font-medium">{selectedPayout.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-bold text-lg">${parseFloat(selectedPayout.netAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="complete-transaction-id">Transaction ID *</Label>
                <Input
                  id="complete-transaction-id"
                  placeholder="Enter transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Transaction ID is required to complete the payout
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCompleteDialogOpen(false);
                setTransactionId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmComplete}
              disabled={!transactionId || completePayoutMutation.isPending}
            >
              {completePayoutMutation.isPending ? "Completing..." : "Complete Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fail Payout Dialog */}
      <Dialog open={isFailDialogOpen} onOpenChange={setIsFailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject/Fail Payout</DialogTitle>
            <DialogDescription>
              Mark this payout as failed and provide a reason
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Supplier</span>
                  <span className="font-medium">{selectedPayout.supplierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-bold text-lg">${parseFloat(selectedPayout.netAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="failure-reason">Reason for Failure</Label>
                <Textarea
                  id="failure-reason"
                  placeholder="Explain why this payout failed or was rejected"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFailDialogOpen(false);
                setFailureReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmFail}
              disabled={failPayoutMutation.isPending}
            >
              {failPayoutMutation.isPending ? "Processing..." : "Mark as Failed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Processing Guide</CardTitle>
          <CardDescription>How to process supplier payouts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Processing Steps</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Review the payout request and verify supplier details</li>
              <li>Click "Process" to mark the payout as being processed</li>
              <li>Transfer funds to the supplier using their preferred method</li>
              <li>Click "Complete" and enter the transaction ID</li>
              <li>Supplier will be notified of the completed payout</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Payout Methods</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Bank Transfer: Use supplier's registered bank account details</li>
              <li>PayPal: Transfer to supplier's PayPal email address</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Important Notes</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Always verify supplier identity before processing payouts</li>
              <li>Keep transaction IDs for record keeping and dispute resolution</li>
              <li>Failed payouts should include a clear reason for the supplier</li>
              <li>Completed payouts cannot be reversed through the system</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

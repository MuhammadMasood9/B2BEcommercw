import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, DollarSign, CreditCard, CheckCircle, Clock, XCircle, Upload } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Commission {
  id: string;
  orderId: string;
  orderNumber: string;
  orderAmount: string;
  commissionRate: string;
  commissionAmount: string;
  status: string;
  createdAt: string;
}

interface CreditStatus {
  creditLimit: number;
  totalUnpaid: number;
  availableCredit: number;
  isRestricted: boolean;
  lastPaymentDate: string | null;
}

export default function SupplierCommissionPayment() {
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch credit status
  const { data: creditData } = useQuery({
    queryKey: ["/api/commissions/supplier/credit-status"],
  });

  const creditStatus: CreditStatus | undefined = creditData?.creditStatus;

  // Fetch unpaid commissions
  const { data: commissionsData, isLoading } = useQuery({
    queryKey: ["/api/commissions/supplier/unpaid-commissions"],
  });

  const commissions: Commission[] = commissionsData?.commissions || [];

  // Submit payment mutation
  const submitPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const response = await fetch("/api/commissions/supplier/submit-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit payment");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment Submitted",
        description: "Your payment has been submitted for verification.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/supplier/unpaid-commissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/supplier/credit-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/supplier/payment-history"] });
      setIsPaymentDialogOpen(false);
      setSelectedCommissions([]);
      setTransactionId("");
      setPaymentProofUrl("");
      setNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectCommission = (commissionId: string) => {
    setSelectedCommissions(prev =>
      prev.includes(commissionId)
        ? prev.filter(id => id !== commissionId)
        : [...prev, commissionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCommissions.length === commissions.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(commissions.map(c => c.id));
    }
  };

  const selectedTotal = commissions
    .filter(c => selectedCommissions.includes(c.id))
    .reduce((sum, c) => sum + parseFloat(c.commissionAmount), 0);

  const handleSubmitPayment = () => {
    if (selectedCommissions.length === 0) {
      toast({
        title: "No Commissions Selected",
        description: "Please select at least one commission to pay.",
        variant: "destructive",
      });
      return;
    }

    if (!transactionId) {
      toast({
        title: "Transaction ID Required",
        description: "Please enter the transaction ID.",
        variant: "destructive",
      });
      return;
    }

    submitPaymentMutation.mutate({
      commissionIds: selectedCommissions,
      paymentMethod,
      transactionId,
      paymentDate,
      paymentProofUrl: paymentProofUrl || undefined,
      notes: notes || undefined,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commission Payments</h1>
        <p className="text-muted-foreground">Pay your platform commissions</p>
      </div>

      {/* Credit Status Card */}
      {creditStatus && (
        <Card className={creditStatus.isRestricted ? "border-red-500" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Credit Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {creditStatus.isRestricted && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Account Restricted</AlertTitle>
                <AlertDescription>
                  Your account is restricted due to unpaid commissions. Please pay outstanding commissions to continue operations.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Credit Limit</p>
                <p className="text-2xl font-bold">${creditStatus.creditLimit.toFixed(2)}</p>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">Total Unpaid</p>
                <p className="text-2xl font-bold text-red-600">
                  ${creditStatus.totalUnpaid.toFixed(2)}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${
                creditStatus.availableCredit > 0 
                  ? "bg-green-50 border border-green-200" 
                  : "bg-red-50 border border-red-200"
              }`}>
                <p className={`text-sm ${
                  creditStatus.availableCredit > 0 ? "text-green-700" : "text-red-700"
                }`}>
                  Available Credit
                </p>
                <p className={`text-2xl font-bold ${
                  creditStatus.availableCredit > 0 ? "text-green-600" : "text-red-600"
                }`}>
                  ${creditStatus.availableCredit.toFixed(2)}
                </p>
              </div>
            </div>

            {creditStatus.lastPaymentDate && (
              <p className="text-sm text-muted-foreground mt-4">
                Last payment: {format(new Date(creditStatus.lastPaymentDate), "PPP")}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Unpaid Commissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Unpaid Commissions</CardTitle>
              <CardDescription>Select commissions to pay</CardDescription>
            </div>
            {selectedCommissions.length > 0 && (
              <Button onClick={() => setIsPaymentDialogOpen(true)}>
                Pay ${selectedTotal.toFixed(2)}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No unpaid commissions
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={selectedCommissions.length === commissions.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">Select All</span>
              </div>

              {commissions.map((commission) => (
                <div
                  key={commission.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedCommissions.includes(commission.id)}
                    onCheckedChange={() => handleSelectCommission(commission.id)}
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Order #{commission.orderNumber}</p>
                      <Badge variant={commission.status === 'unpaid' ? 'destructive' : 'secondary'}>
                        {commission.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(commission.createdAt), "PPP")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Order Amount: ${parseFloat(commission.orderAmount).toFixed(2)} | 
                      Rate: {(parseFloat(commission.commissionRate) * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg text-red-600">
                      ${parseFloat(commission.commissionAmount).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Commission Payment</DialogTitle>
            <DialogDescription>
              Enter payment details for verification
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-2xl font-bold">${selectedTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedCommissions.length} commission(s) selected
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-id">Transaction ID *</Label>
              <Input
                id="transaction-id"
                placeholder="Enter transaction/reference ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-date">Payment Date *</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-proof">Payment Proof URL (Optional)</Label>
              <Input
                id="payment-proof"
                placeholder="URL to payment receipt/screenshot"
                value={paymentProofUrl}
                onChange={(e) => setPaymentProofUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Upload your receipt to a file hosting service and paste the URL here
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Please ensure you have completed the payment before submitting. 
                Admin will verify your payment details before marking commissions as paid.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPayment}
              disabled={submitPaymentMutation.isPending || !transactionId}
            >
              {submitPaymentMutation.isPending ? "Submitting..." : "Submit Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">How to Pay</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Select the commissions you want to pay</li>
              <li>Transfer the total amount to the platform's account</li>
              <li>Click "Pay" and enter your payment details</li>
              <li>Upload payment proof (receipt/screenshot)</li>
              <li>Wait for admin verification (usually 1-2 business days)</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Payment Methods</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Bank Transfer: Direct transfer to platform's bank account</li>
              <li>PayPal: Transfer to platform's PayPal account</li>
              <li>Stripe: Online payment through Stripe</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Important Notes</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Keep your transaction ID and payment proof for records</li>
              <li>Payments are verified within 1-2 business days</li>
              <li>Your account restrictions will be lifted once payment is verified</li>
              <li>Contact support if you have any payment issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

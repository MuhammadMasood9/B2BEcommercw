import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Payout {
  id: string;
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

export default function SupplierPayouts() {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState<string>("bank_transfer");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payouts
  const { data: payoutsData, isLoading } = useQuery({
    queryKey: ["/api/commissions/supplier/payouts"],
    queryFn: async () => {
      const response = await fetch("/api/commissions/supplier/payouts", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch payouts");
      return response.json();
    },
  });

  const payouts: Payout[] = payoutsData?.payouts || [];

  // Fetch commission summary to show available balance
  const { data: summaryData } = useQuery({
    queryKey: ["/api/commissions/supplier/commissions/summary"],
    queryFn: async () => {
      const response = await fetch("/api/commissions/supplier/commissions/summary", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch commission summary");
      return response.json();
    },
  });

  const availableBalance = summaryData?.summary?.paidAmount || 0;

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async (method: string) => {
      const response = await fetch("/api/commissions/supplier/payouts/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payoutMethod: method }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to request payout");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/supplier/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/commissions/supplier/commissions/summary"] });
      setIsRequestDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRequestPayout = () => {
    requestPayoutMutation.mutate(payoutMethod);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payouts</h1>
          <p className="text-muted-foreground">Manage your payout requests</p>
        </div>

        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <DollarSign className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
              <DialogDescription>
                Request a payout of your available balance
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Available Balance</span>
                  <span className="text-2xl font-bold">${availableBalance.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Payout Method</Label>
                <RadioGroup value={payoutMethod} onValueChange={setPayoutMethod}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                    <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span>Bank Transfer</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Direct transfer to your bank account
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span>PayPal</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Transfer to your PayPal account
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {availableBalance <= 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    You don't have any available balance to withdraw. Complete orders to earn commissions.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRequestDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestPayout}
                disabled={availableBalance <= 0 || requestPayoutMutation.isPending}
              >
                {requestPayoutMutation.isPending ? "Requesting..." : "Request Payout"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Available Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Available Balance</CardTitle>
          <CardDescription>Your current balance available for payout</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600">
            ${availableBalance.toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            This amount is from completed orders with paid commissions
          </p>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>View all your payout requests and transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payout requests yet. Request your first payout above.
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{getPayoutMethodLabel(payout.payoutMethod)}</p>
                      {getStatusBadge(payout.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Requested: {format(new Date(payout.createdAt), "PPP")}
                    </p>
                    {payout.processedDate && (
                      <p className="text-sm text-muted-foreground">
                        Processed: {format(new Date(payout.processedDate), "PPP")}
                      </p>
                    )}
                    {payout.transactionId && (
                      <p className="text-xs text-muted-foreground">
                        Transaction ID: {payout.transactionId}
                      </p>
                    )}
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-bold text-lg">
                      ${parseFloat(payout.netAmount).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Gross: ${parseFloat(payout.amount).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Commission: ${parseFloat(payout.commissionDeducted).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Information</CardTitle>
          <CardDescription>How payouts work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Processing Time</h4>
            <p className="text-sm text-muted-foreground">
              Payout requests are typically processed within 3-5 business days.
              You'll receive a notification once your payout is completed.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Payout Methods</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Bank Transfer: Direct deposit to your registered bank account</li>
              <li>PayPal: Transfer to your PayPal account email</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Important Notes</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Only completed orders with paid commissions are available for payout</li>
              <li>Platform commission is automatically deducted from order amounts</li>
              <li>Ensure your payment details are up to date in your profile settings</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

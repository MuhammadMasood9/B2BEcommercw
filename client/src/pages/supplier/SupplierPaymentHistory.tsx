import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, XCircle, ExternalLink, FileText } from "lucide-react";
import { format } from "date-fns";

interface PaymentItem {
  commissionId: string;
  amount: string;
  orderNumber: string;
}

interface Payment {
  id: string;
  amount: string;
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  paymentProofUrl: string | null;
  status: string;
  notes: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  items: PaymentItem[];
}

export default function SupplierPaymentHistory() {
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ["/api/commissions/supplier/payment-history"],
  });

  const payments: Payment[] = paymentsData?.payments || [];

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
        <h1 className="text-3xl font-bold">Payment History</h1>
        <p className="text-muted-foreground">View your commission payment submissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Submissions</CardTitle>
          <CardDescription>All your commission payment submissions and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment submissions yet
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
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Payment #{payment.id.slice(0, 8)}</p>
                        {getStatusBadge(payment.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {format(new Date(payment.createdAt), "PPP 'at' p")}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold">${parseFloat(payment.amount).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
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
                    {payment.verifiedAt && (
                      <div>
                        <span className="text-muted-foreground">Verified:</span>{" "}
                        <span>{format(new Date(payment.verifiedAt), "PP")}</span>
                      </div>
                    )}
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
                      <p className="text-sm text-muted-foreground">Notes:</p>
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

                  {/* Commissions Paid */}
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Commissions Included:</p>
                    <div className="space-y-1">
                      {payment.items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Order #{item.orderNumber}
                          </span>
                          <span className="font-medium">
                            ${parseFloat(item.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

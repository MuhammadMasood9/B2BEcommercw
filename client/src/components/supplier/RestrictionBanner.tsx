import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CreditCard, XCircle } from "lucide-react";
import { Link } from "wouter";

interface RestrictionStatus {
  isRestricted: boolean;
  totalUnpaid: number;
  creditLimit: number;
  creditUsed: number;
  creditRemaining: number;
  usagePercentage: number;
}

export default function RestrictionBanner() {
  // Fetch restriction status
  const { data: statusData } = useQuery({
    queryKey: ['/api/suppliers/restriction-status'],
    queryFn: async () => {
      const response = await fetch('/api/suppliers/restriction-status', {
        credentials: 'include',
      });
      if (!response.ok) {
        // If endpoint doesn't exist or returns error, don't show banner
        return null;
      }
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const status: RestrictionStatus | null = statusData?.restrictionStatus || null;

  // Don't show banner if no status or not restricted and usage < 80%
  if (!status || (!status.isRestricted && status.usagePercentage < 80)) {
    return null;
  }

  // Determine banner variant and message
  const isRestricted = status.isRestricted;
  const isWarning = !isRestricted && status.usagePercentage >= 80;

  return (
    <div className="mb-6">
      <Alert
        variant={isRestricted ? "destructive" : "default"}
        className={isRestricted ? "border-red-500 bg-red-50" : "border-orange-500 bg-orange-50"}
      >
        <div className="flex items-start gap-3">
          {isRestricted ? (
            <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
          )}
          <div className="flex-1">
            <AlertTitle className={isRestricted ? "text-red-900" : "text-orange-900"}>
              {isRestricted ? "Account Restricted" : "Credit Limit Warning"}
            </AlertTitle>
            <AlertDescription className={isRestricted ? "text-red-800" : "text-orange-800"}>
              {isRestricted ? (
                <>
                  Your account has been restricted due to unpaid commissions. You cannot create
                  quotations, respond to inquiries, or send messages until payment is made.
                </>
              ) : (
                <>
                  You are approaching your commission credit limit. Please submit payment soon to
                  avoid account restrictions.
                </>
              )}
            </AlertDescription>

            {/* Credit Usage Details */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className={isRestricted ? "text-red-900 font-medium" : "text-orange-900 font-medium"}>
                  Unpaid Commission: ₹{status.totalUnpaid.toFixed(2)}
                </span>
                <span className={isRestricted ? "text-red-900 font-medium" : "text-orange-900 font-medium"}>
                  Credit Limit: ₹{status.creditLimit.toFixed(2)}
                </span>
              </div>
              <Progress
                value={status.usagePercentage}
                className={`h-2 ${isRestricted ? "bg-red-200" : "bg-orange-200"}`}
              />
              <div className="flex justify-between text-xs">
                <span className={isRestricted ? "text-red-700" : "text-orange-700"}>
                  {status.usagePercentage.toFixed(1)}% used
                </span>
                <span className={isRestricted ? "text-red-700" : "text-orange-700"}>
                  ₹{status.creditRemaining.toFixed(2)} remaining
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="mt-4">
              <Link href="/supplier/commissions">
                <Button
                  variant={isRestricted ? "destructive" : "default"}
                  size="sm"
                  className={isRestricted ? "" : "bg-orange-600 hover:bg-orange-700"}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isRestricted ? "Pay Now to Restore Access" : "View Commission Details"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Alert>
    </div>
  );
}

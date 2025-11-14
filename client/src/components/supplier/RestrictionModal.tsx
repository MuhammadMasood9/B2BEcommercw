import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { XCircle, CreditCard, AlertTriangle, DollarSign } from "lucide-react";
import { Link } from "wouter";

interface RestrictionStatus {
  isRestricted: boolean;
  totalUnpaid: number;
  creditLimit: number;
  creditUsed: number;
  creditRemaining: number;
  usagePercentage: number;
}

interface RestrictionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restrictionStatus: RestrictionStatus;
  actionType?: "quotation" | "inquiry" | "message";
}

export default function RestrictionModal({
  open,
  onOpenChange,
  restrictionStatus,
  actionType = "quotation",
}: RestrictionModalProps) {
  const actionLabels = {
    quotation: "create quotations",
    inquiry: "respond to inquiries",
    message: "send messages",
  };

  const actionLabel = actionLabels[actionType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl">Account Restricted</DialogTitle>
          </div>
          <DialogDescription>
            Your account is currently restricted due to unpaid commissions. You cannot {actionLabel}{" "}
            until payment is made.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Commission Details */}
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-900">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Unpaid Commission:</span>
                  <span className="text-lg font-bold">₹{restrictionStatus.totalUnpaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Credit Limit:</span>
                  <span>₹{restrictionStatus.creditLimit.toFixed(2)}</span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Credit Usage Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Credit Usage</span>
              <span className="font-medium text-red-600">
                {restrictionStatus.usagePercentage.toFixed(1)}%
              </span>
            </div>
            <Progress value={restrictionStatus.usagePercentage} className="h-2 bg-red-100" />
            <p className="text-xs text-muted-foreground">
              You have exceeded your commission credit limit
            </p>
          </div>

          {/* What You Can Do */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              What You Can Do
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Submit payment for outstanding commissions</li>
              <li>• View your commission history and details</li>
              <li>• Contact support if you have questions</li>
            </ul>
          </div>

          {/* Restrictions Applied */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Current Restrictions
            </h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• Cannot create or send quotations</li>
              <li>• Cannot respond to buyer inquiries</li>
              <li>• Cannot send messages to buyers</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
          <Link href="/supplier/commissions" className="w-full sm:w-auto">
            <Button variant="destructive" className="w-full" onClick={() => onOpenChange(false)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay Commission Now
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

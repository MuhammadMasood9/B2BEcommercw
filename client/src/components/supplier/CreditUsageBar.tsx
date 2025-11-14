import { AlertCircle } from "lucide-react";

interface CreditUsageBarProps {
  totalUnpaid: number;
  creditLimit: number;
  className?: string;
}

export function CreditUsageBar({ totalUnpaid, creditLimit, className = "" }: CreditUsageBarProps) {
  const usagePercentage = (totalUnpaid / creditLimit) * 100;
  const cappedPercentage = Math.min(usagePercentage, 100);
  
  // Color coding based on usage
  const getColorClass = () => {
    if (usagePercentage >= 100) return "bg-destructive";
    if (usagePercentage > 80) return "bg-destructive";
    if (usagePercentage > 50) return "bg-orange-500";
    return "bg-green-500";
  };

  const getTextColorClass = () => {
    if (usagePercentage >= 100) return "text-destructive";
    if (usagePercentage > 80) return "text-destructive";
    if (usagePercentage > 50) return "text-orange-600";
    return "text-green-600";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">Credit Usage</span>
        <span className={`font-semibold ${getTextColorClass()}`}>
          {usagePercentage.toFixed(1)}%
        </span>
      </div>
      
      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getColorClass()}`}
          style={{ width: `${cappedPercentage}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>₹{totalUnpaid.toLocaleString()} used</span>
        <span>₹{creditLimit.toLocaleString()} limit</span>
      </div>

      {/* Warning when usage > 80% */}
      {usagePercentage > 80 && (
        <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg mt-3">
          <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-orange-900">
            <p className="font-medium">Credit Limit Warning</p>
            <p className="text-xs mt-1">
              {usagePercentage >= 100 
                ? "You have exceeded your credit limit. Your account may be restricted. Please submit payment immediately."
                : "You're approaching your credit limit. Please submit payment soon to avoid account restrictions."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

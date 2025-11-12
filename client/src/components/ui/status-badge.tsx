import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Package,
  Truck,
  PackageCheck,
  FileText,
  MessageSquare,
  DollarSign,
} from "lucide-react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-input bg-background",
        success: "bg-green-100 text-green-800 border border-green-200",
        warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        error: "bg-red-100 text-red-800 border border-red-200",
        info: "bg-brand-grey-100 text-brand-grey-800 border border-brand-grey-200",
        pending: "bg-orange-100 text-orange-800 border border-orange-200",
        processing: "bg-purple-100 text-purple-800 border border-purple-200",
      },
      status: {
        // Order statuses
        pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        confirmed: "bg-brand-orange-100 text-brand-orange-800 border border-brand-orange-200",
        processing: "bg-purple-100 text-purple-800 border border-purple-200",
        shipped: "bg-orange-600 text-orange-600 border border-orange-600",
        delivered: "bg-green-100 text-green-800 border border-green-200",
        cancelled: "bg-red-100 text-red-800 border border-red-200",
        
        // Quotation statuses
        draft: "bg-gray-100 text-gray-800 border border-gray-200",
        sent: "bg-brand-orange-100 text-brand-orange-800 border border-brand-orange-200",
        accepted: "bg-green-100 text-green-800 border border-green-200",
        rejected: "bg-red-100 text-red-800 border border-red-200",
        expired: "bg-orange-100 text-orange-800 border border-orange-200",
        
        // Inquiry statuses
        new: "bg-brand-orange-100 text-brand-orange-800 border border-brand-orange-200",
        replied: "bg-purple-100 text-purple-800 border border-purple-200",
        quoted: "bg-green-100 text-green-800 border border-green-200",
        closed: "bg-gray-100 text-gray-800 border border-gray-200",
        
        // Product statuses
        active: "bg-green-100 text-green-800 border border-green-200",
        inactive: "bg-gray-100 text-gray-800 border border-gray-200",
        "out-of-stock": "bg-red-100 text-red-800 border border-red-200",
        "low-stock": "bg-orange-100 text-orange-800 border border-orange-200",
        
        // Approval statuses
        approved: "bg-green-100 text-green-800 border border-green-200",
        "pending-approval": "bg-yellow-100 text-yellow-800 border border-yellow-200",
        
        // Payment statuses
        paid: "bg-green-100 text-green-800 border border-green-200",
        unpaid: "bg-red-100 text-red-800 border border-red-200",
        "partially-paid": "bg-orange-100 text-orange-800 border border-orange-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const statusIcons: Record<string, LucideIcon> = {
  // Order statuses
  pending: Clock,
  confirmed: CheckCircle2,
  processing: Package,
  shipped: Truck,
  delivered: PackageCheck,
  cancelled: XCircle,
  
  // Quotation statuses
  draft: FileText,
  sent: MessageSquare,
  accepted: CheckCircle2,
  rejected: XCircle,
  expired: AlertCircle,
  
  // Inquiry statuses
  new: AlertCircle,
  replied: MessageSquare,
  quoted: FileText,
  closed: CheckCircle2,
  
  // Product statuses
  active: CheckCircle2,
  inactive: XCircle,
  "out-of-stock": XCircle,
  "low-stock": AlertCircle,
  
  // Approval statuses
  approved: CheckCircle2,
  "pending-approval": Clock,
  
  // Payment statuses
  paid: DollarSign,
  unpaid: AlertCircle,
  "partially-paid": DollarSign,
};

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'status'>,
    Omit<VariantProps<typeof statusBadgeVariants>, 'status'> {
  status?: string;
  variant?: VariantProps<typeof statusBadgeVariants>['variant'];
  icon?: LucideIcon;
  showIcon?: boolean;
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, variant, status, icon, showIcon = true, children, ...props }, ref) => {
    // Determine which icon to use
    const IconComponent = icon || (status && statusIcons[status.toLowerCase()]);
    
    // Format status text for display
    const displayText = children || (status 
      ? status.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
      : "");

    return (
      <div
        ref={ref}
        className={cn(
          statusBadgeVariants({ 
            variant: variant || undefined,
            status: status ? (status.toLowerCase() as any) : undefined 
          }),
          className
        )}
        {...props}
      >
        {showIcon && IconComponent && <IconComponent className="h-3.5 w-3.5" />}
        <span>{displayText}</span>
      </div>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export { StatusBadge, statusBadgeVariants };

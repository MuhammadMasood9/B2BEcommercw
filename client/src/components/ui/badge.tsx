import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold font-sans transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-orange-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-brand-orange-500 text-white shadow-sm hover:bg-brand-orange-600",
        secondary: 
          "border-transparent bg-brand-grey-900 text-white hover:bg-brand-grey-800",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-red-600",
        outline: 
          "border border-brand-orange-500 text-brand-orange-500 bg-transparent hover:bg-brand-orange-50",
        success:
          "border-transparent bg-green-600 text-white shadow-sm hover:bg-green-700",
        warning:
          "border-transparent bg-yellow-500 text-white shadow-sm hover:bg-yellow-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants }

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium font-sans transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-brand-orange-500 text-white border border-brand-orange-600 hover:bg-brand-orange-600 active:bg-brand-orange-700 shadow-sm hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive-border hover:bg-red-600 active:bg-red-700",
        outline:
          "border-2 border-brand-orange-500 text-brand-orange-500 bg-transparent hover:bg-brand-orange-500 hover:text-white active:bg-brand-orange-600 shadow-sm",
        secondary: 
          "bg-brand-grey-900 text-white border border-brand-grey-800 hover:bg-brand-grey-800 active:bg-brand-grey-700 shadow-sm hover:shadow-md",
        ghost: 
          "border border-transparent text-brand-orange-500 hover:bg-brand-orange-50 hover:text-brand-orange-600 active:bg-brand-orange-100",
        link:
          "text-brand-orange-500 underline-offset-4 hover:underline hover:text-brand-orange-600 active:text-brand-orange-700",
      },
      // Heights are set as "min" heights, because sometimes AI will place large amount of content
      // inside buttons. With a min-height they will look appropriate with small amounts of content,
      // but will expand to fit large amounts of content.
      size: {
        default: "min-h-9 px-4 py-2 text-sm",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }

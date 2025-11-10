import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown } from "lucide-react";

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  badge?: string;
  color?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, icon: Icon, trend, badge, color, ...props }, ref) => {
    const colorClasses = {
      blue: "text-blue-600 bg-blue-50",
      green: "text-green-600 bg-green-50",
      orange: "text-orange-600 bg-orange-50",
      purple: "text-purple-600 bg-purple-50",
      red: "text-red-600 bg-red-50",
      yellow: "text-yellow-600 bg-yellow-50",
    };

    const iconColorClass = color && color in colorClasses 
      ? colorClasses[color as keyof typeof colorClasses]
      : "text-primary bg-primary/10";

    return (
      <Card ref={ref} className={cn("hover:shadow-md transition-shadow", className)} {...props}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                {badge && (
                  <Badge variant="secondary" className="text-xs">
                    {badge}
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{value}</p>
                {trend && (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      trend.direction === "up" ? "text-green-600" : "text-red-600"
                    )}
                  >
                    {trend.direction === "up" ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                    <span>{Math.abs(trend.value)}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className={cn("p-3 rounded-lg", iconColorClass)}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

StatCard.displayName = "StatCard";

export { StatCard };

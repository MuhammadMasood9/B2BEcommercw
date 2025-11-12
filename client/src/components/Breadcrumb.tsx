import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center space-x-2 text-sm", className)}
    >
      <Link href="/">
        <a className="flex items-center text-muted-foreground hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors">
          <Home className="w-4 h-4" />
        </a>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon;

        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {item.href && !isLast ? (
              <Link href={item.href}>
                <a className="flex items-center gap-1.5 text-muted-foreground hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors">
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </a>
              </Link>
            ) : (
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  isLast
                    ? "text-foreground dark:text-white font-medium"
                    : "text-muted-foreground dark:text-gray-400"
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;

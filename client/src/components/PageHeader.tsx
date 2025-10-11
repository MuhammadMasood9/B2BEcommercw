import { ReactNode } from "react";
import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{
    label: string;
    href?: string;
  }>;
  children?: ReactNode;
  variant?: "default" | "gradient" | "minimal";
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  children,
  variant = "gradient",
  className = ""
}: PageHeaderProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "gradient":
        return "bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 text-white";
      case "minimal":
        return "bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800";
      default:
        return "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800";
    }
  };

  return (
    <div className={`relative overflow-hidden ${getVariantClasses()} ${className}`}>
      {/* Background Pattern */}
      {variant === "gradient" && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] bg-repeat"></div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-2 text-sm mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-gray-300 dark:hover:text-gray-400 transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center space-x-2">
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-400" />
                {crumb.href ? (
                  <Link 
                    href={crumb.href} 
                    className="hover:text-gray-300 dark:hover:text-gray-400 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-gray-300 dark:text-gray-400">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className={`text-lg sm:text-xl max-w-2xl ${
                variant === "gradient" 
                  ? "text-gray-200" 
                  : "text-gray-600 dark:text-gray-400"
              }`}>
                {subtitle}
              </p>
            )}
          </div>

          {/* Action Buttons/Content */}
          {children && (
            <div className="flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                {children}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Accent */}
        {variant === "gradient" && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-500 to-gray-600"></div>
        )}
      </div>
    </div>
  );
}

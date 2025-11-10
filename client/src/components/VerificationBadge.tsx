import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Award, CheckCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  level: 'none' | 'basic' | 'business' | 'premium';
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function VerificationBadge({ 
  level, 
  isVerified, 
  size = 'md', 
  showLabel = true,
  className = '' 
}: VerificationBadgeProps) {
  if (!isVerified || level === 'none') {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const getBadgeConfig = () => {
    switch (level) {
      case 'premium':
        return {
          icon: Award,
          label: 'Premium Verified',
          shortLabel: 'Premium',
          color: 'bg-yellow-600 hover:bg-yellow-700 text-white border-0',
          description: 'Premium verified supplier with comprehensive business verification, trade references, and quality certifications.'
        };
      case 'business':
        return {
          icon: ShieldCheck,
          label: 'Business Verified',
          shortLabel: 'Business',
          color: 'bg-blue-600 hover:bg-blue-700 text-white border-0',
          description: 'Business verified supplier with confirmed business registration and documentation.'
        };
      case 'basic':
        return {
          icon: CheckCircle,
          label: 'Verified',
          shortLabel: 'Verified',
          color: 'bg-green-600 hover:bg-green-700 text-white border-0',
          description: 'Basic verified supplier with confirmed identity and contact information.'
        };
      default:
        return null;
    }
  };

  const config = getBadgeConfig();
  if (!config) return null;

  const Icon = config.icon;
  const label = showLabel ? config.label : config.shortLabel;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${config.color} ${sizeClasses[size]} ${className} cursor-help`}>
            <Icon className={`${iconSizes[size]} ${showLabel ? 'mr-1' : ''}`} />
            {showLabel && label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

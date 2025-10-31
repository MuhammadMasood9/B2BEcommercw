import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  Award,
  Star,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  level: string;
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const VERIFICATION_CONFIG = {
  none: {
    name: 'Not Verified',
    icon: Shield,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    variant: 'secondary' as const
  },
  basic: {
    name: 'Basic Verified',
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    variant: 'default' as const
  },
  business: {
    name: 'Business Verified',
    icon: Award,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    variant: 'default' as const
  },
  premium: {
    name: 'Premium Verified',
    icon: Star,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    variant: 'default' as const
  },
  trade_assurance: {
    name: 'Trade Assurance',
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    variant: 'default' as const
  }
};

export function VerificationBadge({ 
  level, 
  isVerified, 
  size = 'md', 
  showLabel = true,
  className 
}: VerificationBadgeProps) {
  // If not verified, show as not verified regardless of level
  const effectiveLevel = isVerified ? level : 'none';
  const config = VERIFICATION_CONFIG[effectiveLevel as keyof typeof VERIFICATION_CONFIG] || VERIFICATION_CONFIG.none;
  
  const Icon = config.icon;
  
  const sizeConfig = {
    sm: {
      icon: 'h-3 w-3',
      text: 'text-xs',
      padding: 'px-2 py-1'
    },
    md: {
      icon: 'h-4 w-4',
      text: 'text-sm',
      padding: 'px-2.5 py-1'
    },
    lg: {
      icon: 'h-5 w-5',
      text: 'text-base',
      padding: 'px-3 py-1.5'
    }
  };

  const currentSize = sizeConfig[size];

  if (!showLabel) {
    // Icon only version
    return (
      <div 
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          config.bgColor,
          config.borderColor,
          'border',
          size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-10 h-10',
          className
        )}
        title={config.name}
      >
        <Icon className={cn(currentSize.icon, config.color)} />
      </div>
    );
  }

  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        'inline-flex items-center gap-1.5',
        currentSize.padding,
        currentSize.text,
        config.bgColor,
        config.borderColor,
        'border',
        className
      )}
    >
      <Icon className={cn(currentSize.icon, config.color)} />
      {config.name}
    </Badge>
  );
}

// Utility function to get verification level display name
export function getVerificationLevelName(level: string, isVerified: boolean): string {
  const effectiveLevel = isVerified ? level : 'none';
  return VERIFICATION_CONFIG[effectiveLevel as keyof typeof VERIFICATION_CONFIG]?.name || 'Unknown';
}

// Utility function to check if a level is higher than another
export function isHigherVerificationLevel(level1: string, level2: string): boolean {
  const hierarchy = ['none', 'basic', 'business', 'premium', 'trade_assurance'];
  const index1 = hierarchy.indexOf(level1);
  const index2 = hierarchy.indexOf(level2);
  return index1 > index2;
}

// Utility function to get verification benefits
export function getVerificationBenefits(level: string): string[] {
  const benefits = {
    none: [],
    basic: [
      'Basic verification badge',
      'Increased buyer trust',
      'Access to basic features'
    ],
    business: [
      'Business verification badge',
      'Higher search ranking',
      'Access to premium features',
      'Reduced commission rates'
    ],
    premium: [
      'Premium verification badge',
      'Priority customer support',
      'Featured listing opportunities',
      'Lowest commission rates',
      'Advanced analytics'
    ],
    trade_assurance: [
      'Trade Assurance badge',
      'Order protection guarantee',
      'Priority dispute resolution',
      'Exclusive marketing opportunities',
      'Dedicated account manager'
    ]
  };

  return benefits[level as keyof typeof benefits] || [];
}
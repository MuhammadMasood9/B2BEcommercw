import React, { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface PermissionGuardProps {
  children: ReactNode;
  resource?: string;
  action?: string;
  role?: string | string[];
  requireEmailVerification?: boolean;
  requireSupplierApproval?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  resource,
  action,
  role,
  requireEmailVerification = false,
  requireSupplierApproval = false,
  fallback = null,
  showFallback = true,
}) => {
  const { 
    user, 
    isAuthenticated, 
    hasRole, 
    hasPermission, 
    isEmailVerified, 
    isSupplierApproved 
  } = useAuth();

  // Check authentication
  if (!isAuthenticated) {
    return showFallback ? <>{fallback}</> : null;
  }

  // Check role requirement
  if (role && !hasRole(role)) {
    return showFallback ? <>{fallback}</> : null;
  }

  // Check email verification requirement
  if (requireEmailVerification && !isEmailVerified) {
    return showFallback ? <>{fallback}</> : null;
  }

  // Check supplier approval requirement
  if (requireSupplierApproval && !isSupplierApproved) {
    return showFallback ? <>{fallback}</> : null;
  }

  // Check specific permission requirement
  if (resource && action && !hasPermission(resource, action)) {
    return showFallback ? <>{fallback}</> : null;
  }

  // All checks passed, render children
  return <>{children}</>;
};

// Convenience components for common permission patterns
export const AdminOnly: React.FC<{ 
  children: ReactNode; 
  fallback?: ReactNode;
  showFallback?: boolean;
}> = ({ children, fallback, showFallback = false }) => (
  <PermissionGuard role="admin" fallback={fallback} showFallback={showFallback}>
    {children}
  </PermissionGuard>
);

export const SupplierOnly: React.FC<{ 
  children: ReactNode; 
  requireApproval?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
}> = ({ children, requireApproval = false, fallback, showFallback = false }) => (
  <PermissionGuard 
    role="supplier" 
    requireSupplierApproval={requireApproval}
    fallback={fallback} 
    showFallback={showFallback}
  >
    {children}
  </PermissionGuard>
);

export const BuyerOnly: React.FC<{ 
  children: ReactNode; 
  requireVerification?: boolean;
  fallback?: ReactNode;
  showFallback?: boolean;
}> = ({ children, requireVerification = false, fallback, showFallback = false }) => (
  <PermissionGuard 
    role="buyer" 
    requireEmailVerification={requireVerification}
    fallback={fallback} 
    showFallback={showFallback}
  >
    {children}
  </PermissionGuard>
);

export const AuthenticatedOnly: React.FC<{ 
  children: ReactNode; 
  fallback?: ReactNode;
  showFallback?: boolean;
}> = ({ children, fallback, showFallback = false }) => (
  <PermissionGuard fallback={fallback} showFallback={showFallback}>
    {children}
  </PermissionGuard>
);

export const HasPermission: React.FC<{ 
  children: ReactNode; 
  resource: string;
  action: string;
  fallback?: ReactNode;
  showFallback?: boolean;
}> = ({ children, resource, action, fallback, showFallback = false }) => (
  <PermissionGuard 
    resource={resource} 
    action={action} 
    fallback={fallback} 
    showFallback={showFallback}
  >
    {children}
  </PermissionGuard>
);

export const MultiRole: React.FC<{ 
  children: ReactNode; 
  roles: string[];
  fallback?: ReactNode;
  showFallback?: boolean;
}> = ({ children, roles, fallback, showFallback = false }) => (
  <PermissionGuard role={roles} fallback={fallback} showFallback={showFallback}>
    {children}
  </PermissionGuard>
);

// Hook for conditional rendering based on permissions
export const usePermissions = () => {
  const { hasRole, hasPermission, isEmailVerified, isSupplierApproved } = useAuth();

  const canAccess = (config: {
    role?: string | string[];
    resource?: string;
    action?: string;
    requireEmailVerification?: boolean;
    requireSupplierApproval?: boolean;
  }) => {
    if (config.role && !hasRole(config.role)) {
      return false;
    }

    if (config.requireEmailVerification && !isEmailVerified) {
      return false;
    }

    if (config.requireSupplierApproval && !isSupplierApproved) {
      return false;
    }

    if (config.resource && config.action && !hasPermission(config.resource, config.action)) {
      return false;
    }

    return true;
  };

  return {
    canAccess,
    hasRole,
    hasPermission,
    isEmailVerified,
    isSupplierApproved,
  };
};

export default PermissionGuard;
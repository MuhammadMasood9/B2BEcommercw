import { useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../contexts/AuthContext';

interface NavigationGuardOptions {
  requireAuth?: boolean;
  requireRole?: string | string[];
  requireEmailVerification?: boolean;
  requireSupplierApproval?: boolean;
  requirePermission?: {
    resource: string;
    action: string;
  };
  redirectTo?: string;
  onUnauthorized?: () => void;
  onSuccess?: () => void;
}

export const useNavigationGuard = (options: NavigationGuardOptions = {}) => {
  const {
    requireAuth = true,
    requireRole,
    requireEmailVerification = false,
    requireSupplierApproval = false,
    requirePermission,
    redirectTo = '/login',
    onUnauthorized,
    onSuccess,
  } = options;

  const [location, setLocation] = useLocation();
  const {
    user,
    loading,
    isAuthenticated,
    hasRole,
    hasPermission,
    isEmailVerified,
    isSupplierApproved,
    isAccountLocked,
  } = useAuth();

  const checkAccess = useCallback(() => {
    // Don't check while loading
    if (loading) return { allowed: true, reason: null };

    // Check authentication
    if (requireAuth && !isAuthenticated) {
      return { allowed: false, reason: 'authentication_required' };
    }

    // Check account lock
    if (isAuthenticated && isAccountLocked) {
      return { allowed: false, reason: 'account_locked' };
    }

    // Check role
    if (requireRole && !hasRole(requireRole)) {
      return { allowed: false, reason: 'insufficient_role' };
    }

    // Check email verification
    if (requireEmailVerification && !isEmailVerified) {
      return { allowed: false, reason: 'email_verification_required' };
    }

    // Check supplier approval
    if (requireSupplierApproval && !isSupplierApproved) {
      return { allowed: false, reason: 'supplier_approval_required' };
    }

    // Check specific permission
    if (requirePermission && !hasPermission(requirePermission.resource, requirePermission.action)) {
      return { allowed: false, reason: 'insufficient_permissions' };
    }

    return { allowed: true, reason: null };
  }, [
    loading,
    requireAuth,
    isAuthenticated,
    isAccountLocked,
    requireRole,
    hasRole,
    requireEmailVerification,
    isEmailVerified,
    requireSupplierApproval,
    isSupplierApproved,
    requirePermission,
    hasPermission,
  ]);

  const navigate = useCallback((path: string) => {
    const { allowed, reason } = checkAccess();
    
    if (allowed) {
      setLocation(path);
      onSuccess?.();
    } else {
      onUnauthorized?.();
      
      // Handle different unauthorized reasons
      switch (reason) {
        case 'authentication_required':
          setLocation(`${redirectTo}?redirect=${encodeURIComponent(path)}`);
          break;
        case 'account_locked':
          setLocation('/account-locked');
          break;
        case 'email_verification_required':
          setLocation('/email-verification');
          break;
        case 'supplier_approval_required':
          setLocation('/supplier/application-status');
          break;
        case 'insufficient_role':
        case 'insufficient_permissions':
          // Redirect to appropriate dashboard
          if (user?.role === 'admin') {
            setLocation('/admin/dashboard');
          } else if (user?.role === 'supplier') {
            setLocation('/supplier/dashboard');
          } else if (user?.role === 'buyer') {
            setLocation('/buyer/dashboard');
          } else {
            setLocation('/dashboard');
          }
          break;
        default:
          setLocation(redirectTo);
      }
    }
  }, [checkAccess, setLocation, onSuccess, onUnauthorized, redirectTo, user?.role]);

  const canAccess = useCallback((path?: string) => {
    return checkAccess().allowed;
  }, [checkAccess]);

  const getAccessReason = useCallback(() => {
    return checkAccess().reason;
  }, [checkAccess]);

  // Auto-redirect on mount if access is denied
  useEffect(() => {
    const { allowed, reason } = checkAccess();
    
    if (!loading && !allowed) {
      onUnauthorized?.();
      
      switch (reason) {
        case 'authentication_required':
          setLocation(`${redirectTo}?redirect=${encodeURIComponent(location)}`);
          break;
        case 'account_locked':
          setLocation('/account-locked');
          break;
        case 'email_verification_required':
          setLocation('/email-verification');
          break;
        case 'supplier_approval_required':
          setLocation('/supplier/application-status');
          break;
        case 'insufficient_role':
        case 'insufficient_permissions':
          // Redirect to appropriate dashboard
          if (user?.role === 'admin') {
            setLocation('/admin/dashboard');
          } else if (user?.role === 'supplier') {
            setLocation('/supplier/dashboard');
          } else if (user?.role === 'buyer') {
            setLocation('/buyer/dashboard');
          } else {
            setLocation('/dashboard');
          }
          break;
        default:
          setLocation(redirectTo);
      }
    } else if (!loading && allowed) {
      onSuccess?.();
    }
  }, [
    loading,
    checkAccess,
    setLocation,
    location,
    redirectTo,
    user?.role,
    onUnauthorized,
    onSuccess,
  ]);

  return {
    canAccess,
    navigate,
    getAccessReason,
    isLoading: loading,
    user,
  };
};

// Convenience hooks for common patterns
export const useAdminGuard = (options: Omit<NavigationGuardOptions, 'requireRole'> = {}) => {
  return useNavigationGuard({
    ...options,
    requireRole: 'admin',
  });
};

export const useSupplierGuard = (options: Omit<NavigationGuardOptions, 'requireRole'> = {}) => {
  return useNavigationGuard({
    ...options,
    requireRole: 'supplier',
    requireSupplierApproval: true,
  });
};

export const useBuyerGuard = (options: Omit<NavigationGuardOptions, 'requireRole'> = {}) => {
  return useNavigationGuard({
    ...options,
    requireRole: 'buyer',
    requireEmailVerification: true,
  });
};

export const useAuthGuard = (options: Omit<NavigationGuardOptions, 'requireAuth'> = {}) => {
  return useNavigationGuard({
    ...options,
    requireAuth: true,
  });
};

export default useNavigationGuard;
import React, { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../../contexts/AuthContext';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { AlertCircle, Loader2, Shield, Mail, Clock } from 'lucide-react';

interface RouteGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireRole?: string | string[];
  requireEmailVerification?: boolean;
  requireSupplierApproval?: boolean;
  requirePermission?: {
    resource: string;
    action: string;
  };
  fallbackPath?: string;
  loadingComponent?: ReactNode;
  unauthorizedComponent?: ReactNode;
  redirectOnSuccess?: string;
  showRetry?: boolean;
}

export const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requireAuth = true,
  requireRole,
  requireEmailVerification = false,
  requireSupplierApproval = false,
  requirePermission,
  fallbackPath = '/login',
  loadingComponent,
  unauthorizedComponent,
  redirectOnSuccess,
  showRetry = true,
}) => {
  const { 
    user, 
    loading, 
    error,
    authStatus,
    isAuthenticated, 
    hasRole, 
    hasPermission, 
    isEmailVerified, 
    isSupplierApproved,
    isAccountLocked,
    clearError
  } = useAuth();
  const [location, setLocation] = useLocation();

  // Handle authentication errors
  useEffect(() => {
    if (error && showRetry) {
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, showRetry, clearError]);

  // Show loading component while checking authentication
  if (loading || authStatus === 'loading') {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">Loading...</h3>
            <p className="text-sm text-gray-600">Verifying your access permissions</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (authStatus === 'error' && error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-4">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          {showRetry && (
            <div className="text-center space-y-4">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => setLocation('/login')} 
                className="w-full"
              >
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    setLocation(`${fallbackPath}?redirect=${encodeURIComponent(location)}`);
    return null;
  }

  // Handle account locked
  if (isAuthenticated && isAccountLocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-4 text-center space-y-4">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Account Locked</h1>
            <p className="text-gray-600">
              Your account has been temporarily locked due to multiple failed login attempts.
            </p>
            <p className="text-sm text-gray-500">
              Please try again later or contact support for assistance.
            </p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => setLocation('/forgot-password')} className="w-full">
              Reset Password
            </Button>
            <Button onClick={() => setLocation('/contact')} variant="outline" className="w-full">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check role requirement
  if (requireRole && !hasRole(requireRole)) {
    const unauthorizedContent = unauthorizedComponent || (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-4 text-center space-y-4">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600">
              You don't have the required permissions to access this page.
            </p>
            <p className="text-sm text-gray-500">
              Required role: {Array.isArray(requireRole) ? requireRole.join(', ') : requireRole}
            </p>
            <p className="text-sm text-gray-500">
              Your role: {user?.role || 'Unknown'}
            </p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => window.history.back()} variant="outline" className="w-full">
              Go Back
            </Button>
            <Button onClick={() => {
              // Role-based redirect
              switch (user?.role) {
                case 'admin':
                  setLocation('/admin/dashboard');
                  break;
                case 'supplier':
                  setLocation('/supplier/dashboard');
                  break;
                case 'buyer':
                  setLocation('/buyer/dashboard');
                  break;
                default:
                  setLocation('/dashboard');
              }
            }} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
    return <>{unauthorizedContent}</>;
  }

  // Check email verification requirement
  if (requireEmailVerification && !isEmailVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-4 text-center space-y-4">
          <div className="bg-yellow-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
            <Mail className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Email Verification Required</h1>
            <p className="text-gray-600">
              Please verify your email address to access this feature.
            </p>
            <p className="text-sm text-gray-500">
              We sent a verification link to: {user?.email}
            </p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => setLocation('/email-verification')} className="w-full">
              Verify Email
            </Button>
            <Button 
              onClick={async () => {
                try {
                  // Resend verification email logic would go here
                  // await resendVerificationEmail();
                  alert('Verification email sent!');
                } catch (error) {
                  alert('Failed to send verification email');
                }
              }} 
              variant="outline" 
              className="w-full"
            >
              Resend Verification Email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check supplier approval requirement
  if (requireSupplierApproval && !isSupplierApproved) {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return 'bg-yellow-100 text-yellow-600';
        case 'rejected': return 'bg-red-100 text-red-600';
        case 'suspended': return 'bg-red-100 text-red-600';
        default: return 'bg-gray-100 text-gray-600';
      }
    };

    const getStatusMessage = (status: string) => {
      switch (status) {
        case 'pending': return 'Your supplier application is under review. We will notify you once approved.';
        case 'rejected': return 'Your supplier application was rejected. Please contact support for more information.';
        case 'suspended': return 'Your supplier account has been suspended. Please contact support.';
        default: return 'Your supplier account requires approval to access this feature.';
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-4 text-center space-y-4">
          <div className="bg-yellow-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Supplier Approval Required</h1>
            <p className="text-gray-600">
              {getStatusMessage(user?.supplierStatus || '')}
            </p>
            <div className="inline-flex items-center gap-2">
              <span className="text-sm text-gray-500">Current status:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user?.supplierStatus || '')}`}>
                {user?.supplierStatus || 'Unknown'}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Button onClick={() => setLocation('/supplier/application-status')} className="w-full">
              View Application Status
            </Button>
            {user?.supplierStatus === 'rejected' && (
              <Button onClick={() => setLocation('/contact')} variant="outline" className="w-full">
                Contact Support
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Check specific permission requirement
  if (requirePermission && !hasPermission(requirePermission.resource, requirePermission.action)) {
    const unauthorizedContent = unauthorizedComponent || (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full mx-4 text-center space-y-4">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Insufficient Permissions</h1>
            <p className="text-gray-600">
              You don't have permission to perform this action.
            </p>
            <p className="text-sm text-gray-500">
              Required permission: {requirePermission.action} on {requirePermission.resource}
            </p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => window.history.back()} variant="outline" className="w-full">
              Go Back
            </Button>
            <Button onClick={() => {
              // Role-based redirect
              switch (user?.role) {
                case 'admin':
                  setLocation('/admin/dashboard');
                  break;
                case 'supplier':
                  setLocation('/supplier/dashboard');
                  break;
                case 'buyer':
                  setLocation('/buyer/dashboard');
                  break;
                default:
                  setLocation('/dashboard');
              }
            }} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
    return <>{unauthorizedContent}</>;
  }

  // Handle successful redirect if specified
  if (redirectOnSuccess && isAuthenticated) {
    setLocation(redirectOnSuccess);
    return null;
  }

  // All checks passed, render children
  return <>{children}</>;
};

// Convenience components for common guard patterns
export const AdminGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RouteGuard requireRole="admin">
    {children}
  </RouteGuard>
);

export const SupplierGuard: React.FC<{ children: ReactNode; requireApproval?: boolean }> = ({ 
  children, 
  requireApproval = false 
}) => (
  <RouteGuard 
    requireRole="supplier" 
    requireSupplierApproval={requireApproval}
  >
    {children}
  </RouteGuard>
);

export const BuyerGuard: React.FC<{ children: ReactNode; requireVerification?: boolean }> = ({ 
  children, 
  requireVerification = false 
}) => (
  <RouteGuard 
    requireRole="buyer" 
    requireEmailVerification={requireVerification}
  >
    {children}
  </RouteGuard>
);

export const AuthGuard: React.FC<{ children: ReactNode }> = ({ children }) => (
  <RouteGuard requireAuth>
    {children}
  </RouteGuard>
);

export const MultiRoleGuard: React.FC<{ 
  children: ReactNode; 
  roles: string[];
  requireVerification?: boolean;
}> = ({ children, roles, requireVerification = false }) => (
  <RouteGuard 
    requireRole={roles}
    requireEmailVerification={requireVerification}
  >
    {children}
  </RouteGuard>
);

export default RouteGuard;
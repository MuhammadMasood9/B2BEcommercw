import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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
}) => {
  const { 
    user, 
    loading, 
    isAuthenticated, 
    hasRole, 
    hasPermission, 
    isEmailVerified, 
    isSupplierApproved 
  } = useAuth();
  const location = useLocation();

  // Show loading component while checking authentication
  if (loading) {
    return loadingComponent ? (
      <>{loadingComponent}</>
    ) : (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role requirement
  if (requireRole && !hasRole(requireRole)) {
    const unauthorizedContent = unauthorizedComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have the required permissions to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Required role: {Array.isArray(requireRole) ? requireRole.join(', ') : requireRole}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
    return <>{unauthorizedContent}</>;
  }

  // Check email verification requirement
  if (requireEmailVerification && !isEmailVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Verification Required</h1>
          <p className="text-gray-600 mb-4">
            Please verify your email address to access this feature.
          </p>
          <button
            onClick={() => window.location.href = '/verify-email'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Verify Email
          </button>
        </div>
      </div>
    );
  }

  // Check supplier approval requirement
  if (requireSupplierApproval && !isSupplierApproved) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Supplier Approval Required</h1>
          <p className="text-gray-600 mb-4">
            Your supplier account is pending approval. Please wait for admin approval to access this feature.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Current status: {user?.supplierStatus || 'Unknown'}
          </p>
          <button
            onClick={() => window.location.href = '/supplier/dashboard'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Check specific permission requirement
  if (requirePermission && !hasPermission(requirePermission.resource, requirePermission.action)) {
    const unauthorizedContent = unauthorizedComponent || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Insufficient Permissions</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to perform this action.
          </p>
          <p className="text-sm text-gray-500">
            Required permission: {requirePermission.action} on {requirePermission.resource}
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
    return <>{unauthorizedContent}</>;
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
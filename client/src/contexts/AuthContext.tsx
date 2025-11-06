import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  role: 'buyer' | 'admin' | 'supplier';
  emailVerified: boolean;
  isActive: boolean;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Security fields
  lastLoginAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  
  // Enhanced role-specific data
  supplierId?: string;
  supplierStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  membershipTier?: 'free' | 'silver' | 'gold' | 'platinum';
  verificationLevel?: 'none' | 'basic' | 'business' | 'premium' | 'trade_assurance';
  buyerId?: string;
  isStaffMember?: boolean;
  staffMemberId?: string;
  staffRole?: 'manager' | 'product_manager' | 'customer_service' | 'accountant';
  staffPermissions?: Record<string, string[]>;
  
  // Additional profile data
  position?: string;
  industry?: string;
  businessType?: 'manufacturer' | 'trading_company' | 'wholesaler' | 'distributor';
  storeName?: string;
  storeSlug?: string;
  rating?: number;
  totalReviews?: number;
  responseRate?: number;
  responseTime?: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  authStatus: 'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  
  // Authentication methods
  login: (email: string, password: string, useJWT?: boolean) => Promise<void>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  
  // Status checks
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  isSupplierApproved: boolean;
  isEmailVerified: boolean;
  isAccountLocked: boolean;
  isStaffMember: boolean;
  
  // Enhanced permission helpers
  canAccessResource: (resource: string, action: string) => boolean;
  canManageSupplierResource: (resource: string, action: string) => boolean;
  canAccessAdminFeature: (feature: string) => boolean;
  
  // User management
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  
  // Session management
  extendSession: () => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  phone?: string;
  role: 'buyer' | 'supplier' | 'admin';
  industry?: string;
  businessType?: string;
  position?: string;
  mainProducts?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'authenticated' | 'unauthenticated' | 'error'>('idle');

  // Token management
  const getAccessToken = () => localStorage.getItem('accessToken');
  const getRefreshToken = () => localStorage.getItem('refreshToken');
  const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  };
  const clearTokens = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  // API request helper with automatic token handling
  const apiRequest = async (url: string, options: RequestInit = {}) => {
    const accessToken = getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If token expired, try to refresh
    if (response.status === 401 && accessToken) {
      const refreshed = await refreshTokenInternal();
      if (refreshed) {
        // Retry the request with new token
        headers['Authorization'] = `Bearer ${getAccessToken()}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    return response;
  };

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      setAuthStatus('loading');
      setError(null);
      
      const response = await apiRequest('/api/auth/me');

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setAuthStatus('authenticated');
      } else {
        setUser(null);
        clearTokens();
        setAuthStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      clearTokens();
      setError('Failed to verify authentication');
      setAuthStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (email: string, password: string, useJWT: boolean = true) => {
    try {
      setLoading(true);
      setAuthStatus('loading');
      setError(null);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, useJWT }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Login failed');
        setAuthStatus('error');
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();

      if (useJWT && data.accessToken) {
        setTokens(data.accessToken, data.refreshToken);
      }

      setUser(data.user);
      setAuthStatus('authenticated');
    } catch (error) {
      console.error('Login error:', error);
      setAuthStatus('error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      clearTokens();
      setAuthStatus('unauthenticated');
      setError(null);
      setLoading(false);
    }
  };

  // Internal refresh token function that returns boolean
  const refreshTokenInternal = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = getRefreshToken();

      if (!refreshTokenValue) {
        setAuthStatus('unauthenticated');
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (response.ok) {
        const data = await response.json();
        setTokens(data.accessToken, data.refreshToken);
        setUser(data.user);
        setAuthStatus('authenticated');
        setError(null);
        return true;
      } else {
        clearTokens();
        setUser(null);
        setAuthStatus('unauthenticated');
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearTokens();
      setUser(null);
      setError('Session expired. Please login again.');
      setAuthStatus('error');
      return false;
    }
  };

  // Public refresh token function that matches interface
  const refreshToken = async (): Promise<void> => {
    await refreshTokenInternal();
  };

  // Register function
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      setLoading(true);
      setAuthStatus('loading');
      setError(null);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Registration failed');
        setAuthStatus('error');
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();

      // If JWT tokens are returned, store them
      if (data.accessToken) {
        setTokens(data.accessToken, data.refreshToken);
      }

      setUser(data.user);
      setAuthStatus('authenticated');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthStatus('error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Role checking helper
  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role;
  };

  // Permission checking helper (simplified client-side version)
  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;

    // Admin has all permissions
    if (user.role === 'admin') return true;

    // Check staff permissions for suppliers
    if (user.isStaffMember && user.staffPermissions) {
      return user.staffPermissions[resource]?.includes(action) || false;
    }

    // Simplified permission logic for client-side
    const rolePermissions: Record<string, Record<string, string[]>> = {
      supplier: {
        products: ['read', 'write', 'delete'],
        orders: ['read', 'write', 'fulfill'],
        inquiries: ['read', 'write', 'respond'],
        quotations: ['read', 'write', 'send'],
        rfqs: ['read', 'respond'],
        analytics: ['read'],
        financial: ['read'],
        settings: ['read', 'write'],
      },
      buyer: {
        products: ['read', 'search', 'favorite'],
        orders: ['read', 'write', 'cancel'],
        inquiries: ['read', 'write', 'send'],
        quotations: ['read', 'compare', 'accept'],
        rfqs: ['read', 'write', 'create'],
        analytics: ['read'],
        settings: ['read', 'write'],
      }
    };

    const userPermissions = rolePermissions[user.role];
    return userPermissions?.[resource]?.includes(action) || false;
  };

  // Enhanced permission helpers
  const canAccessResource = (resource: string, action: string): boolean => {
    return hasPermission(resource, action);
  };

  const canManageSupplierResource = (resource: string, action: string): boolean => {
    if (!user || user.role !== 'supplier') return false;
    
    // Check if supplier is approved for write operations
    if (['write', 'delete', 'create'].includes(action) && !isSupplierApproved) {
      return false;
    }
    
    return hasPermission(resource, action);
  };

  const canAccessAdminFeature = (feature: string): boolean => {
    if (!user || user.role !== 'admin') return false;
    
    // All admins can access all features for now
    // In a more complex system, you might have different admin roles
    return true;
  };

  // User management functions
  const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
    try {
      setError(null);
      const response = await apiRequest('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      setError(null);
      const response = await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to change password');
        throw new Error(errorData.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      throw error;
    }
  };

  const requestPasswordReset = async (email: string): Promise<void> => {
    try {
      setError(null);
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to request password reset');
        throw new Error(errorData.error || 'Failed to request password reset');
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      throw error;
    }
  };

  const verifyEmail = async (token: string): Promise<void> => {
    try {
      setError(null);
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to verify email');
        throw new Error(errorData.error || 'Failed to verify email');
      }

      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  };

  const resendVerificationEmail = async (): Promise<void> => {
    try {
      setError(null);
      const response = await apiRequest('/api/auth/resend-verification', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to resend verification email');
        throw new Error(errorData.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  };

  const extendSession = async (): Promise<void> => {
    try {
      const response = await apiRequest('/api/auth/extend-session', {
        method: 'POST',
      });

      if (!response.ok) {
        console.warn('Failed to extend session');
      }
    } catch (error) {
      console.warn('Session extension error:', error);
    }
  };

  // Computed properties
  const isAuthenticated = !!user;
  const isSupplierApproved = user?.role === 'supplier' && user?.supplierStatus === 'approved';
  const isEmailVerified = user?.emailVerified || false;
  const isAccountLocked = user?.lockedUntil ? new Date(user.lockedUntil) > new Date() : false;
  const isStaffMember = user?.isStaffMember || false;

  // Initialize auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Track user activity for session management
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let activityTimer: NodeJS.Timeout;

    const resetActivityTimer = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(() => {
        // User has been inactive for 25 minutes, extend session
        extendSession().catch(console.error);
      }, 25 * 60 * 1000);
    };

    const handleActivity = () => {
      resetActivityTimer();
    };

    // Set up activity listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Initialize timer
    resetActivityTimer();

    return () => {
      clearTimeout(activityTimer);
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [isAuthenticated, extendSession]);

  // Set up token refresh interval and session extension
  useEffect(() => {
    if (user && getAccessToken()) {
      // Refresh token every 14 minutes (token expires in 15)
      const refreshInterval = setInterval(() => {
        refreshToken().catch(console.error);
      }, 14 * 60 * 1000);

      // Extend session every 25 minutes (session timeout is 30 minutes)
      const sessionInterval = setInterval(() => {
        extendSession().catch(console.error);
      }, 25 * 60 * 1000);

      return () => {
        clearInterval(refreshInterval);
        clearInterval(sessionInterval);
      };
    }
  }, [user, refreshToken, extendSession]);

  const value: AuthContextType = {
    user,
    loading,
    error,
    authStatus,
    
    // Authentication methods
    login,
    register,
    logout,
    refreshToken,
    
    // Status checks
    isAuthenticated,
    hasRole,
    hasPermission,
    isSupplierApproved,
    isEmailVerified,
    isAccountLocked,
    isStaffMember,
    
    // Enhanced permission helpers
    canAccessResource,
    canManageSupplierResource,
    canAccessAdminFeature,
    
    // User management
    updateUserProfile,
    changePassword,
    requestPasswordReset,
    verifyEmail,
    resendVerificationEmail,
    
    // Session management
    extendSession,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
  createdAt: Date;
  // Enhanced role-specific data
  supplierId?: string;
  supplierStatus?: string;
  membershipTier?: string;
  buyerId?: string;
  isStaffMember?: boolean;
  staffMemberId?: string;
  staffRole?: string;
  staffPermissions?: Record<string, string[]>;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, useJWT?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
  isSupplierApproved: boolean;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
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
      const refreshed = await refreshToken();
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

  // Check authentication status
  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/auth/me');
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
        clearTokens();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      clearTokens();
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string, useJWT: boolean = true) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, useJWT }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      
      if (useJWT && data.accessToken) {
        setTokens(data.accessToken, data.refreshToken);
      }
      
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      clearTokens();
    }
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = getRefreshToken();
      
      if (!refreshTokenValue) {
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
        return true;
      } else {
        clearTokens();
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearTokens();
      setUser(null);
      return false;
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
    
    // Simplified permission logic for client-side
    // In a real application, you might want to fetch permissions from the server
    const rolePermissions: Record<string, Record<string, string[]>> = {
      supplier: {
        products: ['read', 'write', 'delete'],
        orders: ['read', 'write', 'fulfill'],
        inquiries: ['read', 'write', 'respond'],
        quotations: ['read', 'write', 'send'],
        rfqs: ['read', 'respond'],
      },
      buyer: {
        products: ['read', 'search', 'favorite'],
        orders: ['read', 'write', 'cancel'],
        inquiries: ['read', 'write', 'send'],
        quotations: ['read', 'compare', 'accept'],
        rfqs: ['read', 'write', 'create'],
      }
    };
    
    const userPermissions = rolePermissions[user.role];
    return userPermissions?.[resource]?.includes(action) || false;
  };

  // Computed properties
  const isAuthenticated = !!user;
  const isSupplierApproved = user?.role === 'supplier' && user?.supplierStatus === 'approved';
  const isEmailVerified = user?.emailVerified || false;

  // Initialize auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Set up token refresh interval
  useEffect(() => {
    if (user && getAccessToken()) {
      const interval = setInterval(() => {
        refreshToken();
      }, 14 * 60 * 1000); // Refresh every 14 minutes (token expires in 15)

      return () => clearInterval(interval);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout,
    refreshToken,
    isAuthenticated,
    hasRole,
    hasPermission,
    isSupplierApproved,
    isEmailVerified,
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
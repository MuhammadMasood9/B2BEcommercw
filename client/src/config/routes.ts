export interface RouteConfig {
  path: string;
  component?: string;
  requireAuth?: boolean;
  requireRole?: string | string[];
  requireEmailVerification?: boolean;
  requireSupplierApproval?: boolean;
  requirePermission?: {
    resource: string;
    action: string;
  };
  redirectTo?: string;
  title?: string;
  description?: string;
  meta?: Record<string, any>;
}

// Public routes (no authentication required)
export const publicRoutes: RouteConfig[] = [
  {
    path: '/',
    component: 'Home',
    requireAuth: false,
    title: 'B2B Marketplace - Connect with Global Suppliers',
  },
  {
    path: '/login',
    component: 'Login',
    requireAuth: false,
    title: 'Sign In - B2B Marketplace',
  },
  {
    path: '/signup',
    component: 'Signup',
    requireAuth: false,
    title: 'Create Account - B2B Marketplace',
  },
  {
    path: '/forgot-password',
    component: 'ForgotPassword',
    requireAuth: false,
    title: 'Reset Password - B2B Marketplace',
  },
  {
    path: '/reset-password',
    component: 'ResetPassword',
    requireAuth: false,
    title: 'Set New Password - B2B Marketplace',
  },
  {
    path: '/email-verification',
    component: 'EmailVerification',
    requireAuth: false,
    title: 'Verify Email - B2B Marketplace',
  },
  {
    path: '/terms',
    component: 'Terms',
    requireAuth: false,
    title: 'Terms of Service - B2B Marketplace',
  },
  {
    path: '/privacy',
    component: 'Privacy',
    requireAuth: false,
    title: 'Privacy Policy - B2B Marketplace',
  },
  {
    path: '/contact',
    component: 'Contact',
    requireAuth: false,
    title: 'Contact Us - B2B Marketplace',
  },
];

// Admin routes
export const adminRoutes: RouteConfig[] = [
  {
    path: '/admin/dashboard',
    component: 'AdminDashboard',
    requireAuth: true,
    requireRole: 'admin',
    title: 'Admin Dashboard',
  },
  {
    path: '/admin/users',
    component: 'AdminUserManagement',
    requireAuth: true,
    requireRole: 'admin',
    title: 'User Management - Admin',
  },
  {
    path: '/admin/suppliers',
    component: 'AdminSuppliers',
    requireAuth: true,
    requireRole: 'admin',
    title: 'Supplier Management - Admin',
  },
  {
    path: '/admin/suppliers/pending',
    component: 'AdminSuppliersPending',
    requireAuth: true,
    requireRole: 'admin',
    title: 'Pending Suppliers - Admin',
  },
  {
    path: '/admin/buyers',
    component: 'AdminBuyers',
    requireAuth: true,
    requireRole: 'admin',
    title: 'Buyer Management - Admin',
  },
  {
    path: '/admin/products',
    component: 'AdminProducts',
    requireAuth: true,
    requireRole: 'admin',
    title: 'Product Management - Admin',
  },
  {
    path: '/admin/orders',
    component: 'AdminOrders',
    requireAuth: true,
    requireRole: 'admin',
    title: 'Order Management - Admin',
  },
  {
    path: '/admin/disputes',
    component: 'AdminDisputes',
    requireAuth: true,
    requireRole: 'admin',
    title: 'Dispute Management - Admin',
  },
  {
    path: '/admin/analytics',
    component: 'AdminAnalytics',
    requireAuth: true,
    requireRole: 'admin',
    title: 'Analytics - Admin',
  },
  {
    path: '/admin/settings',
    component: 'AdminSettings',
    requireAuth: true,
    requireRole: 'admin',
    title: 'Platform Settings - Admin',
  },
  {
    path: '/admin/moderation',
    component: 'AdminContentModeration',
    requireAuth: true,
    requireRole: 'admin',
    title: 'Content Moderation - Admin',
  },
];

// Supplier routes
export const supplierRoutes: RouteConfig[] = [
  {
    path: '/supplier/dashboard',
    component: 'SupplierDashboard',
    requireAuth: true,
    requireRole: 'supplier',
    title: 'Supplier Dashboard',
  },
  {
    path: '/supplier/application-status',
    component: 'SupplierApplicationStatus',
    requireAuth: true,
    requireRole: 'supplier',
    title: 'Application Status - Supplier',
  },
  {
    path: '/supplier/products',
    component: 'SupplierProducts',
    requireAuth: true,
    requireRole: 'supplier',
    requireSupplierApproval: true,
    requirePermission: { resource: 'products', action: 'read' },
    title: 'My Products - Supplier',
  },
  {
    path: '/supplier/products/new',
    component: 'SupplierProductForm',
    requireAuth: true,
    requireRole: 'supplier',
    requireSupplierApproval: true,
    requirePermission: { resource: 'products', action: 'write' },
    title: 'Add Product - Supplier',
  },
  {
    path: '/supplier/products/:id/edit',
    component: 'SupplierProductForm',
    requireAuth: true,
    requireRole: 'supplier',
    requireSupplierApproval: true,
    requirePermission: { resource: 'products', action: 'write' },
    title: 'Edit Product - Supplier',
  },
  {
    path: '/supplier/orders',
    component: 'SupplierOrders',
    requireAuth: true,
    requireRole: 'supplier',
    requireSupplierApproval: true,
    requirePermission: { resource: 'orders', action: 'read' },
    title: 'Orders - Supplier',
  },
  {
    path: '/supplier/inquiries',
    component: 'SupplierInquiries',
    requireAuth: true,
    requireRole: 'supplier',
    requireSupplierApproval: true,
    requirePermission: { resource: 'inquiries', action: 'read' },
    title: 'Inquiries - Supplier',
  },
  {
    path: '/supplier/quotations',
    component: 'SupplierQuotations',
    requireAuth: true,
    requireRole: 'supplier',
    requireSupplierApproval: true,
    requirePermission: { resource: 'quotations', action: 'read' },
    title: 'Quotations - Supplier',
  },
  {
    path: '/supplier/analytics',
    component: 'SupplierAnalytics',
    requireAuth: true,
    requireRole: 'supplier',
    requireSupplierApproval: true,
    requirePermission: { resource: 'analytics', action: 'read' },
    title: 'Analytics - Supplier',
  },
  {
    path: '/supplier/settings',
    component: 'SupplierSettings',
    requireAuth: true,
    requireRole: 'supplier',
    requirePermission: { resource: 'settings', action: 'read' },
    title: 'Store Settings - Supplier',
  },
  {
    path: '/supplier/staff',
    component: 'SupplierStaff',
    requireAuth: true,
    requireRole: 'supplier',
    requireSupplierApproval: true,
    requirePermission: { resource: 'staff', action: 'read' },
    title: 'Staff Management - Supplier',
  },
];

// Buyer routes
export const buyerRoutes: RouteConfig[] = [
  {
    path: '/buyer/dashboard',
    component: 'BuyerDashboard',
    requireAuth: true,
    requireRole: 'buyer',
    title: 'Buyer Dashboard',
  },
  {
    path: '/buyer/products',
    component: 'BuyerProductDiscovery',
    requireAuth: true,
    requireRole: 'buyer',
    requireEmailVerification: true,
    title: 'Product Discovery - Buyer',
  },
  {
    path: '/buyer/products/:id',
    component: 'BuyerProductDetail',
    requireAuth: true,
    requireRole: 'buyer',
    requireEmailVerification: true,
    title: 'Product Details - Buyer',
  },
  {
    path: '/buyer/rfqs',
    component: 'BuyerRFQs',
    requireAuth: true,
    requireRole: 'buyer',
    requireEmailVerification: true,
    requirePermission: { resource: 'rfqs', action: 'read' },
    title: 'My RFQs - Buyer',
  },
  {
    path: '/buyer/rfqs/new',
    component: 'BuyerRFQForm',
    requireAuth: true,
    requireRole: 'buyer',
    requireEmailVerification: true,
    requirePermission: { resource: 'rfqs', action: 'write' },
    title: 'Create RFQ - Buyer',
  },
  {
    path: '/buyer/rfqs/:id',
    component: 'BuyerRFQDetail',
    requireAuth: true,
    requireRole: 'buyer',
    requireEmailVerification: true,
    requirePermission: { resource: 'rfqs', action: 'read' },
    title: 'RFQ Details - Buyer',
  },
  {
    path: '/buyer/orders',
    component: 'BuyerOrders',
    requireAuth: true,
    requireRole: 'buyer',
    requireEmailVerification: true,
    requirePermission: { resource: 'orders', action: 'read' },
    title: 'My Orders - Buyer',
  },
  {
    path: '/buyer/orders/:id',
    component: 'BuyerOrderDetail',
    requireAuth: true,
    requireRole: 'buyer',
    requireEmailVerification: true,
    requirePermission: { resource: 'orders', action: 'read' },
    title: 'Order Details - Buyer',
  },
  {
    path: '/buyer/inquiries',
    component: 'BuyerInquiries',
    requireAuth: true,
    requireRole: 'buyer',
    requireEmailVerification: true,
    requirePermission: { resource: 'inquiries', action: 'read' },
    title: 'My Inquiries - Buyer',
  },
  {
    path: '/buyer/messages',
    component: 'BuyerMessages',
    requireAuth: true,
    requireRole: 'buyer',
    requireEmailVerification: true,
    title: 'Messages - Buyer',
  },
  {
    path: '/buyer/settings',
    component: 'BuyerSettings',
    requireAuth: true,
    requireRole: 'buyer',
    requirePermission: { resource: 'settings', action: 'read' },
    title: 'Account Settings - Buyer',
  },
];

// Shared authenticated routes
export const sharedRoutes: RouteConfig[] = [
  {
    path: '/dashboard',
    component: 'Dashboard',
    requireAuth: true,
    title: 'Dashboard',
  },
  {
    path: '/profile',
    component: 'Profile',
    requireAuth: true,
    title: 'My Profile',
  },
  {
    path: '/notifications',
    component: 'Notifications',
    requireAuth: true,
    title: 'Notifications',
  },
  {
    path: '/messages',
    component: 'Messages',
    requireAuth: true,
    title: 'Messages',
  },
  {
    path: '/chat',
    component: 'Chat',
    requireAuth: true,
    title: 'Chat',
  },
  {
    path: '/account-locked',
    component: 'AccountLocked',
    requireAuth: true,
    title: 'Account Locked',
  },
];

// All routes combined
export const allRoutes: RouteConfig[] = [
  ...publicRoutes,
  ...adminRoutes,
  ...supplierRoutes,
  ...buyerRoutes,
  ...sharedRoutes,
];

// Helper functions
export const getRouteConfig = (path: string): RouteConfig | undefined => {
  return allRoutes.find(route => route.path === path);
};

export const getRoutesByRole = (role: string): RouteConfig[] => {
  return allRoutes.filter(route => {
    if (!route.requireRole) return true;
    if (Array.isArray(route.requireRole)) {
      return route.requireRole.includes(role);
    }
    return route.requireRole === role;
  });
};

export const isPublicRoute = (path: string): boolean => {
  return publicRoutes.some(route => route.path === path);
};

export const getDefaultRouteForRole = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'supplier':
      return '/supplier/dashboard';
    case 'buyer':
      return '/buyer/dashboard';
    default:
      return '/dashboard';
  }
};

export const getLoginRedirectPath = (role: string, supplierStatus?: string): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'supplier':
      if (supplierStatus === 'approved') {
        return '/supplier/dashboard';
      } else {
        return '/supplier/application-status';
      }
    case 'buyer':
      return '/buyer/dashboard';
    default:
      return '/dashboard';
  }
};
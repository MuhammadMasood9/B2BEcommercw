import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PermissionGuard } from './PermissionGuard';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Home, 
  Settings, 
  User, 
  Bell, 
  LogOut,
  Shield,
  Store,
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  FileText,
  MessageSquare,
  Search,
  Plus,
  Menu
} from 'lucide-react';
import { useLocation } from 'wouter';

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  permission?: {
    resource: string;
    action: string;
  };
  requireEmailVerification?: boolean;
  requireSupplierApproval?: boolean;
  children?: NavigationItem[];
}

const adminNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: Home,
  },
  {
    label: 'User Management',
    path: '/admin/users',
    icon: Users,
    children: [
      { label: 'All Users', path: '/admin/users', icon: Users },
      { label: 'Suppliers', path: '/admin/suppliers', icon: Store },
      { label: 'Buyers', path: '/admin/buyers', icon: ShoppingCart },
      { label: 'Admins', path: '/admin/admins', icon: Shield },
    ],
  },
  {
    label: 'Content Moderation',
    path: '/admin/moderation',
    icon: FileText,
  },
  {
    label: 'Analytics',
    path: '/admin/analytics',
    icon: BarChart3,
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    icon: Settings,
  },
];

const supplierNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/supplier/dashboard',
    icon: Home,
  },
  {
    label: 'Products',
    path: '/supplier/products',
    icon: Package,
    permission: { resource: 'products', action: 'read' },
    requireSupplierApproval: true,
    children: [
      { label: 'All Products', path: '/supplier/products', icon: Package },
      { label: 'Add Product', path: '/supplier/products/new', icon: Plus },
      { label: 'Bulk Upload', path: '/supplier/products/bulk', icon: FileText },
    ],
  },
  {
    label: 'Orders',
    path: '/supplier/orders',
    icon: ShoppingCart,
    permission: { resource: 'orders', action: 'read' },
    requireSupplierApproval: true,
  },
  {
    label: 'Inquiries',
    path: '/supplier/inquiries',
    icon: MessageSquare,
    permission: { resource: 'inquiries', action: 'read' },
    requireSupplierApproval: true,
  },
  {
    label: 'Analytics',
    path: '/supplier/analytics',
    icon: BarChart3,
    permission: { resource: 'analytics', action: 'read' },
    requireSupplierApproval: true,
  },
  {
    label: 'Store Settings',
    path: '/supplier/settings',
    icon: Settings,
    permission: { resource: 'settings', action: 'read' },
  },
];

const buyerNavigation: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/buyer/dashboard',
    icon: Home,
  },
  {
    label: 'Product Discovery',
    path: '/buyer/products',
    icon: Search,
    requireEmailVerification: true,
  },
  {
    label: 'RFQs',
    path: '/buyer/rfqs',
    icon: FileText,
    permission: { resource: 'rfqs', action: 'read' },
    requireEmailVerification: true,
    children: [
      { label: 'My RFQs', path: '/buyer/rfqs', icon: FileText },
      { label: 'Create RFQ', path: '/buyer/rfqs/new', icon: Plus },
    ],
  },
  {
    label: 'Orders',
    path: '/buyer/orders',
    icon: ShoppingCart,
    permission: { resource: 'orders', action: 'read' },
    requireEmailVerification: true,
  },
  {
    label: 'Messages',
    path: '/buyer/messages',
    icon: MessageSquare,
    requireEmailVerification: true,
  },
  {
    label: 'Settings',
    path: '/buyer/settings',
    icon: Settings,
    permission: { resource: 'settings', action: 'read' },
  },
];

interface RoleBasedNavigationProps {
  variant?: 'sidebar' | 'header' | 'mobile';
  className?: string;
  onNavigate?: (path: string) => void;
}

export const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  variant = 'sidebar',
  className = '',
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const getNavigationItems = (): NavigationItem[] => {
    switch (user?.role) {
      case 'admin':
        return adminNavigation;
      case 'supplier':
        return supplierNavigation;
      case 'buyer':
        return buyerNavigation;
      default:
        return [];
    }
  };

  const handleNavigate = (path: string) => {
    setLocation(path);
    onNavigate?.(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const Icon = item.icon;
    const isActive = location === item.path;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <PermissionGuard
        key={item.path}
        resource={item.permission?.resource}
        action={item.permission?.action}
        requireEmailVerification={item.requireEmailVerification}
        requireSupplierApproval={item.requireSupplierApproval}
        showFallback={false}
      >
        <div className={`${level > 0 ? 'ml-4' : ''}`}>
          <Button
            variant={isActive ? 'default' : 'ghost'}
            className={`w-full justify-start ${variant === 'header' ? 'h-8 px-3' : 'h-10 px-4'} ${
              isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => handleNavigate(item.path)}
          >
            <Icon className={`${variant === 'header' ? 'h-3 w-3' : 'h-4 w-4'} mr-2`} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                {item.badge}
              </Badge>
            )}
          </Button>
          
          {hasChildren && (
            <div className="mt-1 space-y-1">
              {item.children?.map((child) => renderNavigationItem(child, level + 1))}
            </div>
          )}
        </div>
      </PermissionGuard>
    );
  };

  const renderUserInfo = () => (
    <div className={`${variant === 'sidebar' ? 'p-4 border-t' : 'flex items-center space-x-2'}`}>
      <div className="flex items-center space-x-3">
        <div className="bg-blue-100 rounded-full p-2">
          <User className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {user?.role}
            </Badge>
            {user?.role === 'supplier' && user?.supplierStatus && (
              <Badge 
                variant={user.supplierStatus === 'approved' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {user.supplierStatus}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {variant === 'sidebar' && (
        <div className="mt-3 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleNavigate('/profile')}
          >
            <User className="h-4 w-4 mr-2" />
            Profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => handleNavigate('/notifications')}
          >
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      )}
    </div>
  );

  if (variant === 'mobile') {
    return (
      <div className={`bg-white shadow-lg rounded-lg ${className}`}>
        <div className="p-4">
          {renderUserInfo()}
        </div>
        <nav className="px-4 pb-4 space-y-1">
          {getNavigationItems().map((item) => renderNavigationItem(item))}
        </nav>
      </div>
    );
  }

  if (variant === 'header') {
    return (
      <nav className={`flex items-center space-x-1 ${className}`}>
        {getNavigationItems().slice(0, 5).map((item) => renderNavigationItem(item))}
        {getNavigationItems().length > 5 && (
          <Button variant="ghost" size="sm">
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </nav>
    );
  }

  // Default sidebar variant
  return (
    <div className={`bg-white shadow-lg h-full flex flex-col ${className}`}>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {getNavigationItems().map((item) => renderNavigationItem(item))}
      </nav>
      {renderUserInfo()}
    </div>
  );
};

export default RoleBasedNavigation;
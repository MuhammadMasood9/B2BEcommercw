import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  Shield, 
  Mail, 
  User, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Settings,
  Activity
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  emailVerified: boolean;
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface CreateAdminData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  requireMfa: boolean;
}

export default function AdminUserManagement() {
  const { user } = useAuth();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [createData, setCreateData] = useState<CreateAdminData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    requireMfa: true
  });

  // Fetch admin users
  const fetchAdminUsers = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/registration/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setAdminUsers(result.adminUsers || []);
      } else {
        toast.error('Failed to fetch admin users');
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast.error('Failed to fetch admin users');
    } finally {
      setLoading(false);
    }
  };

  // Create new admin user
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createData.email || !createData.password || !createData.firstName || !createData.lastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsCreating(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/registration/admin/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Admin account created successfully! Verification email sent.');
        setIsCreateDialogOpen(false);
        setCreateData({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          phone: '',
          requireMfa: true
        });
        fetchAdminUsers(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to create admin account');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error('Failed to create admin account');
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle admin status
  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/registration/admin/users/${adminId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message);
        fetchAdminUsers(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to update admin status');
      }
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast.error('Failed to update admin status');
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const getStatusBadge = (admin: AdminUser) => {
    if (!admin.isActive) {
      return <Badge variant="destructive">Inactive</Badge>;
    }
    if (!admin.emailVerified) {
      return <Badge variant="secondary">Pending Verification</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin User Management</h1>
          <p className="text-gray-600 mt-2">Manage admin accounts and permissions</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Create Admin Account
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={createData.firstName}
                      onChange={(e) => setCreateData({ ...createData, firstName: e.target.value })}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={createData.lastName}
                      onChange={(e) => setCreateData({ ...createData, lastName: e.target.value })}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    value={createData.email}
                    onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={createData.phone}
                    onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={createData.password}
                    onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                    required
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="requireMfa" 
                  checked={createData.requireMfa}
                  onCheckedChange={(checked) => setCreateData({ ...createData, requireMfa: checked === true })}
                />
                <Label htmlFor="requireMfa" className="text-sm">
                  Require two-factor authentication (recommended)
                </Label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Security Notice</p>
                    <p>Admin accounts have elevated privileges. Ensure strong passwords and enable 2FA.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Create Admin
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin Users List */}
      <div className="grid gap-4">
        {adminUsers.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Admin Users</h3>
                <p className="text-gray-600">Create your first admin account to get started.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          adminUsers.map((admin) => (
            <Card key={admin.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {admin.firstName} {admin.lastName}
                      </h3>
                      <p className="text-gray-600">{admin.email}</p>
                      {admin.phone && (
                        <p className="text-sm text-gray-500">{admin.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      {getStatusBadge(admin)}
                      <div className="flex items-center gap-2 mt-2">
                        {admin.emailVerified ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm text-gray-600">
                          {admin.emailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                      {admin.twoFactorEnabled && (
                        <div className="flex items-center gap-2 mt-1">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-600">2FA Enabled</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleAdminStatus(admin.id, admin.isActive)}
                        disabled={admin.id === user?.id}
                        className={admin.isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                      >
                        {admin.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Last Login:</span>
                      <span className="ml-2 text-gray-900">
                        {admin.lastLoginAt 
                          ? new Date(admin.lastLoginAt).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
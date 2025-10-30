import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StaffActivityMonitor from './StaffActivityMonitor';
import StaffPerformanceDashboard from './StaffPerformanceDashboard';
import StaffCommunication from './StaffCommunication';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Shield, 
  Eye, 
  Edit, 
  Trash2, 
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StaffMember {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: Record<string, string[]>;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface RolePermissions {
  [role: string]: {
    [resource: string]: string[];
  };
}

const ROLE_LABELS = {
  manager: 'Manager',
  product_manager: 'Product Manager',
  customer_service: 'Customer Service',
  accountant: 'Accountant'
};

const ROLE_DESCRIPTIONS = {
  manager: 'Full access to products, orders, inquiries, and analytics',
  product_manager: 'Manage products, respond to inquiries, view analytics',
  customer_service: 'Handle orders, respond to inquiries, view products',
  accountant: 'View financial data, analytics, and order information'
};

export default function StaffManagement() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>({});
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [createForm, setCreateForm] = useState({
    email: '',
    name: '',
    role: ''
  });
  const [editForm, setEditForm] = useState({
    name: '',
    role: '',
    isActive: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffMembers();
    fetchRolePermissions();
  }, []);

  const fetchStaffMembers = async () => {
    try {
      const response = await fetch('/api/suppliers/staff', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStaffMembers(data.staff || []);
      } else {
        throw new Error('Failed to fetch staff members');
      }
    } catch (error) {
      console.error('Error fetching staff members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async () => {
    try {
      const response = await fetch('/api/suppliers/staff/roles/permissions', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRolePermissions(data.roles || {});
      }
    } catch (error) {
      console.error('Error fetching role permissions:', error);
    }
  };

  const handleCreateStaff = async () => {
    try {
      const response = await fetch('/api/suppliers/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(createForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: `Staff member created successfully. Temporary password: ${data.temporaryPassword}`
        });
        setIsCreateDialogOpen(false);
        setCreateForm({ email: '', name: '', role: '' });
        fetchStaffMembers();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create staff member');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleEditStaff = async () => {
    if (!selectedStaff) return;
    
    try {
      const response = await fetch(`/api/suppliers/staff/${selectedStaff.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Staff member updated successfully'
        });
        setIsEditDialogOpen(false);
        setSelectedStaff(null);
        fetchStaffMembers();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update staff member');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to remove this staff member?')) return;
    
    try {
      const response = await fetch(`/api/suppliers/staff/${staffId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Staff member removed successfully'
        });
        fetchStaffMembers();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove staff member');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleResetPassword = async (staffId: string) => {
    if (!confirm('Are you sure you want to reset this staff member\'s password?')) return;
    
    try {
      const response = await fetch(`/api/suppliers/staff/${staffId}/reset-password`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Success',
          description: `Password reset successfully. New password: ${data.temporaryPassword}`
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset password');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setEditForm({
      name: staff.name,
      role: staff.role,
      isActive: staff.isActive
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (isActive: boolean, lastLogin?: string) => {
    if (!isActive) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
    }
    
    if (!lastLogin) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Never Logged In</Badge>;
    }
    
    const lastLoginDate = new Date(lastLogin);
    const daysSinceLogin = Math.floor((Date.now() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLogin <= 1) {
      return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    } else if (daysSinceLogin <= 7) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Recent</Badge>;
    } else {
      return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Inactive</Badge>;
    }
  };

  const renderPermissions = (permissions: Record<string, string[]>) => {
    return (
      <div className="space-y-2">
        {Object.entries(permissions).map(([resource, actions]) => (
          <div key={resource} className="flex items-center gap-2">
            <span className="font-medium capitalize">{resource}:</span>
            <div className="flex gap-1">
              {actions.map(action => (
                <Badge key={action} variant="outline" className="text-xs">
                  {action}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff Management</h1>
          <p className="text-gray-600">Manage your team members and their permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Create a new staff member account with role-based permissions.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="staff@example.com"
                />
              </div>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={createForm.role} onValueChange={(value) => setCreateForm({ ...createForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div>
                          <div className="font-medium">{label}</div>
                          <div className="text-sm text-gray-500">{ROLE_DESCRIPTIONS[value as keyof typeof ROLE_DESCRIPTIONS]}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStaff} disabled={!createForm.email || !createForm.name || !createForm.role}>
                Create Staff Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Staff Members</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="activity">Activity Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members ({staffMembers.length})
              </CardTitle>
              <CardDescription>
                Manage your team members and their access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              {staffMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members yet</h3>
                  <p className="text-gray-500 mb-4">Add team members to help manage your business</p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add First Staff Member
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffMembers.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.name}</TableCell>
                        <TableCell>{staff.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {ROLE_LABELS[staff.role as keyof typeof ROLE_LABELS] || staff.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(staff.isActive, staff.lastLogin)}
                        </TableCell>
                        <TableCell>
                          {staff.lastLogin ? new Date(staff.lastLogin).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(staff)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPassword(staff.id)}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStaff(staff.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Roles & Permissions
              </CardTitle>
              <CardDescription>
                Overview of available roles and their permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(rolePermissions).map(([role, permissions]) => (
                  <div key={role} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">
                          {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]}
                        </p>
                      </div>
                      <Badge variant="outline">{role}</Badge>
                    </div>
                    <Separator className="mb-3" />
                    {renderPermissions(permissions)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <StaffPerformanceDashboard />
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <StaffCommunication />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <StaffActivityMonitor />
        </TabsContent>
      </Tabs>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={selectedStaff.email} disabled />
              </div>
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
                <Label htmlFor="edit-active">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStaff}>
              Update Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
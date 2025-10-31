import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Users, 
  Settings, 
  Eye,
  Lock,
  Unlock,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Crown,
  UserCheck
} from "lucide-react";

// Types
interface AdminRole {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: number;
  parentRoleId?: string;
  permissions: Record<string, any>;
  resourcePermissions: Record<string, string[]>;
  isActive: boolean;
  isSystemRole: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PermissionResource {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  resourcePath: string;
  availableActions: string[];
}

// Validation schemas
const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").regex(/^[a-z_]+$/, "Role name must be lowercase with underscores"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().optional(),
  level: z.number().min(0).max(100).default(0),
  parentRoleId: z.string().optional(),
});

const updateRoleSchema = createRoleSchema.partial().omit({ name: true });

export default function RoleConfiguration() {
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<AdminRole | null>(null);
  const { toast } = useToast();

  // Fetch roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<AdminRole[]>({
    queryKey: ['/api/admin/access/roles'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/access/roles');
      return response.roles || [];
    },
  });

  // Fetch permission resources
  const { data: resources = [] } = useQuery<PermissionResource[]>({
    queryKey: ['/api/admin/access/permission-resources'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/access/permission-resources');
      return response.resources || [];
    },
  });

  // Fetch role hierarchy
  const { data: hierarchy = [] } = useQuery({
    queryKey: ['/api/admin/access/role-hierarchy'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/access/role-hierarchy');
      return response.hierarchy || [];
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: any) => {
      return await apiRequest('POST', '/api/admin/access/role-management', {
        action: 'create',
        roleData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/access/roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/access/role-hierarchy'] });
      toast({ title: "Success", description: "Role created successfully" });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create role", 
        variant: "destructive" 
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ roleId, roleData }: { roleId: string; roleData: any }) => {
      return await apiRequest('POST', '/api/admin/access/role-management', {
        action: 'update',
        roleId,
        roleData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/access/roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/access/role-hierarchy'] });
      toast({ title: "Success", description: "Role updated successfully" });
      setIsEditDialogOpen(false);
      setSelectedRole(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update role", 
        variant: "destructive" 
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return await apiRequest('POST', '/api/admin/access/role-management', {
        action: 'delete',
        roleId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/access/roles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/access/role-hierarchy'] });
      toast({ title: "Success", description: "Role deleted successfully" });
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete role", 
        variant: "destructive" 
      });
    },
  });

  // Forms
  const createForm = useForm({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      level: 0,
      parentRoleId: "",
    },
  });

  const updateForm = useForm({
    resolver: zodResolver(updateRoleSchema),
    defaultValues: {
      displayName: "",
      description: "",
      level: 0,
      parentRoleId: "",
    },
  });

  // Update form when selected role changes
  useEffect(() => {
    if (selectedRole) {
      updateForm.reset({
        displayName: selectedRole.displayName,
        description: selectedRole.description || "",
        level: selectedRole.level,
        parentRoleId: selectedRole.parentRoleId || "",
      });
    }
  }, [selectedRole, updateForm]);

  const onCreateSubmit = (data: any) => {
    createRoleMutation.mutate({
      ...data,
      permissions: {},
      resourcePermissions: {},
    });
  };

  const onUpdateSubmit = (data: any) => {
    if (!selectedRole) return;
    updateRoleMutation.mutate({
      roleId: selectedRole.id,
      roleData: data,
    });
  };

  const handleDeleteRole = (role: AdminRole) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (roleToDelete) {
      deleteRoleMutation.mutate(roleToDelete.id);
    }
  };

  const getRoleLevelColor = (level: number) => {
    if (level >= 80) return "text-red-600 bg-red-50";
    if (level >= 60) return "text-orange-600 bg-orange-50";
    if (level >= 40) return "text-yellow-600 bg-yellow-50";
    if (level >= 20) return "text-blue-600 bg-blue-50";
    return "text-gray-600 bg-gray-50";
  };

  const getRoleIcon = (level: number) => {
    if (level >= 80) return <Crown className="w-4 h-4" />;
    if (level >= 60) return <Shield className="w-4 h-4" />;
    if (level >= 40) return <UserCheck className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Configuration</h2>
          <p className="text-gray-600 mt-1">Manage admin roles and permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., content_manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Content Manager" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Role description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permission Level (0-100)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="parentRoleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Role (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">No parent role</SelectItem>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createRoleMutation.isPending}>
                    {createRoleMutation.isPending ? "Creating..." : "Create Role"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Roles</p>
                <p className="text-2xl font-bold">{roles.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Roles</p>
                <p className="text-2xl font-bold">{roles.filter(r => r.isSystemRole).length}</p>
              </div>
              <Lock className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Custom Roles</p>
                <p className="text-2xl font-bold">{roles.filter(r => !r.isSystemRole).length}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Roles</p>
                <p className="text-2xl font-bold">{roles.filter(r => r.isActive).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getRoleLevelColor(role.level)}`}>
                        {getRoleIcon(role.level)}
                      </div>
                      <div>
                        <p className="font-medium">{role.displayName}</p>
                        <p className="text-sm text-gray-500">{role.name}</p>
                        {role.description && (
                          <p className="text-xs text-gray-400 mt-1">{role.description}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getRoleLevelColor(role.level)}>
                      Level {role.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isSystemRole ? "destructive" : "default"}>
                      {role.isSystemRole ? "System" : "Custom"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isActive ? "default" : "secondary"}>
                      {role.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(role.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRole(role);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      {!role.isSystemRole && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRole(role)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Role: {selectedRole?.displayName}</DialogTitle>
          </DialogHeader>
          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {!selectedRole?.isSystemRole && (
                <FormField
                  control={updateForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permission Level (0-100)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="100" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateRoleMutation.isPending}>
                  {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Role
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the role "{roleToDelete?.displayName}"? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDelete}
                disabled={deleteRoleMutation.isPending}
              >
                {deleteRoleMutation.isPending ? "Deleting..." : "Delete Role"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}